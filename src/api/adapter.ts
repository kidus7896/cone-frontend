// Translates between the Cone backend (openapi.yaml: camelCase, priceEtb, categoryId...)
// and the shapes the pages already use (snake_case, price, category_id...).
// Pure functions only, so they are easy to test. Used by client.ts when VITE_USE_MOCK=false.
import type { Category, Condition, Listing, ListingsQuery, ReportPayload, Seller, User } from '../types';

// ---------- Raw backend shapes (only the fields we use) ----------

export interface ApiCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  fields?: Array<{ key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[]; required?: boolean }>;
  children?: ApiCategory[];
}

export interface ApiArea {
  id: string;
  parentId: string | null;
  name: string;
}

export interface ApiListingSummary {
  id: string;
  title: string;
  priceEtb: number;
  negotiable: boolean;
  condition: 'new' | 'used';
  areaName: string;
  categoryId: string;
  coverThumbUrl: string | null;
  createdAt: string;
}

export interface ApiSeller {
  id: string;
  name: string | null;
  memberSince: string;
  activeListings: number;
}

export interface ApiListing {
  id: string;
  title: string;
  description: string;
  priceEtb: number;
  negotiable: boolean;
  condition: 'new' | 'used';
  categoryId: string;
  areaId: string;
  attributes: Record<string, string | number | boolean>;
  images: Array<{ id: string; url: string; thumbUrl: string; order: number }>;
  contact: { showPhone: boolean; telegram: string | null; email: string | null };
  status: Listing['status'];
  rejectReason?: string | null;
  seller: ApiSeller;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUser {
  id: string;
  name: string | null;
  phone: string;
  role: User['role'];
  createdAt: string;
}

// ---------- Lookups built from /categories and /areas ----------

export interface Lookups {
  categoryById: Map<string, { name: string; parentId?: string; parentName?: string }>;
  categoryKeyToId: Map<string, string>; // id, slug, or slug with underscores -> id
  areaById: Map<string, string>;
  areaNameToId: Map<string, string>;
}

export function buildCategoryLookup(items: ApiCategory[]): Pick<Lookups, 'categoryById' | 'categoryKeyToId'> {
  const categoryById: Lookups['categoryById'] = new Map();
  const categoryKeyToId: Lookups['categoryKeyToId'] = new Map();
  const add = (c: ApiCategory, parentName?: string) => {
    categoryById.set(c.id, { name: c.name, parentId: c.parentId ?? undefined, parentName });
    categoryKeyToId.set(c.id.toLowerCase(), c.id);
    categoryKeyToId.set(c.slug.toLowerCase(), c.id);
    categoryKeyToId.set(c.slug.toLowerCase().replace(/-/g, '_'), c.id);
    (c.children ?? []).forEach((child) => add(child, c.name));
  };
  items.forEach((c) => add(c));
  return { categoryById, categoryKeyToId };
}

export function buildAreaLookup(items: ApiArea[]): Pick<Lookups, 'areaById' | 'areaNameToId'> {
  const areaById: Lookups['areaById'] = new Map();
  const areaNameToId: Lookups['areaNameToId'] = new Map();
  for (const a of items) {
    areaById.set(a.id, a.name);
    areaNameToId.set(a.name.toLowerCase(), a.id);
  }
  return { areaById, areaNameToId };
}

// ---------- Small helpers ----------

const ICONS: Record<string, string> = {
  vehicles: 'Car',
  'real-estate': 'Home',
  'phones-and-electronics': 'Smartphone',
  'home-and-furniture': 'Armchair',
  services: 'Briefcase',
  other: 'Package',
};

export const maskedPhone = () => '+251 9•• ••• •••';

export function toFrontendCondition(c: 'new' | 'used'): Condition {
  return c === 'new' ? 'new' : 'used_good';
}

export function toApiCondition(c: Condition | ''): 'new' | 'used' | undefined {
  if (!c) return undefined;
  return c === 'new' ? 'new' : 'used';
}

export function monthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function resolveCategoryId(key: string | undefined, lookups: Pick<Lookups, 'categoryKeyToId'>): string | undefined {
  if (!key) return undefined;
  return lookups.categoryKeyToId.get(key.toLowerCase()) ?? key;
}

// ---------- Mappers ----------

export function mapUser(u: ApiUser): User {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name ?? '',
    role: u.role,
    privacy_accepted: true,
    created_at: u.createdAt,
  };
}

export function mapCategories(items: ApiCategory[]): Category[] {
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: ICONS[c.slug] ?? 'Package',
    description: '',
    itemCount: 0,
    subcategories: (c.children ?? []).map((child) => child.name),
    fields: c.fields?.map((f) => ({ key: f.key, label: f.label, type: f.type, options: f.options })),
  }));
}

function placeholderSeller(id = ''): Seller {
  return { id, name: 'Cone seller', phone_masked: maskedPhone(), joined_at: '', verified: false };
}

export function mapSeller(s: ApiSeller): Seller {
  return {
    id: s.id,
    name: s.name?.trim() || 'Cone seller',
    phone_masked: maskedPhone(),
    joined_at: monthYear(s.memberSince),
    total_listings: s.activeListings,
    verified: false,
  };
}

