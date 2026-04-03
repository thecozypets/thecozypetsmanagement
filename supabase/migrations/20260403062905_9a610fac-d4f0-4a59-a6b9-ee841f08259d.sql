
CREATE TABLE public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text DEFAULT '',
  dog_name text NOT NULL,
  dog_breed text DEFAULT '',
  special_needs text DEFAULT '',
  preferred_check_in text NOT NULL,
  preferred_check_out text NOT NULL,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a booking request (public form)
CREATE POLICY "Anyone can submit booking request"
ON public.booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only the business owner can view their requests
CREATE POLICY "Owner can view booking requests"
ON public.booking_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only the business owner can update (approve/reject)
CREATE POLICY "Owner can update booking requests"
ON public.booking_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Only the business owner can delete
CREATE POLICY "Owner can delete booking requests"
ON public.booking_requests
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow public read of company_settings for booking page branding
CREATE POLICY "Public can view company settings"
ON public.company_settings
FOR SELECT
TO anon
USING (true);
