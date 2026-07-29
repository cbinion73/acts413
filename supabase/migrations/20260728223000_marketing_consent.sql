-- ACTS413 marketing consent is separate from account access.

alter table public.profiles
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists marketing_consent_version text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  opted_in boolean := coalesce(new.raw_user_meta_data ->> 'marketing_consent', '') = 'true';
begin
  insert into public.profiles (
    id,
    marketing_consent,
    marketing_consent_at,
    marketing_consent_version
  )
  values (
    new.id,
    opted_in,
    case when opted_in then timezone('utc', now()) else null end,
    case when opted_in then new.raw_user_meta_data ->> 'marketing_consent_version' else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
