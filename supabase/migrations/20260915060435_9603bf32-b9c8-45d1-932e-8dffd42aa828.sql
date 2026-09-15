DROP POLICY IF EXISTS "Authenticated can view booking extras" ON public.booking_extras;
DROP POLICY IF EXISTS "Authenticated can insert booking extras" ON public.booking_extras;
DROP POLICY IF EXISTS "Authenticated can update booking extras" ON public.booking_extras;
DROP POLICY IF EXISTS "Authenticated can delete booking extras" ON public.booking_extras;

CREATE POLICY "Users can view own booking extras"
ON public.booking_extras
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.boardings
  WHERE boardings.id = booking_extras.boarding_id
    AND boardings.user_id = auth.uid()
));

CREATE POLICY "Users can insert own booking extras"
ON public.booking_extras
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.boardings
  WHERE boardings.id = booking_extras.boarding_id
    AND boardings.user_id = auth.uid()
));

CREATE POLICY "Users can update own booking extras"
ON public.booking_extras
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.boardings
  WHERE boardings.id = booking_extras.boarding_id
    AND boardings.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.boardings
  WHERE boardings.id = booking_extras.boarding_id
    AND boardings.user_id = auth.uid()
));

CREATE POLICY "Users can delete own booking extras"
ON public.booking_extras
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.boardings
  WHERE boardings.id = booking_extras.boarding_id
    AND boardings.user_id = auth.uid()
));