-- ============================================================
-- THE EXTREME NOTEBOOK — DATABASE SCHEMA (Supabase / Postgres)
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run
--
-- This file is written to be safely re-runnable end to end: every table
-- uses "create table if not exists", every column uses "add column if
-- not exists", and every policy is dropped before being recreated. You
-- can paste the whole thing again later (e.g. after a future update)
-- without it failing on "already exists" errors.
--
-- SECURITY AUDIT NOTES (read this before running):
--   - Fixed: a fresh-database ordering bug where study_room_access_requests
--     was altered before it was created (would hard-fail on a new project).
--   - Fixed: profiles had NO protection on the "role" / "is_banned" columns
--     — any signed-in user could have run `update profiles set role='admin'`
--     on themselves. Now enforced by a trigger, not just a policy, so it
--     can't be bypassed by calling the API directly.
--   - Fixed: an approved, unexpired VIP-room access request could not
--     actually be used to join the room — the INSERT policy on
--     study_room_members never checked for it.
--   - Fixed: a friend request's SENDER could accept their own request.
--     Only the recipient can now accept/reject; only the sender can cancel.
--   - Fixed: notifications used `with check (true)` — any user could
--     insert a notification claiming to be for/from anyone. Tightened to
--     require the inserting user to record themselves as the creator.
--   - Fixed: test scores were trusted from the client with no server-side
--     check at all. A trigger now recomputes the score from the stored
--     answers and the real answer key before the row is saved, so the
--     number a client sends is always overwritten with the true one.
--   - Fixed: premium notes were readable by anyone via the API — the
--     paywall was frontend-only. The notes SELECT policy now requires a
--     premium/admin role (or authorship) for public premium notes.
--   - Fixed: paid VIP room numbers could be claimed for free, or used as a
--     room_code without claiming them at all. Users can now only self-claim
--     ₹0 numbers; paid ones are assigned by an admin after payment, and a
--     trigger on study_rooms rejects unclaimed VIP numbers as room codes.
--   - Known, documented limitation: this project has no backend server,
--     so test_questions.correct_index is still readable by any signed-in
--     client before they submit (RLS can't selectively hide one column
--     from one query without a view/function). Score tampering is fixed;
--     a technically determined user could still look up answers in the
--     network tab. Fully closing that needs a real backend endpoint.
--   - Documented, not changed: the shared "attachments" storage bucket is
--     intentionally public-read (avatars and public notes need to be
--     visible across the app). Study-room file uploads share that same
--     bucket, so a room file's direct URL isn't access-controlled to just
--     that room's members — only "unguessable" (random path). Properly
--     scoping that needs per-folder storage policies or signed URLs.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROFILES (one row per signed-up user)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text,
  bio text,
  education text,
  avatar_url text,
  role text not null default 'user',            -- 'user' | 'admin' | 'premium'
  pin_hash text,                                 -- optional 4-digit PIN (hashed) for private chat lock
  settings jsonb not null default '{"private_hidden": false}'::jsonb,
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);
alter table profiles add column if not exists is_banned boolean not null default false;

alter table profiles enable row level security;

drop policy if exists "profiles are viewable by everyone" on profiles;
create policy "profiles are viewable by everyone"
  on profiles for select using (true);

drop policy if exists "users can insert their own profile" on profiles;
create policy "users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- SECURITY: this only checks *which row* you're touching, not *which
-- columns*. Column-level protection for role/is_banned is enforced by the
-- trigger below (protect_privileged_profile_fields), not by this policy.
drop policy if exists "users can update their own profile" on profiles;
create policy "users can update their own profile"
  on profiles for update using (auth.uid() = id);

drop policy if exists "admins can update any profile" on profiles;
create policy "admins can update any profile"
  on profiles for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- SECURITY FIX (#6): without this, any authenticated user could call the
-- Supabase client directly with `update profiles set role='admin' where
-- id=auth.uid()` and it would succeed, because the UPDATE policy above only
-- checks row ownership, not which columns changed. This trigger runs on
-- every update and silently forces role/is_banned back to their previous
-- value unless the person making the change is *already* an admin. It
-- can't be bypassed from the frontend since it runs inside Postgres itself.
create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    new.role := old.role;
    new.is_banned := old.is_banned;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_privileged_profile_fields_trigger on profiles;
create trigger protect_privileged_profile_fields_trigger
  before update on profiles
  for each row execute procedure public.protect_privileged_profile_fields();

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1) || substr(new.id::text,1,4)),
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1))
  );
  return new;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant all on public.profiles to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- SUBJECTS / TOPICS / EXAMS
-- ------------------------------------------------------------
create table if not exists subjects (
  id serial primary key,
  name text not null unique,
  icon text,
  color text
);
create table if not exists topics (
  id serial primary key,
  subject_id int references subjects(id) on delete cascade,
  name text not null
);
create table if not exists exams (
  id serial primary key,
  name text not null unique
);

alter table subjects enable row level security;
alter table topics enable row level security;
alter table exams enable row level security;
drop policy if exists "subjects readable by all" on subjects;
create policy "subjects readable by all" on subjects for select using (true);
drop policy if exists "topics readable by all" on topics;
create policy "topics readable by all" on topics for select using (true);
drop policy if exists "exams readable by all" on exams;
create policy "exams readable by all" on exams for select using (true);

insert into subjects (name, icon, color) values
  ('Physics','⚛','c-blue'), ('Chemistry','🧪','c-green'), ('Biology','🧬','c-coral'),
  ('Mathematics','∑','c-purple'), ('Computer Science','⌨','c-teal'), ('General Knowledge','🌐','c-amber')
on conflict (name) do nothing;

insert into exams (name) values
  ('SSC'),('CET'),('NEET'),('JEE'),('Nursing'),('Government Exams'),('School'),('College')
on conflict (name) do nothing;

-- ------------------------------------------------------------
-- NOTES
-- ------------------------------------------------------------
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete set null,
  subject_id int references subjects(id),
  topic_id int references topics(id),
  title text not null,
  excerpt text,
  content text,
  file_url text,
  tags text[] default '{}',
  is_premium boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
alter table notes enable row level security;

