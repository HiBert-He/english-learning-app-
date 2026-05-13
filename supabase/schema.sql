-- ============================================================
-- 英语错题 App — Supabase Schema
-- 在 Supabase Dashboard > SQL Editor 里执行一次即可
-- ============================================================

-- 用户资料（扩展 auth.users）
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

-- 教师邀请码（管理员手动插入，学生输入后升级为教师）
create table if not exists teacher_codes (
  code text primary key,
  used_by uuid references profiles(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);
-- 预置几个初始邀请码，可在 Dashboard 里增删
insert into teacher_codes (code) values
  ('TEACHER2024'), ('TEACH001'), ('EDU2024'), ('ENGLISH88')
on conflict do nothing;

-- 班级
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references profiles(id) on delete cascade,
  invite_code text unique not null,
  created_at timestamptz not null default now()
);

-- 入班记录
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(class_id, student_id)
);

-- 错题
create table if not exists wrong_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  question_text text not null default '',
  question_images text[] not null default '{}',
  correct_answer text not null default '',
  my_answer text not null default '',
  reason text not null default '',
  knowledge_points text[] not null default '{}',
  corrected boolean not null default false,
  teacher_comment text,
  teacher_id uuid references profiles(id),
  teacher_commented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 单词本
create table if not exists vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  english text not null,
  chinese text not null,
  example text not null default '',
  mastered boolean not null default false,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table teacher_codes enable row level security;
alter table classes enable row level security;
alter table enrollments enable row level security;
alter table wrong_questions enable row level security;
alter table vocabulary enable row level security;

-- profiles
create policy "own_profile_select" on profiles for select using (
  auth.uid() = id
  or exists (
    select 1 from classes c join enrollments e on e.class_id = c.id
    where c.teacher_id = auth.uid() and e.student_id = profiles.id
  )
);
create policy "own_profile_insert" on profiles for insert with check (auth.uid() = id);
create policy "own_profile_update" on profiles for update using (auth.uid() = id);

-- teacher_codes（任何已登录用户可读，用于验证）
create policy "read_codes" on teacher_codes for select using (auth.role() = 'authenticated');
create policy "update_codes" on teacher_codes for update using (auth.role() = 'authenticated');

-- classes
create policy "teacher_all_classes" on classes for all using (teacher_id = auth.uid());
create policy "student_view_class" on classes for select using (
  exists (select 1 from enrollments where class_id = classes.id and student_id = auth.uid())
);

-- enrollments
create policy "student_own_enrollment" on enrollments for select using (student_id = auth.uid());
create policy "student_join" on enrollments for insert with check (student_id = auth.uid());
create policy "student_leave" on enrollments for delete using (student_id = auth.uid());
create policy "teacher_view_enrollments" on enrollments for select using (
  exists (select 1 from classes where id = enrollments.class_id and teacher_id = auth.uid())
);

-- wrong_questions
create policy "student_own_questions" on wrong_questions for all using (user_id = auth.uid());
create policy "teacher_read_questions" on wrong_questions for select using (
  exists (
    select 1 from classes c join enrollments e on e.class_id = c.id
    where c.teacher_id = auth.uid() and e.student_id = wrong_questions.user_id
  )
);
-- 教师批注：通过函数安全执行，不授予直接 update 权限

-- vocabulary
create policy "own_vocabulary" on vocabulary for all using (user_id = auth.uid());

-- ============================================================
-- 教师批注函数（security definer，只允许修改 comment 字段）
-- ============================================================
create or replace function set_teacher_comment(
  p_question_id uuid,
  p_comment text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update wrong_questions
  set
    teacher_comment = p_comment,
    teacher_id = auth.uid(),
    teacher_commented_at = now()
  where
    id = p_question_id
    and exists (
      select 1 from classes c
      join enrollments e on e.class_id = c.id
      where c.teacher_id = auth.uid()
        and e.student_id = wrong_questions.user_id
    );
end;
$$;

-- ============================================================
-- 自动更新 updated_at
-- ============================================================
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger wrong_questions_updated_at
  before update on wrong_questions
  for each row execute procedure touch_updated_at();
