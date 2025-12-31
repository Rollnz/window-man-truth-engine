-- Create book-covers storage bucket (public for easy access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to book covers
CREATE POLICY "Public read access for book covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

-- Allow authenticated inserts (edge functions use service role, so this is for flexibility)
CREATE POLICY "Allow public insert for book covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-covers');

-- Create table to cache generated book covers
CREATE TABLE public.generated_book_covers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  prompt_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_book_covers ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access for generated_book_covers"
ON public.generated_book_covers FOR SELECT
USING (true);

-- Allow insert (edge function uses service role)
CREATE POLICY "Allow insert for generated_book_covers"
ON public.generated_book_covers FOR INSERT
WITH CHECK (true);

-- Allow update for regeneration
CREATE POLICY "Allow update for generated_book_covers"
ON public.generated_book_covers FOR UPDATE
USING (true);

-- Allow delete for cleanup
CREATE POLICY "Allow delete for generated_book_covers"
ON public.generated_book_covers FOR DELETE
USING (true);