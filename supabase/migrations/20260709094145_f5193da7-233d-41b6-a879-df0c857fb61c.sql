
-- Additive columns on boardings (safe defaults so existing rows keep working)
ALTER TABLE public.boardings
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'walk-in',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS internal_notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS coupon_code TEXT NOT NULL DEFAULT '';

-- Booking extras (per-booking itemized charges)
CREATE TABLE IF NOT EXISTS public.booking_extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boarding_id UUID NOT NULL REFERENCES public.boardings(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'custom',
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_extras TO authenticated;
GRANT ALL ON public.booking_extras TO service_role;

ALTER TABLE public.booking_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view booking extras"
  ON public.booking_extras FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert booking extras"
  ON public.booking_extras FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update booking extras"
  ON public.booking_extras FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete booking extras"
  ON public.booking_extras FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS booking_extras_boarding_id_idx
  ON public.booking_extras(boarding_id);
