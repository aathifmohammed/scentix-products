import React from 'react';
import type { Product } from '../lib/db';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="w-full max-w-[500px] rounded-[32px] glass-panel glass-panel-hover p-4 md:p-6 flex flex-col justify-between overflow-hidden relative group select-none">
      
      {/* 1:1 Product Image Container */}
      <div className="w-full aspect-square overflow-hidden rounded-[20px] bg-gradient-to-br from-black/40 to-white/5 relative border border-white/5">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />
        {/* Soft gold vignetting/overlay over image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Info & Content Area */}
      <div className="flex flex-col gap-2 mt-4 relative z-10">
        
        {/* Type & Volume */}
        <div className="flex justify-between items-center text-xs tracking-wider uppercase">
          <span className="text-gray-400 font-sans font-medium">
            {product.productType === 'BodySpray' ? 'Body Spray' : product.productType}
          </span>
          <span className="text-accent-gold font-sans font-semibold">
            {product.volumeLabel}
          </span>
        </div>

        {/* Product Name */}
        <div className="flex justify-between items-end">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight pr-4">
            {product.name}
          </h2>
          <span className="text-[10px] tracking-widest font-sans font-semibold uppercase px-2.5 py-1 rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/25 select-none shrink-0 mb-1">
            {product.category}
          </span>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-accent-gold/25 to-transparent my-1" />

        {/* Wholesale & Retail Contact Info */}
        <div className="text-center py-1">
          <a
            href="https://wa.me/94703215170"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] sm:text-xs text-accent-gold hover:text-accent-gold-hover tracking-widest font-semibold font-sans uppercase animate-pulse hover:animate-none transition-colors cursor-pointer inline-block"
          >
            Contact 070 321 5170 for Wholesale & Retail
          </a>
        </div>
      </div>
    </div>
  );
};
