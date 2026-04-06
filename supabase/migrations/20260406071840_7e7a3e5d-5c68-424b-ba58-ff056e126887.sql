
-- Add dog photo URL column to booking_requests
ALTER TABLE public.booking_requests ADD COLUMN dog_photo_url text DEFAULT null;

-- Create storage bucket for booking photos (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('booking-photos', 'booking-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload booking photos
CREATE POLICY "Anyone can upload booking photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'booking-photos');

-- Allow anyone to view booking photos
CREATE POLICY "Anyone can view booking photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'booking-photos');
