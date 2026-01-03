-- Enable RLS on vault_documents
-- This table stores documents uploaded by users to their vault

CREATE TABLE IF NOT EXISTS public.vault_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File metadata
  file_name text NOT NULL,
  file_path text NOT NULL UNIQUE,
  file_type text NOT NULL,
  file_size bigint NOT NULL,

  -- Organization
  category text NOT NULL DEFAULT 'other', -- quotes|insurance|warranties|photos|permits|other
  tags text[] DEFAULT '{}',

  -- Optional metadata
  description text,
  upload_source text, -- manual|mobile|email|auto

  -- Soft delete
  deleted_at timestamptz
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_vault_documents_user_id ON public.vault_documents (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vault_documents_category ON public.vault_documents (user_id, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vault_documents_deleted ON public.vault_documents (user_id, deleted_at) WHERE deleted_at IS NULL;

-- Enable Row Level Security
ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own documents
CREATE POLICY "Users can view their own vault documents"
  ON public.vault_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vault documents"
  ON public.vault_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vault documents"
  ON public.vault_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vault documents"
  ON public.vault_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_vault_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_vault_documents_updated_at
  BEFORE UPDATE ON public.vault_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vault_documents_updated_at();

-- Create storage bucket for vault documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault-documents',
  'vault-documents',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Users can only access their own vault documents
CREATE POLICY "Users can view their own vault files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'vault-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their own vault files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'vault-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own vault files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'vault-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own vault files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'vault-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
