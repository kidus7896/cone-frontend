// Translates between the Cone backend (openapi.yaml: camelCase, priceEtb, categoryId...)
// and the shapes the pages already use (snake_case, price, category_id...).
// Pure functions only, so they are easy to test. Used by client.ts when VITE_USE_MOCK=false.
import type {
  AdminArea,
  AdminCategory,
  AdminDashboard,
  AdminListingItem,
  AdminReport,
  AdminUser,
  AuditLogEntry,
  Category,
  Condition,
  Listing,
  ListingsQuery,
  ReportPayload,
  Seller,
  User,
} from '../types';

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
  email?: string | null;
  areaId?: string | null;
  areaName?: string | null;
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

export function mapUser(u: ApiUser, lookups?: Lookups): User {
  const areaName = u.areaName ?? (u.areaId && lookups?.areaById ? lookups.areaById.get(u.areaId) : undefined);
  return {
    id: u.id,
    phone: u.phone,
    name: u.name ?? '',
    role: u.role,
    privacy_accepted: true,
    created_at: u.createdAt,
    email: u.email ?? undefined,
    area_id: u.areaId ?? undefined,
    area_name: areaName ?? undefined,
  };
}

const mapField = (f: NonNullable<ApiCategory['fields']>[number]) => ({
  key: f.key,
  label: f.label,
  type: f.type,
  options: f.options,
  required: f.required,
});

