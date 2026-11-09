import React, { useState, useEffect } from 'react';
import {
  ListFilter,
  PlusCircle,
  Edit,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Eye,
  Clock,
  Trash2,
  ExternalLink,
  Tag,
  MapPin,
} from 'lucide-react';
import { Listing, ListingStatus } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { ErrorMessage } from '../components/ErrorMessage';

type TabStatus =
  | 'all'
  | 'active'
  | 'waiting_for_review'
  | 'rejected'
  | 'paused'
  | 'sold'
  | 'draft'
  | 'expired';

const TABS: { id: TabStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'waiting_for_review', label: 'Waiting for review' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'paused', label: 'Paused' },
  { id: 'sold', label: 'Sold' },
  { id: 'draft', label: 'Draft' },
  { id: 'expired', label: 'Expired' },
];

export const MyListings: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { navigate, queryParams, setMeta } = useRouter();

  const currentTab = (queryParams.get('status') as TabStatus) || 'all';

  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Status update in progress
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setMeta('My Classifieds Listings - Cone Addis Ababa', 'Manage, edit, pause, and renew your ads in Addis Ababa.');

    if (!isAuthLoading && !isAuthenticated) {
      navigate('/signin?redirect=/my/listings');
    }
  }, [isAuthLoading, isAuthenticated]);

  const fetchMyListings = async (tab: TabStatus) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getMyListings(tab === 'all' ? undefined : tab);
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
      fetchMyListings(currentTab);
    }
  }, [currentTab, isAuthenticated]);

  const handleTabChange = (tab: TabStatus) => {
    if (tab === 'all') {
      navigate('/my/listings');
    } else {
      navigate(`/my/listings?status=${tab}`);
    }
  };

  // Status Action Handlers (POST /listings/{id}/status)
  const handleStatusChange = async (listingId: string, action: 'pause' | 'resume' | 'sold' | 'renew') => {
    try {
      setUpdatingId(listingId);
      setError(null);
      setActionSuccessMessage(null);

      await apiClient.updateListingStatus(listingId, action);
      setActionSuccessMessage(`Listing status updated successfully.`);

      // Refresh listings
      await fetchMyListings(currentTab);

      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Active
          </span>
        );
      case 'waiting_for_review':
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-xs font-bold">
            <Clock className="h-3 w-3 text-amber-700" />
            Waiting for review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 text-rose-800 px-2 py-0.5 text-xs font-bold">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 text-slate-800 px-2 py-0.5 text-xs font-bold">
            <PauseCircle className="h-3 w-3 text-slate-600" />
            Paused
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 text-indigo-800 px-2 py-0.5 text-xs font-bold">
            <CheckCircle2 className="h-3 w-3 text-indigo-600" />
            Marked as Sold
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-bold">
            Draft
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-xs font-bold">
            Expired
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-bold capitalize">
            {status}
          </span>
        );
    }
  };

  const isEditable = (status: ListingStatus) => {
    return status === 'draft' || status === 'rejected' || status === 'paused' || status === 'active';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Banner */}
      <div className="border-b border-slate-200 bg-white py-6 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Classifieds
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage, edit, pause, or renew your listings across Addis Ababa.
            </p>
          </div>

          <button
            onClick={() => navigate('/post')}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all self-start sm:self-auto"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Post New Listing</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Error / Success Notices */}
        <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-4" />

        {actionSuccessMessage && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 mb-6 no-scrollbar">
          {TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Listings Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse flex gap-4"
              >
                <div className="h-28 w-36 bg-slate-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-5 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="space-y-4">
            {listings.map((item) => {
              const coverPhoto = item.images && item.images.length > 0
                ? item.images[0]
                : 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=400&q=80';

              const isBusy = updatingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Cover photo */}
                    <div className="relative h-40 sm:h-32 sm:w-44 w-full flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={coverPhoto}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                            {item.category_name} {item.subcategory ? `• ${item.subcategory}` : ''}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ID: {item.id}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mt-0.5 truncate">
                          {item.title}
                        </h3>

                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-slate-950">
                            {new Intl.NumberFormat('en-US').format(item.price)}
                          </span>
                          <span className="text-xs font-bold text-emerald-700">ETB</span>
                          {item.is_negotiable && (
                            <span className="text-[10px] text-slate-500 font-medium ml-1">
                              (Negotiable)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{item.area}, Addis Ababa</span>
                        </div>

                        {/* Rejection Reason Box */}
                        {item.status === 'rejected' && item.rejection_reason && (
                          <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Moderator Rejection Reason: </span>
                                {item.rejection_reason}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        {/* View live if active */}
                        {item.status === 'active' && (
                          <button
                            onClick={() => navigate(`/listing/${item.id}`)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>View Ad</span>
                          </button>
                        )}

                        {/* Edit Button */}
                        {isEditable(item.status) && (
                          <button
                            onClick={() => navigate(`/post?id=${item.id}`)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                            <span>Edit Details</span>
                          </button>
                        )}

                        {/* Pause button */}
                        {item.status === 'active' && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleStatusChange(item.id, 'pause')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            <PauseCircle className="h-3.5 w-3.5 text-slate-500" />
                            <span>Pause</span>
                          </button>
                        )}

                        {/* Resume button */}
                        {item.status === 'paused' && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleStatusChange(item.id, 'resume')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 text-xs font-bold hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Resume Ad</span>
                          </button>
                        )}

                        {/* Mark as sold */}
                        {item.status === 'active' && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleStatusChange(item.id, 'sold')}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Mark Sold</span>
                          </button>
                        )}

                        {/* Renew button (for sold or expired) */}
                        {(item.status === 'sold' || item.status === 'expired') && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleStatusChange(item.id, 'renew')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Renew Listing</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty tab state */
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="h-12 w-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Tag className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No listings in "{TABS.find((t) => t.id === currentTab)?.label}"
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              You don't have any ads matching this status tab right now.
            </p>
            <button
              onClick={() => navigate('/post')}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs"
            >
              Post an Ad Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
