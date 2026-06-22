alter table public.registration_requests
  add column if not exists activation_email_sent_at timestamptz,
  add column if not exists activation_email_status text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid,
  add column if not exists admin_note text;

alter table public.profiles
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists last_password_reset_sent_at timestamptz,
  add column if not exists onboarding_completed boolean default false;

update public.profiles
set onboarding_completed = false
where onboarding_completed is null;

alter table public.profiles
  alter column onboarding_completed set default false;
