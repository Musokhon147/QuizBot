-- Run this in your Supabase SQL Editor

-- Users table (extended)
create table users (
  telegram_id text primary key,
  name text,
  username text,
  language text default 'uz' check (language in ('uz', 'ru', 'en')),
  theme text default 'dark' check (theme in ('dark', 'light', 'auto')),
  joined_at timestamptz default now(),
  last_active timestamptz default now()
);

-- Tests table
create table tests (
  id uuid default gen_random_uuid() primary key,
  telegram_user_id text not null references users(telegram_id),
  title text not null,
  category text,
  created_at timestamptz default now()
);

-- Questions table
create table questions (
  id uuid default gen_random_uuid() primary key,
  test_id uuid references tests(id) on delete cascade,
  question_number int not null,
  question_text text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard'))
);

-- Attempts (quiz results)
create table attempts (
  id uuid default gen_random_uuid() primary key,
  test_id uuid references tests(id) on delete cascade,
  telegram_user_id text not null references users(telegram_id),
  score int not null,
  total_questions int not null,
  answers jsonb not null,
  duration_ms int default 0,
  time_per_question int default 0,
  created_at timestamptz default now()
);

-- Bookmarks
create table bookmarks (
  telegram_user_id text references users(telegram_id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (telegram_user_id, question_id)
);

-- Indexes
create index idx_tests_user on tests(telegram_user_id);
create index idx_questions_test on questions(test_id);
create index idx_attempts_user on attempts(telegram_user_id);
create index idx_attempts_test on attempts(test_id);
create index idx_attempts_created on attempts(created_at desc);

-- Leaderboard view
create or replace view leaderboard as
select
  u.telegram_id,
  u.name,
  u.username,
  count(a.id)::int as attempts,
  coalesce(sum(a.score), 0)::int as total_correct,
  coalesce(round(avg(a.score::numeric * 100 / nullif(a.total_questions, 0)), 1), 0) as avg_pct,
  coalesce(sum(a.score), 0)::int * 10 + count(a.id)::int as score_index
from users u
left join attempts a on a.telegram_user_id = u.telegram_id
group by u.telegram_id, u.name, u.username
order by score_index desc;

-- Helper: calculate user streak
create or replace function user_streak(uid text)
returns int language sql stable as $$
  with daily as (
    select distinct date_trunc('day', created_at)::date as d
    from attempts where telegram_user_id = uid
  ),
  numbered as (
    select d, d - (row_number() over (order by d desc))::int as grp
    from daily
  )
  select coalesce(count(*), 0)::int
  from numbered
  where grp = (select grp from numbered order by d desc limit 1);
$$;

-- Enable Row Level Security
alter table users enable row level security;
alter table tests enable row level security;
alter table questions enable row level security;
alter table attempts enable row level security;
alter table bookmarks enable row level security;

-- Policies (service key from backend bypasses RLS)
create policy "Service access" on users for all using (true);
create policy "Service access" on tests for all using (true);
create policy "Service access" on questions for all using (true);
create policy "Service access" on attempts for all using (true);
create policy "Service access" on bookmarks for all using (true);

-- Enable realtime for leaderboard updates
alter publication supabase_realtime add table attempts;
