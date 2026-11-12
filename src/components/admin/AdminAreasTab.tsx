import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Edit3, X, CheckCircle2 } from 'lucide-react';
import { AdminArea } from '../../types';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ErrorMessage } from '../ErrorMessage';

interface EditingAreaState {
  mode: 'create' | 'edit';
  id?: string;
  name: string;
  isActive: boolean;
}

export const AdminAreasTab: React.FC = () => {
  const { t } = useLanguage();
  const [areas, setAreas] = useState<AdminArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingAreaState | null>(null);
  const [saveError, setSaveError] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadAreas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getAdminAreas();
      setAreas(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      if (editing.mode === 'create') {
        await apiClient.createAdminArea({
          name: editing.name,
          isActive: editing.isActive,
        });
      } else if (editing.id) {
        await apiClient.updateAdminArea(editing.id, {
          name: editing.name,
          isActive: editing.isActive,
        });
      }

      setEditing(null);
      setSuccessMsg(t.admin.areas.savedSuccess);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadAreas();
    } catch (err: any) {
      setSaveError(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t.admin.areas.heading}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.admin.areas.sub}</p>
        </div>

        <button
          onClick={() => {
            setSaveError(null);
            setEditing({ mode: 'create', name: '', isActive: true });
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white self-start sm:self-auto shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{t.admin.areas.addArea}</span>
        </button>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {areas.map((area) => (
            <div
              key={area.id}
              className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{area.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {area.isActive === false ? 'Inactive' : 'Active'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSaveError(null);
                  setEditing({
                    mode: 'edit',
                    id: area.id,
                    name: area.name,
                    isActive: area.isActive ?? true,
                  });
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-black text-slate-900">
                {editing.mode === 'create' ? t.admin.areas.addArea : t.admin.areas.editArea}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <ErrorMessage error={saveError} onDismiss={() => setSaveError(null)} />

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t.admin.areas.nameLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. Bole Michael"
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none ${
                    saveError?.fields?.name ? 'border-rose-400' : 'border-slate-300 focus:border-emerald-500'
                  }`}
                />
                {saveError?.fields?.name && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{saveError.fields.name}</p>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{t.admin.areas.activeLabel}</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {t.admin.areas.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
