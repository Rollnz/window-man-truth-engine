-- Drop the generated_book_covers table (CASCADE removes all RLS policies automatically)
DROP TABLE IF EXISTS public.generated_book_covers CASCADE;

-- Remove storage bucket policies and bucket
DROP POLICY IF EXISTS "Public read access for book covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert for book covers" ON storage.objects;
DELETE FROM storage.objects WHERE bucket_id = 'book-covers';
DELETE FROM storage.buckets WHERE id = 'book-covers';