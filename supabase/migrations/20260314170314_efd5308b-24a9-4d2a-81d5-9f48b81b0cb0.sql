-- Add mp_payment_id to profiles for refund processing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

-- Add mp_refund_id to refund_requests
ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS mp_refund_id TEXT;