-- SECURITY FIX (#10): premium notes were only hidden by the frontend — any
-- client could select them (content + file_url) straight from the API.
-- A public premium note is now only returned to premium members, admins
-- and its author. Trade-off: non-premium users no longer see premium notes
-- in the list at all (RLS works on whole rows, so there's no "show the
-- title, hide the body" option without a separate preview table/function).
drop policy if exists "notes readable by everyone" on notes;
create policy "notes readable by everyone" on notes for select
  using (
    (is_public = true and is_premium = false)
    or (is_public = true and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('premium','admin')))
    or auth.uid() = author_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "users can create personal notes, admins can publish public ones" on notes;
create policy "users can create personal notes, admins can publish public ones" on notes for insert
  with check (
    auth.uid() = author_id
    and (is_public = false or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  );

drop policy if exists "authors can update their own notes" on notes;
create policy "authors can update their own notes" on notes for update
  using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and (is_public = false or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  );

drop policy if exists "authors can delete their own notes" on notes;
create policy "authors can delete their own notes" on notes for delete using (auth.uid() = author_id);
drop policy if exists "admins can delete any note" on notes;
create policy "admins can delete any note" on notes for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ------------------------------------------------------------
-- BOOKMARKS
-- ------------------------------------------------------------
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  note_id uuid references notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, note_id)
);
alter table bookmarks enable row level security;
drop policy if exists "users manage their own bookmarks" on bookmarks;
create policy "users manage their own bookmarks" on bookmarks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- PUBLIC DOUBTS (Questions & Answers)
-- ------------------------------------------------------------
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete set null,
  subject_id int references subjects(id),
  content text not null,
  created_at timestamptz not null default now()
);
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  content text not null,
  is_helpful boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists question_likes (
  question_id uuid references questions(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (question_id, user_id)
);

alter table questions enable row level security;
alter table answers enable row level security;
alter table question_likes enable row level security;

drop policy if exists "questions readable by all" on questions;
create policy "questions readable by all" on questions for select using (true);
drop policy if exists "authenticated can post questions" on questions;
create policy "authenticated can post questions" on questions for insert with check (auth.uid() = author_id);
drop policy if exists "authors manage own questions" on questions;
create policy "authors manage own questions" on questions for update using (auth.uid() = author_id);
drop policy if exists "authors delete own questions" on questions;
create policy "authors delete own questions" on questions for delete using (auth.uid() = author_id);
drop policy if exists "admins can delete any question" on questions;
create policy "admins can delete any question" on questions for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "answers readable by all" on answers;
create policy "answers readable by all" on answers for select using (true);
drop policy if exists "authenticated can post answers" on answers;
create policy "authenticated can post answers" on answers for insert with check (auth.uid() = author_id);
drop policy if exists "authors manage own answers" on answers;
create policy "authors manage own answers" on answers for update using (auth.uid() = author_id);
drop policy if exists "admins can delete any answer" on answers;
create policy "admins can delete any answer" on answers for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "likes readable by all" on question_likes;
create policy "likes readable by all" on question_likes for select using (true);
drop policy if exists "users manage their own likes" on question_likes;
create policy "users manage their own likes" on question_likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- LIVE CHAT
-- ------------------------------------------------------------
create table if not exists live_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table live_messages enable row level security;
drop policy if exists "live messages readable by all" on live_messages;
create policy "live messages readable by all" on live_messages for select using (true);
drop policy if exists "authenticated can post live messages" on live_messages;
create policy "authenticated can post live messages" on live_messages for insert with check (auth.uid() = user_id);
drop policy if exists "authors delete own live messages" on live_messages;
create policy "authors delete own live messages" on live_messages for delete using (auth.uid() = user_id);
drop policy if exists "admins can delete any live message" on live_messages;
create policy "admins can delete any live message" on live_messages for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ------------------------------------------------------------
-- FRIEND REQUESTS (must exist before conversations, which depend on it)
-- ------------------------------------------------------------
create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid references profiles(id) on delete cascade,
  to_id uuid references profiles(id) on delete cascade,
  status text not null default 'pending', -- pending | accepted | rejected
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(from_id, to_id)
);
alter table friend_requests enable row level security;

drop policy if exists "involved users can read their friend requests" on friend_requests;
create policy "involved users can read their friend requests" on friend_requests for select
  using (auth.uid() = from_id or auth.uid() = to_id);

drop policy if exists "users can send a friend request" on friend_requests;
create policy "users can send a friend request" on friend_requests for insert
  with check (auth.uid() = from_id and from_id <> to_id);

-- SECURITY FIX (#7): the previous version of this policy let the SENDER
-- update the row too, which meant someone could accept their own
-- outgoing friend request. Only the recipient may accept/reject now.
drop policy if exists "recipient can accept or reject" on friend_requests;
create policy "recipient can accept or reject" on friend_requests for update
  using (auth.uid() = to_id)
  with check (auth.uid() = to_id);

drop policy if exists "sender can cancel their request" on friend_requests;
create policy "sender can cancel their request" on friend_requests for delete
  using (auth.uid() = from_id);

-- ------------------------------------------------------------
-- PRIVATE CHAT (1-to-1) — requires an accepted friend request
-- ------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);
create table if not exists private_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table conversations enable row level security;
alter table private_messages enable row level security;

drop policy if exists "participants can see their conversation" on conversations;
create policy "participants can see their conversation"
  on conversations for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- A private conversation can only be created once there's an accepted
-- friend request between the two people (either direction), or if either
-- side is an admin (support/moderation can still reach anyone directly).
drop policy if exists "authenticated users can start a conversation" on conversations;
create policy "authenticated users can start a conversation"
  on conversations for insert
  with check (
    (auth.uid() = user_a or auth.uid() = user_b)
    and (
      exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
      or exists (
        select 1 from friend_requests f
        where f.status = 'accepted'
        and ((f.from_id = user_a and f.to_id = user_b) or (f.from_id = user_b and f.to_id = user_a))
      )
    )
  );

drop policy if exists "participants can read their messages" on private_messages;
create policy "participants can read their messages"
  on private_messages for select
  using (exists (select 1 from conversations c where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())));

drop policy if exists "participants can send messages" on private_messages;
create policy "participants can send messages"
  on private_messages for insert
  with check (
    auth.uid() = sender_id and
    exists (select 1 from conversations c where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid()))
  );

drop policy if exists "participants can delete conversation messages" on private_messages;
create policy "participants can delete conversation messages"
  on private_messages for delete
  using (exists (select 1 from conversations c where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())));

-- ------------------------------------------------------------
-- REPORTS / MODERATION
-- ------------------------------------------------------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  target_type text not null,
  target_id text not null,
  reason text,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);
alter table reports enable row level security;
drop policy if exists "authenticated can file reports" on reports;
create policy "authenticated can file reports" on reports for insert with check (auth.uid() = reporter_id);
drop policy if exists "admins can view reports" on reports;
create policy "admins can view reports" on reports for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "admins can update reports" on reports;
create policy "admins can update reports" on reports for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  type text not null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table notifications add column if not exists created_by uuid references profiles(id) on delete set null;
alter table notifications enable row level security;

drop policy if exists "users see their own notifications" on notifications;
create policy "users see their own notifications" on notifications for select using (auth.uid() = user_id);
drop policy if exists "users update their own notifications" on notifications;
create policy "users update their own notifications" on notifications for update using (auth.uid() = user_id);

