-- Create an enum for the report status
create type report_status as enum ('pending', 'approved', 'rejected');

-- Create the reported_errors table
create table reported_errors (
  id uuid default uuid_generate_v4() primary key,
  discount_id uuid references discounts(id) on delete cascade,
  reported_at timestamp with time zone default now(),
  is_discontinued boolean default false,
  
  -- Error flags
  days_error boolean default false,
  discount_error boolean default false,
  reimbursement_error boolean default false,
  frequency_error boolean default false,
  
  -- Suggested corrections
  suggested_days text[],
  suggested_discount integer,
  suggested_reimbursement integer,
  suggested_frequency text,
  
  -- Additional info
  evidence_url text not null,
  comments text,
  status report_status default 'pending'
);

-- Create an index on discount_id for faster lookups
create index reported_errors_discount_id_idx on reported_errors(discount_id);

-- Create an index on status for filtering
create index reported_errors_status_idx on reported_errors(status);

-- Create a function to prevent multiple pending reports for the same discount
create or replace function check_pending_reports()
returns trigger as $$
begin
  if exists (
    select 1 
    from reported_errors 
    where discount_id = NEW.discount_id 
    and status = 'pending'
    and id != NEW.id
  ) then
    raise exception 'A pending report already exists for this discount';
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Create a trigger to enforce the pending reports check
create trigger check_pending_reports_trigger
before insert or update on reported_errors
for each row
execute function check_pending_reports();

-- Add RLS policies
alter table reported_errors enable row level security;

-- Allow anyone to create reports
create policy "Anyone can create reports"
on reported_errors for insert
to anon
with check (true);

-- Allow anyone to read reports
create policy "Anyone can view reports"
on reported_errors for select
to anon
using (true);

-- Prevent updates and deletes from anon users
create policy "Prevent updates from anon"
on reported_errors for update
to anon
using (false);

create policy "Prevent deletes from anon"
on reported_errors for delete
to anon
using (false); 