-- ============================================================================
-- TUBAMBE — full schema. Safe to run on a fresh Supabase project.
-- If you already have an older version of this schema, see the migration
-- notes in README.md instead of re-running this whole file.
-- ============================================================================

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  handle text unique not null,
  display_name text not null,
  birth_date date not null,
  country text,
  avatar_url text,
  bio text,
  is_private boolean not null default false,
  created_at timestamptz default now()
);

create or replace function enforce_min_age()
returns trigger as $$
begin
  if new.birth_date > (current_date - interval '16 years') then
    raise exception 'Users must be at least 16 years old to create a profile.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_min_age
  before insert or update on profiles
  for each row execute function enforce_min_age();

create table videos (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade not null,
  title text,
  caption text,
  category text,
  language text,
  cf_uid text,
  video_url text,
  thumbnail_url text,
  duration_seconds int,
  is_monetized boolean default true,
  views_count integer not null default 0,
  pinned boolean not null default false,
  created_at timestamptz default now(),
  constraint has_a_video check (cf_uid is not null or video_url is not null)
);

create table likes (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references videos(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (video_id, user_id)
);

create table follows (
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'accepted' check (status in ('accepted', 'pending')),
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create table reposts (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references videos(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (video_id, user_id)
);

create table saves (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references videos(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (video_id, user_id)
);

create table comments (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references videos(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  parent_comment_id uuid references comments(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table comment_likes (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references comments(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (comment_id, user_id)
);

create table notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references profiles(id) on delete cascade not null,
  actor_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('like', 'repost', 'comment', 'reply', 'comment_like', 'follow', 'follow_request', 'follow_accept', 'new_video')),
  video_id uuid references videos(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz default now()
);

create table wallet_transactions (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references profiles(id) on delete cascade not null,
  video_id uuid references videos(id) on delete set null,
  source text not null check (source in ('ad_revenue', 'tip', 'brand_deal', 'shop_sale')),
  amount_local numeric(12,2) not null,
  currency text not null default 'KES',
  created_at timestamptz default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table videos enable row level security;
alter table likes enable row level security;
alter table follows enable row level security;
alter table reposts enable row level security;
alter table saves enable row level security;
alter table comments enable row level security;
alter table comment_likes enable row level security;
alter table notifications enable row level security;
alter table wallet_transactions enable row level security;

create policy "Profiles are publicly readable" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- Real privacy enforcement: a private account's videos are only visible to
-- the creator themselves and to their ACCEPTED followers. Everyone else
-- (including logged-out visitors) gets nothing back for that creator's rows
-- — this is enforced by Postgres itself, not just hidden in the UI.
create policy "Videos visible to permitted viewers" on videos for select using (
  exists (select 1 from profiles p where p.id = videos.creator_id and p.is_private = false)
  or auth.uid() = creator_id
  or exists (
    select 1 from follows f
    where f.follower_id = auth.uid() and f.following_id = videos.creator_id and f.status = 'accepted'
  )
);
create policy "Creators can insert their own videos" on videos for insert with check (auth.uid() = creator_id);
create policy "Creators can update their own videos" on videos for update using (auth.uid() = creator_id);

create policy "Likes are publicly readable" on likes for select using (true);
create policy "Users can like as themselves" on likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike their own like" on likes for delete using (auth.uid() = user_id);

create policy "Follows are publicly readable" on follows for select using (true);
create policy "Users can follow as themselves" on follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on follows for delete using (auth.uid() = follower_id);
create policy "Recipients can remove a follow request" on follows for delete using (auth.uid() = following_id);
create policy "Recipients can accept a follow request" on follows for update using (auth.uid() = following_id) with check (auth.uid() = following_id);

create policy "Reposts are publicly readable" on reposts for select using (true);
create policy "Users can repost as themselves" on reposts for insert with check (auth.uid() = user_id);
create policy "Users can undo their own repost" on reposts for delete using (auth.uid() = user_id);

create policy "Users can see their own saves" on saves for select using (auth.uid() = user_id);
create policy "Users can save as themselves" on saves for insert with check (auth.uid() = user_id);
create policy "Users can unsave their own save" on saves for delete using (auth.uid() = user_id);

create policy "Comments are publicly readable" on comments for select using (true);
create policy "Users can comment as themselves" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete their own comments" on comments for delete using (auth.uid() = user_id);

create policy "Comment likes are publicly readable" on comment_likes for select using (true);
create policy "Users can like comments as themselves" on comment_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike their own comment like" on comment_likes for delete using (auth.uid() = user_id);

create policy "Users see only their own notifications" on notifications for select using (auth.uid() = recipient_id);
create policy "Users can mark their own notifications read" on notifications for update using (auth.uid() = recipient_id);

create policy "Creators can view their own earnings" on wallet_transactions for select using (auth.uid() = creator_id);

-- ============================================================================
-- Storage
-- ============================================================================

insert into storage.buckets (id, name, public) values ('videos', 'videos', true) on conflict (id) do nothing;
create policy "Videos bucket is publicly readable" on storage.objects for select using (bucket_id = 'videos');
create policy "Signed-in users can upload videos" on storage.objects for insert with check (bucket_id = 'videos' and auth.role() = 'authenticated');

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
create policy "Avatars bucket is publicly readable" on storage.objects for select using (bucket_id = 'avatars');
create policy "Signed-in users can upload avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- ============================================================================
-- View counts — a dedicated function lets ANY viewer increment a count on a
-- row they don't own, without opening up general UPDATE access to everyone.
-- ============================================================================

create or replace function increment_video_views(vid uuid)
returns void
security definer
set search_path = public
as $$
begin
  update videos set views_count = views_count + 1 where id = vid;
end;
$$ language plpgsql;

-- ============================================================================
-- Notifications — created by triggers (security definer, so they fire
-- regardless of the RLS rules on the notifications table itself), so a
-- notification is never missed because of a bug in the app's client code.
-- ============================================================================

create or replace function notify_on_like()
returns trigger security definer set search_path = public as $$
declare v_creator uuid;
begin
  select creator_id into v_creator from videos where id = new.video_id;
  if v_creator is not null and v_creator <> new.user_id then
    insert into notifications (recipient_id, actor_id, type, video_id)
    values (v_creator, new.user_id, 'like', new.video_id);
  end if;
  return new;
end;
$$ language plpgsql;
create trigger trg_notify_like after insert on likes for each row execute function notify_on_like();

create or replace function notify_on_repost()
returns trigger security definer set search_path = public as $$
declare v_creator uuid;
begin
  select creator_id into v_creator from videos where id = new.video_id;
  if v_creator is not null and v_creator <> new.user_id then
    insert into notifications (recipient_id, actor_id, type, video_id)
    values (v_creator, new.user_id, 'repost', new.video_id);
  end if;
  return new;
end;
$$ language plpgsql;
create trigger trg_notify_repost after insert on reposts for each row execute function notify_on_repost();

create or replace function notify_on_comment()
returns trigger security definer set search_path = public as $$
declare v_creator uuid; v_parent_author uuid;
begin
  if new.parent_comment_id is null then
    select creator_id into v_creator from videos where id = new.video_id;
    if v_creator is not null and v_creator <> new.user_id then
      insert into notifications (recipient_id, actor_id, type, video_id, comment_id)
      values (v_creator, new.user_id, 'comment', new.video_id, new.id);
    end if;
  else
    select user_id into v_parent_author from comments where id = new.parent_comment_id;
    if v_parent_author is not null and v_parent_author <> new.user_id then
      insert into notifications (recipient_id, actor_id, type, video_id, comment_id)
      values (v_parent_author, new.user_id, 'reply', new.video_id, new.id);
    end if;
  end if;
  return new;
end;
$$ language plpgsql;
create trigger trg_notify_comment after insert on comments for each row execute function notify_on_comment();

create or replace function notify_on_comment_like()
returns trigger security definer set search_path = public as $$
declare v_author uuid; v_video uuid;
begin
  select user_id, video_id into v_author, v_video from comments where id = new.comment_id;
  if v_author is not null and v_author <> new.user_id then
    insert into notifications (recipient_id, actor_id, type, video_id, comment_id)
    values (v_author, new.user_id, 'comment_like', v_video, new.comment_id);
  end if;
  return new;
end;
$$ language plpgsql;
create trigger trg_notify_comment_like after insert on comment_likes for each row execute function notify_on_comment_like();

create or replace function notify_on_follow()
returns trigger security definer set search_path = public as $$
begin
  insert into notifications (recipient_id, actor_id, type)
  values (new.following_id, new.follower_id, case when new.status = 'pending' then 'follow_request' else 'follow' end);
  return new;
end;
$$ language plpgsql;
create trigger trg_notify_follow after insert on follows for each row execute function notify_on_follow();

create or replace function notify_on_follow_accept()
returns trigger security definer set search_path = public as $$
begin
  if old.status = 'pending' and new.status = 'accepted' then
    insert into notifications (recipient_id, actor_id, type)
    values (new.follower_id, new.following_id, 'follow_accept');
  end if;
  return new;
end;
$$ language plpgsql;
create trigger trg_notify_follow_accept after update of status on follows for each row execute function notify_on_follow_accept();

create or replace function notify_followers_on_new_video()
returns trigger security definer set search_path = public as $$
begin
  insert into notifications (recipient_id, actor_id, type, video_id)
  select f.follower_id, new.creator_id, 'new_video', new.id
  from follows f
  where f.following_id = new.creator_id and f.status = 'accepted';
  return new;
end;
$$ language plpgsql;
create trigger trg_notify_new_video after insert on videos for each row execute function notify_followers_on_new_video();

-- ============================================================================
-- Realtime: lets the notification bell update live instead of only on refresh.
-- Wrapped in a DO block so re-running this file doesn't error if it's
-- already been added.
-- ============================================================================
do $$
begin
  execute 'alter publication supabase_realtime add table notifications';
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- Moderation: reporting, blocking, and deleting your own content.
-- ============================================================================

create table reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references profiles(id) on delete cascade not null,
  video_id uuid references videos(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  reported_user_id uuid references profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz default now(),
  constraint has_a_target check (video_id is not null or comment_id is not null or reported_user_id is not null)
);

create table blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid references profiles(id) on delete cascade not null,
  blocked_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (blocker_id, blocked_id)
);

alter table reports enable row level security;
alter table blocks enable row level security;

create policy "Users can see their own reports" on reports for select using (auth.uid() = reporter_id);
create policy "Users can file reports" on reports for insert with check (auth.uid() = reporter_id);

-- Both sides of a block can see the row (needed so the videos policy below
-- can check it reliably from either direction); this is the one trade-off
-- of this simple approach — being blocked is, in principle, discoverable by
-- querying this table directly, same as on several mainstream apps.
create policy "Users can see blocks involving them" on blocks for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);
create policy "Users can block as themselves" on blocks for insert with check (auth.uid() = blocker_id);
create policy "Users can unblock" on blocks for delete using (auth.uid() = blocker_id);

create policy "Creators can delete their own videos" on videos for delete using (auth.uid() = creator_id);

-- Replace the videos policy to also hide content between blocked users, in
-- either direction, on top of the existing privacy rule.
drop policy "Videos visible to permitted viewers" on videos;
create policy "Videos visible to permitted viewers" on videos for select using (
  (
    exists (select 1 from profiles p where p.id = videos.creator_id and p.is_private = false)
    or auth.uid() = creator_id
    or exists (
      select 1 from follows f
      where f.follower_id = auth.uid() and f.following_id = videos.creator_id and f.status = 'accepted'
    )
  )
  and not exists (
    select 1 from blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = videos.creator_id)
       or (b.blocker_id = videos.creator_id and b.blocked_id = auth.uid())
  )
);
