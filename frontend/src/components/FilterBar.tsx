import React, { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

export interface FilterState {
  type: 'all' | '22ml' | '50ml' | '100ml' | 'bodyspray' | 'attar';
  gender?: 'Men' | 'Women' | 'Unisex' | 'All';
}

interface FilterBarProps {
  activeFilter: FilterState;
  onChangeFilter: (filter: FilterState) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onChangeFilter }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const menuItems = [
    { id: 'all', label: 'All Products', hasDropdown: false },
    { id: '22ml', label: '22ml Perfumes', hasDropdown: true },
    { id: '50ml', label: '50ml Perfumes', hasDropdown: true },
    { id: '100ml', label: '100ml Perfumes', hasDropdown: true },
    { id: 'bodyspray', label: 'Body Spray', hasDropdown: true },
    { id: 'attar', label: 'Attars', hasDropdown: false },
  ];

  const genderOptions = [
    { label: 'All', value: 'All' },
    { label: 'Mens', value: 'Men' },
    { label: 'Womens', value: 'Women' },
    { label: 'Unisex', value: 'Unisex' },
  ];

  const handleItemClick = (itemId: string, hasDropdown: boolean) => {
    if (!hasDropdown) {
      onChangeFilter({ type: itemId as any });
      setMobileMenuOpen(false);
      setActiveDropdown(null);
    } else {
      // Toggle dropdown on mobile click
      setActiveDropdown(activeDropdown === itemId ? null : itemId);
    }
  };

  const handleDropdownSelect = (itemId: string, gender: string) => {
    onChangeFilter({
      type: itemId as any,
      gender: gender === 'All' ? undefined : (gender as any),
    });
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const isFilterActive = (itemId: string) => {
    return activeFilter.type === itemId;
  };

  const getActiveLabel = () => {
    const item = menuItems.find((m) => m.id === activeFilter.type);
    if (!item) return 'All Products';
    if (activeFilter.gender) {
      const displayGender = activeFilter.gender === 'Men' ? 'Mens' : activeFilter.gender === 'Women' ? 'Womens' : 'Unisex';
      return `${item.label} (${displayGender})`;
    }
    return item.label;
  };

  return (
    <nav className="fixed z-50 transition-all duration-300 top-0 left-0 w-full lg:top-1/2 lg:left-6 lg:w-64 lg:h-auto lg:-translate-y-1/2">
      {/* Main Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-0 mt-4 lg:mt-0">
        <div className="glass-panel rounded-full lg:rounded-[32px] px-6 lg:px-5 py-3 lg:py-8 flex lg:flex-col lg:items-start lg:gap-8 justify-between transition-all duration-300">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center lg:w-full lg:justify-center lg:border-b lg:border-white/5 lg:pb-6">
            <span className="font-serif text-2xl font-bold tracking-widest text-accent-gold cursor-pointer select-none">
              SCENTIX
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:flex-col lg:space-x-0 lg:space-y-3 lg:w-full space-x-1 items-center lg:items-stretch">
            {menuItems.map((item) => {
              const active = isFilterActive(item.id);
              return (
                <div
                  key={item.id}
                  className="relative group py-2 lg:py-1 lg:w-full"
                  onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.id)}
                  onMouseLeave={() => item.hasDropdown && setActiveDropdown(null)}
                >
                  <button
                    onClick={() => handleItemClick(item.id, item.hasDropdown)}
                    className={`flex items-center justify-between lg:justify-between w-full lg:w-full gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2.5 rounded-full lg:rounded-xl text-xs lg:text-sm font-medium transition-all duration-300 select-none cursor-pointer ${
                      active
                        ? 'text-accent-gold bg-accent-gold/10 border border-accent-gold/30 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {item.label}
                    {item.hasDropdown && (
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 lg:ml-auto ${
                          activeDropdown === item.id ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {item.hasDropdown && (
                    <div
                      className={`absolute left-1/2 lg:left-full -translate-x-1/2 lg:translate-x-0 lg:top-0 lg:pl-3 mt-2 lg:mt-0 w-40 transition-all duration-300 origin-top lg:origin-left z-50 ${
                        activeDropdown === item.id
                          ? 'opacity-100 scale-100 pointer-events-auto'
                          : 'opacity-0 scale-95 pointer-events-none'
                      }`}
                    >
                      <div className="rounded-2xl glass-panel py-2 shadow-2xl">
                        {genderOptions.map((opt) => {
                          const isSelected =
                            active &&
                            ((opt.value === 'All' && !activeFilter.gender) ||
                              (opt.value !== 'All' && activeFilter.gender === opt.value));

                          return (
                            <button
                              key={opt.label}
                              onClick={() => handleDropdownSelect(item.id, opt.value)}
                              className={`w-full text-left px-4 py-2 text-xs font-sans transition-colors duration-200 cursor-pointer ${
                                isSelected
                                  ? 'text-accent-gold font-semibold bg-accent-gold/10'
                                  : 'text-gray-300 hover:text-accent-gold hover:bg-white/5'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Filter Label (Mobile Display) */}
          <div className="lg:hidden flex items-center">
            <span className="text-xs font-semibold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 rounded-full px-3 py-1 font-sans">
              {getActiveLabel()}
            </span>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-accent-gold p-2 rounded-full hover:bg-white/5 transition-all select-none cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`lg:hidden fixed inset-x-4 top-20 rounded-3xl glass-panel shadow-2xl p-4 transition-all duration-300 origin-top z-40 ${
          mobileMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex flex-col space-y-2">
          {menuItems.map((item) => {
            const active = isFilterActive(item.id);
            const dropdownOpen = activeDropdown === item.id;

            return (
              <div key={item.id} className="flex flex-col">
                <button
                  onClick={() => handleItemClick(item.id, item.hasDropdown)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    active
                      ? 'text-accent-gold bg-accent-gold/15 border border-accent-gold/25'
                      : 'text-gray-300 hover:text-gray-100 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.hasDropdown && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Mobile Dropdown Sub-menu */}
                {item.hasDropdown && dropdownOpen && (
                  <div className="pl-6 pr-2 py-1 mt-1 flex flex-col space-y-1 border-l border-accent-gold/20 ml-4">
                    {genderOptions.map((opt) => {
                      const isSelected =
                        active &&
                        ((opt.value === 'All' && !activeFilter.gender) ||
                          (opt.value !== 'All' && activeFilter.gender === opt.value));

                      return (
                        <button
                          key={opt.label}
                          onClick={() => handleDropdownSelect(item.id, opt.value)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                            isSelected
                              ? 'text-accent-gold font-semibold bg-accent-gold/10'
                              : 'text-gray-400 hover:text-accent-gold hover:bg-white/5'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
