import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  MoveLeft,
  MoveRight,
  ShieldCheck,
  ImageIcon,
  Sparkles,
  Info,
  DollarSign,
  Tag,
  MapPin,
  Send,
  Eye,
  Check,
} from 'lucide-react';
import { Listing, Category, Condition, CategoryFieldDef } from '../types';
import { apiClient, ADDIS_ABABA_AREAS, ConeApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { ErrorMessage } from '../components/ErrorMessage';

export const PostListing: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { navigate, queryParams, setMeta } = useRouter();
  const { t } = useLanguage();

  const editId = queryParams.get('id');

  // Step 1: Details, Step 2: Photos, Step 3: Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Categories & Areas
  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<string[]>(ADDIS_ABABA_AREAS);

  // Active Draft ID (created at end of step 1 or loaded via editId)
  const [draftListingId, setDraftListingId] = useState<string | null>(editId || null);

  // Form fields
  const [title, setTitle] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedArea, setSelectedArea] = useState('Bole');
  const [price, setPrice] = useState<string>('');
  const [isNegotiable, setIsNegotiable] = useState<boolean>(true);
  const [condition, setCondition] = useState<'new' | 'used'>('used');
  const [description, setDescription] = useState('');

  // Category extra dynamic fields
  const [attributes, setAttributes] = useState<Record<string, any>>({});

  // Contact options
  const [showPhone, setShowPhone] = useState<boolean>(true);
  const [telegramUsername, setTelegramUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Photos state
  interface UploadedPhoto {
    id: string;
    url: string;
    is_cover?: boolean;
    uploading?: boolean;
    error?: string;
  }
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Submission & Loading state
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<any>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/signin?redirect=/post');
    }
  }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    setMeta('Post an Ad in Addis Ababa - Cone Marketplace', 'Sell your car, apartment, phone, or items in Addis Ababa.');

    const loadInitialData = async () => {
      try {
        setIsPageLoading(true);
        const [cats, areaList] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getAreas(),
        ]);
        setCategories(cats);
        setAreas(areaList);

        // If editing existing listing or draft
        if (editId) {
          const existing = await apiClient.getListingById(editId);
          setDraftListingId(existing.id);
          setTitle(existing.title || '');
          setSelectedArea(existing.area || 'Bole');
          setPrice(existing.price ? String(existing.price) : '');
          setIsNegotiable(!!existing.is_negotiable);
          setCondition(existing.condition === 'new' ? 'new' : 'used');
          setDescription(existing.description || '');
          setAttributes(existing.attributes || {});
          setShowPhone(existing.show_phone !== false);
          setTelegramUsername(existing.contact?.telegram_username || existing.seller?.telegram_username || '');
          setEmail(existing.contact?.email || existing.seller?.email || '');

          // Resolve category & subcategory
          const matchedCat = cats.find((c) => c.id === existing.category_id);
          if (matchedCat) {
            setSelectedParentCategory(matchedCat.id);
            if (existing.subcategory) {
              setSelectedSubcategory(existing.subcategory);
            } else if (matchedCat.subcategories.length > 0) {
              setSelectedSubcategory(matchedCat.subcategories[0]);
            }
          }

          // Resolve photos
          if (existing.images_meta && existing.images_meta.length > 0) {
            setPhotos(
              existing.images_meta.map((m) => ({
                id: m.id,
                url: m.url,
                is_cover: !!m.is_cover,
              }))
            );
          } else if (existing.images && existing.images.length > 0) {
            setPhotos(
              existing.images.map((url, idx) => ({
                id: `img_${idx}`,
                url,
                is_cover: idx === 0,
              }))
            );
          }
        }
      } catch (err: any) {
        setGlobalError(err);
      } finally {
        setIsPageLoading(false);
      }
    };

    loadInitialData();
  }, [editId]);

  // When parent category changes, set default subcategory if available
  const activeCategoryObj = categories.find((c) => c.id === selectedParentCategory);
  // The backend defines extra fields on the subcategory (for example Cars: make, model, year).
  const activeFields =
    (selectedSubcategory && activeCategoryObj?.subcategoryFields?.[selectedSubcategory]) ||
    activeCategoryObj?.fields;
  useEffect(() => {
    if (activeCategoryObj && activeCategoryObj.subcategories.length > 0 && !selectedSubcategory) {
      setSelectedSubcategory(activeCategoryObj.subcategories[0]);
    }
  }, [selectedParentCategory, activeCategoryObj]);

  // Validation for Step 1 (Details)
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters long';
    } else if (title.trim().length > 120) {
      errs.title = 'Title must not exceed 120 characters';
    }

    if (!selectedParentCategory) {
      errs.category = 'Please choose a category';
    } else if (activeCategoryObj && activeCategoryObj.subcategories.length > 0 && !selectedSubcategory) {
      errs.category = 'Please choose a specific subcategory (leaf category)';
    }

    if (!selectedArea) {
      errs.area = 'Please select an area in Addis Ababa';
    }

    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      errs.price = 'Please enter a valid whole number in Ethiopian Birr (ETB)';
    }

    if (!description.trim() || description.trim().length < 20) {
      errs.description = 'Description must be at least 20 characters long';
    }

    // Required extra fields
    if (activeFields) {
      activeFields.forEach((f) => {
        if (f.required && (attributes[f.key] === undefined || attributes[f.key] === '')) {
          errs[f.key] = `${f.label} is required`;
        }
      });
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 1 -> Step 2: Save Draft & advance
  const handleProceedToPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateStep1()) {
      return;
    }

    try {
      setIsSaving(true);

      const leafCatId = selectedParentCategory;

      if (!draftListingId) {
        // Create draft (POST /listings)
        const draft = await apiClient.createDraft({
          title: title.trim(),
          categoryId: leafCatId,
          areaId: selectedArea,
        });

        setDraftListingId(draft.id);

        // Patch remaining fields
        await apiClient.updateListing(draft.id, {
          categoryId: leafCatId, // lets the client pick the chosen subcategory
          areaId: selectedArea,
          price: Math.round(Number(price)),
          is_negotiable: isNegotiable,
          condition,
          description: description.trim(),
          attributes: {
            ...attributes,
            subcategory: selectedSubcategory || undefined,
          },
          contact: {
            show_phone: showPhone,
            telegram_username: telegramUsername.trim() || undefined,
            email: email.trim() || undefined,
          },
        });
      } else {
        // Update existing draft (PATCH /listings/{id})
        await apiClient.updateListing(draftListingId, {
          title: title.trim(),
          categoryId: leafCatId,
          areaId: selectedArea,
          price: Math.round(Number(price)),
          is_negotiable: isNegotiable,
          condition,
          description: description.trim(),
          attributes: {
            ...attributes,
            subcategory: selectedSubcategory || undefined,
          },
          contact: {
            show_phone: showPhone,
            telegram_username: telegramUsername.trim() || undefined,
            email: email.trim() || undefined,
          },
        });
      }

      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      if (err instanceof ConeApiError && err.fields) {
        setFieldErrors(err.fields);
      }
      setGlobalError(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Photo File Uploads (POST /listings/{id}/images)
  const handlePhotoFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !draftListingId) return;

    if (photos.length + files.length > 8) {
      setGlobalError({
        message: 'You can upload a maximum of 8 photos for each listing.',
      });
      return;
    }

    setGlobalError(null);
    const filesArray = Array.from(files);

    for (const file of filesArray) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const tempPreview = URL.createObjectURL(file);

      // Add optimistic entry
      setPhotos((prev) => [
        ...prev,
        { id: tempId, url: tempPreview, uploading: true },
      ]);

      try {
        const uploaded = await apiClient.uploadListingImage(draftListingId, file);
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === tempId
              ? {
                  id: uploaded.id,
                  url: uploaded.url,
                  is_cover: prev.length === 1 || p.is_cover,
                  uploading: false,
                }
              : p
          )
        );
      } catch (err: any) {
        setPhotos((prev) => prev.filter((p) => p.id !== tempId));
        setGlobalError(err);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove Photo (DELETE /listings/{id}/images/{imageId})
  const handleRemovePhoto = async (photoId: string) => {
    if (!draftListingId) return;
    try {
      await apiClient.deleteListingImage(draftListingId, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: any) {
      setGlobalError(err);
    }
  };

  // Reorder Photos (POST /listings/{id}/images/order)
  const handleMovePhoto = async (index: number, direction: 'left' | 'right') => {
    if (!draftListingId) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const reordered = [...photos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update cover flag (first photo is cover)
    const updated = reordered.map((p, idx) => ({ ...p, is_cover: idx === 0 }));
    setPhotos(updated);

    try {
      await apiClient.reorderListingImages(
        draftListingId,
        updated.map((p) => p.id)
      );
    } catch (err: any) {
      setGlobalError(err);
    }
  };

  // Step 2 -> Step 3
  const handleProceedToReview = () => {
    if (photos.length === 0) {
      setGlobalError({
        message: 'Please upload at least 1 photo before proceeding to review.',
      });
      return;
    }
    setGlobalError(null);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3: Final Submit (POST /listings/{id}/submit)
  const handleSubmitListing = async () => {
    if (!draftListingId) return;

    try {
      setIsSaving(true);
      setGlobalError(null);
      setFieldErrors({});

      await apiClient.submitListing(draftListingId);
      setIsSubmittedSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      if (err instanceof ConeApiError && err.fields) {
        setFieldErrors(err.fields);
        // Jump back to details if title/description error
        if (err.fields.title || err.fields.price || err.fields.description) {
          setCurrentStep(1);
        } else if (err.fields.images) {
          setCurrentStep(2);
        }
      }
      setGlobalError(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto" />
        <div className="h-12 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  // After submit success screen
  if (isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-9 w-9" />
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Listing Submitted!
          </h1>

          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200/80 p-4 text-xs font-semibold text-emerald-900 leading-relaxed">
            Your ad is waiting for review. We usually review within a day.
          </div>

          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            Our Addis Ababa moderation team verifies ads to keep Cone safe from scams, spam, and counterfeit goods.
          </p>

          <div className="mt-8 flex flex-col gap-2.5">
            <button
              onClick={() => navigate('/my/listings')}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-sm transition-colors"
            >
              View My Listings
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-xl border border-slate-300 bg-white hover:bg-slate-50 py-3 text-xs font-bold text-slate-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header Banner */}
      <div className="border-b border-slate-200 bg-white py-4 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep((prev) => (prev - 1) as any);
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{currentStep === 1 ? 'Cancel' : 'Previous Step'}</span>
          </button>

          <h1 className="text-sm font-bold text-slate-900">
            {editId ? 'Edit Ad' : 'Post a Free Ad in Addis Ababa'}
          </h1>

          {draftListingId && (
            <span className="text-[11px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded">
              Draft Saved
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                1
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1.5">Details</span>
            </div>

            <div
              className={`h-1 flex-1 mx-3 rounded transition-colors ${
                currentStep >= 2 ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            />

            <div className="flex flex-col items-center">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1.5">Photos</span>
            </div>

            <div
              className={`h-1 flex-1 mx-3 rounded transition-colors ${
                currentStep >= 3 ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            />

            <div className="flex flex-col items-center">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  currentStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1.5">Review</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        <ErrorMessage error={globalError} onDismiss={() => setGlobalError(null)} className="mb-6" />

        {/* ============================================================== */}
        {/* STEP 1: DETAILS */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <form onSubmit={handleProceedToPhotos} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                1. Item & Pricing Details
              </h2>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Listing Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  maxLength={120}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => ({ ...prev, title: '' }));
                    }
                  }}
                  placeholder="e.g., Toyota Vitz 2018 Automatic Pearl White"
                  className={`w-full rounded-xl border bg-slate-50 py-2.5 px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                    fieldErrors.title
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
                <div className="flex justify-between items-center mt-1 text-[11px]">
                  {fieldErrors.title ? (
                    <span className="text-rose-600 font-semibold">{fieldErrors.title}</span>
                  ) : (
                    <span className="text-slate-400">5 to 120 characters</span>
                  )}
                  <span className="text-slate-400 font-mono">{title.length}/120</span>
                </div>
              </div>

              {/* Category (Parent and Leaf Subcategory) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Top-Level Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedParentCategory}
                    required
                    onChange={(e) => {
                      setSelectedParentCategory(e.target.value);
                      setSelectedSubcategory('');
                      setAttributes({});
                      if (fieldErrors.category) {
                        setFieldErrors((prev) => ({ ...prev, category: '' }));
                      }
                    }}
                    className={`w-full rounded-xl border bg-white py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 ${
                      fieldErrors.category
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                    }`}
                  >
                    <option value="">Select a category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Leaf Subcategory <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedSubcategory}
                    disabled={!activeCategoryObj || activeCategoryObj.subcategories.length === 0}
                    onChange={(e) => {
                      setSelectedSubcategory(e.target.value);
                      setAttributes({}); // fields differ per subcategory
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-60"
                  >
                    {activeCategoryObj && activeCategoryObj.subcategories.length > 0 ? (
                      activeCategoryObj.subcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))
                    ) : (
                      <option value="">(Category has no subcategories)</option>
                    )}
                  </select>
                </div>
              </div>
              {fieldErrors.category && (
                <p className="text-[11px] text-rose-600 font-semibold">{fieldErrors.category}</p>
              )}

              {/* Area & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Area / Subcity in Addis Ababa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedArea}
                    required
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    {areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Condition <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-4 pt-1.5">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="cond"
                        value="new"
                        checked={condition === 'new'}
                        onChange={() => setCondition('new')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>New</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="cond"
                        value="used"
                        checked={condition === 'used'}
                        onChange={() => setCondition('used')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Used</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Price & Negotiable */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Price in Ethiopian Birr (ETB) <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        if (fieldErrors.price) {
                          setFieldErrors((prev) => ({ ...prev, price: '' }));
                        }
                      }}
                      placeholder="e.g. 3500000"
                      className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-3.5 pr-14 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                        fieldErrors.price
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                      }`}
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-emerald-700">
                      ETB
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isNegotiable}
                      onChange={(e) => setIsNegotiable(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Price is Negotiable</span>
                  </label>
                </div>
                {fieldErrors.price && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{fieldErrors.price}</p>
                )}
              </div>

              {/* Category Extra Dynamic Fields */}
              {activeFields && activeFields.length > 0 && (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {selectedSubcategory || activeCategoryObj.name} details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeFields.map((f) => (
                      <div key={f.key}>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        {f.type === 'select' ? (
                          <select
                            value={attributes[f.key] || ''}
                            onChange={(e) =>
                              setAttributes((prev) => ({ ...prev, [f.key]: e.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white py-2 px-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Select {f.label}...</option>
                            {f.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type === 'number' ? 'number' : 'text'}
                            value={attributes[f.key] || ''}
                            onChange={(e) =>
                              setAttributes((prev) => ({ ...prev, [f.key]: e.target.value }))
                            }
                            placeholder={f.unit ? `e.g. in ${f.unit}` : ''}
                            className="w-full rounded-lg border border-slate-300 bg-white py-2 px-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        )}
                        {fieldErrors[f.key] && (
                          <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            {fieldErrors[f.key]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (fieldErrors.description) {
                      setFieldErrors((prev) => ({ ...prev, description: '' }));
                    }
                  }}
                  placeholder="Describe your item in detail (condition, service history, reason for selling, inclusions)..."
                  className={`w-full rounded-xl border bg-slate-50 py-2.5 px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                    fieldErrors.description
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
                <div className="flex justify-between items-center mt-1 text-[11px]">
                  {fieldErrors.description ? (
                    <span className="text-rose-600 font-semibold">{fieldErrors.description}</span>
                  ) : (
                    <span className="text-slate-400">At least 20 characters</span>
                  )}
                  <span className="text-slate-400 font-mono">{description.length} chars</span>
                </div>
              </div>
            </div>

            {/* Contact Options Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                2. Contact Options for Buyers
              </h2>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Show my phone number
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Buyers can click "Show phone number" to call you directly ({user?.phone || 'Your Ethiopian mobile'}).
                  </span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Telegram Username (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">@</span>
                    <input
                      type="text"
                      value={telegramUsername.replace('@', '')}
                      onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))}
                      placeholder="username"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-7 pr-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-7 py-3 text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
              >
                <span>{isSaving ? 'Saving Draft...' : 'Next: Upload Photos'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 2: PHOTOS */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    2. Upload Photos ({photos.length}/8)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upload 1 to 8 clear photos of your item. The first photo will be the cover.
                  </p>
                </div>
              </div>

              {/* Privacy Notice on Photos */}
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Privacy Notice:</strong> All photos are automatically re-encoded and sensitive GPS location data (EXIF) is stripped before saving.
                </p>
              </div>

              {/* Upload Drop Zone / Button */}
              {photos.length < 8 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 p-8 text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoFilesSelected}
                    className="hidden"
                  />
                  <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-xs mx-auto mb-3">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Click to browse and upload photos
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, WEBP up to 10MB each (1 to 8 photos)
                  </div>
                </div>
              )}

              {/* Photos Grid & Reorder */}
              {photos.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Uploaded Photos (Use arrows to reorder cover photo)
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 bg-slate-100 shadow-2xs ${
                          idx === 0 ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={`Uploaded photo ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />

                        {/* Cover photo badge */}
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            COVER PHOTO
                          </div>
                        )}

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="absolute top-2 right-2 rounded-full bg-black/60 hover:bg-rose-600 p-1 text-white backdrop-blur-xs transition-colors"
                          title="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        {/* Reorder arrows */}
                        <div className="absolute bottom-2 inset-x-2 flex justify-between gap-1 opacity-90 group-hover:opacity-100">
                          {idx > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(idx, 'left')}
                              className="rounded-md bg-black/70 hover:bg-black p-1 text-white backdrop-blur-xs"
                              title="Move photo left"
                            >
                              <MoveLeft className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <div />
                          )}

                          {idx < photos.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(idx, 'right')}
                              className="rounded-md bg-black/70 hover:bg-black p-1 text-white backdrop-blur-xs"
                              title="Move photo right"
                            >
                              <MoveRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700"
              >
                &larr; Back to Details
              </button>

              <button
                type="button"
                onClick={handleProceedToReview}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-7 py-3 text-xs font-bold text-white shadow-md transition-all flex items-center gap-2"
              >
                <span>Next: Review & Submit</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: REVIEW & SUBMIT */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">
                  3. Review Your Listing
                </h2>
                <p className="text-xs text-slate-500">
                  Check all details before submitting. Your listing will be reviewed by our Addis team before going live.
                </p>
              </div>

              {/* Preview Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                {/* Photo Strip */}
                {photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((p, idx) => (
                      <div
                        key={p.id}
                        className="relative h-24 w-32 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200"
                      >
                        <img src={p.url} alt="" className="h-full w-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1 rounded">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
                    <span>{activeCategoryObj?.name}</span>
                    {selectedSubcategory && <span>&bull; {selectedSubcategory}</span>}
                    <span>&bull; {condition === 'new' ? 'Brand New' : 'Used'}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{title}</h3>
                  <div className="mt-2 text-2xl font-black text-slate-950">
                    {new Intl.NumberFormat('en-US').format(Number(price))} ETB
                    {isNegotiable && (
                      <span className="ml-2 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Negotiable
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>{selectedArea}, Addis Ababa</span>
                </div>

                {/* Attributes preview */}
                {Object.keys(attributes).length > 0 && (
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(attributes).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          {k}
                        </span>
                        <span className="font-bold text-slate-800">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Description preview */}
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Description
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Contact options preview */}
                <div className="border-t border-slate-200 pt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                  <div>
                    <strong>Phone:</strong> {showPhone ? user?.phone || 'Enabled' : 'Hidden'}
                  </div>
                  {telegramUsername && (
                    <div>
                      <strong>Telegram:</strong> @{telegramUsername}
                    </div>
                  )}
                  {email && (
                    <div>
                      <strong>Email:</strong> {email}
                    </div>
                  )}
                </div>
              </div>

              {/* Review Process Explanation */}
              <div className="rounded-xl bg-slate-900 text-white p-4 text-xs space-y-1">
                <div className="font-bold text-emerald-400">What happens next?</div>
                <p className="text-slate-300 leading-relaxed">
                  Upon submission, your ad will enter our moderation queue with status <strong>Waiting for review</strong>. We inspect all posts for authentic Addis Ababa contact details and compliance. Most ads are approved within a few hours.
                </p>
              </div>
            </div>

            {/* Bottom Submit Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700"
              >
                &larr; Back to Photos
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSubmitListing}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-8 py-3.5 text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{isSaving ? 'Submitting Ad...' : 'Submit Ad for Review'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