-- SECURITY FIX (#8): `with check (true)` meant literally anyone could
-- insert a notification pretending to be "for" or "from" anyone. This
-- can't fully stop cross-user spam without a backend, but it does force
-- every insert to honestly record who actually created it (traceable /
-- reportable), instead of an anonymous, unattributable free-for-all.
drop policy if exists "system can insert notifications" on notifications;
drop policy if exists "authenticated users can create notifications" on notifications;
create policy "authenticated users can create notifications" on notifications for insert
  with check (auth.uid() = created_by);

-- ------------------------------------------------------------
-- SUBSCRIPTIONS (payment-link based, see config.js)
-- ------------------------------------------------------------
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  plan text not null default 'premium',
  status text not null default 'pending',
  stripe_session_id text,
  created_at timestamptz not null default now()
);
alter table subscriptions enable row level security;
drop policy if exists "users see their own subscription" on subscriptions;
create policy "users see their own subscription" on subscriptions for select using (auth.uid() = user_id);
drop policy if exists "users can create their own pending subscription" on subscriptions;
create policy "users can create their own pending subscription" on subscriptions for insert with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- ROOM ID POOL — reserved admin codes + purchasable VIP numbers
-- (Table only — no reference to study_rooms yet, so this can be created
-- before study_rooms exists; the room_id column is added later once
-- study_rooms exists, fixing the original ordering bug.)
-- ------------------------------------------------------------
create table if not exists study_room_vip_codes (
  code text primary key,
  is_admin_reserved boolean not null default false,
  price numeric(10,2) not null default 199,
  claimed_by uuid references profiles(id) on delete set null,
  claimed_at timestamptz
);
alter table study_room_vip_codes enable row level security;
drop policy if exists "vip codes readable by everyone" on study_room_vip_codes;
create policy "vip codes readable by everyone" on study_room_vip_codes for select using (true);
drop policy if exists "admins can manage vip code pricing" on study_room_vip_codes;
create policy "admins can manage vip code pricing" on study_room_vip_codes for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
-- SECURITY FIX (#11): users could claim any paid VIP number (₹199–599) for
-- free with a direct update, since nothing checked for a payment. Users can
-- now only self-claim numbers priced at 0. Paid numbers are assigned by an
-- admin (set claimed_by to the buyer) once the payment shows up in the
-- provider dashboard — same manual flow as `subscriptions`. The
-- enforce_vip_room_code trigger on study_rooms (below) closes the other
-- route: creating a room with a VIP number as its room_code directly.
drop policy if exists "users can claim an available vip number" on study_room_vip_codes;
create policy "users can claim an available vip number" on study_room_vip_codes for update
  using (claimed_by is null and is_admin_reserved = false and price = 0)
  with check (claimed_by = auth.uid() and is_admin_reserved = false and price = 0);

insert into study_room_vip_codes (code, is_admin_reserved, price) values
  ('000001', true, 0), ('000002', true, 0), ('000003', true, 0), ('000004', true, 0), ('000005', true, 0),
  ('100000', false, 199), ('111111', false, 499), ('123456', false, 299), ('200000', false, 199),
  ('222222', false, 499), ('300000', false, 199), ('555555', false, 399), ('777777', false, 399),
  ('888888', false, 349), ('999999', false, 599)
on conflict (code) do nothing;

-- ------------------------------------------------------------
-- STUDY ROOMS (created before anything that references it)
-- ------------------------------------------------------------
create table if not exists study_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  name text not null,
  created_by uuid references profiles(id) on delete set null,
  is_premium boolean not null default false,
  price numeric(10,2) not null default 0,
  pinned_message text,
  locked boolean not null default false,
  created_at timestamptz not null default now()
);
alter table study_rooms add column if not exists price numeric(10,2) not null default 0;
alter table study_rooms add column if not exists pinned_message text;
alter table study_rooms add column if not exists locked boolean not null default false;
alter table study_rooms add column if not exists teacher_id uuid references profiles(id) on delete set null;
alter table study_rooms add column if not exists teacher_type text;
alter table study_rooms add column if not exists bot_teacher_id text;
alter table study_room_vip_codes add column if not exists room_id uuid references study_rooms(id) on delete set null;

create table if not exists study_room_members (
  room_id uuid references study_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  co_host boolean not null default false,
  primary key (room_id, user_id)
);
alter table study_room_members add column if not exists co_host boolean not null default false;

create table if not exists study_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references study_rooms(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists study_room_access_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references study_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(room_id, user_id)
);
alter table study_room_access_requests add column if not exists expires_at timestamptz;

