import React, { useState } from 'react';
import { Heart, MapPin, Clock, Tag } from 'lucide-react';
import { Listing } from '../types';
import { apiClient, getAuthToken } from '../api/client';
import { useRouter } from '../context/RouterContext';

interface ListingCardProps {
  listing: Listing;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onFavoriteToggle }) => {
  const { navigate, path } = useRouter();
  const [isFavorited, setIsFavorited] = useState(!!listing.is_favorited);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking favorite button, don't navigate
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/listing/${listing.id}`);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingFav) return;

    if (!getAuthToken()) {
      navigate(`/signin?redirect=${encodeURIComponent(path || `/listing/${listing.id}`)}`);
      return;
    }

    setIsTogglingFav(true);
    const nextState = !isFavorited;
    setIsFavorited(nextState);

    try {
      await apiClient.toggleFavorite(listing.id);
      if (onFavoriteToggle) {
        onFavoriteToggle(listing.id, nextState);
      }
    } catch (err: any) {
      // Revert if failed
      setIsFavorited(!nextState);
      if (err?.code === 'UNAUTHENTICATED') {
        navigate(`/signin?redirect=${encodeURIComponent(path || `/listing/${listing.id}`)}`);
      }
    } finally {
      setIsTogglingFav(false);
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case 'new':
        return 'Brand New';
      case 'like_new':
        return 'Like New';
      case 'used_good':
        return 'Good';
      case 'used_fair':
        return 'Fair';
      case 'refurbished':
        return 'Refurbished';
      default:
        return cond;
    }
  };

  // Human readable time ago
  const getTimeAgo = (dateStr: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      const days = Math.floor(diffSec / 86400);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const primaryImage = listing.images && listing.images.length > 0
    ? listing.images[0]
    : 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onClick={handleCardClick}
      className="group flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg cursor-pointer"
    >
      {/* Image Thumbnail with Overlay Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={primaryImage}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Condition Tag */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1">
          <span className="rounded bg-slate-900/80 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-white backdrop-blur-xs">
            {getConditionLabel(listing.condition)}
          </span>
          {listing.is_negotiable && (
            <span className="hidden xs:inline-block rounded bg-emerald-600/90 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-white backdrop-blur-xs">
              Negotiable
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full backdrop-blur-md transition-all ${
            isFavorited
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-white/85 text-slate-700 hover:bg-white hover:text-rose-500'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Photos count */}
        {listing.images && listing.images.length > 1 && (
          <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 rounded bg-black/60 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[11px] font-medium text-white backdrop-blur-xs">
            1/{listing.images.length}
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        {/* Category & Time */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-1.5">
          <span className="font-semibold text-emerald-700 truncate max-w-[62%]">
            {listing.category_name}
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] text-slate-400">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {getTimeAgo(listing.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
          {listing.title}
        </h3>

        {/* Price in ETB */}
        <div className="mt-1.5 sm:mt-2.5 flex items-baseline gap-1">
          <span className="text-sm sm:text-lg font-black text-slate-950">
            {formatPrice(listing.price)}
          </span>
          <span className="text-[10px] sm:text-xs font-bold text-emerald-700">ETB</span>
        </div>

        {/* Location (Addis Ababa Area) */}
        <div className="mt-auto pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-1 truncate text-slate-600 font-medium">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 text-slate-400" />
            <span className="truncate">{listing.area}</span>
          </div>
          {listing.seller?.verified && (
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded flex-shrink-0">
              Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
