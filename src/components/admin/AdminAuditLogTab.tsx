import React, { useEffect, useState } from 'react';
import { History, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ErrorMessage } from '../ErrorMessage';

export const AdminAuditLogTab: React.FC = () => {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const pageSize = 20;

  const loadLog = async (targetPage = page) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getAdminAuditLog(targetPage, pageSize);
      setEntries(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLog(page);
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t.admin.auditLog.heading}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.admin.auditLog.sub}</p>
        </div>
        <button
          onClick={() => loadLog(page)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {isLoading ? (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">{t.admin.auditLog.empty}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t.admin.auditLog.timestamp}</th>
                  <th className="px-4 py-3">{t.admin.auditLog.actor}</th>
                  <th className="px-4 py-3">{t.admin.auditLog.action}</th>
                  <th className="px-4 py-3">{t.admin.auditLog.target}</th>
                  <th className="px-4 py-3">{t.admin.auditLog.reason}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {e.actorName || e.actorId || 'Staff'}
                      </div>
                      {e.actorPhone && (
                        <div className="text-[10px] font-mono text-slate-400">{e.actorPhone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded bg-slate-100 text-slate-800 px-2 py-0.5 text-[11px] font-mono font-bold">
                        {e.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {e.targetType ? `${e.targetType}: ` : ''}
                      {e.targetId || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      {e.reason && <div className="font-medium text-slate-800">{e.reason}</div>}
                      {e.details && Object.keys(e.details).length > 0 && (
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {JSON.stringify(e.details)}
                        </div>
                      )}
                      {!e.reason && (!e.details || Object.keys(e.details).length === 0) && '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-40"
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
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