export function mapCategories(items: ApiCategory[]): Category[] {
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: ICONS[c.slug] ?? 'Package',
    description: '',
    itemCount: 0,
    subcategories: (c.children ?? []).map((child) => child.name),
    fields: c.fields?.map(mapField),
    subcategoryFields: Object.fromEntries(
      (c.children ?? []).filter((ch) => ch.fields?.length).map((ch) => [ch.name, ch.fields!.map(mapField)])
    ),
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
    const key = k.startsWith('attributes.') ? k.slice('attributes.'.length) : k;
    out[key === 'priceEtb' ? 'price' : key === 'photos' ? 'images' : key] = v;
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

// Form inputs give strings; the backend wants numbers for number fields.
export function coerceAttributes(
  attrs: Record<string, unknown>,
  leafCategoryId: string | undefined,
  tree: ApiCategory[]
): Record<string, unknown> {
  const all: ApiCategory[] = tree.flatMap((c) => [c, ...(c.children ?? [])]);
  const defs = all.find((c) => c.id === leafCategoryId)?.fields ?? [];
  const out: Record<string, unknown> = { ...attrs };
  for (const f of defs) {
    const v = out[f.key];
    if (f.type === 'number' && typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) {
      out[f.key] = Number(v);
    }
  }
  return out;
}

// ---------- Admin raw shapes & mappers ----------

export interface ApiAdminListing extends Partial<ApiListing> {
  id: string;
  title: string;
  priceEtb: number;
  categoryId: string;
  areaId?: string;
  areaName?: string;
  coverThumbUrl?: string | null;
  status: Listing['status'];
  submittedAt?: string;
  createdAt: string;
  updatedAt?: string;
  seller?: ApiSeller & { phone?: string };
  sellerName?: string | null;
}

export interface ApiAdminReport {
  id: string;
  listingId: string;
  listingTitle?: string;
  listing?: { id: string; title: string; status?: string };
  reporterId?: string;
  reporter?: { id: string; name?: string | null; phone?: string };
  reporterName?: string | null;
  reporterPhone?: string;
  reason: string;
  note?: string | null;
  details?: string | null;
  status: string;
  resolutionAction?: string | null;
  resolution?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface ApiAdminUser {
  id: string;
  name: string | null;
  phone: string;
  email?: string | null;
  role: User['role'];
  status?: 'active' | 'suspended';
  suspended?: boolean;
  statusReason?: string | null;
  suspendReason?: string | null;
  createdAt: string;
  listingsCount?: number;
  activeListings?: number;
}

export interface ApiAdminCategory extends ApiCategory {
  sortOrder?: number;
  isActive?: boolean;
  active?: boolean;
  children?: ApiAdminCategory[];
}

export interface ApiAdminArea extends ApiArea {
  isActive?: boolean;
  active?: boolean;
  sortOrder?: number;
}

export interface ApiAuditLogEntry {
  id: string;
  createdAt: string;
  actorId: string;
  actorName?: string | null;
  actorPhone?: string | null;
  actorRole?: string | null;
  actor?: { id: string; name?: string | null; phone?: string | null; role?: string | null };
  action: string;
  targetType?: string | null;
  entityType?: string | null;
  targetId?: string | null;
  entityId?: string | null;
  reason?: string | null;
  details?: Record<string, any> | null;
}

function humanizeMetricKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function mapAdminDashboard(raw: Record<string, any>): AdminDashboard {
  const knownKeys = new Set([
    'pendingListings',
    'pendingReviewListings',
    'pendingCount',
    'activeListings',
    'openReports',
    'totalUsers',
    'suspendedUsers',
    'resolvedReports',
  ]);

  const pendingListings = Number(
    raw.pendingListings ?? raw.pendingReviewListings ?? raw.pendingCount ?? 0
  );
  const activeListings = Number(raw.activeListings ?? 0);
  const openReports = Number(raw.openReports ?? raw.pendingReports ?? 0);
  const totalUsers = Number(raw.totalUsers ?? raw.usersCount ?? 0);
  const suspendedUsers =
    raw.suspendedUsers !== undefined ? Number(raw.suspendedUsers) : undefined;
  const resolvedReports =
    raw.resolvedReports !== undefined ? Number(raw.resolvedReports) : undefined;

  const extraCounts: Array<{ key: string; label: string; value: number }> = [];
  for (const [key, val] of Object.entries(raw)) {
    if (!knownKeys.has(key) && typeof val === 'number' && Number.isFinite(val)) {
      extraCounts.push({ key, label: humanizeMetricKey(key), value: val });
    }
  }

  return {
    pendingListings,
    activeListings,
    openReports,
    totalUsers,
    suspendedUsers,
    resolvedReports,
    extraCounts,
  };
}

export function mapAdminListing(item: ApiAdminListing, lookups: Lookups): AdminListingItem {
  const cat = lookups.categoryById.get(item.categoryId);
  const sellerObj = item.seller
    ? mapSeller(item.seller)
    : {
        id: '',
        name: item.sellerName?.trim() || 'Cone seller',
        phone_masked: maskedPhone(),
        joined_at: '',
        verified: false,
      };
  if (item.seller?.phone) {
    sellerObj.phone_revealed = item.seller.phone;
  }
  if (item.contact?.telegram) {
    sellerObj.telegram_username = item.contact.telegram.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
  }
  if (item.contact?.email) {
    sellerObj.email = item.contact.email;
  }

  const images =
    item.images && item.images.length > 0
      ? [...item.images].sort((a, b) => a.order - b.order).map((i) => i.url)
      : item.coverThumbUrl
      ? [item.coverThumbUrl]
      : [];

  return {
    id: item.id,
    title: item.title,
    description: item.description ?? '',
    price: item.priceEtb ?? 0,
    currency: 'ETB',
    is_negotiable: Boolean(item.negotiable),
    category_id: cat?.parentId ?? item.categoryId,
    category_name: cat?.parentName ?? cat?.name ?? '',
    subcategory: cat?.parentName ? cat.name : undefined,
    area: item.areaName ?? (item.areaId ? lookups.areaById.get(item.areaId) ?? '' : ''),
    condition: toFrontendCondition(item.condition ?? 'used'),
    images,
    images_meta: item.images
      ? [...item.images].sort((a, b) => a.order - b.order).map((i, idx) => ({ id: i.id, url: i.url, is_cover: idx === 0 }))
      : undefined,
    attributes: item.attributes ?? {},
    status: item.status,
    rejection_reason: item.rejectReason ?? undefined,
    show_phone: item.contact?.showPhone,
    contact: item.contact
      ? {
          show_phone: item.contact.showPhone,
          telegram_username: sellerObj.telegram_username,
          email: item.contact.email ?? undefined,
        }
      : undefined,
    views_count: 0,
    favorites_count: 0,
    created_at: item.createdAt,
    updated_at: item.updatedAt ?? item.createdAt,
    submitted_at: item.submittedAt ?? item.createdAt,
    seller: sellerObj,
  };
}

export function mapAdminReport(r: ApiAdminReport): AdminReport {
  return {
    id: r.id,
    listingId: r.listingId || r.listing?.id || '',
    listingTitle: r.listingTitle ?? r.listing?.title ?? 'Reported Listing',
    listingStatus: r.listing?.status,
    reporterId: r.reporterId ?? r.reporter?.id,
    reporterName: r.reporterName ?? r.reporter?.name ?? undefined,
    reporterPhone: r.reporterPhone ?? r.reporter?.phone ?? undefined,
    reason: r.reason,
    note: r.note ?? r.details ?? undefined,
    status: r.status,
    resolutionAction: r.resolutionAction ?? r.resolution ?? undefined,
    resolutionNote: r.resolutionNote ?? undefined,
    resolvedAt: r.resolvedAt ?? undefined,
    createdAt: r.createdAt,
  };
}

export function mapAdminUser(u: ApiAdminUser): AdminUser {
  const status: 'active' | 'suspended' =
    u.status === 'suspended' || u.suspended ? 'suspended' : 'active';
  return {
    id: u.id,
    name: u.name ?? '',
    phone: u.phone,
    email: u.email ?? undefined,
    role: u.role,
    status,
    statusReason: u.statusReason ?? u.suspendReason ?? undefined,
    createdAt: u.createdAt,
    listingsCount: u.listingsCount ?? u.activeListings,
  };
}

export function mapAdminCategory(c: ApiAdminCategory): AdminCategory {
  return {
    id: c.id,
    parentId: c.parentId ?? null,
    name: c.name,
    slug: c.slug,
    sortOrder: c.sortOrder,
    isActive: c.isActive ?? c.active ?? true,
    fields: (c.fields ?? []).map(mapField),
    children: (c.children ?? []).map(mapAdminCategory),
  };
}

export function mapAdminArea(a: ApiAdminArea): AdminArea {
  return {
    id: a.id,
    parentId: a.parentId ?? null,
    name: a.name,
    isActive: a.isActive ?? a.active ?? true,
    sortOrder: a.sortOrder,
  };
}

export function mapAuditLogEntry(e: ApiAuditLogEntry): AuditLogEntry {
  return {
    id: e.id,
    createdAt: e.createdAt,
    actorId: e.actorId || e.actor?.id || '',
    actorName: e.actorName ?? e.actor?.name ?? undefined,
    actorPhone: e.actorPhone ?? e.actor?.phone ?? undefined,
    actorRole: e.actorRole ?? e.actor?.role ?? undefined,
    action: e.action,
    targetType: e.targetType ?? e.entityType ?? undefined,
    targetId: e.targetId ?? e.entityId ?? undefined,
    reason: e.reason ?? undefined,
    details: e.details ?? undefined,
  };
}


// The backend returns admin categories as a flat list; the admin screen wants a tree.
export function nestAdminCategories<T extends { id: string; parentId?: string | null; children?: T[] }>(rows: T[]): T[] {
  const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] as T[] }]));
  const roots: T[] = [];
  for (const r of byId.values()) {
    const parent = r.parentId ? byId.get(r.parentId) : undefined;
    if (parent) parent.children!.push(r as T);
    else roots.push(r as T);
  }
  return roots;
}
