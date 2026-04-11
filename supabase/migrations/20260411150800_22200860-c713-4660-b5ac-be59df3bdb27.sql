
CREATE TABLE public.fosters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  animal_type text NOT NULL DEFAULT 'dog',
  check_in_date text NOT NULL,
  check_out_date text NOT NULL,
  status public.boarding_status NOT NULL DEFAULT 'reserved',
  kennel_number text DEFAULT '',
  daily_rate numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  special_requests text DEFAULT '',
  feeding_schedule text DEFAULT '',
  notes text DEFAULT '',
  payment_status text NOT NULL DEFAULT 'outstanding',
  paid_amount numeric NOT NULL DEFAULT 0,
  payment_method text,
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fosters" ON public.fosters FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fosters" ON public.fosters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fosters" ON public.fosters FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fosters" ON public.fosters FOR DELETE TO authenticated USING (auth.uid() = user_id);
