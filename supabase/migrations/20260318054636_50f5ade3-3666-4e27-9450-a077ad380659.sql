
-- Create boarding_status enum
CREATE TYPE public.boarding_status AS ENUM ('reserved', 'checked-in', 'checked-out', 'cancelled');

-- Owners table
CREATE TABLE public.owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  emergency_contact TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own owners" ON public.owners FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own owners" ON public.owners FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own owners" ON public.owners FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own owners" ON public.owners FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Dogs table
CREATE TABLE public.dogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.owners(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  breed TEXT NOT NULL DEFAULT '',
  age INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 0,
  gender TEXT NOT NULL DEFAULT 'male',
  special_needs TEXT DEFAULT '',
  feeding_instructions TEXT DEFAULT '',
  medications TEXT DEFAULT '',
  vaccinated BOOLEAN NOT NULL DEFAULT false,
  neutered BOOLEAN NOT NULL DEFAULT false,
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dogs" ON public.dogs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dogs" ON public.dogs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dogs" ON public.dogs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dogs" ON public.dogs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Boardings table
CREATE TABLE public.boardings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id UUID REFERENCES public.dogs(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.owners(id) ON DELETE CASCADE NOT NULL,
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  status boarding_status NOT NULL DEFAULT 'reserved',
  kennel_number TEXT DEFAULT '',
  daily_rate NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  special_requests TEXT DEFAULT '',
  feeding_schedule TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boardings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own boardings" ON public.boardings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own boardings" ON public.boardings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own boardings" ON public.boardings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own boardings" ON public.boardings FOR DELETE TO authenticated USING (auth.uid() = user_id);
