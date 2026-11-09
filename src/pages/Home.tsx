import React, { useEffect, useState } from 'react';
import {
  Search,
  MapPin,
  Car,
  Home as HomeIcon,
  Smartphone,
  Armchair,
  Shirt,
  Briefcase,
  Cog,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Listing, Category } from '../types';
import { apiClient, ADDIS_ABABA_AREAS } from '../api/client';
import { ListingCard } from '../components/ListingCard';
import { useRouter } from '../context/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { ErrorMessage } from '../components/ErrorMessage';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  vehicles: <Car className="h-6 w-6" />,
  real_estate: <HomeIcon className="h-6 w-6" />,
  electronics: <Smartphone className="h-6 w-6" />,
  home_furniture: <Armchair className="h-6 w-6" />,
  fashion_beauty: <Shirt className="h-6 w-6" />,
  jobs: <Briefcase className="h-6 w-6" />,
  commercial_machinery: <Cog className="h-6 w-6" />,
};

const POPULAR_SEARCH_TAGS = [
  'Toyota Vitz',
  'Bole Apartment',
  'iPhone 15 Pro',
  'Wanza Wood Table',
  'Hyundai Tucson',
  'Piassa Habesha Kemis',
];

export const Home: React.FC = () => {
  const { navigate, setMeta } = useRouter();
  const { t } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [newestListings, setNewestListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [heroSearch, setHeroSearch] = useState<string>('');

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

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/browse?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-8 pb-14 px-4 sm:px-6">
        {/* Subtle patterned background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Addis Ababa’s Direct Marketplace • No Middlemen</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            {t.home.heroHeading}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-300 font-normal">
            {t.home.heroSubheading}
          </p>

          {/* Hero Search Box */}
          <form
            onSubmit={handleHeroSearch}
            className="mx-auto mt-7 max-w-2xl flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/15 shadow-2xl"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="What are you looking for in Addis Ababa?"
                className="w-full rounded-xl bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Search</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Popular Search Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{t.home.popularSearches}</span>
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/browse?q=${encodeURIComponent(tag)}`)}
                className="rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-0.5 text-slate-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 -mt-6">
        {/* Addis Ababa Subcity Fast Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-10">
          <div className="flex items-center gap-2 mb-2.5">
            <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {t.home.popularAreas}
            </h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {ADDIS_ABABA_AREAS.map((area) => (
              <button
                key={area}
                onClick={() => navigate(`/browse?area=${encodeURIComponent(area)}`)}
                className="whitespace-nowrap rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Global Error Banner if any */}
        <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-6" />

        {/* Categories Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                {t.home.exploreCategories}
              </h2>
              <p className="text-xs text-slate-500">
                Browse direct listings across Addis Ababa
              </p>
            </div>
            <button
              onClick={() => navigate('/browse')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{t.home.viewAllListings}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => navigate(`/browse?category=${cat.id}`)}
                className="group flex flex-col items-center text-center p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-2.5 shadow-2xs">
                  {CATEGORY_ICONS[cat.id] || <TagIcon className="h-6 w-6" />}
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {cat.itemCount}+ ads
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Newest in Addis Ababa Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {t.home.newestListings}
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Recently posted by verified residents & businesses in Addis
              </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
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
          ) : newestListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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

        {/* Addis Ababa Community Callout */}
        <section className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
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
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V5a2 2 0 012-2z" />
    </svg>
  );
}
