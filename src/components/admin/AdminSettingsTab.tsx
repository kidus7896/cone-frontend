import React, { useEffect, useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { AdminSettings } from '../../types';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ErrorMessage } from '../ErrorMessage';

function formatSettingLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export const AdminSettingsTab: React.FC = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<AdminSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.getAdminSettings();
        setSettings(res);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setError(null);

    try {
      setIsSaving(true);
      const updated = await apiClient.updateAdminSettings(settings);
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const entries = Object.entries(settings);

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          {t.admin.settings.heading}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">{t.admin.settings.sub}</p>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{t.admin.settings.savedSuccess}</span>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-xs"
        >
          {entries.map(([key, value]) => {
            const fieldError = error?.fields?.[key];
            if (typeof value === 'boolean') {
              return (
                <div key={key} className="py-1">
                  <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">
                      {formatSettingLabel(key)}
                    </span>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                  {fieldError && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{fieldError}</p>
                  )}
                </div>
              );
            }

            if (typeof value === 'number') {
              return (
                <div key={key}>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {formatSettingLabel(key)}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        [key]: e.target.value === '' ? 0 : Number(e.target.value),
                      }))
                    }
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none ${
                      fieldError
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300 bg-white focus:border-emerald-500'
                    }`}
                  />
                  {fieldError && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{fieldError}</p>
                  )}
                </div>
              );
            }

            return (
              <div key={key}>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {formatSettingLabel(key)}
                </label>
                <input
                  type="text"
                  value={value ?? ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none ${
                    fieldError
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-300 bg-white focus:border-emerald-500'
                  }`}
                />
                {fieldError && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{fieldError}</p>
                )}
              </div>
            );
          })}

          <div className="pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? t.admin.settings.saving : t.admin.settings.save}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
