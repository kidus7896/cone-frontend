import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Flag,
  Users,
  UserX,
  RefreshCw,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { AdminDashboard } from '../../types';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ErrorMessage } from '../ErrorMessage';

interface AdminDashboardTabProps {
  onNavigateTab: (tab: 'moderation' | 'reports' | 'users') => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getAdminDashboard();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cards = data
    ? [
        {
          key: 'pending',
          label: t.admin.dashboard.pendingListings,
          value: data.pendingListings,
          icon: Clock,
          accent: 'bg-amber-50 text-amber-700 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-700',
          onClick: () => onNavigateTab('moderation'),
        },
        {
          key: 'openReports',
          label: t.admin.dashboard.openReports,
          value: data.openReports,
          icon: Flag,
          accent: 'bg-rose-50 text-rose-700 border-rose-200',
          iconBg: 'bg-rose-100 text-rose-700',
          onClick: () => onNavigateTab('reports'),
        },
        {
          key: 'activeListings',
          label: t.admin.dashboard.activeListings,
          value: data.activeListings,
          icon: CheckCircle2,
          accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-700',
          onClick: () => onNavigateTab('moderation'),
        },
        {
          key: 'totalUsers',
          label: t.admin.dashboard.totalUsers,
          value: data.totalUsers,
          icon: Users,
          accent: 'bg-slate-50 text-slate-800 border-slate-200',
          iconBg: 'bg-slate-200 text-slate-700',
          onClick: () => onNavigateTab('users'),
        },
        ...(data.suspendedUsers !== undefined
          ? [
              {
                key: 'suspendedUsers',
                label: t.admin.dashboard.suspendedUsers,
                value: data.suspendedUsers,
                icon: UserX,
                accent: 'bg-orange-50 text-orange-800 border-orange-200',
                iconBg: 'bg-orange-100 text-orange-700',
                onClick: () => onNavigateTab('users'),
              },
            ]
          : []),
        ...(data.resolvedReports !== undefined
          ? [
              {
                key: 'resolvedReports',
                label: t.admin.dashboard.resolvedReports,
                value: data.resolvedReports,
                icon: ShieldCheck,
                accent: 'bg-sky-50 text-sky-800 border-sky-200',
                iconBg: 'bg-sky-100 text-sky-700',
                onClick: () => onNavigateTab('reports'),
              },
            ]
          : []),
        ...(data.extraCounts || []).map((extra) => ({
          key: extra.key,
          label: extra.label,
          value: extra.value,
          icon: BarChart3,
          accent: 'bg-white text-slate-800 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-600',
          onClick: undefined,
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t.admin.dashboard.heading}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.admin.dashboard.sub}</p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 self-start sm:self-auto shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{t.admin.dashboard.refresh}</span>
        </button>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse space-y-3"
            >
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                onClick={card.onClick}
                className={`rounded-2xl border p-5 transition-all ${card.accent} ${
                  card.onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                    {card.label}
                  </span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black tracking-tight">
                  {card.value.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
