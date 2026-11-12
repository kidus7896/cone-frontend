import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Search,
  UserCheck,
  UserX,
  ShieldAlert,
  Copy,
  Check,
  X,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { AdminUser, User } from '../../types';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ErrorMessage } from '../ErrorMessage';

interface AdminUsersTabProps {
  isSuperAdmin: boolean;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ isSuperAdmin }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Suspend / Reactivate modal
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Role change loading state
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);

  // One-time MFA setup dialog
  const [mfaSetupUri, setMfaSetupUri] = useState<string | null>(null);
  const [mfaQrDataUrl, setMfaQrDataUrl] = useState<string | null>(null);
  const [copiedUri, setCopiedUri] = useState(false);

  const loadUsers = async (searchStr = query) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getAdminUsers({ q: searchStr, page: 1, pageSize: 50 });
      setUsers(res.items);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers('');
  }, []);

  useEffect(() => {
    if (!mfaSetupUri) {
      setMfaQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(mfaSetupUri, { width: 220, margin: 2 })
      .then((url) => setMfaQrDataUrl(url))
      .catch(() => setMfaQrDataUrl(null));
  }, [mfaSetupUri]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(query);
  };

  const handleOpenStatusModal = (u: AdminUser) => {
    setStatusTarget(u);
    setStatusReason('');
    setStatusError(null);
  };

  const handleConfirmStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    if (!statusReason.trim()) {
      setStatusError({
        code: 'VALIDATION_ERROR',
        message: 'A reason is required.',
        fields: { reason: 'Please enter a reason' },
      });
      return;
    }

    const nextStatus = statusTarget.status === 'active' ? 'suspended' : 'active';

    try {
      setIsUpdatingStatus(true);
      setStatusError(null);
      const updated = await apiClient.updateAdminUserStatus(statusTarget.id, {
        status: nextStatus,
        reason: statusReason.trim(),
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setStatusTarget(null);
      setSuccessMsg(t.admin.users.statusUpdated);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setStatusError(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    try {
      setRoleUpdatingId(userId);
      setError(null);
      const res = await apiClient.updateAdminUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === res.user.id ? res.user : u)));
      setSuccessMsg(t.admin.users.roleUpdated);
      setTimeout(() => setSuccessMsg(null), 4000);

      if (res.mfaSetupUri) {
        setCopiedUri(false);
        setMfaSetupUri(res.mfaSetupUri);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleCopyMfaUri = async () => {
    if (!mfaSetupUri) return;
    try {
      await navigator.clipboard.writeText(mfaSetupUri);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2500);
    } catch {
      /* clipboard fallback handled by selectable text */
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          {t.admin.users.heading}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">{t.admin.users.sub}</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.admin.users.searchPlaceholder}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white"
        >
          {t.admin.users.searchBtn}
        </button>
      </form>

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
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">{t.admin.users.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {u.name || 'Unnamed User'}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      u.status === 'suspended'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {u.status}
                  </span>
                  <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase">
                    {u.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
                  <span>{u.phone}</span>
                  <span>ID: {u.id}</span>
                </div>

                {u.statusReason && (
                  <p className="text-[11px] text-rose-700 font-medium">
                    Note: {u.statusReason}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                {isSuperAdmin && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500">
                      {t.admin.users.roleLabel}:
                    </label>
                    <select
                      value={u.role}
                      disabled={roleUpdatingId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as User['role'])}
                      className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={() => handleOpenStatusModal(u)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                    u.status === 'active'
                      ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {u.status === 'active' ? (
                    <>
                      <UserX className="h-3.5 w-3.5" />
                      <span>{t.admin.users.suspend}</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>{t.admin.users.reactivate}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suspend / Reactivate Modal */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-black text-slate-900">
                {statusTarget.status === 'active'
                  ? t.admin.users.statusModalSuspend
                  : t.admin.users.statusModalReactivate}
              </h3>
              <button
                onClick={() => setStatusTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmStatus} className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Target user: <strong className="text-slate-900">{statusTarget.name || statusTarget.phone}</strong>{' '}
                (<span className="font-mono">{statusTarget.phone}</span>)
              </p>

              <ErrorMessage error={statusError} onDismiss={() => setStatusError(null)} />

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {t.admin.users.reasonLabel} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={statusReason}
                  onChange={(e) => {
                    setStatusReason(e.target.value);
                    if (statusError?.fields?.reason) setStatusError(null);
                  }}
                  placeholder={t.admin.users.reasonPlaceholder}
                  className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 focus:outline-none ${
                    statusError?.fields?.reason ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {statusError?.fields?.reason && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{statusError.fields.reason}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white disabled:opacity-50 ${
                    statusTarget.status === 'active'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {statusTarget.status === 'active'
                    ? t.admin.users.suspend
                    : t.admin.users.reactivate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Time MFA Setup URI & QR Dialog */}
      {mfaSetupUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 flex items-center gap-2.5 text-white">
              <ShieldAlert className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <h3 className="text-sm font-black">{t.admin.users.mfaDialogTitle}</h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-900 leading-relaxed">
                {t.admin.users.mfaDialogWarning}
              </div>

              {mfaQrDataUrl && (
                <div className="flex justify-center py-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                    <img src={mfaQrDataUrl} alt="MFA QR Code" className="h-48 w-48" />
                  </div>
                </div>
              )}

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Authenticator Setup URI
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] font-mono text-slate-800 break-all select-all">
                  {mfaSetupUri}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyMfaUri}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800"
                >
                  {copiedUri ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedUri ? t.admin.users.mfaCopied : t.admin.users.mfaCopyUri}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMfaSetupUri(null)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2 text-xs font-bold text-white"
                >
                  {t.admin.users.mfaClose}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
