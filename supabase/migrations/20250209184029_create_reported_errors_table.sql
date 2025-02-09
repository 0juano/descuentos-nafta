CREATE TABLE reported_errors (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  discount_id uuid,
  is_discontinued boolean NOT NULL,
  days_error text,
  discount_error text,
  reimbursement_error text,
  frequency_error text,
  suggested_days text,
  suggested_discount text,
  suggested_reimbursement text,
  suggested_frequency text,
  evidence_url text,
  comments text,
  created_at timestamp with time zone DEFAULT now()
);
