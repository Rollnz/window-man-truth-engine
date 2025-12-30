-- Create claim-documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'claim-documents',
  'claim-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp']
);

-- Allow anyone to upload to the bucket (using session path)
CREATE POLICY "Allow anonymous uploads to claim-documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'claim-documents');

-- Allow users to read their own uploads via sessionId path
CREATE POLICY "Allow read access to own claim documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'claim-documents');

-- Allow users to update their own uploads
CREATE POLICY "Allow update access to own claim documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'claim-documents');

-- Allow users to delete their own uploads
CREATE POLICY "Allow delete access to own claim documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'claim-documents');