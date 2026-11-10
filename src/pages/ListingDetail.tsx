import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Heart,
  Share2,
  Flag,
  Phone,
  Send,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Eye,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Listing, ReportPayload } from '../types';
import { apiClient } from '../api/client';
import { useRouter } from '../context/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { ErrorMessage } from '../components/ErrorMessage';
import { ListingCard } from '../components/ListingCard';

interface ListingDetailProps {
  id: string;
}

export const ListingDetail: React.FC<ListingDetailProps> = ({ id }) => {
  const { navigate, setMeta } = useRouter();
  const { t } = useLanguage();

  const [listing, setListing] = useState<Listing | null>(null);
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Phone reveal state
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [isRevealingPhone, setIsRevealingPhone] = useState<boolean>(false);
  const [phoneCopied, setPhoneCopied] = useState<boolean>(false);

  // Favorite & Share state
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<boolean>(false);

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<ReportPayload['reason']>('spam');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);
  const [reportError, setReportError] = useState<any>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setActiveImageIndex(0);

        const data = await apiClient.getListingById(id);
        setListing(data);
        setIsFavorited(!!data.is_favorited);

        if (data.seller.phone_revealed) {
          setRevealedPhone(data.seller.phone_revealed);
        } else {
          setRevealedPhone(null);
        }

        // Set dynamic meta tags
        setMeta(
          `${data.title} - ${new Intl.NumberFormat('en-US').format(data.price)} ETB | Cone Addis Ababa`,
          `${data.category_name} in ${data.area}, Addis Ababa. ${data.description.substring(0, 150)}...`
        );

        // Fetch related listings
        try {
          const relatedRes = await apiClient.getListings({
            category: data.category_id,
            limit: 4,
          });
          setRelatedListings(relatedRes.listings.filter((l) => l.id !== data.id));
        } catch {
          // ignore related failures
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  // Phone Reveal Action
  const handleRevealPhone = async () => {
    if (!listing || isRevealingPhone) return;

    try {
      setIsRevealingPhone(true);
      setError(null);
      const res = await apiClient.revealPhone(listing.id);
      setRevealedPhone(res.phone);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsRevealingPhone(false);
    }
  };

  const handleCopyPhone = () => {
    if (!revealedPhone) return;
    navigator.clipboard.writeText(revealedPhone);
    setPhoneCopied(true);
    setTimeout(() => setPhoneCopied(false), 2000);
  };

  const handleToggleFavorite = async () => {
    if (!listing || isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    const nextState = !isFavorited;
    setIsFavorited(nextState);

    try {
      await apiClient.toggleFavorite(listing.id);
    } catch {
      setIsFavorited(!nextState);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleShare = () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: listing?.title || 'Cone Listing',
        url: currentUrl,
      }).catch(() => {
        // fallback to clipboard
        navigator.clipboard.writeText(currentUrl);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      });
    } else {
      navigator.clipboard.writeText(currentUrl);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    try {
      setIsSubmittingReport(true);
      setReportError(null);
      const res = await apiClient.reportListing(listing.id, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });

      setReportSuccessMessage(res.message);
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccessMessage(null);
        setReportDetails('');
      }, 2000);
    } catch (err: any) {
      setReportError(err);
    } finally {
      setIsSubmittingReport(false);
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
        return 'Used - Like New';
      case 'used_good':
        return 'Used - Good';
      case 'used_fair':
        return 'Used - Fair';
      case 'refurbished':
        return 'Refurbished';
      default:
        return cond;
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 aspect-[4/3] bg-slate-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded" />
            <div className="h-6 bg-slate-200 rounded w-1/2" />
            <div className="h-12 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ErrorMessage error={error || 'Listing not found'} className="mb-6" />
        <button
          onClick={() => navigate('/browse')}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
        >
          {t.listing.back}
        </button>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-20 right-4 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-fade-in flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{t.listing.linkCopied}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="border-b border-slate-200/80 bg-white py-3 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : navigate('/browse')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t.listing.back}</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.listing.share}</span>
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-semibold transition-colors ${
                isFavorited
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorited ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">
                {isFavorited ? t.listing.favorited : t.listing.favorite}
              </span>
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              title="Report ad"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Detail Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Gallery & Description (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Gallery Box */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              {/* Main Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900 group">
                <img
                  src={images[activeImageIndex]}
                  alt={listing.title}
                  className="h-full w-full object-contain cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                />

                {/* Lightbox zoom icon */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute bottom-3 right-3 rounded-lg bg-black/60 p-2 text-white hover:bg-black/80 transition-colors backdrop-blur-xs"
                  title="Fullscreen image"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>

                {/* Image Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/75 transition-colors backdrop-blur-xs"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/75 transition-colors backdrop-blur-xs"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Counter */}
                <div className="absolute top-3 left-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-xs">
                  {activeImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnails Row */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3 border-t border-slate-100 bg-slate-50/50">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title, Price, Location for Mobile/Tablet */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  {listing.category_name}
                </span>
                {listing.subcategory && (
                  <span className="text-slate-500 font-medium">• {listing.subcategory}</span>
                )}
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{getConditionLabel(listing.condition)}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                {listing.title}
              </h1>

              {/* Price & Badges */}
              <div className="mt-4 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-black text-slate-950">
                  {formatPrice(listing.price)}
                </span>
                <span className="text-sm font-black text-emerald-700">ETB</span>

                {listing.is_negotiable ? (
                  <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-bold">
                    {t.listing.negotiable}
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium">
                    {t.listing.fixed}
                  </span>
                )}
              </div>

              {/* Location Badge */}
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>
                  {listing.area}, Addis Ababa
                  {listing.landmark ? ` (${listing.landmark})` : ''}
                </span>
              </div>
            </div>

            {/* Specifications / Attributes Table */}
            {listing.attributes && Object.keys(listing.attributes).length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  {t.listing.specifications}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(listing.attributes).map(([key, val]) => (
                    <div key={key} className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900 truncate">
                        {String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Description */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                {t.listing.description}
              </h2>
              <div className="prose prose-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {listing.description}
              </div>

              {/* Meta stats */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Posted: {new Date(listing.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{listing.views_count} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  <span>{listing.favorites_count} saves</span>
                </div>
                <div>Listing ID: {listing.id}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Seller Card & Direct Contact Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Contact Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 sticky top-24">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Direct Seller Contact
              </h3>

              {/* Reveal Phone Button / Revealed Phone Display */}
              {revealedPhone ? (
                <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 p-4 animate-fade-in space-y-3">
                  <div className="text-xs font-semibold text-emerald-800 flex items-center justify-between">
                    <span>Verified Seller Phone:</span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-950 font-bold px-1.5 py-0.5 rounded">
                      REVEALED
                    </span>
                  </div>

                  <div className="font-mono text-xl font-black text-slate-950 tracking-wider">
                    {revealedPhone}
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`tel:${revealedPhone.replace(/\s+/g, '')}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 transition-colors shadow-xs"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{t.listing.callNow}</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                      title="Copy phone number"
                    >
                      {phoneCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRevealPhone}
                  disabled={isRevealingPhone}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-3.5 px-4 text-sm font-bold text-white transition-all shadow-md disabled:opacity-60"
                >
                  <Phone className="h-4 w-4" />
                  <span>
                    {isRevealingPhone ? 'Revealing number...' : t.listing.showPhone}
                  </span>
                  <span className="font-mono text-xs opacity-75 font-normal ml-1">
                    {listing.seller.phone_masked}
                  </span>
                </button>
              )}

              {/* Optional Telegram Direct Chat */}
              {listing.seller.telegram_username && (
                <a
                  href={`https://t.me/${listing.seller.telegram_username.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] hover:bg-[#1e8ec3] active:scale-95 py-3 px-4 text-xs font-bold text-white transition-all shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{t.listing.messageTelegram} (@{listing.seller.telegram_username.replace('@', '')})</span>
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              )}

              {/* Optional Email Link */}
              {listing.seller.email && (
                <a
                  href={`mailto:${listing.seller.email}?subject=Inquiry on Cone: ${encodeURIComponent(listing.title)}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 py-2.5 px-4 text-xs font-bold text-slate-700 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{t.listing.sendEmail}</span>
                </a>
              )}

              {/* Seller Information Profile Card */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  {listing.seller.avatar_url ? (
                    <img
                      src={listing.seller.avatar_url}
                      alt={listing.seller.name}
                      className="h-12 w-12 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-base">
                      {listing.seller.name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {listing.seller.name}
                      </h4>
                      {listing.seller.verified && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {t.listing.memberSince} {listing.seller.joined_at}
                    </div>
                    {listing.seller.total_listings && (
                      <div className="text-[11px] text-slate-500 font-medium">
                        {listing.seller.total_listings} active ads
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/seller/${listing.seller.id}`)}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 text-xs font-bold text-slate-700 transition-colors text-center block"
                >
                  {t.listing.viewSellerProfile}
                </button>
              </div>

              {/* Local Safety Warning Box */}
              <div className="rounded-xl bg-amber-50/80 border border-amber-200/70 p-3 text-xs text-amber-950">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Addis Safety Tip:</strong> {t.listing.safetyWarning}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Listings Section */}
        {relatedListings.length > 0 && (
          <div className="mt-14 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Similar Ads in {listing.category_name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              {relatedListings.map((rel) => (
                <ListingCard key={rel.id} listing={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <img
            src={images[activeImageIndex]}
            alt={listing.title}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/40 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() =>
                  setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/40 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900">{t.report.title}</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">{t.report.sub}</p>

            <ErrorMessage error={reportError} onDismiss={() => setReportError(null)} className="mb-4" />

            {reportSuccessMessage ? (
              <div className="rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 text-center">
                {reportSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    {t.report.reasonLabel}
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-800 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="spam">{t.report.reasons.spam}</option>
                    <option value="fraud">{t.report.reasons.fraud}</option>
                    <option value="inappropriate">{t.report.reasons.inappropriate}</option>
                    <option value="duplicate">{t.report.reasons.duplicate}</option>
                    <option value="wrong_category">{t.report.reasons.wrong_category}</option>
                    <option value="sold">{t.report.reasons.sold}</option>
                    <option value="other">{t.report.reasons.other}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    {t.report.detailsLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder={t.report.detailsPlaceholder}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-800 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {t.report.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-bold text-white transition-colors disabled:opacity-60"
                  >
                    {isSubmittingReport ? t.report.submitting : t.report.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
