import { createClient } from '@supabase/supabase-js';

export interface Product {
  id: string;
  name: string;
  productType: 'Perfume' | 'BodySpray' | 'Attar';
  volumeMl: number;
  volumeLabel: string;
  isCustomVolume: boolean;
  category: 'Men' | 'Women' | 'Unisex';
  imageUrl: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

// Check environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const adminPasswordEnv = import.meta.env.VITE_ADMIN_PASSWORD || 'scentix2026';

const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

// Initialize Supabase client if configured
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!isSupabaseConfigured) {
  console.warn(
    'Scentix: Supabase URL and Anon Key are not provided. Falling back to LocalStorage database.'
  );
}

// Initial seed products
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Oud Royale',
    productType: 'Perfume',
    volumeMl: 50,
    volumeLabel: '50ml',
    isCustomVolume: false,
    category: 'Unisex',
    imageUrl: '/images/perfume_gold.png',
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Noir Mystique',
    productType: 'Perfume',
    volumeMl: 100,
    volumeLabel: '100ml',
    isCustomVolume: false,
    category: 'Men',
    imageUrl: '/images/perfume_noir.png',
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Amber Glow',
    productType: 'BodySpray',
    volumeMl: 150,
    volumeLabel: '150ml',
    isCustomVolume: false,
    category: 'Women',
    imageUrl: '/images/bodyspray_gold.png',
    sortOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Royal Oud Attar',
    productType: 'Attar',
    volumeMl: 12,
    volumeLabel: '12ml',
    isCustomVolume: false,
    category: 'Unisex',
    imageUrl: '/images/attar_oud.png',
    sortOrder: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Midnight Rose',
    productType: 'Perfume',
    volumeMl: 22,
    volumeLabel: '22ml',
    isCustomVolume: false,
    category: 'Women',
    imageUrl: '/images/perfume_noir.png',
    sortOrder: 4,
    createdAt: new Date().toISOString(),
  },
];

// Helper to initialize local storage
const getLocalProducts = (): Product[] => {
  const localData = localStorage.getItem('scentix_products');
  if (!localData) {
    localStorage.setItem('scentix_products', JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  return JSON.parse(localData);
};

const saveLocalProducts = (products: Product[]) => {
  localStorage.setItem('scentix_products', JSON.stringify(products));
};

// Database APIs
export const db = {
  /**
   * Fetch all products
   */
  async getProducts(): Promise<Product[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sortOrder', { ascending: true });
      if (error) {
        console.error('Error fetching from Supabase, returning local data:', error);
        return getLocalProducts();
      }
      return data as Product[];
    } else {
      // LocalStorage mode
      return getLocalProducts().sort((a, b) => a.sortOrder - b.sortOrder);
    }
  },

  /**
   * Add a new product
   */
  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const newId = Math.random().toString(36).substring(2, 9);
    const newProduct: Product = {
      ...product,
      id: supabase ? undefined as any : newId, // Supabase generates id
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (supabase) {
      // Omit 'id' so that Supabase generates a UUID using default database constraints
      const { id, ...supabaseProduct } = newProduct;
      const { data, error } = await supabase
        .from('products')
        .insert([supabaseProduct])
        .select()
        .single();
      if (error) {
        throw new Error(error.message);
      }
      return data as Product;
    } else {
      const current = getLocalProducts();
      newProduct.id = newId;
      current.push(newProduct);
      saveLocalProducts(current);
      return newProduct;
    }
  },

  /**
   * Update an existing product
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        throw new Error(error.message);
      }
      return data as Product;
    } else {
      const current = getLocalProducts();
      const idx = current.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Product not found');
      
      const updatedProduct = { ...current[idx], ...updatedFields };
      current[idx] = updatedProduct;
      saveLocalProducts(current);
      return updatedProduct;
    }
  },

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
      return true;
    } else {
      const current = getLocalProducts();
      const filtered = current.filter((p) => p.id !== id);
      saveLocalProducts(filtered);
      return true;
    }
  },

  /**
   * Bulk reorder products
   */
  async reorderProducts(orderedIds: string[]): Promise<boolean> {
    if (supabase) {
      // In Supabase, we can update in bulk or single updates.
      // For simplicity and compatibility, we execute individual updates in parallel
      const updates = orderedIds.map((id, index) =>
        supabase.from('products').update({ sortOrder: index }).eq('id', id)
      );
      const results = await Promise.all(updates);
      const error = results.find((r) => r.error);
      if (error) {
        throw new Error(error.error?.message || 'Error updating order');
      }
      return true;
    } else {
      const current = getLocalProducts();
      const updated = current.map((p) => {
        const index = orderedIds.indexOf(p.id);
        if (index !== -1) {
          return { ...p, sortOrder: index };
        }
        return p;
      });
      saveLocalProducts(updated);
      return true;
    }
  },

  /**
   * Authenticate admin using shared password
   */
  login(password: string): boolean {
    if (password === adminPasswordEnv) {
      sessionStorage.setItem('scentix_admin_token', 'authenticated');
      return true;
    }
    return false;
  },

  /**
   * Check if admin session is active
   */
  isAdminAuthenticated(): boolean {
    return sessionStorage.getItem('scentix_admin_token') === 'authenticated';
  },

  /**
   * Logout admin
   */
  logout() {
    sessionStorage.removeItem('scentix_admin_token');
  },
};
