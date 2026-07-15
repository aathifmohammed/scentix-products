-- Scentix Supabase SQL Schema Setup
-- Run this in your Supabase SQL Editor (https://supabase.com) to create the required table and seed it.

-- 1. Create the products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "productType" TEXT NOT NULL CHECK ("productType" IN ('Perfume', 'BodySpray', 'Attar')),
    "volumeMl" INTEGER NOT NULL,
    "volumeLabel" TEXT NOT NULL,
    "isCustomVolume" BOOLEAN NOT NULL DEFAULT FALSE,
    category TEXT NOT NULL CHECK (category IN ('Men', 'Women', 'Unisex')),
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create indexes for quick filtering and sorting
CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products("productType");
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products("sortOrder");

-- 3. Set up Row Level Security (RLS)
-- To enable RLS:
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone (anonymous users) to read the product catalog
CREATE POLICY "Allow public read-only access" 
ON public.products 
FOR SELECT 
USING (true);

-- Policy to allow full access to authenticated admin users
-- Note: Set up an admin user in the Supabase Authentication panel first.
CREATE POLICY "Allow write access for authenticated users only" 
ON public.products 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Alternative Policy (QUICK START / DEVELOPMENT ONLY):
-- If you want to enable quick editing without configuring authentication,
-- you can temporarily allow anonymous write access, but this is NOT recommended for production:
-- CREATE POLICY "Allow public write access (DEV ONLY)" 
-- ON public.products 
-- FOR ALL 
-- TO anon 
-- USING (true) 
-- WITH CHECK (true);


-- 4. Seed the database with initial premium products
INSERT INTO public.products (name, "productType", "volumeMl", "volumeLabel", "isCustomVolume", category, "imageUrl", "sortOrder")
VALUES 
('Oud Royale', 'Perfume', 50, '50ml', false, 'Unisex', '/images/perfume_gold.png', 0),
('Noir Mystique', 'Perfume', 100, '100ml', false, 'Men', '/images/perfume_noir.png', 1),
('Amber Glow', 'BodySpray', 150, '150ml', false, 'Women', '/images/bodyspray_gold.png', 2),
('Royal Oud Attar', 'Attar', 12, '12ml', false, 'Unisex', '/images/attar_oud.png', 3),
('Midnight Rose', 'Perfume', 22, '22ml', false, 'Women', '/images/perfume_noir.png', 4);
