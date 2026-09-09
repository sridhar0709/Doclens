/*
  DocLens DB Migration: Enforce Single Document Per Type Per User
  
  1. De-duplicate the public.documents table keeping only the latest upload.
  2. Apply a UNIQUE constraint on (user_id, doc_type).
*/

-- 1. Remove duplicate documents, keeping only the latest one based on uploaded_at timestamp
DELETE FROM public.documents d1
USING public.documents d2
WHERE d1.user_id = d2.user_id
  AND d1.doc_type = d2.doc_type
  AND d1.uploaded_at < d2.uploaded_at;

-- 2. Add unique constraint to prevent duplicate document types for the same citizen
ALTER TABLE public.documents
ADD CONSTRAINT unique_user_doc_type UNIQUE (user_id, doc_type);
