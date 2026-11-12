import React, { useEffect, useState } from 'react';
import { User, Phone, Mail, MapPin, ShieldAlert, LogOut, CheckCircle2, Save, Lock, ShieldCheck } from 'lucide-react';
import { apiClient } from '../api/client';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ErrorMessage } from '../components/ErrorMessage';

export const Account: React.FC = () => {
  const { navigate, setMeta } = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [areas, setAreas] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<any>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Account deletion state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionError, setDeletionError] = useState<any>(null);

  useEffect(() => {
    setMeta(
      'Account Settings - Cone Addis Ababa',
      'Manage your Cone classifieds profile, contact details, and location in Addis Ababa, Ethiopia.'
    );
  }, []);

  // Redirect if not signed in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin?redirect=/account');
    }
  }, [isAuthenticated, authLoading]);

  // Load user data and areas
  useEffect(() => {
    const loadAccountData = async () => {
      try {
        setIsLoading(true);
        setGeneralError(null);
        const [userData, areaList] = await Promise.all([
          apiClient.getMe(),
          apiClient.getAreas(),
        ]);

        const u = userData.user;
        setName(u.name || '');
        setEmail(u.email || '');
        setSelectedArea(u.area_name || u.area_id || '');
        setAreas(areaList);
      } catch (err: any) {
        setGeneralError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadAccountData();
    }
  }, [isAuthenticated]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setGeneralError(null);
    setFieldErrors({});

    const clientErrors: Record<string, string> = {};
    if (!name.trim()) {
      clientErrors.name = 'Name cannot be empty';
    } else if (name.trim().length < 2) {
      clientErrors.name = 'Name must be at least 2 characters';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      clientErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.updateMe({
        name: name.trim(),
        email: email.trim() ? email.trim() : null,
        areaId: selectedArea ? selectedArea : null,
      });

      // Refresh user session in context so Header updates immediately
      await refreshUser();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      if (err?.fields) {
        setFieldErrors(err.fields);
      }
      setGeneralError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') return;

    try {
      setIsDeletingAccount(true);
      setDeletionError(null);
      await apiClient.requestAccountDeletion();
      await logout();
      navigate('/');
    } catch (err: any) {
      setDeletionError(err);
      setIsDeletingAccount(false);
    }
  };

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading account details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Banner */}
      <div className="border-b border-slate-200 bg-white py-6 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <User className="h-4 w-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.account.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t.account.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {(user?.role === 'moderator' || user?.role === 'super_admin') && (
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-colors shadow-2xs"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t.nav.admin}</span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-500" />
              <span>{t.account.signOut}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Profile Settings Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
            <span>{t.account.personalInfo}</span>
          </h2>

          <ErrorMessage error={generalError} onDismiss={() => setGeneralError(null)} className="mb-6" />

          {saveSuccess && (
            <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{t.account.saveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Phone Number (Read-only) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  {t.account.phoneLabel}
                </label>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  <Lock className="h-3 w-3" />
                  <span>Verified</span>
                </span>
              </div>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={user?.phone || ''}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 py-2.5 pl-10 pr-4 text-xs font-mono font-semibold text-slate-600 cursor-not-allowed select-all"
                />
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {t.account.phoneHint}
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                {t.account.nameLabel} <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  placeholder={t.account.namePlaceholder}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                    fieldErrors.name
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-300 bg-white focus:border-emerald-500'
                  }`}
                />
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
              {fieldErrors.name && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.name}</p>
              )}
            </div>

            {/* Optional Email */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                {t.account.emailLabel}
              </label>
              <div className="relative mt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder={t.account.emailPlaceholder}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                    fieldErrors.email
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-300 bg-white focus:border-emerald-500'
                  }`}
                />
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Area Dropdown */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                {t.account.areaLabel}
              </label>
              <div className="relative mt-1">
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    if (fieldErrors.areaId) {
                      setFieldErrors((prev) => ({ ...prev, areaId: '' }));
                    }
                  }}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 bg-white focus:outline-none transition-colors ${
                    fieldErrors.areaId
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-300 focus:border-emerald-500'
                  }`}
                >
                  <option value="">-- {t.account.selectArea} --</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}, Addis Ababa
                    </option>
                  ))}
                </select>
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
              {fieldErrors.areaId && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.areaId}</p>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.account.saving}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{t.account.saveButton}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 sm:hidden"
              >
                {t.account.signOut}
              </button>
            </div>
          </form>
        </div>

        {/* Delete Account Section */}
        <div className="rounded-2xl border border-rose-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900">
                {t.account.deleteSectionTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.account.deleteSectionSub}
              </p>

              <div className="mt-4 rounded-xl bg-rose-50/70 border border-rose-200/80 p-3.5 text-xs text-rose-900 leading-relaxed">
                <p className="font-semibold">{t.account.deleteExplanation}</p>
              </div>

              <ErrorMessage error={deletionError} onDismiss={() => setDeletionError(null)} className="mt-4" />

              <div className="mt-5 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  {t.account.deleteConfirmInstruction}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={t.account.deleteConfirmPlaceholder}
                    className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none sm:w-60"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText.trim() !== 'DELETE' || isDeletingAccount}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  >
                    {isDeletingAccount ? (
                      <>
                        <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t.account.deleting}</span>
                      </>
                    ) : (
                      <span>{t.account.deleteButton}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