create table if not exists study_room_bans (
  room_id uuid references study_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  banned_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists study_room_notes (
  room_id uuid primary key references study_rooms(id) on delete cascade,
  content text not null default '',
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists study_room_tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references study_rooms(id) on delete cascade,
  content text not null,
  is_done boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists study_room_whiteboard_strokes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references study_rooms(id) on delete cascade,
  points jsonb not null,
  color text not null default '#33E0FF',
  size int not null default 3,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists study_room_now_playing (
  room_id uuid primary key references study_rooms(id) on delete cascade,
  video_id text not null,
  title text,
  started_at timestamptz not null default now(),
  set_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table study_rooms enable row level security;
alter table study_room_members enable row level security;
alter table study_room_messages enable row level security;
alter table study_room_access_requests enable row level security;
alter table study_room_bans enable row level security;
alter table study_room_notes enable row level security;
alter table study_room_tasks enable row level security;
alter table study_room_whiteboard_strokes enable row level security;
alter table study_room_now_playing enable row level security;

-- study_rooms: admins can create any room (free or VIP with any price);
-- anyone else's own room must carry a real monthly price — they can still
-- invite specific friends in for free afterwards (a separate members
-- policy below), but a stranger joining by code has to pay/request access.
drop policy if exists "rooms readable by everyone" on study_rooms;
create policy "rooms readable by everyone" on study_rooms for select using (true);

drop policy if exists "authenticated users can create rooms" on study_rooms;
create policy "authenticated users can create rooms" on study_rooms for insert
  with check (
    auth.uid() = created_by
    and (
      exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
      or (is_premium = true and price > 0)
    )
  );

drop policy if exists "creator or admin can update room" on study_rooms;
create policy "creator or admin can update room" on study_rooms for update
  using (auth.uid() = created_by or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "creator or admin can delete room" on study_rooms;
create policy "creator or admin can delete room" on study_rooms for delete
  using (auth.uid() = created_by or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- SECURITY FIX (#11, continued): without this, anyone could skip the VIP
-- pool entirely and insert a room with room_code = '777777', or rename an
-- existing room to it. For non-admins, a room_code that's in the VIP pool
-- must already be claimed by the person creating the room, and room_code
-- can't be changed after creation. auth.uid() is null only for the SQL
-- editor / service role (RLS already blocks anonymous writes), so those
-- are let through for admin maintenance.
create or replace function public.enforce_vip_room_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.study_room_vip_codes%rowtype;
begin
  if auth.uid() is null
     or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.room_code is distinct from old.room_code then
      raise exception 'Only admins can change a room number';
    end if;
    return new;
  end if;

  select * into v from public.study_room_vip_codes where code = new.room_code;
  if found and v.claimed_by is distinct from auth.uid() then
    raise exception 'That room number is a VIP number you have not purchased';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_vip_room_code_trigger on study_rooms;
create trigger enforce_vip_room_code_trigger
  before insert or update of room_code on study_rooms
  for each row execute function public.enforce_vip_room_code();

drop policy if exists "room membership readable by everyone" on study_room_members;
create policy "room membership readable by everyone" on study_room_members for select using (true);

-- SECURITY/BUG FIX (#2): this used to only allow a self-join when the room
-- was free, or when the joining user's own profile role was already
-- 'admin'/'premium' — an ordinary student with a host-approved, unexpired
-- VIP access request could never actually complete their own join, because
-- nothing here checked study_room_access_requests at all. Added.
--
-- SECURITY FIX (#17): this also used to have no ban check at all — a banned
-- user couldn't join through the app's UI (which checks study_room_bans in
-- JavaScript first), but nothing stopped them from calling the Supabase
-- API directly from the browser console to insert themselves anyway. Now
-- blocked at the database level too, so the frontend check is a UX nicety,
-- not the actual security boundary.
drop policy if exists "users can join a room if allowed" on study_room_members;
create policy "users can join a room if allowed" on study_room_members for insert
  with check (
    auth.uid() = user_id
    and not exists (select 1 from study_room_bans b where b.room_id = room_id and b.user_id = auth.uid())
    and exists (
      select 1 from study_rooms r
      where r.id = room_id
      and (
        r.is_premium = false
        or r.created_by = auth.uid()
        or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','premium'))
        or exists (
          select 1 from study_room_access_requests a
          where a.room_id = r.id and a.user_id = auth.uid() and a.status = 'approved'
          and (a.expires_at is null or a.expires_at > now())
        )
      )
    )
  );

-- Lets the host/admin add ANY approved user straight into the room
-- (the policy above only lets people add themselves).
drop policy if exists "host/admin can add a member after approving access" on study_room_members;
create policy "host/admin can add a member after approving access"
  on study_room_members for insert
  with check (
    exists (select 1 from study_rooms r where r.id = room_id and r.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "users can leave a room" on study_room_members;
create policy "users can leave a room" on study_room_members for delete using (auth.uid() = user_id);
drop policy if exists "host or admin can remove a member" on study_room_members;
create policy "host or admin can remove a member" on study_room_members for delete
  using (
    exists (select 1 from study_rooms r where r.id = study_room_members.room_id and r.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- BUG FIX: study_room_members had RLS enabled but no UPDATE policy at all,
-- so "Make co-host" silently matched zero rows (no error, no effect).
-- NOTE (#16): this intentionally only lets the room's actual creator (or a
-- platform admin) change a member's row — a co-host does NOT get this
-- permission, so co-hosts can't promote/demote/remove other members or
-- touch anyone's row via the database, only via whatever the app's UI
-- explicitly exposes to them (currently: nothing at the DB level).
drop policy if exists "room host or admin can update a member's row" on study_room_members;
create policy "room host or admin can update a member's row" on study_room_members for update
  using (
    exists (select 1 from study_rooms r where r.id = study_room_members.room_id and r.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from study_rooms r where r.id = study_room_members.room_id and r.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "members can read room messages" on study_room_messages;
create policy "members can read room messages" on study_room_messages for select
  using (exists (select 1 from study_room_members m where m.room_id = study_room_messages.room_id and m.user_id = auth.uid())
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "members can send room messages" on study_room_messages;
create policy "members can send room messages" on study_room_messages for insert
  with check (auth.uid() = sender_id and exists (select 1 from study_room_members m where m.room_id = study_room_messages.room_id and m.user_id = auth.uid()));

drop policy if exists "users see own requests, host/admin see all for their room" on study_room_access_requests;
create policy "users see own requests, host/admin see all for their room"
  on study_room_access_requests for select
  using (
    auth.uid() = user_id
    or exists (select 1 from study_rooms r where r.id = room_id and r.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists "users can request access to a room" on study_room_access_requests;
create policy "users can request access to a room"
  on study_room_access_requests for insert
  with check (auth.uid() = user_id);
drop policy if exists "host/admin can resolve requests for their room" on study_room_access_requests;
create policy "host/admin can resolve requests for their room"
  on study_room_access_requests for update
  using (
    exists (select 1 from study_rooms r where r.id = room_id and r.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "host/admin can view bans" on study_room_bans;
create policy "host/admin can view bans" on study_room_bans for select
  using (exists (select 1 from study_rooms r where r.id = room_id and r.created_by = auth.uid())
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "host/admin can ban" on study_room_bans;
create policy "host/admin can ban" on study_room_bans for insert
  with check (exists (select 1 from study_rooms r where r.id = room_id and r.created_by = auth.uid())
              or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "host/admin can unban" on study_room_bans;
create policy "host/admin can unban" on study_room_bans for delete
  using (exists (select 1 from study_rooms r where r.id = room_id and r.created_by = auth.uid())
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ------------------------------------------------------------
-- DIGITAL BOARD — the room's notes, whiteboard, music, tasks and teacher
-- panel all live inside one shared board. Only the room's host, its
-- assigned human teacher (study_rooms.teacher_id) and admins can operate
-- it; everyone else just watches. study_room_board stores which tab the
-- board is showing, so every student's screen follows the teacher's.
--
-- SECURITY FIX (#12): the old insert policies below used
-- `m.room_id = room_id` inside the subquery, where the unqualified room_id
-- resolves to m.room_id itself — so being a member of ANY room let you
-- write into every room. The new policies use the helper instead.
-- ------------------------------------------------------------
create or replace function public.can_control_room_board(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
      or exists (select 1 from study_rooms r where r.id = p_room_id and (r.created_by = auth.uid() or r.teacher_id = auth.uid()));
$$;

create table if not exists study_room_board (
  room_id uuid primary key references study_rooms(id) on delete cascade,
  active_tab text not null default 'whiteboard',
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table study_room_board enable row level security;

drop policy if exists "members can see the board" on study_room_board;
create policy "members can see the board" on study_room_board for select
  using (exists (select 1 from study_room_members m where m.room_id = study_room_board.room_id and m.user_id = auth.uid())
         or public.can_control_room_board(study_room_board.room_id));
drop policy if exists "board controllers can set up the board" on study_room_board;
create policy "board controllers can set up the board" on study_room_board for insert
  with check (public.can_control_room_board(room_id));
drop policy if exists "board controllers can switch the board" on study_room_board;
create policy "board controllers can switch the board" on study_room_board for update
  using (public.can_control_room_board(study_room_board.room_id))
  with check (public.can_control_room_board(study_room_board.room_id));

drop policy if exists "members can read shared notes" on study_room_notes;
create policy "members can read shared notes" on study_room_notes for select
  using (exists (select 1 from study_room_members m where m.room_id = study_room_notes.room_id and m.user_id = auth.uid())
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "members can create shared notes" on study_room_notes;
drop policy if exists "board controllers can create shared notes" on study_room_notes;
create policy "board controllers can create shared notes" on study_room_notes for insert
  with check (public.can_control_room_board(room_id));
drop policy if exists "members can edit shared notes" on study_room_notes;
drop policy if exists "board controllers can edit shared notes" on study_room_notes;
create policy "board controllers can edit shared notes" on study_room_notes for update
  using (public.can_control_room_board(study_room_notes.room_id))
  with check (public.can_control_room_board(study_room_notes.room_id));

drop policy if exists "members can read tasks" on study_room_tasks;
create policy "members can read tasks" on study_room_tasks for select
  using (exists (select 1 from study_room_members m where m.room_id = study_room_tasks.room_id and m.user_id = auth.uid())
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "members can add tasks" on study_room_tasks;
drop policy if exists "board controllers can add tasks" on study_room_tasks;
create policy "board controllers can add tasks" on study_room_tasks for insert
  with check (auth.uid() = created_by and public.can_control_room_board(room_id));
drop policy if exists "members can update tasks" on study_room_tasks;
drop policy if exists "board controllers can update tasks" on study_room_tasks;
create policy "board controllers can update tasks" on study_room_tasks for update
  using (public.can_control_room_board(study_room_tasks.room_id))
  with check (public.can_control_room_board(study_room_tasks.room_id));
drop policy if exists "members can delete tasks" on study_room_tasks;
drop policy if exists "board controllers can delete tasks" on study_room_tasks;
create policy "board controllers can delete tasks" on study_room_tasks for delete
  using (public.can_control_room_board(study_room_tasks.room_id));

drop policy if exists "members can read whiteboard" on study_room_whiteboard_strokes;
create policy "members can read whiteboard" on study_room_whiteboard_strokes for select
  using (exists (select 1 from study_room_members m where m.room_id = study_room_whiteboard_strokes.room_id and m.user_id = auth.uid())
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "members can draw on whiteboard" on study_room_whiteboard_strokes;
drop policy if exists "board controllers can draw on whiteboard" on study_room_whiteboard_strokes;
create policy "board controllers can draw on whiteboard" on study_room_whiteboard_strokes for insert
  with check (auth.uid() = created_by and public.can_control_room_board(room_id));
drop policy if exists "members can clear whiteboard" on study_room_whiteboard_strokes;
drop policy if exists "board controllers can clear whiteboard" on study_room_whiteboard_strokes;
create policy "board controllers can clear whiteboard" on study_room_whiteboard_strokes for delete
  using (public.can_control_room_board(study_room_whiteboard_strokes.room_id));

drop policy if exists "room members can see what's playing" on study_room_now_playing;
create policy "room members can see what's playing" on study_room_now_playing for select
  using (exists (select 1 from study_room_members m where m.room_id = study_room_now_playing.room_id and m.user_id = auth.uid())
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "room members can queue a song" on study_room_now_playing;
drop policy if exists "board controllers can queue a song" on study_room_now_playing;
create policy "board controllers can queue a song" on study_room_now_playing for insert
  with check (public.can_control_room_board(room_id));
drop policy if exists "room members can change the song" on study_room_now_playing;
drop policy if exists "board controllers can change the song" on study_room_now_playing;
create policy "board controllers can change the song" on study_room_now_playing for update
  using (public.can_control_room_board(study_room_now_playing.room_id))
  with check (public.can_control_room_board(study_room_now_playing.room_id));

-- ------------------------------------------------------------
-- TESTS (practice "Test" + scheduled "Live Test")
-- ------------------------------------------------------------
create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject_id int references subjects(id),
  is_live boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  created_at timestamptz not null default now()
);
create table if not exists test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score int not null default 0,
  total int not null default 0,
  submitted_at timestamptz not null default now()
);
alter table test_attempts add column if not exists answers jsonb not null default '{}'::jsonb;

alter table tests enable row level security;
alter table test_questions enable row level security;
alter table test_attempts enable row level security;

drop policy if exists "tests readable by everyone" on tests;
create policy "tests readable by everyone" on tests for select using (true);
drop policy if exists "admins can create tests" on tests;
create policy "admins can create tests" on tests for insert
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "admins can update tests" on tests;
create policy "admins can update tests" on tests for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "admins can delete tests" on tests;
create policy "admins can delete tests" on tests for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "test questions readable by everyone" on test_questions;
create policy "test questions readable by everyone" on test_questions for select using (true);
drop policy if exists "admins can add test questions" on test_questions;
create policy "admins can add test questions" on test_questions for insert
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "admins can delete test questions" on test_questions;
create policy "admins can delete test questions" on test_questions for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- SECURITY (#21): users can only ever insert an attempt as themselves, and
-- there is deliberately NO update/delete policy on test_attempts — with
-- RLS enabled and no such policy, Postgres denies all updates/deletes by
-- default, so nobody (not even the test-taker) can alter a score after
-- it's submitted.
drop policy if exists "users see their own attempts, admins see all" on test_attempts;
create policy "users see their own attempts, admins see all" on test_attempts for select
  using (auth.uid() = user_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "users submit their own attempt" on test_attempts;
create policy "users submit their own attempt" on test_attempts for insert
  with check (auth.uid() = user_id);

-- SECURITY FIX (#21): the client used to compute score/total itself and
-- the database just stored whatever number it was told — trivially
-- editable from the browser console before hitting submit. This trigger
-- recomputes the real score from the submitted answers and the actual
-- answer key in test_questions, and overwrites score/total with the
-- correct numbers no matter what the client sent.
-- KNOWN LIMITATION (documented, not fixed here): test_questions.correct_index
-- is still readable by any signed-in client via a normal select before they
-- submit — there's no backend in this project to hide it selectively.
-- This trigger stops *score* tampering; it doesn't hide the answer key.
create or replace function public.verify_test_attempt_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  computed_score int;
  computed_total int;
begin
  select count(*) into computed_total from test_questions where test_id = new.test_id;
  select count(*) into computed_score
    from test_questions q
    where q.test_id = new.test_id
    and (new.answers ->> q.id::text)::int = q.correct_index;
  new.score := coalesce(computed_score, 0);
  new.total := coalesce(computed_total, 0);
  return new;
end;
$$;

drop trigger if exists verify_test_attempt_score_trigger on test_attempts;
create trigger verify_test_attempt_score_trigger
  before insert on test_attempts
  for each row execute procedure public.verify_test_attempt_score();

-- ------------------------------------------------------------
-- STORAGE — profile photos, note files, room files (see security note
-- at the top of this file about the public-read trade-off)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

drop policy if exists "attachments are publicly viewable" on storage.objects;
create policy "attachments are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'attachments');

drop policy if exists "authenticated users can upload attachments" on storage.objects;
create policy "authenticated users can upload attachments"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

drop policy if exists "users can update their own uploaded files" on storage.objects;
create policy "users can update their own uploaded files"
  on storage.objects for update
  using (bucket_id = 'attachments' and owner = auth.uid());

drop policy if exists "users can delete their own uploaded files" on storage.objects;
create policy "users can delete their own uploaded files"
  on storage.objects for delete
  using (bucket_id = 'attachments' and owner = auth.uid());

-- ------------------------------------------------------------
-- REALTIME — add every live-updating table to the publication.
-- Wrapped so re-running this script never fails just because a table is
-- already in the publication (Postgres has no "add table if not exists"
-- for publications, so this fakes it with exception handling).
-- ------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table live_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table private_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table answers; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table questions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table study_room_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table study_room_access_requests; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table study_room_now_playing; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table study_room_whiteboard_strokes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table study_room_tasks; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table study_room_notes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table study_room_board; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table friend_requests; exception when duplicate_object then null; end;
end $$;

-- ============================================================
-- To make yourself an admin after signing up once, run (replace the email):
-- update profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'you@example.com');
-- ============================================================

-- ============================================================
-- CHAT APPEARANCE — themes/fonts for Live Chat, Doubt (Public) Chat,
-- and Private Chat, with the permission split the app requires:
--   - Live Chat & Doubt Chat: ONE shared look for everyone, editable by
--     admins only (host-controlled).
--   - Private Chat: one shared look per conversation, editable by either
--     participant (both-controlled).
-- ============================================================
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table app_settings enable row level security;
drop policy if exists "app settings readable by everyone" on app_settings;
create policy "app settings readable by everyone" on app_settings for select using (true);
drop policy if exists "only admins can change app settings" on app_settings;
create policy "only admins can change app settings" on app_settings for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists conversation_appearance (
  conversation_id uuid primary key references conversations(id) on delete cascade,
  value jsonb not null,
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table conversation_appearance enable row level security;
drop policy if exists "participants can read their chat appearance" on conversation_appearance;
create policy "participants can read their chat appearance" on conversation_appearance for select
  using (exists (select 1 from conversations c where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())));
drop policy if exists "either participant can set their chat appearance" on conversation_appearance;
create policy "either participant can set their chat appearance" on conversation_appearance for all
  using (exists (select 1 from conversations c where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())))
  with check (auth.uid() = updated_by and exists (select 1 from conversations c where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())));

-- ============================================================
-- DISCUSSION ROOMS — study room + classroom + debate + leaderboard
-- Design notes (why some things are merged instead of exactly matching
-- the spec's table list): scores live as columns on discussion_answers
-- rather than a separate discussion_scores table (one row already IS one
-- score), the leaderboard is COMPUTED from discussion_answers rather than
-- a stored discussion_leaderboards table (a computed view can never drift
-- out of sync with the real answers, which a stored copy could), "raise
-- hand" is a column on membership rather than its own table, and there is
-- one teacher_id column per room rather than a discussion_room_teachers
-- table (this app supports exactly one teacher per room at a time, which
-- matches the "Current Teacher" singular design in the spec). This keeps
-- the schema smaller without losing any required capability, per the
-- brief's own instruction to avoid unnecessary duplicate tables.
-- ============================================================

create table if not exists discussion_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,          -- e.g. DR-2026-0001
  name text not null,
  description text,
  subject_id int references subjects(id),
  host_id uuid references profiles(id) on delete set null,
  teacher_id uuid references profiles(id) on delete set null,
  max_members int not null default 30,
  privacy text not null default 'public',  -- public | private | invite_only
  scoring_enabled boolean not null default true,
  leaderboard_enabled boolean not null default true,
  medals_enabled boolean not null default true,
  penalty_enabled boolean not null default false,  -- host choice: off-topic answers get 0 vs a configured penalty
  rules text[] default array[
    'Respect everyone.','Explain your reasoning.','No spam.',
    'No copied answers.','No personal attacks.','Stay on topic.','Give others a chance.'
  ],
  status text not null default 'open',     -- open | live | ended | archived
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists discussion_room_members (
  room_id uuid references discussion_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  hand_raised boolean not null default false,
  hand_raised_at timestamptz,
  primary key (room_id, user_id)
);

create table if not exists discussion_topics (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references discussion_rooms(id) on delete cascade,
  title text not null,
  description text,
  subject_id int references subjects(id),
  difficulty text default 'medium',        -- easy | medium | hard
  discussion_minutes int default 20,
  image_url text,
  file_url text,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists discussion_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references discussion_rooms(id) on delete cascade,
  topic_id uuid references discussion_topics(id) on delete cascade,
  round_number int not null default 1,
  round_type text not null default 'knowledge', -- knowledge|thinking|advice|challenge|final
  question text not null,
  timer_seconds int default 60,
  status text not null default 'pending',  -- pending | active | ended
  current_participant_id uuid references profiles(id) on delete set null,
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists discussion_answers (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references discussion_rounds(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  submitted_at timestamptz not null default now(),
  time_taken_seconds int,
  -- Scoring: 0-10 each, only a host/teacher-authorized update may set these
  -- (see the trigger + policies below) — never trusted from client insert.
  knowledge_score int not null default 0,
  reasoning_score int not null default 0,
  creativity_score int not null default 0,
  relevance_score int not null default 0,
  communication_score int not null default 0,
  bonus_points int not null default 0,
  total_score int generated always as (
    knowledge_score + reasoning_score + creativity_score + relevance_score + communication_score + bonus_points
  ) stored,
  feedback text,
  evaluated_by uuid references profiles(id) on delete set null,
  evaluated_at timestamptz,
  unique (round_id, user_id)
);

create table if not exists discussion_polls (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references discussion_rooms(id) on delete cascade,
  question text not null,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists discussion_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references discussion_polls(id) on delete cascade,
  label text not null,
  position int not null default 0
);
create table if not exists discussion_poll_votes (
  poll_id uuid references discussion_polls(id) on delete cascade,
  option_id uuid references discussion_poll_options(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  voted_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create table if not exists discussion_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references discussion_rooms(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  content text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists discussion_room_files (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references discussion_rooms(id) on delete cascade,
  uploaded_by uuid references profiles(id) on delete set null,
  file_url text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

-- Only ever written by the award_discussion_winners() function below
-- (security definer) — there is deliberately NO insert policy for regular
-- users, so a student cannot award themselves a medal no matter what API
-- call they try.
create table if not exists discussion_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  room_id uuid references discussion_rooms(id) on delete set null,
  room_code text,
  topic_title text,
  award_type text not null,     -- champion | best_thinker | most_creative | knowledge_master | best_communicator | helpful_student
  medal_level text not null,    -- bronze | silver | gold | champion | master_thinker
  score int not null default 0,
  awarded_at timestamptz not null default now()
);

alter table discussion_rooms add column if not exists teacher_type text;
alter table discussion_rooms add column if not exists bot_teacher_id text;
alter table discussion_rooms enable row level security;
alter table discussion_room_members enable row level security;
alter table discussion_topics enable row level security;
alter table discussion_rounds enable row level security;
alter table discussion_answers enable row level security;
alter table discussion_polls enable row level security;
alter table discussion_poll_options enable row level security;
alter table discussion_poll_votes enable row level security;
alter table discussion_messages enable row level security;
alter table discussion_room_files enable row level security;
alter table discussion_achievements enable row level security;

-- ---- helper predicate reused across many policies below ----
-- (Postgres has no boolean macros, so this is just repeated inline, but
-- documented once here for clarity.)
-- "is host or admin"    : r.host_id = auth.uid() OR profiles.role='admin'
-- "is host/teacher/admin": above OR r.teacher_id = auth.uid()
-- "is member"           : exists row in discussion_room_members

drop policy if exists "rooms readable by everyone if public, else members/host/teacher/admin" on discussion_rooms;
create policy "rooms readable by everyone if public, else members/host/teacher/admin" on discussion_rooms for select
  using (
    privacy = 'public'
    or host_id = auth.uid() or teacher_id = auth.uid()
    or exists (select 1 from discussion_room_members m where m.room_id = id and m.user_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists "authenticated users can create a discussion room" on discussion_rooms;
create policy "authenticated users can create a discussion room" on discussion_rooms for insert
  with check (auth.uid() = host_id);
drop policy if exists "host or admin can update room" on discussion_rooms;
create policy "host or admin can update room" on discussion_rooms for update
  using (host_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "host or admin can delete/archive room" on discussion_rooms;
create policy "host or admin can delete/archive room" on discussion_rooms for delete
  using (host_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "membership readable by everyone" on discussion_room_members;
create policy "membership readable by everyone" on discussion_room_members for select using (true);
drop policy if exists "users can join a public/invited room themselves" on discussion_room_members;
create policy "users can join a public/invited room themselves" on discussion_room_members for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from discussion_rooms r where r.id = room_id and r.privacy = 'public')
  );
drop policy if exists "host/admin can add any member" on discussion_room_members;
create policy "host/admin can add any member" on discussion_room_members for insert
  with check (exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid()))
              or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "users can update their own membership row (raise hand)" on discussion_room_members;
create policy "users can update their own membership row (raise hand)" on discussion_room_members for update
  using (auth.uid() = user_id or exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())));
drop policy if exists "users can leave, host/admin can remove" on discussion_room_members;
create policy "users can leave, host/admin can remove" on discussion_room_members for delete
  using (auth.uid() = user_id or exists (select 1 from discussion_rooms r where r.id = room_id and r.host_id = auth.uid())
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "topics readable if room readable" on discussion_topics;
create policy "topics readable if room readable" on discussion_topics for select
  using (exists (select 1 from discussion_rooms r where r.id = room_id));
drop policy if exists "host or teacher can manage topics" on discussion_topics;
create policy "host or teacher can manage topics" on discussion_topics for all
  using (exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid()))
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid()))
              or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "rounds readable by room members" on discussion_rounds;
create policy "rounds readable by room members" on discussion_rounds for select
  using (exists (select 1 from discussion_room_members m where m.room_id = discussion_rounds.room_id and m.user_id = auth.uid())
         or exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid()))
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "host or teacher can manage rounds" on discussion_rounds;
create policy "host or teacher can manage rounds" on discussion_rounds for all
  using (exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid()))
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid()))
              or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "answers readable by room members" on discussion_answers;
create policy "answers readable by room members" on discussion_answers for select
  using (exists (
    select 1 from discussion_rounds rd join discussion_room_members m on m.room_id = rd.room_id
    where rd.id = round_id and m.user_id = auth.uid()
  ) or exists (
    select 1 from discussion_rounds rd join discussion_rooms r on r.id = rd.room_id
    where rd.id = round_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())
  ) or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- SECURITY (#38): a student may only insert their OWN answer, only during
-- their OWN turn (or an open/untargeted round), and score columns default
-- to 0 regardless of what they send — see the trigger below that hard-locks
-- them for non-host/teacher inserts, so "score:1000" in a crafted request
-- is simply overwritten back to 0 before the row is ever stored.
drop policy if exists "members submit their own answer on their turn" on discussion_answers;
create policy "members submit their own answer on their turn" on discussion_answers for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from discussion_rounds rd
      join discussion_room_members m on m.room_id = rd.room_id and m.user_id = auth.uid()
      where rd.id = round_id and rd.status = 'active'
      and (rd.current_participant_id is null or rd.current_participant_id = auth.uid())
    )
  );
drop policy if exists "host or teacher can score an answer" on discussion_answers;
create policy "host or teacher can score an answer" on discussion_answers for update
  using (exists (
    select 1 from discussion_rounds rd join discussion_rooms r on r.id = rd.room_id
    where rd.id = round_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())
  ) or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create or replace function public.protect_discussion_answer_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_authorized boolean;
begin
  select exists (
    select 1 from discussion_rounds rd join discussion_rooms r on r.id = rd.room_id
    where rd.id = new.round_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())
  ) or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  into is_authorized;

  if tg_op = 'INSERT' and not is_authorized then
    -- a student's own submission always starts at zero score — only a
    -- follow-up UPDATE by the host/teacher (allowed by the policy above)
    -- can ever change these numbers.
    new.knowledge_score := 0; new.reasoning_score := 0; new.creativity_score := 0;
    new.relevance_score := 0; new.communication_score := 0; new.bonus_points := 0;
    new.evaluated_by := null; new.evaluated_at := null;
  end if;

  if tg_op = 'UPDATE' and not is_authorized then
    -- a student editing their own answer text can't smuggle in a score
    -- change either — scores are pinned to whatever they already were.
    new.knowledge_score := old.knowledge_score; new.reasoning_score := old.reasoning_score;
    new.creativity_score := old.creativity_score; new.relevance_score := old.relevance_score;
    new.communication_score := old.communication_score; new.bonus_points := old.bonus_points;
    new.evaluated_by := old.evaluated_by; new.evaluated_at := old.evaluated_at;
  end if;

  if tg_op = 'UPDATE' and is_authorized then
    new.evaluated_by := auth.uid();
    new.evaluated_at := now();
    -- clamp every score to the documented 0-10 range (0-50+bonus total)
    new.knowledge_score := greatest(0, least(10, coalesce(new.knowledge_score,0)));
    new.reasoning_score := greatest(0, least(10, coalesce(new.reasoning_score,0)));
    new.creativity_score := greatest(0, least(10, coalesce(new.creativity_score,0)));
    new.relevance_score := greatest(0, least(10, coalesce(new.relevance_score,0)));
    new.communication_score := greatest(0, least(10, coalesce(new.communication_score,0)));
    new.bonus_points := greatest(0, least(20, coalesce(new.bonus_points,0)));
  end if;

  return new;
end;
$$;
drop trigger if exists protect_discussion_answer_scores_trigger on discussion_answers;
create trigger protect_discussion_answer_scores_trigger
  before insert or update on discussion_answers
  for each row execute procedure public.protect_discussion_answer_scores();

drop policy if exists "polls readable by room members" on discussion_polls;
create policy "polls readable by room members" on discussion_polls for select
  using (exists (select 1 from discussion_room_members m where m.room_id = discussion_polls.room_id and m.user_id = auth.uid())
         or exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())));
drop policy if exists "host or teacher can manage polls" on discussion_polls;
create policy "host or teacher can manage polls" on discussion_polls for all
  using (exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())))
  with check (exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())));

drop policy if exists "poll options readable by room members" on discussion_poll_options;
create policy "poll options readable by room members" on discussion_poll_options for select
  using (exists (select 1 from discussion_polls pl where pl.id = poll_id));
drop policy if exists "host or teacher can manage poll options" on discussion_poll_options;
create policy "host or teacher can manage poll options" on discussion_poll_options for all
  using (exists (select 1 from discussion_polls pl join discussion_rooms r on r.id = pl.room_id where pl.id = poll_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())))
  with check (exists (select 1 from discussion_polls pl join discussion_rooms r on r.id = pl.room_id where pl.id = poll_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())));

drop policy if exists "poll votes readable by room members" on discussion_poll_votes;
create policy "poll votes readable by room members" on discussion_poll_votes for select
  using (exists (select 1 from discussion_polls pl join discussion_room_members m on m.room_id = pl.room_id where pl.id = poll_id and m.user_id = auth.uid()));
drop policy if exists "members vote once per poll" on discussion_poll_votes;
create policy "members vote once per poll" on discussion_poll_votes for insert
  with check (auth.uid() = user_id and exists (select 1 from discussion_polls pl join discussion_room_members m on m.room_id = pl.room_id where pl.id = poll_id and m.user_id = auth.uid()));

drop policy if exists "messages readable by room members" on discussion_messages;
create policy "messages readable by room members" on discussion_messages for select
  using (exists (select 1 from discussion_room_members m where m.room_id = discussion_messages.room_id and m.user_id = auth.uid())
         or exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())));
drop policy if exists "members can send messages" on discussion_messages;
create policy "members can send messages" on discussion_messages for insert
  with check (auth.uid() = sender_id and exists (select 1 from discussion_room_members m where m.room_id = room_id and m.user_id = auth.uid()));
drop policy if exists "host/teacher/author can pin or delete messages" on discussion_messages;
create policy "host/teacher/author can pin or delete messages" on discussion_messages for update
  using (auth.uid() = sender_id or exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())));
drop policy if exists "host/teacher/author can delete messages" on discussion_messages;
create policy "host/teacher/author can delete messages" on discussion_messages for delete
  using (auth.uid() = sender_id or exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid()))
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "files readable by room members" on discussion_room_files;
create policy "files readable by room members" on discussion_room_files for select
  using (exists (select 1 from discussion_room_members m where m.room_id = discussion_room_files.room_id and m.user_id = auth.uid())
         or exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())));
drop policy if exists "host or teacher can upload room files" on discussion_room_files;
create policy "host or teacher can upload room files" on discussion_room_files for insert
  with check (auth.uid() = uploaded_by and exists (select 1 from discussion_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())));

-- SECURITY (#39): achievements are readable by everyone (they show on
-- public profiles) but have NO insert/update policy for ordinary users at
-- all — the only way a row appears here is through the function below,
-- which runs with elevated privileges and is only callable by a room's
-- host/teacher/admin.
drop policy if exists "achievements readable by everyone" on discussion_achievements;
create policy "achievements readable by everyone" on discussion_achievements for select using (true);

-- SECURITY (#37): appointing/removing/changing a teacher is just an UPDATE
-- to discussion_rooms.teacher_id, already covered by "host or admin can
-- update room" above — so only the room's actual host (or a platform
-- admin) can ever change who the teacher is. A teacher can never appoint
-- themselves or another teacher, and appointing someone never touches
-- their global profiles.role, so they never become a global admin.

-- Computes and stores the winners for a finished discussion room. Callable
-- only by that room's host/teacher (or a platform admin) — this is the
-- ONLY path by which discussion_achievements ever gets a new row, which is
-- what actually prevents self-awarded medals (#39), not just a policy.
create or replace function public.award_discussion_winners(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  is_authorized boolean;
  r_code text; r_topic text;
begin
  select exists (
    select 1 from discussion_rooms r where r.id = p_room_id and (r.host_id = auth.uid() or r.teacher_id = auth.uid())
  ) or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  into is_authorized;
  if not is_authorized then
    raise exception 'Only the host or teacher can finalize this discussion.';
  end if;

  select room_code into r_code from discussion_rooms where id = p_room_id;
  select title into r_topic from discussion_topics where room_id = p_room_id and is_active = true order by created_at desc limit 1;

  -- 🏆 Discussion Champion — highest total score across the room
  insert into discussion_achievements (user_id, room_id, room_code, topic_title, award_type, medal_level, score)
  select a.user_id, p_room_id, r_code, r_topic, 'champion', 'champion', sum(a.total_score)
  from discussion_answers a join discussion_rounds rd on rd.id = a.round_id
  where rd.room_id = p_room_id
  group by a.user_id order by sum(a.total_score) desc limit 1;

  -- 🧠 Best Thinker — highest average reasoning score
  insert into discussion_achievements (user_id, room_id, room_code, topic_title, award_type, medal_level, score)
  select a.user_id, p_room_id, r_code, r_topic, 'best_thinker', 'gold', round(avg(a.reasoning_score))
  from discussion_answers a join discussion_rounds rd on rd.id = a.round_id
  where rd.room_id = p_room_id
  group by a.user_id order by avg(a.reasoning_score) desc limit 1;

  -- 💡 Most Creative
  insert into discussion_achievements (user_id, room_id, room_code, topic_title, award_type, medal_level, score)
  select a.user_id, p_room_id, r_code, r_topic, 'most_creative', 'gold', round(avg(a.creativity_score))
  from discussion_answers a join discussion_rounds rd on rd.id = a.round_id
  where rd.room_id = p_room_id
  group by a.user_id order by avg(a.creativity_score) desc limit 1;

  -- 📚 Knowledge Master
  insert into discussion_achievements (user_id, room_id, room_code, topic_title, award_type, medal_level, score)
  select a.user_id, p_room_id, r_code, r_topic, 'knowledge_master', 'gold', round(avg(a.knowledge_score))
  from discussion_answers a join discussion_rounds rd on rd.id = a.round_id
  where rd.room_id = p_room_id
  group by a.user_id order by avg(a.knowledge_score) desc limit 1;

  -- 🗣 Best Communicator
  insert into discussion_achievements (user_id, room_id, room_code, topic_title, award_type, medal_level, score)
  select a.user_id, p_room_id, r_code, r_topic, 'best_communicator', 'gold', round(avg(a.communication_score))
  from discussion_answers a join discussion_rounds rd on rd.id = a.round_id
  where rd.room_id = p_room_id
  group by a.user_id order by avg(a.communication_score) desc limit 1;

  update discussion_rooms set status = 'ended', ended_at = now() where id = p_room_id;
end;
$$;
grant execute on function public.award_discussion_winners(uuid) to authenticated;

do $$
begin
  begin alter publication supabase_realtime add table discussion_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table discussion_rounds; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table discussion_answers; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table discussion_room_members; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table discussion_poll_votes; exception when duplicate_object then null; end;
end $$;
