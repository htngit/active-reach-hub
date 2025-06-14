
-- Fix the products table to allow nullable price and make sure stock has proper default
ALTER TABLE public.products 
ALTER COLUMN price DROP NOT NULL;

-- Ensure stock has proper default (it should already have this but let's be explicit)
ALTER TABLE public.products 
ALTER COLUMN stock SET DEFAULT 0;
