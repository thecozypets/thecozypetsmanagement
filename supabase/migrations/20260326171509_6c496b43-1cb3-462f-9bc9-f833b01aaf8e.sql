
ALTER TABLE public.boardings 
  ADD COLUMN payment_status text NOT NULL DEFAULT 'outstanding',
  ADD COLUMN paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN payment_method text DEFAULT NULL;
