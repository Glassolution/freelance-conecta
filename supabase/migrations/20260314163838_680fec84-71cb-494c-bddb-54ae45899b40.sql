ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ;

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS days_active INTEGER;