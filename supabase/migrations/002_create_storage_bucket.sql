-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for signatures bucket
CREATE POLICY "Users can upload their own signatures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signatures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view signatures they have access to"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'signatures' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.signatures
      WHERE signature_data LIKE '%' || name || '%'
    )
  )
);

CREATE POLICY "Users can delete their own signatures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'signatures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