export function mapListingSummary(s: ApiListingSummary, lookups: Lookups): Listing {
  const cat = lookups.categoryById.get(s.categoryId);
  return {
    id: s.id,
    title: s.title,
    description: '',
    price: s.priceEtb,
    currency: 'ETB',
    is_negotiable: s.negotiable,
    category_id: cat?.parentId ?? s.categoryId,
    category_name: cat?.parentName ?? cat?.name ?? '',
    subcategory: cat?.parentName ? cat.name : undefined,
    area: s.areaName,
    condition: toFrontendCondition(s.condition),
    images: s.coverThumbUrl ? [s.coverThumbUrl] : [],
    attributes: {},
    status: 'active',
    views_count: 0,
    favorites_count: 0,
    created_at: s.createdAt,
    updated_at: s.createdAt,
    seller: placeholderSeller(),
  };
}

export function mapListing(l: ApiListing, lookups: Lookups): Listing {
  const cat = lookups.categoryById.get(l.categoryId);
  const seller = mapSeller(l.seller);
  if (l.contact?.telegram) seller.telegram_username = l.contact.telegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
  if (l.contact?.email) seller.email = l.contact.email;
  return {
    id: l.id,
    title: l.title,
    description: l.description,
    price: l.priceEtb,
    currency: 'ETB',
    is_negotiable: l.negotiable,
    category_id: cat?.parentId ?? l.categoryId,
    category_name: cat?.parentName ?? cat?.name ?? '',
    subcategory: cat?.parentName ? cat.name : undefined,
    area: lookups.areaById.get(l.areaId) ?? '',
    condition: toFrontendCondition(l.condition),
    images: [...l.images].sort((a, b) => a.order - b.order).map((i) => i.url),
    attributes: l.attributes ?? {},
    status: l.status,
    rejection_reason: l.rejectReason ?? undefined,
    show_phone: l.contact?.showPhone,
    contact: {
      show_phone: l.contact?.showPhone ?? true,
      telegram_username: seller.telegram_username,
      email: l.contact?.email ?? undefined,
    },
    images_meta: [...l.images]
      .sort((x, y) => x.order - y.order)
      .map((i, idx) => ({ id: i.id, url: i.url, is_cover: idx === 0 })),
    views_count: 0,
    favorites_count: 0,
    created_at: l.createdAt,
    updated_at: l.updatedAt,
    seller,
    is_favorited: l.isFavorite,
  };
}

// ---------- Requests ----------

export function buildListingsParams(
  query: ListingsQuery,
  lookups: Pick<Lookups, 'categoryKeyToId' | 'areaNameToId'>
): URLSearchParams {
  const p = new URLSearchParams();
  if (query.page) p.set('page', String(query.page));
  if (query.limit) p.set('pageSize', String(Math.min(query.limit, 50)));
  const categoryId = resolveCategoryId(query.category, lookups);
  if (categoryId) p.set('categoryId', categoryId);
  if (query.area) {
    const areaId = lookups.areaNameToId.get(query.area.toLowerCase());
    if (areaId) p.set('areaId', areaId);
  }
  const condition = toApiCondition(query.condition ?? '');
  if (condition) p.set('condition', condition);
  if (query.min_price) p.set('minPrice', String(query.min_price));
  if (query.max_price) p.set('maxPrice', String(query.max_price));
  if (query.q?.trim()) p.set('q', query.q.trim());
  // The backend has no "popular" sort yet; use newest.
  p.set('sort', query.sort === 'price_asc' || query.sort === 'price_desc' ? query.sort : 'newest');
  return p;
}

// Frontend report reasons -> backend reasons.
export function mapReportReason(reason: ReportPayload['reason']): string {
  switch (reason) {
    case 'fraud':
      return 'scam';
    case 'inappropriate':
      return 'prohibited_item';
    case 'duplicate':
      return 'duplicate';
    case 'wrong_category':
      return 'wrong_category';
    default:
      return 'other'; // spam, sold, other
  }
}

// Leaf category the backend needs: the app keeps the parent id plus a subcategory name.
export function resolveLeafCategoryId(
  parentKey: string,
  subcategoryName: string | undefined,
  tree: ApiCategory[]
): string {
  const parent = tree.find((c) => c.id === parentKey || c.slug === parentKey);
  if (!parent) return parentKey;
  const children = parent.children ?? [];
  if (children.length === 0) return parent.id;
  const child = children.find((c) => c.name.toLowerCase() === (subcategoryName ?? '').toLowerCase());
  return (child ?? children[0]).id;
}

// Backend field names -> the names the pages look for.
export function mapFieldErrors(fields?: Record<string, string>): Record<string, string> | undefined {
  if (!fields) return fields;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k === 'priceEtb' ? 'price' : k === 'photos' ? 'images' : k] = v;
  }
  return out;
}

export function toApiStatusAction(a: string): string {
  const x = a.toLowerCase();
  if (x === 'sold' || x === 'mark_sold') return 'mark_sold';
  if (x === 'paused' || x === 'pause') return 'pause';
  if (x === 'active' || x === 'resume') return 'resume';
  return x; // renew
}

export function toApiStatusFilter(s?: string): string | undefined {
  if (!s || s === 'all') return undefined;
  return s === 'waiting_for_review' ? 'pending_review' : s;
}
