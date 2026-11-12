import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  Flag,
  Users,
  FolderTree,
  MapPin,
  Settings,
  History,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { AdminDashboardTab } from '../components/admin/AdminDashboardTab';
import { AdminModerationTab } from '../components/admin/AdminModerationTab';
import { AdminReportsTab } from '../components/admin/AdminReportsTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminAreasTab } from '../components/admin/AdminAreasTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { AdminAuditLogTab } from '../components/admin/AdminAuditLogTab';

type AdminTab =
  | 'dashboard'
  | 'moderation'
  | 'reports'
  | 'users'
  | 'categories'
  | 'areas'
  | 'settings'
  | 'auditLog';

export const Admin: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { path, navigate, setMeta } = useRouter();
  const { t } = useLanguage();

  const isStaff =
    !!user && (user.role === 'moderator' || user.role === 'super_admin');
  const isSuperAdmin = user?.role === 'super_admin';

  const tabFromPath = (p: string): AdminTab => {
    if (p === '/admin/listings' || p === '/admin/moderation') return 'moderation';
    if (p === '/admin/reports') return 'reports';
    if (p === '/admin/users') return 'users';
    if (p === '/admin/categories') return 'categories';
    if (p === '/admin/areas') return 'areas';
    if (p === '/admin/settings') return 'settings';
    if (p === '/admin/audit-log') return 'auditLog';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(() => tabFromPath(path));

  useEffect(() => {
    setMeta('Cone Admin - Moderation & Operations', 'Cone staff administration and moderation panel.');
  }, []);

  useEffect(() => {
    setActiveTab(tabFromPath(path));
  }, [path]);

  // Redirect non-staff home once auth state settles
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isStaff)) {
      navigate('/');
    }
  }, [authLoading, isAuthenticated, isStaff]);

  // Ensure moderators cannot access super-admin-only tabs
  useEffect(() => {
    if (
      !isSuperAdmin &&
      (activeTab === 'categories' ||
        activeTab === 'areas' ||
        activeTab === 'settings' ||
        activeTab === 'auditLog')
    ) {
      setActiveTab('dashboard');
    }
  }, [isSuperAdmin, activeTab]);

  if (authLoading || !isAuthenticated || !isStaff) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Verifying staff access...</span>
        </div>
      </div>
    );
  }

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    superAdminOnly?: boolean;
  }> = [
    { id: 'dashboard', label: t.admin.tabs.dashboard, icon: LayoutDashboard },
    { id: 'moderation', label: t.admin.tabs.moderation, icon: ClipboardCheck },
    { id: 'reports', label: t.admin.tabs.reports, icon: Flag },
    { id: 'users', label: t.admin.tabs.users, icon: Users },
    { id: 'categories', label: t.admin.tabs.categories, icon: FolderTree, superAdminOnly: true },
    { id: 'areas', label: t.admin.tabs.areas, icon: MapPin, superAdminOnly: true },
    { id: 'settings', label: t.admin.tabs.settings, icon: Settings, superAdminOnly: true },
    { id: 'auditLog', label: t.admin.tabs.auditLog, icon: History, superAdminOnly: true },
  ];

  const visibleNavItems = navItems.filter((item) => !item.superAdminOnly || isSuperAdmin);

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-12">
      {/* Top Staff Header Bar */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {t.admin.title}
              </h1>
              <p className="text-[11px] text-slate-500">{t.admin.subtitle}</p>
            </div>
          </div>

          <span className="rounded-lg bg-slate-900 text-emerald-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
            {isSuperAdmin ? t.admin.roleBadgeSuper : t.admin.roleBadgeMod}
          </span>
        </div>

        {/* Mobile / Tablet Top Tab Bar */}
        <div className="mx-auto max-w-7xl mt-4 lg:hidden overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 pb-1 min-w-max">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area: Desktop Sidebar + Panel */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="lg:flex lg:items-start lg:gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-28">
            <nav className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => selectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-left transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Active Tab Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <AdminDashboardTab onNavigateTab={(tab) => selectTab(tab)} />
            )}
            {activeTab === 'moderation' && <AdminModerationTab />}
            {activeTab === 'reports' && <AdminReportsTab />}
            {activeTab === 'users' && <AdminUsersTab isSuperAdmin={isSuperAdmin} />}
            {activeTab === 'categories' && isSuperAdmin && <AdminCategoriesTab />}
            {activeTab === 'areas' && isSuperAdmin && <AdminAreasTab />}
            {activeTab === 'settings' && isSuperAdmin && <AdminSettingsTab />}
            {activeTab === 'auditLog' && isSuperAdmin && <AdminAuditLogTab />}
          </div>
        </div>
      </div>
    </div>
  );
};
