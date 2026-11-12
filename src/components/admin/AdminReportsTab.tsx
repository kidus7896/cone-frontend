import React, { useEffect, useState } from 'react';
import {
  Flag,
  ExternalLink,
  CheckCircle2,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminReport } from '../../types';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { ErrorMessage } from '../ErrorMessage';

export const AdminReportsTab: React.FC = () => {
  const { t } = useLanguage();
  const { navigate } = useRouter();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resolve modal state
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [resolveAction, setResolveAction] = useState<'dismiss' | 'remove_listing'>('dismiss');
  const [resolveNote, setResolveNote] = useState('');
  const [resolveError, setResolveError] = useState<any>(null);
  const [isResolving, setIsResolving] = useState(false);

  const pageSize = 20;

  const loadReports = async (targetPage = page, targetStatus = statusFilter) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getAdminReports({
        status: targetStatus,
        page: targetPage,
        pageSize,
      });
      setReports(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports(page, statusFilter);
  }, [page, statusFilter]);

  const handleOpenResolve = (rep: AdminReport) => {
    setSelectedReport(rep);
    setResolveAction('dismiss');
    setResolveNote('');
    setResolveError(null);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setIsResolving(true);
      setResolveError(null);
      await apiClient.resolveAdminReport(selectedReport.id, {
        action: resolveAction,
        note: resolveNote.trim() || undefined,
      });

      setSelectedReport(null);
      setSuccessMsg(t.admin.reports.resolvedSuccess);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadReports(page, statusFilter);
    } catch (err: any) {
      setResolveError(err);
    } finally {
      setIsResolving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t.admin.reports.heading}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.admin.reports.sub}</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 self-start sm:self-auto focus:border-emerald-500 focus:outline-none"
        >
          <option value="open">Open Reports</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
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
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse space-y-2">
              <div className="h-4 w-1/3 bg-slate-200 rounded" />
              <div className="h-3 w-2/3 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Flag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">{t.admin.reports.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      rep.status === 'open'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {rep.status}
                  </span>
                  <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase">
                    {rep.reason.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(rep.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {rep.listingTitle}
                  </span>
                  {rep.listingId && (
                    <a
                      href={`/listing/${rep.listingId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/listing/${rep.listingId}`);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                    >
                      <span>{t.admin.reports.viewListing}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {rep.note && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200/70">
                    “{rep.note}”
                  </p>
                )}

                <div className="text-[11px] text-slate-500">
                  Reporter: {rep.reporterName || rep.reporterId || 'Anonymous'}{' '}
                  {rep.reporterPhone ? `(${rep.reporterPhone})` : ''}
                </div>

                {rep.resolutionNote && (
                  <div className="text-[11px] text-emerald-800 font-medium">
                    Resolution ({rep.resolutionAction}): {rep.resolutionNote}
                  </div>
                )}
              </div>

              {rep.status === 'open' && (
                <button
                  onClick={() => handleOpenResolve(rep)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white flex-shrink-0"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t.admin.reports.resolve}</span>
                </button>
              )}
            </div>
          ))}

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

      {/* Resolve Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-black text-slate-900">{t.admin.reports.resolve}</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-5 space-y-4">
              <ErrorMessage error={resolveError} onDismiss={() => setResolveError(null)} />

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {t.admin.reports.actionLabel}
                </label>
                <select
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value as 'dismiss' | 'remove_listing')}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="dismiss">{t.admin.reports.actionDismiss}</option>
                  <option value="remove_listing">{t.admin.reports.actionRemoveListing}</option>
                </select>
                {resolveError?.fields?.action && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{resolveError.fields.action}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {t.admin.reports.noteLabel}
                </label>
                <textarea
                  rows={3}
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder={t.admin.reports.notePlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
                {resolveError?.fields?.note && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{resolveError.fields.note}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {t.admin.reports.confirmResolve}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
