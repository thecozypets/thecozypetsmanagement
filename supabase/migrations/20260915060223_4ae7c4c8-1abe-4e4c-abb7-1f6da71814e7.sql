ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS kennel_capacity integer NOT NULL DEFAULT 10;

UPDATE public.company_settings
SET kennel_capacity = 10
WHERE kennel_capacity < 1;

ALTER TABLE public.company_settings
ADD CONSTRAINT company_settings_kennel_capacity_positive CHECK (kennel_capacity > 0);