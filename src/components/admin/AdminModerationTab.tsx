import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Trash2,
  MapPin,
  User,
  Calendar,
  Eye,
  X,
  Tag,
  Phone,
  Mail,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminListingItem } from '../../types';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ErrorMessage } from '../ErrorMessage';

export const AdminModerationTab: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<AdminListingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected listing modal state
  const [selectedListing, setSelectedListing] = useState<AdminListingItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [moderationError, setModerationError] = useState<any>(null);
  const [reasonText, setReasonText] = useState('');
  const [pendingAction, setPendingAction] = useState<'reject' | 'remove' | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const pageSize = 20;

  const loadQueue = async (targetPage = page, targetStatus = statusFilter) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getAdminListings({
        status: targetStatus,
        page: targetPage,
        pageSize,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue(page, statusFilter);
  }, [page, statusFilter]);

  const openListingReview = async (item: AdminListingItem) => {
    setSelectedListing(item);
    setModerationError(null);
    setReasonText('');
    setPendingAction(null);

    if (!item.description) {
      try {
        setIsLoadingDetail(true);
        const full = await apiClient.getListingById(item.id);
        setSelectedListing({
          ...full,
          submitted_at: item.submitted_at,
        });
      } catch {
        // Keep summary fields if detail endpoint unavailable
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  const handleModerate = async (action: 'approve' | 'reject' | 'remove') => {
    if (!selectedListing) return;
    setModerationError(null);

    if ((action === 'reject' || action === 'remove') && !reasonText.trim()) {
      setModerationError({
        code: 'VALIDATION_ERROR',
        message: t.admin.moderation.reasonRequired,
        fields: { reason: t.admin.moderation.reasonRequired },
      });
      return;
    }

    try {
      setIsSubmittingAction(true);
      await apiClient.moderateAdminListing(selectedListing.id, {
        action,
        reason: reasonText.trim() || undefined,
      });

      const msg =
        action === 'approve'
          ? t.admin.moderation.approvedSuccess
          : action === 'reject'
          ? t.admin.moderation.rejectedSuccess
          : t.admin.moderation.removedSuccess;
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);

      setSelectedListing(null);
      setPendingAction(null);
      setReasonText('');
      await loadQueue(page, statusFilter);
    } catch (err: any) {
      setModerationError(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t.admin.moderation.heading}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.admin.moderation.sub}</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            {t.admin.moderation.statusFilter}:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            <option value="pending_review">Pending Review</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
            <option value="paused">Paused</option>
            <option value="sold">Sold</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse flex gap-4"
            >
              <div className="h-20 w-24 rounded-xl bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-slate-200 rounded" />
                <div className="h-3 w-1/3 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800">{t.admin.moderation.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => openListingReview(item)}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Cover Photo */}
              <div className="h-40 sm:h-20 sm:w-28 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/70">
                {item.images[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                    No Photo
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                    {item.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {item.price.toLocaleString()} ETB
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">
                  {item.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    {item.area || 'Addis Ababa'}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    {item.seller.name || 'Cone Seller'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {t.admin.moderation.submittedAt}:{' '}
                    {new Date(item.submitted_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white flex-shrink-0"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t.admin.moderation.inspect}</span>
              </button>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <span className="text-xs font-semibold text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full Listing Review Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="min-w-0 pr-4">
                <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                  {selectedListing.status.replace('_', ' ')}
                </span>
                <h3 className="text-base font-black text-slate-900 truncate mt-1">
                  {selectedListing.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <ErrorMessage
                error={moderationError}
                onDismiss={() => setModerationError(null)}
              />

              {isLoadingDetail ? (
                <div className="text-xs text-slate-500 py-4 text-center">Loading full details...</div>
              ) : (
                <>
                  {/* Photos */}
                  {selectedListing.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedListing.images.map((img, i) => (
                        <div
                          key={i}
                          className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
                        >
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price & Meta */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs">
                    <div>
                      <div className="text-slate-400 font-semibold">Price</div>
                      <div className="font-black text-emerald-700 mt-0.5">
                        {selectedListing.price.toLocaleString()} ETB
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-semibold">Category</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {selectedListing.category_name}
                        {selectedListing.subcategory ? ` / ${selectedListing.subcategory}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-semibold">Area</div>
                      <div className="font-bold text-slate-800 mt-0.5">{selectedListing.area}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-semibold">Condition</div>
                      <div className="font-bold text-slate-800 mt-0.5 uppercase">
                        {selectedListing.condition.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Description
                    </h4>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-white rounded-xl border border-slate-200 p-3">
                      {selectedListing.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Attributes */}
                  {selectedListing.attributes && Object.keys(selectedListing.attributes).length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Specifications
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(selectedListing.attributes).map(([k, v]) => (
                          <div
                            key={k}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-200/70"
                          >
                            <span className="text-slate-500 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {k}
                            </span>
                            <span className="font-bold text-slate-900">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seller Info */}
                  <div className="rounded-xl border border-slate-200 p-3.5 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900">
                      Seller: {selectedListing.seller.name || 'Cone Seller'} (ID: {selectedListing.seller.id})
                    </div>
                    <div className="flex flex-wrap gap-4 text-slate-600">
                      {selectedListing.seller.phone_revealed && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3" /> {selectedListing.seller.phone_revealed}
                        </span>
                      )}
                      {selectedListing.seller.telegram_username && (
                        <span className="flex items-center gap-1">
                          <Send className="h-3 w-3" /> @{selectedListing.seller.telegram_username}
                        </span>
                      )}
                      {selectedListing.seller.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {selectedListing.seller.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reason box (shown when Reject or Remove is selected, or always available) */}
                  {pendingAction && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                      <label className="text-xs font-bold text-rose-900 block">
                        {t.admin.moderation.reasonLabel} <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={reasonText}
                        onChange={(e) => {
                          setReasonText(e.target.value);
                          if (moderationError?.fields?.reason) {
                            setModerationError(null);
                          }
                        }}
                        placeholder={t.admin.moderation.reasonPlaceholder}
                        className={`w-full rounded-xl border bg-white p-2.5 text-xs text-slate-900 focus:outline-none ${
                          moderationError?.fields?.reason
                            ? 'border-rose-400 focus:border-rose-500'
                            : 'border-slate-300 focus:border-rose-500'
                        }`}
                      />
                      {moderationError?.fields?.reason && (
                        <p className="text-xs font-medium text-rose-600">
                          {moderationError.fields.reason}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
              {pendingAction ? (
                <>
                  <button
                    type="button"
                    disabled={isSubmittingAction}
                    onClick={() => {
                      setPendingAction(null);
                      setModerationError(null);
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    {t.admin.moderation.cancel}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingAction}
                    onClick={() => handleModerate(pendingAction)}
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                  >
                    {pendingAction === 'reject'
                      ? t.admin.moderation.confirmReject
                      : t.admin.moderation.confirmRemove}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => setPendingAction('reject')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 text-xs font-bold text-amber-900"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>{t.admin.moderation.reject}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => setPendingAction('remove')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 text-xs font-bold text-rose-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t.admin.moderation.remove}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmittingAction}
                    onClick={() => handleModerate('approve')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t.admin.moderation.approve}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
