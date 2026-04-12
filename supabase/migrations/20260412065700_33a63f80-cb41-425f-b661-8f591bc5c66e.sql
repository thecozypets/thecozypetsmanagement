
-- Create foster_owners table
CREATE TABLE public.foster_owners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT ''::text,
  address text DEFAULT ''::text,
  emergency_contact text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.foster_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own foster_owners" ON public.foster_owners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own foster_owners" ON public.foster_owners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own foster_owners" ON public.foster_owners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own foster_owners" ON public.foster_owners FOR DELETE USING (auth.uid() = user_id);

-- Create foster_dogs table
CREATE TABLE public.foster_dogs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  owner_id uuid NOT NULL REFERENCES public.foster_owners(id) ON DELETE CASCADE,
  name text NOT NULL,
  breed text NOT NULL DEFAULT ''::text,
  age integer NOT NULL DEFAULT 0,
  weight numeric NOT NULL DEFAULT 0,
  gender text NOT NULL DEFAULT 'male'::text,
  special_needs text DEFAULT ''::text,
  feeding_instructions text DEFAULT ''::text,
  medications text DEFAULT ''::text,
  vaccinated boolean NOT NULL DEFAULT false,
  neutered boolean NOT NULL DEFAULT false,
  photo_url text DEFAULT ''::text,
  vaccine_photo_url text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.foster_dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own foster_dogs" ON public.foster_dogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own foster_dogs" ON public.foster_dogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own foster_dogs" ON public.foster_dogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own foster_dogs" ON public.foster_dogs FOR DELETE USING (auth.uid() = user_id);

-- Update fosters table to reference foster_owners/foster_dogs
-- (keeping existing columns but data will now reference new tables)
