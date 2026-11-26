-- =====================================================================
-- Kenrori: bình luận ẩn danh (chỉ cần nhập tên, không cần tài khoản)
--
-- 1) Supabase -> SQL Editor -> New query -> dán TOÀN BỘ file này -> Run.
--    Chạy lại nhiều lần cũng không sao. Không cần chạy supabase-setup.sql
--    nếu bạn chỉ dùng bình luận (file đó chỉ dành cho khu Sáng tác).
-- 2) Đặt mật khẩu kiểm duyệt (để bạn ẩn, xóa, chặn bình luận ngay trên web):
--    New query -> chạy dòng dưới, thay bằng mật khẩu của bạn (ít nhất 8 ký tự):
--      select public.set_comment_password('mat-khau-cua-ban');
--    Sau đó nhập đúng mật khẩu này trong trang quản trị Kenrori.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.comments (
  id bigserial primary key,
  thread text not null check (char_length(thread) between 1 and 300),   -- chương hoặc bộ truyện được bình luận
  parent_id bigint references public.comments(id) on delete cascade,     -- trả lời bình luận nào (một cấp)
  name text not null check (char_length(name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 2000),
  user_id uuid references auth.users(id) on delete set null,             -- có nếu người viết đang đăng nhập khu Sáng tác
  token_hash text,                                                       -- để người viết tự xóa bình luận của mình
  ip_hash text,                                                          -- IP đã băm, chỉ dùng chống spam
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_thread_idx on public.comments (thread, created_at desc);
create index if not exists comments_ip_idx on public.comments (ip_hash, created_at desc);

-- Người bị chặn bình luận (theo IP đã băm) và mật khẩu kiểm duyệt (đã băm).
-- Không ai đọc hai bảng này qua web; chỉ các hàm bên dưới dùng.
create table if not exists public.comment_bans (
  ip_hash text primary key,
  created_at timestamptz not null default now()
);
create table if not exists public.comment_secret (
  id integer primary key default 1 check (id = 1),
  pass_hash text not null
);

-- ---------- Ai là kiểm duyệt viên (tài khoản mod/admin của khu Sáng tác, nếu có) ----------
create or replace function public.comment_is_mod() returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or to_regclass('public.profiles') is null then return false; end if;
  return exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('mod', 'admin') and not p.banned);
end $$;

-- ---------- Kiểm tra trước khi lưu: chống spam, làm sạch dữ liệu ----------
create or replace function public.guard_comment() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  hdr json;
  ip text;
  n int;
begin
  if auth.uid() is not null and to_regclass('public.profiles') is not null then
    if exists (select 1 from public.profiles p where p.id = auth.uid() and p.banned) then
      raise exception 'Tài khoản của bạn đang bị khóa nên không bình luận được';
    end if;
  end if;
  new.user_id := auth.uid();
  new.hidden := false;
  new.created_at := now();
  new.name := left(btrim(regexp_replace(new.name, '\s+', ' ', 'g')), 40);
  new.body := btrim(new.body);
  if char_length(new.name) < 1 then raise exception 'Hãy nhập tên'; end if;
  if char_length(new.body) < 1 then raise exception 'Hãy nhập nội dung bình luận'; end if;
  if new.parent_id is not null and not exists (select 1 from public.comments c where c.id = new.parent_id and c.thread = new.thread and c.parent_id is null) then
    raise exception 'Không tìm thấy bình luận để trả lời';
  end if;

  hdr := nullif(current_setting('request.headers', true), '')::json;
  ip := coalesce(hdr ->> 'cf-connecting-ip', hdr ->> 'x-real-ip', btrim(split_part(coalesce(hdr ->> 'x-forwarded-for', ''), ',', 1)), '');
  new.ip_hash := case when ip = '' then null else encode(digest('kenrori:' || ip, 'sha256'), 'hex') end;

  if new.ip_hash is not null then
    if exists (select 1 from public.comment_bans b where b.ip_hash = new.ip_hash) then
      raise exception 'Bạn đã bị chặn bình luận';
    end if;
    select count(*) into n from public.comments c where c.ip_hash = new.ip_hash and c.created_at > now() - interval '1 minute';
    if n >= 3 then raise exception 'Bạn bình luận hơi nhanh, đợi một phút rồi gửi lại'; end if;
    select count(*) into n from public.comments c where c.ip_hash = new.ip_hash and c.created_at > now() - interval '1 hour';
    if n >= 30 then raise exception 'Bạn đã bình luận quá nhiều trong một giờ, hãy quay lại sau'; end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_comment on public.comments;
create trigger guard_comment before insert on public.comments
  for each row execute function public.guard_comment();

-- ---------- Quyền ----------
alter table public.comments enable row level security;
alter table public.comment_bans enable row level security;
alter table public.comment_secret enable row level security;

-- Web chỉ đọc được các cột công khai, không đọc được token_hash và ip_hash.
revoke all on public.comments from anon, authenticated;
revoke all on public.comment_bans from anon, authenticated;
revoke all on public.comment_secret from anon, authenticated;
grant select (id, thread, parent_id, name, body, user_id, hidden, created_at) on public.comments to anon, authenticated;
grant insert (thread, parent_id, name, body, token_hash) on public.comments to anon, authenticated;
grant update (hidden) on public.comments to authenticated;
grant delete on public.comments to authenticated;
grant usage, select on sequence public.comments_id_seq to anon, authenticated;

drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments for select using (not hidden or public.comment_is_mod());
drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments for insert with check (true);   -- kiểm tra nằm trong trigger
drop policy if exists "comments_mod_update" on public.comments;
create policy "comments_mod_update" on public.comments for update using (public.comment_is_mod());
drop policy if exists "comments_mod_delete" on public.comments;
create policy "comments_mod_delete" on public.comments for delete using (public.comment_is_mod());

-- ---------- Người viết tự xóa bình luận của mình (bằng mã bí mật trình duyệt lưu lúc gửi) ----------
create or replace function public.delete_my_comment(cid bigint, tok text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare n int;
begin
  if tok is null or char_length(tok) < 20 then return false; end if;
  delete from public.comments where id = cid and token_hash = encode(digest(tok, 'sha256'), 'hex');
  get diagnostics n = row_count;
  return n > 0;
end $$;
revoke all on function public.delete_my_comment(bigint, text) from public;
grant execute on function public.delete_my_comment(bigint, text) to anon, authenticated;

-- ---------- Mật khẩu kiểm duyệt ----------
-- Chỉ chạy được trong SQL Editor (web không gọi được hàm này).
create or replace function public.set_comment_password(p text) returns text
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p is null or char_length(p) < 8 then raise exception 'Mật khẩu cần ít nhất 8 ký tự'; end if;
  if p = 'mat-khau-cua-ban' then raise exception 'Hãy thay mat-khau-cua-ban bằng mật khẩu của riêng bạn'; end if;
  insert into public.comment_secret (id, pass_hash) values (1, crypt(p, gen_salt('bf', 10)))
  on conflict (id) do update set pass_hash = excluded.pass_hash;
  return 'Đã đặt mật khẩu kiểm duyệt';
end $$;
revoke all on function public.set_comment_password(text) from public, anon, authenticated;

create or replace function public.comment_pass_ok(p text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select p is not null and exists (select 1 from public.comment_secret s where s.pass_hash = crypt(p, s.pass_hash))
$$;
revoke all on function public.comment_pass_ok(text) from public, anon, authenticated;

-- Trang quản trị dùng hàm này để kiểm tra mật khẩu bạn nhập
create or replace function public.mod_check(p text) returns boolean
language sql stable security definer set search_path = public as $$ select public.comment_pass_ok(p) $$;
revoke all on function public.mod_check(text) from public;
grant execute on function public.mod_check(text) to anon, authenticated;

-- Ẩn, xóa hoặc chặn người viết một bình luận. Dùng được khi có mật khẩu kiểm duyệt
-- hoặc khi đang đăng nhập tài khoản mod/admin của khu Sáng tác.
create or replace function public.mod_comment(cid bigint, p text, act text) returns integer
language plpgsql security definer set search_path = public as $$
declare h text; n int;
begin
  if not (public.comment_pass_ok(p) or public.comment_is_mod()) then
    perform pg_sleep(1);
    raise exception 'Sai mật khẩu kiểm duyệt';
  end if;
  if act = 'hide' then
    update public.comments set hidden = true where id = cid;
  elsif act = 'show' then
    update public.comments set hidden = false where id = cid;
  elsif act = 'delete' then
    delete from public.comments where id = cid;
  elsif act = 'ban' then
    select ip_hash into h from public.comments where id = cid;
    if h is null then
      update public.comments set hidden = true where id = cid;
    else
      insert into public.comment_bans (ip_hash) values (h) on conflict do nothing;
      update public.comments set hidden = true where ip_hash = h;
    end if;
  else
    raise exception 'Thao tác không hợp lệ';
  end if;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.mod_comment(bigint, text, text) from public;
grant execute on function public.mod_comment(bigint, text, text) to anon, authenticated;

-- Hàm cũ của bản trước, không còn dùng
drop function if exists public.ban_commenter(bigint);
