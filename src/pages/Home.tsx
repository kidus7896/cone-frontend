import React, { useEffect, useState } from 'react';
import {
  Car,
  Home as HomeIcon,
  Smartphone,
  Armchair,
  Shirt,
  Briefcase,
  Cog,
  ArrowRight,
} from 'lucide-react';
import { Listing, Category } from '../types';
import { apiClient } from '../api/client';
import { ListingCard } from '../components/ListingCard';
import { useRouter } from '../context/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { ErrorMessage } from '../components/ErrorMessage';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  vehicles: <Car className="h-3.5 w-3.5" />,
  real_estate: <HomeIcon className="h-3.5 w-3.5" />,
  electronics: <Smartphone className="h-3.5 w-3.5" />,
  home_furniture: <Armchair className="h-3.5 w-3.5" />,
  fashion_beauty: <Shirt className="h-3.5 w-3.5" />,
  jobs: <Briefcase className="h-3.5 w-3.5" />,
  commercial_machinery: <Cog className="h-3.5 w-3.5" />,
};

export const Home: React.FC = () => {
  const { navigate, setMeta } = useRouter();
  const { t } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [newestListings, setNewestListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setMeta(
      'Cone - Addis Ababa Classifieds Marketplace',
      'The trusted community classifieds marketplace for Addis Ababa, Ethiopia. Buy, sell, and discover cars, apartments, electronics, jobs, and services locally.'
    );

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [cats, listingsRes] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getListings({ limit: 8, sort: 'newest' }),
        ]);

        setCategories(cats);
        setNewestListings(listingsRes.listings);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-16">
      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        {/* Global Error Banner if any */}
        <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-6" />

        {/* Categories Single Row */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t.home.exploreCategories}
            </h2>
            <button
              onClick={() => navigate('/browse')}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{t.home.viewAllListings}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-stretch gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => navigate(`/browse?category=${cat.id}`)}
                className="group flex-1 min-w-[76px] sm:min-w-0 flex flex-col items-center justify-center py-2 px-1 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-500 hover:shadow-2xs transition-all cursor-pointer select-none"
                title={cat.name}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-1">
                  {CATEGORY_ICONS[cat.id] || <TagIcon />}
                </div>
                <span className="text-[10px] font-semibold text-slate-800 group-hover:text-emerald-700 text-center truncate max-w-full px-1">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Explore Listings Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Explore
                </h2>
              </div>
            </div>

            <button
              onClick={() => navigate('/browse?sort=newest')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>See more</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {[...Array(8)].map((_, i) => (
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
          ) : newestListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {newestListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-sm font-semibold text-slate-600">No listings available right now.</p>
            </div>
          )}
        </section>

        {/* Addis Ababa Community Callout - Hidden on mobile and tablet views */}
        <section className="hidden lg:flex rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="max-w-xl">
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">
              Selling something in Addis?
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Post your ad for free in under 2 minutes
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Reach thousands of buyers directly in Bole, Kazanchis, Piassa, Sarbet, and across Addis Ababa. Direct phone & Telegram contacts.
            </p>
          </div>
          <button
            onClick={() => navigate('/signin?redirect=/post')}
            className="whitespace-nowrap rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3.5 text-xs font-bold text-slate-950 transition-all shadow-md active:scale-95"
          >
            Post a Free Listing Now
          </button>
        </section>
      </div>
    </div>
  );
};

function TagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V5a2 2 0 012-2z" />
    </svg>
  );
}
