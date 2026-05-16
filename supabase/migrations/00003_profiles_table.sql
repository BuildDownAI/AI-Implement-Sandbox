create table profiles (
    user_id         uuid    primary key references auth.users(id) on delete cascade,
    display_name    text    check (display_name is null or length(display_name) <= 50),
    avatar_path     text    check (avatar_path is null or length(avatar_path) <= 500),
    created_at      timestamptz     not null default now(),
    updated_at      timestamptz     not null default now()
);

-- insert handled by trigger, delete handled by cascade of auth.users(id)
grant select, update on profiles to authenticated;