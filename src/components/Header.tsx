import React, { useState } from 'react';
import {
  Search,
  MapPin,
  PlusCircle,
  User as UserIcon,
  Globe,
  Heart,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Header: React.FC = () => {
  const { navigate, queryParams } = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState(queryParams.get('q') || '');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  const handlePostClick = () => {
    if (!isAuthenticated) {
      navigate('/signin?redirect=/post');
    } else {
      navigate('/post');
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md"
      style={{ position: 'fixed', top: 0, left: 0, right: 0 }}
    >
      {/* Top micro-bar for city & announcement */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-white font-semibold">Addis Ababa, Ethiopia</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">Direct community classifieds</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 text-[11px]">
              <Globe className="h-3 w-3 text-slate-400" />
              <button
                onClick={() => setLanguage('en')}
                className={`font-medium transition-colors ${
                  language === 'en' ? 'text-white font-bold underline' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <span className="text-slate-600">/</span>
              <button
                onClick={() => setLanguage('am')}
                className={`font-medium transition-colors ${
                  language === 'am' ? 'text-emerald-400 font-bold underline' : 'text-slate-400 hover:text-white'
                }`}
              >
                አማርኛ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white font-extrabold text-2xl shadow-sm transition-transform group-hover:scale-105">
            ▲
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight text-slate-950 font-sans">
                CONE
              </span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase -mt-1 hidden sm:block">
              Addis Ababa
            </span>
          </div>
        </div>

        {/* Search Bar (Desktop & Tablet) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-xl items-center relative"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className="w-full rounded-full border border-slate-300/90 bg-slate-50/80 py-2.5 pl-10 pr-24 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-emerald-500/20 transition-all shadow-2xs"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
            >
              Search
            </button>
          </div>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Browse Link */}
          <button
            onClick={() => navigate('/browse')}
            className="hidden sm:inline-flex items-center text-sm font-semibold text-slate-700 hover:text-emerald-700 px-2 py-1 rounded-lg"
          >
            {t.nav.browse}
          </button>

          {/* User Sign In / Profile Dropdown */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-3 text-xs font-semibold text-slate-800 hover:border-slate-300 shadow-2xs"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                )}
                <span className="hidden sm:inline-block max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-20">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {user.name || 'Cone User'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {user.phone}
                      </div>
                      {user.role !== 'user' && (
                        <div className="mt-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                          {user.role.replace('_', ' ')}
                        </div>
                      )}
                    </div>

                    {(user.role === 'moderator' || user.role === 'super_admin') && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-900 bg-slate-50/70 hover:bg-emerald-50 flex items-center justify-between border-b border-slate-100"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{t.nav.admin}</span>
                        </span>
                        <span className="text-[10px] bg-slate-900 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase">
                          {user.role === 'super_admin' ? 'Super' : 'Mod'}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/my/listings');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>My Classifieds</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        Manage
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/my/favorites');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                      <span>Saved Ads (Favorites)</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/account');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/post');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Post New Ad
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/browse');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Browse Ads
                    </button>

                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/signin')}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <UserIcon className="h-3.5 w-3.5 text-slate-500" />
              <span>{t.nav.signIn}</span>
            </button>
          )}

          {/* Post Listing CTA Button */}
          <button
            onClick={handlePostClick}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t.nav.post}</span>
            <span className="sm:hidden">Post Ad</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Input Bar */}
      <div className="px-4 pb-2.5 md:hidden">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.nav.searchPlaceholder}
            className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-20 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <button
            type="submit"
            className="absolute right-1 top-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
          >
            Search
          </button>
        </form>
      </div>
    </header>
  );
};
