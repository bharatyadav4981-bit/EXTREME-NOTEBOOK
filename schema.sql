-- ============================================================
-- THE EXTREME NOTEBOOK — DATABASE SCHEMA (Supabase / Postgres)
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Extra safety: uuid generator
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
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are viewable by everyone"
  on profiles for select using (true);

create policy "users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1) || substr(new.id::text,1,4)),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1))
  );
  return new;
end;
$$ language plpgsql security definer;

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
create policy "subjects readable by all" on subjects for select using (true);
create policy "topics readable by all" on topics for select using (true);
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

-- Everyone can read admin-published (public) notes. Students can also read their own personal notes.
create policy "notes readable by everyone" on notes for select
  using (
    is_public = true
    or auth.uid() = author_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Any signed-in user can create a note for themselves, but it can only be marked
-- public (visible to everyone in the shared library) if they are an admin.
create policy "users can create personal notes, admins can publish public ones" on notes for insert
  with check (
    auth.uid() = author_id
    and (is_public = false or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  );

create policy "authors can update their own notes" on notes for update
  using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and (is_public = false or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  );

create policy "authors can delete their own notes" on notes for delete using (auth.uid() = author_id);

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

create policy "questions readable by all" on questions for select using (true);
create policy "authenticated can post questions" on questions for insert with check (auth.uid() = author_id);
create policy "authors manage own questions" on questions for update using (auth.uid() = author_id);
create policy "authors delete own questions" on questions for delete using (auth.uid() = author_id);

create policy "answers readable by all" on answers for select using (true);
create policy "authenticated can post answers" on answers for insert with check (auth.uid() = author_id);
create policy "authors manage own answers" on answers for update using (auth.uid() = author_id);

create policy "likes readable by all" on question_likes for select using (true);
create policy "users manage their own likes" on question_likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- LIVE CHAT (single public room for simplicity — extend to multiple rooms later)
-- ------------------------------------------------------------
create table if not exists live_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table live_messages enable row level security;
create policy "live messages readable by all" on live_messages for select using (true);
create policy "authenticated can post live messages" on live_messages for insert with check (auth.uid() = user_id);
create policy "authors delete own live messages" on live_messages for delete using (auth.uid() = user_id);
create policy "admins can delete any live message" on live_messages for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ------------------------------------------------------------
-- PRIVATE CHAT (1-to-1)
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

create policy "participants can see their conversation"
  on conversations for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "authenticated users can start a conversation"
  on conversations for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "participants can read their messages"
  on private_messages for select
  using (
    exists (select 1 from conversations c where c.id = conversation_id
            and (c.user_a = auth.uid() or c.user_b = auth.uid()))
  );

create policy "participants can send messages"
  on private_messages for insert
  with check (
    auth.uid() = sender_id and
    exists (select 1 from conversations c where c.id = conversation_id
            and (c.user_a = auth.uid() or c.user_b = auth.uid()))
  );

create policy "participants can delete conversation messages"
  on private_messages for delete
  using (
    exists (select 1 from conversations c where c.id = conversation_id
            and (c.user_a = auth.uid() or c.user_b = auth.uid()))
  );

-- ------------------------------------------------------------
-- REPORTS / MODERATION
-- ------------------------------------------------------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  target_type text not null,      -- 'question' | 'answer' | 'user' | 'note'
  target_id text not null,
  reason text,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);
alter table reports enable row level security;
create policy "authenticated can file reports" on reports for insert with check (auth.uid() = reporter_id);
create policy "admins can view reports" on reports for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admins can update reports" on reports for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table notifications enable row level security;
create policy "users see their own notifications" on notifications for select using (auth.uid() = user_id);
create policy "users update their own notifications" on notifications for update using (auth.uid() = user_id);
create policy "system can insert notifications" on notifications for insert with check (true);

-- ------------------------------------------------------------
-- SUBSCRIPTIONS (Stripe payments — see STRIPE section in SETUP_GUIDE.md)
-- ------------------------------------------------------------
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  plan text not null default 'premium',
  status text not null default 'pending',   -- 'pending' | 'active' | 'cancelled'
  stripe_session_id text,
  created_at timestamptz not null default now()
);
alter table subscriptions enable row level security;
create policy "users see their own subscription" on subscriptions for select using (auth.uid() = user_id);
create policy "users can create their own pending subscription" on subscriptions for insert with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- REALTIME: enable replication for chat tables
-- ------------------------------------------------------------
alter publication supabase_realtime add table live_messages;
alter publication supabase_realtime add table private_messages;
alter publication supabase_realtime add table answers;
alter publication supabase_realtime add table questions;

-- ------------------------------------------------------------
-- ADMIN MODERATION EXTRAS
-- ------------------------------------------------------------
alter table profiles add column if not exists is_banned boolean not null default false;

create policy "admins can update any profile"
  on profiles for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins can delete any question"
  on questions for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins can delete any answer"
  on answers for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins can delete any note"
  on notes for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- To make yourself an admin after signing up once, run (replace the email):
-- update profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'you@example.com');

