import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { Product } from '../lib/db';
import { ArrowUp, ArrowDown, Edit2, Trash2, Plus, LogOut, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'Perfume' | 'BodySpray' | 'Attar'>('Perfume');
  const [formVolumeOption, setFormVolumeOption] = useState<'22' | '50' | '100' | 'other'>('50');
  const [formVolumeCustomMl, setFormVolumeCustomMl] = useState<number>(30);
  const [formCategory, setFormCategory] = useState<'Men' | 'Women' | 'Unisex'>('Unisex');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Toast / Status state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load products and check auth
  useEffect(() => {
    setIsAuthenticated(db.isAdminAuthenticated());
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await db.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
      showToast('Failed to load products from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (db.login(passwordInput)) {
      setIsAuthenticated(true);
      setLoginError('');
      showToast('Authenticated successfully');
    } else {
      setLoginError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    db.logout();
    setIsAuthenticated(false);
    setPasswordInput('');
    showToast('Logged out');
  };

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormType('Perfume');
    setFormVolumeOption('50');
    setFormVolumeCustomMl(50);
    setFormCategory('Unisex');
    setFormImageUrl('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormType(p.productType);
    setFormCategory(p.category);
    setFormImageUrl(p.imageUrl);

    if (p.productType === 'Perfume') {
      if (['22', '50', '100'].includes(p.volumeMl.toString()) && !p.isCustomVolume) {
        setFormVolumeOption(p.volumeMl.toString() as any);
      } else {
        setFormVolumeOption('other');
        setFormVolumeCustomMl(p.volumeMl);
      }
    } else {
      setFormVolumeCustomMl(p.volumeMl);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formImageUrl.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setActionLoading(true);

    // Compute volume properties
    let volumeMl = 0;
    let isCustomVolume = false;
    let volumeLabel = '';

    if (formType === 'Perfume') {
      if (formVolumeOption !== 'other') {
        volumeMl = parseInt(formVolumeOption);
        isCustomVolume = false;
        volumeLabel = `${volumeMl}ml`;
      } else {
        volumeMl = Number(formVolumeCustomMl);
        isCustomVolume = ![22, 50, 100].includes(volumeMl);
        volumeLabel = `${volumeMl}ml`;
      }
    } else {
      // BodySpray or Attar
      volumeMl = Number(formVolumeCustomMl);
      isCustomVolume = false;
      volumeLabel = `${volumeMl}ml`;
    }

    const payload = {
      name: formName.trim(),
      productType: formType,
      volumeMl,
      volumeLabel,
      isCustomVolume,
      category: formCategory,
      imageUrl: formImageUrl.trim(),
    };

    try {
      if (editingProduct) {
        // Edit existing
        await db.updateProduct(editingProduct.id, payload);
        showToast('Product updated successfully');
      } else {
        // Add new (calculate sortOrder as the max order + 1)
        const nextSortOrder = products.length > 0 ? Math.max(...products.map((p) => p.sortOrder)) + 1 : 0;
        await db.createProduct({
          ...payload,
          sortOrder: nextSortOrder,
        });
        showToast('Product added successfully');
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error saving product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    setActionLoading(true);
    try {
      await db.deleteProduct(id);
      showToast('Product deleted');
      loadProducts();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error deleting product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === products.length - 1) return;

    const newProducts = [...products];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    // Swap sortOrders in the local state array first
    const temp = newProducts[index];
    newProducts[index] = newProducts[targetIdx];
    newProducts[targetIdx] = temp;

    // Build the ordered IDs list
    const orderedIds = newProducts.map((p) => p.id);

    // Update list immediately to avoid lag
    setProducts(newProducts);

    try {
      await db.reorderProducts(orderedIds);
      showToast('Order saved');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to save order to database', 'error');
      loadProducts(); // Reload original
    }
  };

  const isOtherVolumeSelected = formType === 'Perfume' && formVolumeOption === 'other';
  const showCustomVolumeWarning = isOtherVolumeSelected && ![22, 50, 100].includes(formVolumeCustomMl);

  if (!isAuthenticated) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-dark-bg text-white font-sans px-4 select-none relative">
        {/* Decorative Blurred elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-accent-gold/10 blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent-gold/5 blur-[80px]" />

        <div className="w-full max-w-md glass-panel p-8 rounded-[32px] text-center relative z-10">
          <h1 className="font-serif text-3xl font-bold tracking-widest text-accent-gold mb-2 select-none">
            SCENTIX
          </h1>
          <p className="text-gray-400 text-xs tracking-wider uppercase font-sans mb-8">
            Administrative Access
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold tracking-wider text-accent-gold uppercase pl-1 font-sans">
                Enter Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-accent-gold/25 focus:border-accent-gold text-white font-sans text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold transition-all"
                required
                autoFocus
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1.5 justify-center">
                <AlertCircle size={14} />
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="mt-4 w-full py-3 bg-gradient-to-r from-accent-gold-hover to-accent-gold hover:brightness-110 text-black font-semibold rounded-xl text-sm transition-all shadow-[0_4px_12px_rgba(212,175,55,0.2)] cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-auto bg-dark-bg text-white font-sans pb-16 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl border shadow-xl flex items-center gap-2 font-sans text-sm ${
              toastMessage.type === 'success'
                ? 'bg-black/90 border-accent-gold text-accent-gold'
                : 'bg-black/90 border-red-500/50 text-red-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {toastMessage.text}
          </div>
        </div>
      )}

      {/* Admin Header */}
      <header className="fixed top-0 left-0 w-full z-40 bg-dark-bg/60 backdrop-blur-md border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl font-bold tracking-widest text-accent-gold">
              SCENTIX
            </span>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-sans">
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              View Site <ExternalLink size={12} />
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
          <div>
            <h1 className="text-xl font-serif text-white tracking-wider">
              Product Catalog Catalog Management
            </h1>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              Reorder, update, add, or delete items. Changes reflect on the live site instantly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadProducts}
              className="p-2.5 bg-black/40 hover:bg-white/5 border border-white/10 hover:border-accent-gold/30 rounded-xl transition-all cursor-pointer text-gray-400 hover:text-accent-gold"
              title="Refresh Catalog"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-gold text-black rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-[0_4px_12px_rgba(212,175,55,0.15)] cursor-pointer"
            >
              <Plus size={14} /> Add New Product
            </button>
          </div>
        </div>

        {/* Product Table Grid */}
        {loading ? (
          <div className="w-full py-24 flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl p-8 bg-black/20">
            <p className="text-gray-400 font-sans text-sm mb-4">
              Your catalog is currently empty.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2 border border-accent-gold/45 text-accent-gold rounded-full text-xs font-semibold hover:bg-accent-gold/10 transition-all cursor-pointer"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40 text-[10px] uppercase tracking-wider text-accent-gold font-sans font-bold">
                    <th className="py-4 px-6">Order</th>
                    <th className="py-4 px-4">Image</th>
                    <th className="py-4 px-4">Name</th>
                    <th className="py-4 px-4">Type</th>
                    <th className="py-4 px-4">Volume</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {products.map((p, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === products.length - 1;

                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        {/* Order buttons */}
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMove(idx, 'up')}
                              disabled={isFirst}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isFirst
                                  ? 'opacity-20 cursor-not-allowed border-transparent text-gray-600'
                                  : 'border-white/10 hover:border-accent-gold/40 text-gray-400 hover:text-accent-gold bg-black/20'
                              }`}
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={() => handleMove(idx, 'down')}
                              disabled={isLast}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isLast
                                  ? 'opacity-20 cursor-not-allowed border-transparent text-gray-600'
                                  : 'border-white/10 hover:border-accent-gold/40 text-gray-400 hover:text-accent-gold bg-black/20'
                              }`}
                            >
                              <ArrowDown size={12} />
                            </button>
                            <span className="text-[10px] text-gray-500 font-semibold ml-2 select-none w-4 text-center">
                              {idx + 1}
                            </span>
                          </div>
                        </td>

                        {/* Image Preview */}
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-black border border-white/10">
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                          {p.name}
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4 text-xs font-semibold">
                          {p.productType}
                        </td>

                        {/* Volume */}
                        <td className="py-3 px-4 text-xs">
                          <span className="font-semibold text-white">{p.volumeLabel}</span>
                          {p.isCustomVolume && (
                            <span className="ml-1 text-[8px] text-accent-gold font-bold bg-accent-gold/10 border border-accent-gold/20 px-1.5 py-0.5 rounded-full select-none">
                              Custom
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="text-[10px] tracking-wider font-semibold uppercase px-2.5 py-0.5 rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
                            {p.category}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-2 border border-white/10 hover:border-accent-gold/30 hover:bg-accent-gold/10 text-gray-400 hover:text-accent-gold rounded-xl transition-all cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-2 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => !actionLoading && setIsModalOpen(false)}
          />
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-[32px] shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl sm:text-2xl font-serif text-accent-gold mb-6 select-none">
              {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-4 font-sans text-sm">
              
              {/* Product Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-accent-gold uppercase tracking-wider pl-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Noir Mystique"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-accent-gold text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold transition-all"
                  required
                />
              </div>

              {/* Product Type & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-accent-gold uppercase tracking-wider pl-1">
                    Product Category (Type)
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/10 focus:border-accent-gold text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold transition-all cursor-pointer"
                  >
                    <option value="Perfume">Perfume</option>
                    <option value="BodySpray">Body Spray</option>
                    <option value="Attar">Attar</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-accent-gold uppercase tracking-wider pl-1">
                    Gender Category Tag
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/10 focus:border-accent-gold text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold transition-all cursor-pointer"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                  </select>
                </div>
              </div>

              {/* Volume Selection Logic */}
              <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                
                {/* Conditional volume settings */}
                {formType === 'Perfume' ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-accent-gold uppercase tracking-wider">
                        Volume Size
                      </label>
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        {['22', '50', '100', 'other'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFormVolumeOption(opt as any)}
                            className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                              formVolumeOption === opt
                                ? 'bg-accent-gold text-black border-accent-gold shadow-[0_0_8px_rgba(212,175,55,0.3)]'
                                : 'bg-black border-white/10 hover:border-white/30 text-gray-400'
                            }`}
                          >
                            {opt === 'other' ? 'Other' : `${opt}ml`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formVolumeOption === 'other' && (
                      <div className="flex flex-col gap-1 animate-in fade-in duration-200">
                        <label className="text-[10px] font-bold text-accent-gold uppercase tracking-wider">
                          Custom Volume (ml)
                        </label>
                        <input
                          type="number"
                          value={formVolumeCustomMl}
                          onChange={(e) => setFormVolumeCustomMl(Number(e.target.value))}
                          placeholder="e.g. 30"
                          min={1}
                          className="w-full px-4 py-2 rounded-xl bg-black border border-white/10 focus:border-accent-gold text-white text-xs sm:text-sm focus:outline-none transition-all"
                          required
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // BodySpray & Attar direct volume input
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-accent-gold uppercase tracking-wider">
                      Volume Capacity (ml)
                    </label>
                    <input
                      type="number"
                      value={formVolumeCustomMl}
                      onChange={(e) => setFormVolumeCustomMl(Number(e.target.value))}
                      placeholder="e.g. 150"
                      min={1}
                      className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 focus:border-accent-gold text-white text-xs sm:text-sm focus:outline-none transition-all"
                      required
                    />
                  </div>
                )}

                {/* Info alert for custom volumes */}
                {showCustomVolumeWarning && (
                  <div className="flex items-start gap-2 text-[10px] text-accent-gold/80 bg-accent-gold/5 border border-accent-gold/20 p-2.5 rounded-xl mt-2 select-none">
                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-accent-gold" />
                    <p className="font-sans leading-relaxed">
                      Custom volume perfumes ({formVolumeCustomMl}ml) appear under <strong>"All Products"</strong>, but will not show in the specific 22ml/50ml/100ml filters.
                    </p>
                  </div>
                )}
              </div>

              {/* Image URL */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-accent-gold uppercase tracking-wider pl-1">
                  Product Image URL
                </label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="e.g. /images/perfume_gold.png or https://example.com/perfume.jpg"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-accent-gold text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold transition-all"
                  required
                />
                <p className="text-[9px] text-gray-500 pl-1">
                  Provide a local link (e.g. <code>/images/perfume_gold.png</code>) or a direct web link.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => !actionLoading && setIsModalOpen(false)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-accent-gold text-black font-semibold rounded-xl text-xs hover:brightness-110 transition-all shadow-[0_4px_12px_rgba(212,175,55,0.15)] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading && <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
