import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { db } from '../lib/db';
import type { Product } from '../lib/db';
import { FilterBar } from '../components/FilterBar';
import type { FilterState } from '../components/FilterBar';
import { ProductCard } from '../components/ProductCard';
import { SplashLoader } from '../components/SplashLoader';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface ScrollSectionProps {
  product: Product;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ScrollSection: React.FC<ScrollSectionProps> = ({ product, containerRef }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress of this specific section relative to the container
  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Map scroll progress [0, 0.5, 1] to animations:
  // 0: product card is coming from bottom
  // 0.5: product card is centered on screen
  // 1: product card is exiting to top
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [150, 0, -150]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.82, 1, 0.82]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  return (
    <div
      ref={sectionRef}
      className="w-full h-screen flex items-center justify-center snap-start relative px-4 select-none"
    >
      <motion.div
        style={{ y, scale, opacity }}
        className="w-full flex justify-center"
      >
        <ProductCard product={product} />
      </motion.div>
    </div>
  );
};

export const Showcase: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterState>({ type: 'all' });
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await db.getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Filter and sort products
  useEffect(() => {
    if (products.length === 0) return;

    let result = [...products];

    // Filter by type & volume
    if (activeFilter.type !== 'all') {
      if (activeFilter.type === 'attar') {
        result = result.filter((p) => p.productType === 'Attar');
      } else if (activeFilter.type === 'bodyspray') {
        result = result.filter((p) => p.productType === 'BodySpray');
      } else {
        // e.g. "22ml", "50ml", "100ml" perfumes
        const targetVol = parseInt(activeFilter.type);
        result = result.filter(
          (p) =>
            p.productType === 'Perfume' &&
            p.volumeMl === targetVol &&
            !p.isCustomVolume
        );
      }
    }

    // Filter by gender (Men / Women / Unisex)
    if (activeFilter.gender) {
      result = result.filter((p) => p.category === activeFilter.gender);
    }

    // Sort products based on active filter
    if (activeFilter.type === 'all' && !activeFilter.gender) {
      // Default "All Products" view sorted by admin's custom sortOrder
      result.sort((a, b) => a.sortOrder - b.sortOrder);
    } else {
      // Other filtered views sorted alphabetically by name
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(result);
    setActiveIndex(0);

    // Reset scroll position when filter changes
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [products, activeFilter]);

  // Handle scroll to track active card index
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, clientHeight } = scrollContainerRef.current;
    
    // Determine which section is closest to center
    const newIndex = Math.round(scrollTop / clientHeight);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < filteredProducts.length) {
      setActiveIndex(newIndex);
    }
  };

  const handleFilterChange = (filter: FilterState) => {
    setActiveFilter(filter);
  };

  const scrollToIndex = (idx: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: idx * window.innerHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dark-bg font-sans">
      <AnimatePresence>
        {showSplash && (
          <SplashLoader onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>
      
      {/* 1. Viewport-spanning blurred background layers for crossfading */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {filteredProducts.map((p, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={p.id}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{
                opacity: isActive ? 1 : 0,
                backgroundImage: `url(${p.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: 'scale(1.2)', // Upscale to prevent blur white edges
                filter: 'blur(60px) brightness(0.6)',
              }}
            />
          );
        })}

        {/* Premium Vignette Overlay to maintain contrast and readable text */}
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        <div className="absolute inset-0 bg-radial-[circle_at_center] from-accent-gold/5 via-transparent to-transparent opacity-40" />
      </div>

      {/* 2. Top Filter Navigation Bar */}
      <AnimatePresence>
        {!showSplash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <FilterBar activeFilter={activeFilter} onChangeFilter={handleFilterChange} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Scroll-driven showcase viewport */}
      {loading ? (
        <div className="w-full h-full flex flex-col gap-4 items-center justify-center relative z-10">
          {/* Scentix Luxury Spinner */}
          <div className="w-16 h-16 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
          <p className="font-serif tracking-widest text-accent-gold text-lg animate-pulse">
            SCENTIX
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center relative z-10 px-4">
          <div className="glass-panel max-w-md p-8 rounded-[32px] text-center flex flex-col items-center gap-4">
            <h3 className="text-xl font-serif text-accent-gold tracking-widest uppercase">
              No products found
            </h3>
            <p className="text-sm text-gray-400 font-sans leading-relaxed">
              We couldn't find any products matching the selected category. Try selecting another filter from the bar above.
            </p>
            <button
              onClick={() => setActiveFilter({ type: 'all' })}
              className="mt-2 px-6 py-2 border border-accent-gold/45 text-accent-gold rounded-full text-xs font-semibold hover:bg-accent-gold/10 transition-all select-none cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth relative z-10 no-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {filteredProducts.map((product) => (
            <ScrollSection
              key={product.id}
              product={product}
              containerRef={scrollContainerRef}
            />
          ))}
        </div>
      )}

      {/* 4. Elegant Scroll Progress Indicators */}
      {filteredProducts.length > 1 && (
        <>
          {/* Desktop/Laptop Vertical 3-Button Controller on the Right */}
          <div className="fixed right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center justify-between glass-panel rounded-full py-4 px-2.5 gap-2.5 z-20 select-none shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border border-white/10">
            {/* Back/Up Button */}
            <button
              onClick={() => activeIndex > 0 && scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                activeIndex === 0
                  ? 'border-white/5 text-gray-600 cursor-not-allowed opacity-30'
                  : 'border-white/10 text-gray-300 hover:text-accent-gold hover:border-accent-gold/40 hover:shadow-[0_0_8px_rgba(212,175,55,0.3)] active:scale-90 bg-black/20'
              }`}
            >
              <ChevronUp size={14} />
            </button>

            {/* Vertical fraction page indicator */}
            <div className="flex flex-col items-center py-1 font-serif text-accent-gold select-none">
              <span className="text-[11px] font-bold tracking-wider leading-none">
                {String(activeIndex + 1).padStart(2, '0')}
              </span>
              <span className="h-[1px] w-3 bg-accent-gold/30 my-1.5" />
              <span className="text-[9px] text-gray-500 font-medium leading-none">
                {String(filteredProducts.length).padStart(2, '0')}
              </span>
            </div>

            {/* Forward/Down Button */}
            <button
              onClick={() => activeIndex < filteredProducts.length - 1 && scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === filteredProducts.length - 1}
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                activeIndex === filteredProducts.length - 1
                  ? 'border-white/5 text-gray-600 cursor-not-allowed opacity-30'
                  : 'border-white/10 text-gray-300 hover:text-accent-gold hover:border-accent-gold/40 hover:shadow-[0_0_8px_rgba(212,175,55,0.3)] active:scale-90 bg-black/20'
              }`}
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Mobile 3-Button Controller at the Bottom */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden flex items-center justify-between glass-panel rounded-full px-4 py-2.5 gap-3 z-20 select-none">
            {/* Back Button */}
            <button
              onClick={() => activeIndex > 0 && scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                activeIndex === 0
                  ? 'border-white/5 text-gray-600 cursor-not-allowed opacity-30'
                  : 'border-white/10 text-gray-300 hover:text-accent-gold hover:border-accent-gold/40 active:scale-90 bg-black/20'
              }`}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Center fraction page indicator */}
            <span className="font-serif text-accent-gold tracking-widest text-xs font-semibold px-2 min-w-[70px] text-center">
              {String(activeIndex + 1).padStart(2, '0')} / {String(filteredProducts.length).padStart(2, '0')}
            </span>

            {/* Forward Button */}
            <button
              onClick={() => activeIndex < filteredProducts.length - 1 && scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === filteredProducts.length - 1}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                activeIndex === filteredProducts.length - 1
                  ? 'border-white/5 text-gray-600 cursor-not-allowed opacity-30'
                  : 'border-white/10 text-gray-300 hover:text-accent-gold hover:border-accent-gold/40 active:scale-90 bg-black/20'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