-- ------------------------------------------------------------
-- STUDY ROOMS (group chat rooms with a 6-digit join code, optional music)
-- ------------------------------------------------------------
create table if not exists study_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  name text not null,
  created_by uuid references profiles(id) on delete set null,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists study_room_members (
  room_id uuid references study_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists study_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references study_rooms(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table study_rooms enable row level security;
alter table study_room_members enable row level security;
alter table study_room_messages enable row level security;

create policy "rooms readable by everyone" on study_rooms for select using (true);
create policy "authenticated users can create rooms" on study_rooms for insert with check (auth.uid() = created_by);
create policy "creator or admin can update room" on study_rooms for update
  using (auth.uid() = created_by or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "creator or admin can delete room" on study_rooms for delete
  using (auth.uid() = created_by or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "room membership readable by everyone" on study_room_members for select using (true);
create policy "users can join a room if allowed" on study_room_members for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from study_rooms r
      where r.id = room_id
      and (r.is_premium = false or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','premium')))
    )
  );
create policy "users can leave a room" on study_room_members for delete using (auth.uid() = user_id);

create policy "members can read room messages" on study_room_messages for select
  using (exists (select 1 from study_room_members m where m.room_id = study_room_messages.room_id and m.user_id = auth.uid())
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "members can send room messages" on study_room_messages for insert
  with check (auth.uid() = sender_id and exists (select 1 from study_room_members m where m.room_id = study_room_messages.room_id and m.user_id = auth.uid()));

alter publication supabase_realtime add table study_room_messages;

-- ------------------------------------------------------------
-- STUDY ROOM VIP PRICING + ACCESS REQUESTS
-- Admin decides whether a room is VIP and what it costs. The room's own
-- creator and any admin always get in for free — price only applies to
-- everyone else. Since there's no backend server here, payment itself is
-- handled outside the app (UPI/cash/etc.) and the host/admin approves
-- access afterwards — that approval is what these tables track.
-- ------------------------------------------------------------
alter table study_rooms add column if not exists price numeric(10,2) not null default 0;
alter table study_rooms add column if not exists pinned_message text;

-- Replace the old "any signed-in user can flip is_premium" gap: only an
-- admin may create/mark a room as VIP or attach a price to it.
drop policy if exists "authenticated users can create rooms" on study_rooms;
create policy "authenticated users can create rooms" on study_rooms for insert
  with check (
    auth.uid() = created_by
    and (
      (is_premium = false and price = 0)
      or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

drop policy if exists "creator or admin can update room" on study_rooms;
create policy "creator or admin can update room" on study_rooms for update
  using (auth.uid() = created_by or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (
    (is_premium = false and price = 0)
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create table if not exists study_room_access_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references study_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text not null default 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(room_id, user_id)
);
alter table study_room_access_requests enable row level security;

create policy "users see own requests, host/admin see all for their room"
  on study_room_access_requests for select
  using (
    auth.uid() = user_id
    or exists (select 1 from study_rooms r where r.id = room_id and r.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "users can request access to a room"
  on study_room_access_requests for insert
  with check (auth.uid() = user_id);

create policy "host/admin can resolve requests for their room"
  on study_room_access_requests for update
  using (
    exists (select 1 from study_rooms r where r.id = room_id and r.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Lets the host/admin add an approved user straight into the room
-- (the existing self-join policy only lets people add themselves).
create policy "host/admin can add a member after approving access"
  on study_room_members for insert
  with check (
    exists (select 1 from study_rooms r where r.id = room_id and r.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter publication supabase_realtime add table study_room_access_requests;

-- ------------------------------------------------------------
-- STUDY ROOM JUKEBOX (shared "now playing" song, any member can set it)
-- We don't host or store any audio ourselves — this just remembers which
-- YouTube video is "now playing" and when it started, so every member's
-- browser can embed the official YouTube player and seek to the same
-- position. Kept as its own table (not a column on study_rooms) so any
-- member can control the music without needing update rights on the
-- room's admin-only settings like price or is_premium.
-- ------------------------------------------------------------
create table if not exists study_room_now_playing (
  room_id uuid primary key references study_rooms(id) on delete cascade,
  video_id text not null,
  title text,
  started_at timestamptz not null default now(),
  set_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table study_room_now_playing enable row level security;

create policy "room members can see what's playing"
  on study_room_now_playing for select
  using (
    exists (select 1 from study_room_members m where m.room_id = study_room_now_playing.room_id and m.user_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "room members can queue a song"
  on study_room_now_playing for insert
  with check (exists (select 1 from study_room_members m where m.room_id = room_id and m.user_id = auth.uid()));

create policy "room members can change the song"
  on study_room_now_playing for update
  using (exists (select 1 from study_room_members m where m.room_id = study_room_now_playing.room_id and m.user_id = auth.uid()));

alter publication supabase_realtime add table study_room_now_playing;

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
  score int not null,
  total int not null,
  submitted_at timestamptz not null default now()
);

alter table tests enable row level security;
alter table test_questions enable row level security;
alter table test_attempts enable row level security;

create policy "tests readable by everyone" on tests for select using (true);
create policy "admins can create tests" on tests for insert
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admins can update tests" on tests for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admins can delete tests" on tests for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "test questions readable by everyone" on test_questions for select using (true);
create policy "admins can add test questions" on test_questions for insert
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admins can delete test questions" on test_questions for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "users see their own attempts, admins see all" on test_attempts for select
  using (auth.uid() = user_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "users submit their own attempt" on test_attempts for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- STORAGE — profile photos & chat attachments
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "attachments are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'attachments');

create policy "authenticated users can upload attachments"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

create policy "users can update their own uploaded files"
  on storage.objects for update
  using (bucket_id = 'attachments' and owner = auth.uid());

create policy "users can delete their own uploaded files"
  on storage.objects for delete
  using (bucket_id = 'attachments' and owner = auth.uid());

-- Done. Next: create a Storage bucket named "attachments" (public) from
-- Dashboard → Storage → New bucket, for note PDFs / chat images / avatars.
