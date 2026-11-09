import React, { useEffect, useState } from 'react';
import {
  Filter,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Tag,
  MapPin,
} from 'lucide-react';
import { Listing, Category, Condition, ListingsQuery } from '../types';
import { apiClient, ADDIS_ABABA_AREAS } from '../api/client';
import { ListingCard } from '../components/ListingCard';
import { useRouter } from '../context/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { ErrorMessage } from '../components/ErrorMessage';

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'new', label: 'Brand New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'used_good', label: 'Good' },
  { value: 'used_fair', label: 'Fair' },
  { value: 'refurbished', label: 'Refurbished' },
];

export const Browse: React.FC = () => {
  const { queryParams, navigate, setMeta } = useRouter();
  const { t } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<string[]>(ADDIS_ABABA_AREAS);
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Mobile filters drawer open/close
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Local filter states derived from queryParams
  const currentCategory = queryParams.get('category') || '';
  const currentArea = queryParams.get('area') || '';
  const currentCondition = (queryParams.get('condition') as Condition) || '';
  const currentSearch = queryParams.get('q') || '';
  const currentSort = (queryParams.get('sort') as any) || 'newest';
  const currentPage = parseInt(queryParams.get('page') || '1', 10);
  const currentMinPrice = queryParams.get('min_price') || '';
  const currentMaxPrice = queryParams.get('max_price') || '';
  const currentNegotiable = queryParams.get('is_negotiable') === 'true';

  // Local input states for price inputs before applying
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sync inputs if queryParams change
  useEffect(() => {
    setMinPriceInput(currentMinPrice);
    setMaxPriceInput(currentMaxPrice);
    setSearchInput(currentSearch);
  }, [currentMinPrice, currentMaxPrice, currentSearch]);

  // Update URL helper
  const updateUrl = (updates: Record<string, string | number | undefined | null>) => {
    const nextParams = new URLSearchParams(queryParams.toString());

    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(val));
      }
    });

    // If changing filters, reset to page 1 unless page itself was updated
    if (!('page' in updates)) {
      nextParams.delete('page');
    }

    const nextUrl = `/browse${nextParams.toString() ? `?${nextParams.toString()}` : ''}`;
    navigate(nextUrl);
  };

  // Fetch categories and listings
  useEffect(() => {
    let catName = 'All Categories';
    if (currentCategory && categories.length > 0) {
      const match = categories.find((c) => c.id === currentCategory);
      if (match) catName = match.name;
    }

    const pageTitle = currentSearch
      ? `"${currentSearch}" in ${currentArea || 'Addis Ababa'} - Cone Classifieds`
      : `${catName} in ${currentArea || 'Addis Ababa'} - Cone Classifieds`;

    setMeta(
      pageTitle,
      `Browse verified classifieds in ${currentArea || 'Addis Ababa'}, Ethiopia. Filter by price, category, condition, and connect directly with sellers.`
    );
  }, [currentCategory, currentArea, currentSearch, categories]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [catsRes, areasRes, listingsRes] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getAreas(),
          apiClient.getListings({
            category: currentCategory || undefined,
            area: currentArea || undefined,
            condition: currentCondition || undefined,
            q: currentSearch || undefined,
            sort: currentSort,
            page: currentPage,
            min_price: currentMinPrice ? Number(currentMinPrice) : undefined,
            max_price: currentMaxPrice ? Number(currentMaxPrice) : undefined,
            is_negotiable: currentNegotiable ? true : undefined,
            limit: 12,
          }),
        ]);

        setCategories(catsRes);
        setAreas(areasRes);
        setListings(listingsRes.listings);
        setTotalCount(listingsRes.total);
        setTotalPages(listingsRes.total_pages);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    currentCategory,
    currentArea,
    currentCondition,
    currentSearch,
    currentSort,
    currentPage,
    currentMinPrice,
    currentMaxPrice,
    currentNegotiable,
  ]);

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({
      min_price: minPriceInput || null,
      max_price: maxPriceInput || null,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchInput || null });
  };

  const resetAllFilters = () => {
    navigate('/browse');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchInput('');
  };

  const activeFiltersCount = [
    currentCategory,
    currentArea,
    currentCondition,
    currentMinPrice,
    currentMaxPrice,
    currentNegotiable,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Search Header Banner */}
      <div className="border-b border-slate-200 bg-white py-4 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentCategory
                  ? categories.find((c) => c.id === currentCategory)?.name || 'Classifieds'
                  : t.browse.title}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLoading
                  ? 'Searching Addis Ababa...'
                  : `${totalCount} verified listings in ${currentArea || 'Addis Ababa'}`}
              </p>
            </div>

            {/* Quick in-page Search & Sort */}
            <div className="flex flex-wrap items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Filter keywords..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </form>

              {/* Sort Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                  {t.browse.sortBy}:
                </span>
                <select
                  value={currentSort}
                  onChange={(e) => updateUrl({ sort: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="newest">{t.browse.sortNewest}</option>
                  <option value="price_asc">{t.browse.sortPriceAsc}</option>
                  <option value="price_desc">{t.browse.sortPriceDesc}</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="md:hidden flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-emerald-600 px-1.5 text-[10px] text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Active:</span>

              {currentCategory && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {categories.find((c) => c.id === currentCategory)?.name || currentCategory}
                  <button
                    onClick={() => updateUrl({ category: null })}
                    className="hover:text-emerald-950"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {currentArea && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {currentArea}
                  <button onClick={() => updateUrl({ area: null })} className="hover:text-emerald-950">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {currentCondition && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-800">
                  Condition: {CONDITIONS.find((c) => c.value === currentCondition)?.label}
                  <button
                    onClick={() => updateUrl({ condition: null })}
                    className="hover:text-slate-950"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {(currentMinPrice || currentMaxPrice) && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-800">
                  Price: {currentMinPrice || '0'} - {currentMaxPrice || '∞'} ETB
                  <button
                    onClick={() => {
                      setMinPriceInput('');
                      setMaxPriceInput('');
                      updateUrl({ min_price: null, max_price: null });
                    }}
                    className="hover:text-slate-950"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {currentNegotiable && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  Negotiable only
                  <button
                    onClick={() => updateUrl({ is_negotiable: null })}
                    className="hover:text-emerald-950"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                onClick={resetAllFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-1 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset all</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Listings Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden md:block md:col-span-1 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-emerald-600" />
                  <span>{t.browse.filters}</span>
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetAllFilters}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600"
                  >
                    {t.browse.clearAll}
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="border-b border-slate-100 pb-4 mb-4">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Category
                </label>
                <div className="space-y-1">
                  <button
                    onClick={() => updateUrl({ category: null })}
                    className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      !currentCategory
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateUrl({ category: c.id })}
                      className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                        currentCategory === c.id
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-400">{c.itemCount}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Addis Ababa Subcity / Area */}
              <div className="border-b border-slate-100 pb-4 mb-4">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  {t.browse.subcity}
                </label>
                <select
                  value={currentArea}
                  onChange={(e) => updateUrl({ area: e.target.value || null })}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">All Addis Ababa Areas</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range (ETB) */}
              <div className="border-b border-slate-100 pb-4 mb-4">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  {t.browse.priceRange}
                </label>
                <form onSubmit={handlePriceApply} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2.5 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2.5 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 py-1.5 text-xs font-bold text-white transition-colors"
                  >
                    Apply Price
                  </button>
                </form>
              </div>

              {/* Condition */}
              <div className="border-b border-slate-100 pb-4 mb-4">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  {t.browse.condition}
                </label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="condition_desk"
                      checked={!currentCondition}
                      onChange={() => updateUrl({ condition: null })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>All Conditions</span>
                  </label>
                  {CONDITIONS.map((cond) => (
                    <label
                      key={cond.value}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="condition_desk"
                        checked={currentCondition === cond.value}
                        onChange={() => updateUrl({ condition: cond.value })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{cond.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Negotiable Toggle */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentNegotiable}
                    onChange={(e) => updateUrl({ is_negotiable: e.target.checked ? 'true' : null })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>{t.browse.negotiableOnly}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Listings Grid & Pagination */}
          <div className="col-span-1 md:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse space-y-3"
                  >
                    <div className="aspect-[4/3] bg-slate-200 rounded-xl" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-5 bg-slate-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {listings.map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-200 pt-6">
                    <button
                      onClick={() => updateUrl({ page: Math.max(1, currentPage - 1) })}
                      disabled={currentPage <= 1}
                      className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>{t.browse.prev}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => updateUrl({ page: pageNum })}
                            className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                              currentPage === pageNum
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => updateUrl({ page: Math.min(totalPages, currentPage + 1) })}
                      disabled={currentPage >= totalPages}
                      className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{t.browse.next}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-lg mx-auto shadow-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto mb-4">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{t.browse.noResultsTitle}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {t.browse.noResultsSub}
                </p>
                <button
                  onClick={resetAllFilters}
                  className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                >
                  {t.browse.resetFilters}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Over Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white p-5 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600" />
                <span>Filter Classifieds</span>
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category selection */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-800 uppercase block mb-1.5">
                Category
              </label>
              <select
                value={currentCategory}
                onChange={(e) => updateUrl({ category: e.target.value || null })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcity selection */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-800 uppercase block mb-1.5">
                Subcity / Area
              </label>
              <select
                value={currentArea}
                onChange={(e) => updateUrl({ area: e.target.value || null })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs"
              >
                <option value="">All Addis Ababa Areas</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Price inputs */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-800 uppercase block mb-1.5">
                Price (ETB)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Min ETB"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-2.5 text-xs"
                />
                <input
                  type="number"
                  placeholder="Max ETB"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-2.5 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handlePriceApply}
                className="w-full rounded-lg bg-slate-900 text-white text-xs font-bold py-2"
              >
                Apply Price
              </button>
            </div>

            {/* Condition selection */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-800 uppercase block mb-1.5">
                Condition
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="radio"
                    name="condition_mob"
                    checked={!currentCondition}
                    onChange={() => updateUrl({ condition: null })}
                  />
                  <span>All Conditions</span>
                </label>
                {CONDITIONS.map((cond) => (
                  <label key={cond.value} className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="radio"
                      name="condition_mob"
                      checked={currentCondition === cond.value}
                      onChange={() => updateUrl({ condition: cond.value })}
                    />
                    <span>{cond.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Negotiable */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={currentNegotiable}
                  onChange={(e) => updateUrl({ is_negotiable: e.target.checked ? 'true' : null })}
                  className="rounded text-emerald-600"
                />
                <span>Negotiable prices only</span>
              </label>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  resetAllFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
