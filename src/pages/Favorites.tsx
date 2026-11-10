import React, { useEffect, useState } from 'react';
import { Heart, Search, ArrowRight, Tag } from 'lucide-react';
import { Listing } from '../types';
import { apiClient } from '../api/client';
import { ListingCard } from '../components/ListingCard';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ErrorMessage } from '../components/ErrorMessage';

export const Favorites: React.FC = () => {
  const { navigate, setMeta } = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setMeta(
      'Saved Ads - Cone Addis Ababa',
      'View and manage your saved classifieds and favorite listings in Addis Ababa, Ethiopia.'
    );
  }, []);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin?redirect=/my/favorites');
    }
  }, [isAuthenticated, authLoading]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getMyFavorites(1, 50);
      setListings(res.listings);
      setTotalCount(res.total);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated]);

  const handleFavoriteToggle = (id: string, isFav: boolean) => {
    if (!isFav) {
      // Removing favorite removes the card from this page
      setListings((prev) => prev.filter((item) => item.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    }
  };

  if (authLoading || (!isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading your favorites...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Banner */}
      <div className="border-b border-slate-200 bg-white py-6 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Heart className="h-4 w-4 fill-current" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.favorites.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t.favorites.subtitle}
            </p>
          </div>

          {!isLoading && listings.length > 0 && (
            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {totalCount} {totalCount === 1 ? 'ad' : 'ads'} saved
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-6" />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 animate-pulse space-y-2 sm:space-y-3"
              >
                <div className="aspect-[4/3] bg-slate-200 rounded-lg sm:rounded-xl" />
                <div className="h-3 sm:h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-4 sm:h-5 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        ) : (
          /* Empty Favorites State */
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-md mx-auto shadow-xs my-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mx-auto mb-4">
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t.favorites.emptyTitle}</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {t.favorites.emptySub}
            </p>
            <button
              onClick={() => navigate('/browse')}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition-colors shadow-xs"
            >
              <span>{t.favorites.browseAds}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
