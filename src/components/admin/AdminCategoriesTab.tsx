import React, { useEffect, useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  CornerDownRight,
  Sliders,
} from 'lucide-react';
import { AdminCategory, CategoryFieldDef } from '../../types';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ErrorMessage } from '../ErrorMessage';

interface EditingCategoryState {
  mode: 'create' | 'edit';
  id?: string;
  parentId: string | null;
  parentName?: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder?: number;
  fields: Array<CategoryFieldDef & { optionsRaw?: string }>;
}

export const AdminCategoriesTab: React.FC = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingCategoryState | null>(null);
  const [saveError, setSaveError] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getAdminCategories();
      setCategories(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const slugify = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const openCreate = (parent: AdminCategory | null) => {
    setSaveError(null);
    setEditing({
      mode: 'create',
      parentId: parent ? parent.id : null,
      parentName: parent?.name,
      name: '',
      slug: '',
      isActive: true,
      fields: [],
    });
  };

  const openEdit = (cat: AdminCategory, parentName?: string) => {
    setSaveError(null);
    setEditing({
      mode: 'edit',
      id: cat.id,
      parentId: cat.parentId,
      parentName,
      name: cat.name,
      slug: cat.slug,
      isActive: cat.isActive ?? true,
      sortOrder: cat.sortOrder,
      fields: (cat.fields || []).map((f) => ({
        ...f,
        optionsRaw: (f.options || []).join(', '),
      })),
    });
  };

  const addCustomField = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      fields: [
        ...editing.fields,
        { key: '', label: '', type: 'text', required: false, options: [], optionsRaw: '' },
      ],
    });
  };

  const updateCustomField = (
    idx: number,
    patch: Partial<CategoryFieldDef & { optionsRaw?: string }>
  ) => {
    if (!editing) return;
    const next = [...editing.fields];
    next[idx] = { ...next[idx], ...patch };
    setEditing({ ...editing, fields: next });
  };

  const removeCustomField = (idx: number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      fields: editing.fields.filter((_, i) => i !== idx),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const cleanFields: CategoryFieldDef[] = editing.fields
      .filter((f) => f.key.trim() || f.label.trim())
      .map((f) => {
        const type: 'text' | 'number' | 'select' =
          f.type === 'number' || f.type === 'select' ? f.type : 'text';
        const options =
          type === 'select'
            ? (f.optionsRaw || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined;
        return {
          key: f.key.trim(),
          label: f.label.trim() || f.key.trim(),
          type,
          required: Boolean(f.required),
          ...(options ? { options } : {}),
        };
      });

    try {
      setIsSaving(true);
      setSaveError(null);

      if (editing.mode === 'create') {
        await apiClient.createAdminCategory({
          parentId: editing.parentId,
          name: editing.name,
          slug: editing.slug || slugify(editing.name),
          isActive: editing.isActive,
          sortOrder: editing.sortOrder,
          fields: cleanFields,
        });
      } else if (editing.id) {
        await apiClient.updateAdminCategory(editing.id, {
          parentId: editing.parentId,
          name: editing.name,
          slug: editing.slug,
          isActive: editing.isActive,
          sortOrder: editing.sortOrder,
          fields: cleanFields,
        });
      }

      setEditing(null);
      setSuccessMsg(t.admin.categories.savedSuccess);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadCategories();
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
            {t.admin.categories.heading}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.admin.categories.sub}</p>
        </div>

        <button
          onClick={() => openCreate(null)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white self-start sm:self-auto shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{t.admin.categories.addTopLevel}</span>
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
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((parent) => (
            <div
              key={parent.id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
            >
              {/* Parent Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 px-4 py-3.5 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <FolderTree className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-black text-slate-900">{parent.name}</span>
                  <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {parent.slug}
                  </span>
                  {parent.isActive === false && (
                    <span className="rounded bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase">
                      Hidden
                    </span>
                  )}
                  {parent.fields.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                      <Sliders className="h-3 w-3" />
                      {parent.fields.length} fields
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCreate(parent)}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 text-xs font-bold text-emerald-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t.admin.categories.addSubcategory}</span>
                  </button>
                  <button
                    onClick={() => openEdit(parent)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              {/* Children Rows */}
              {parent.children.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {parent.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 pl-6 sm:pl-10 hover:bg-slate-50/50"
                    >
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <CornerDownRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-800">{child.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{child.slug}</span>
                        {child.isActive === false && (
                          <span className="rounded bg-slate-200 text-slate-700 px-1.5 py-0.5 text-[10px] font-bold">
                            Hidden
                          </span>
                        )}
                        {child.fields.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-semibold">
                            <Sliders className="h-2.5 w-2.5" />
                            {child.fields.length} custom fields
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => openEdit(child, parent.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 flex-shrink-0"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-2.5 text-[11px] text-slate-400 italic">
                  Leaf category (no subcategories)
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Category + Custom Fields Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editing.mode === 'create'
                    ? editing.parentId
                      ? `${t.admin.categories.addSubcategory} (${editing.parentName})`
                      : t.admin.categories.addTopLevel
                    : t.admin.categories.editCategory}
                </h3>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
              <ErrorMessage error={saveError} onDismiss={() => setSaveError(null)} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t.admin.categories.nameLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditing((prev) =>
                        prev
                          ? {
                              ...prev,
                              name: val,
                              slug: prev.mode === 'create' ? slugify(val) : prev.slug,
                            }
                          : null
                      );
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none ${
                      saveError?.fields?.name ? 'border-rose-400' : 'border-slate-300 focus:border-emerald-500'
                    }`}
                  />
                  {saveError?.fields?.name && (
                    <p className="text-xs text-rose-600 mt-1">{saveError.fields.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t.admin.categories.slugLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none ${
                      saveError?.fields?.slug ? 'border-rose-400' : 'border-slate-300 focus:border-emerald-500'
                    }`}
                  />
                  {saveError?.fields?.slug && (
                    <p className="text-xs text-rose-600 mt-1">{saveError.fields.slug}</p>
                  )}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{t.admin.categories.activeLabel}</span>
              </label>

              {/* Custom Fields Editor */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    {t.admin.categories.fieldsHeading}
                  </h4>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t.admin.categories.addField}</span>
                  </button>
                </div>

                {saveError?.fields?.fields && (
                  <p className="text-xs text-rose-600 font-medium">{saveError.fields.fields}</p>
                )}

                {editing.fields.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No custom fields configured for this category yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {editing.fields.map((field, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => updateCustomField(idx, { key: e.target.value })}
                              placeholder={t.admin.categories.fieldKey}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateCustomField(idx, { label: e.target.value })}
                              placeholder={t.admin.categories.fieldLabel}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <select
                              value={field.type}
                              onChange={(e) =>
                                updateCustomField(idx, {
                                  type: e.target.value as 'text' | 'number' | 'select',
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="select">Select</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2 flex items-center justify-between gap-2">
                            <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                              <input
                                type="checkbox"
                                checked={Boolean(field.required)}
                                onChange={(e) =>
                                  updateCustomField(idx, { required: e.target.checked })
                                }
                                className="rounded border-slate-300 text-emerald-600"
                              />
                              <span>Req</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeCustomField(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Remove field"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {field.type === 'select' && (
                          <input
                            type="text"
                            value={field.optionsRaw || ''}
                            onChange={(e) => updateCustomField(idx, { optionsRaw: e.target.value })}
                            placeholder={t.admin.categories.fieldOptions}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
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
                  {t.admin.categories.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
