import {
  Listing,
  ListingsQuery,
  ListingsResponse,
  Category,
  User,
  AuthResponse,
  RevealPhoneResponse,
  ReportPayload,
  ReportResponse,
  ApiErrorPayload,
} from '../types';
import {
  buildAreaLookup,
  buildCategoryLookup,
  buildListingsParams,
  mapCategories,
  mapListing,
  mapListingSummary,
  mapReportReason,
  mapSeller,
  mapUser,
  type ApiArea,
  type ApiCategory,
  type ApiListing,
  type ApiListingSummary,
  type ApiSeller,
  type ApiUser,
  type Lookups,
} from './adapter';

// Read configuration from Vite env
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // Default to true for out-of-the-box readiness

const TOKEN_KEY = 'cone_auth_token';
const DEVICE_ID_KEY = 'cone_device_id';
const FAVORITES_KEY = 'cone_favorites';
const REVEALED_PHONES_KEY = 'cone_revealed_phones';

/**
 * Get or generate persistent random device ID
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Auth token helpers
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Custom API Error class matching { error: { code, message, fields } }
 */
export class ConeApiError extends Error {
  code: string;
  fields?: Record<string, string>;

  constructor(code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ConeApiError';
    this.code = code;
    this.fields = fields;
  }
}

// -------------------------------------------------------------
// REALISTIC MOCK DATA (Addis Ababa Classifieds)
// -------------------------------------------------------------

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'vehicles',
    name: 'Vehicles',
    slug: 'vehicles',
    icon: 'Car',
    description: 'Cars, SUVs, motorbikes, and commercial trucks in Addis Ababa',
    itemCount: 412,
    subcategories: ['Sedan', 'SUV & 4WD', 'Hatchback', 'Minibus & Van', 'Motorcycle', 'Commercial Trucks'],
    fields: [
      { key: 'make', label: 'Make', type: 'select', options: ['Toyota', 'Hyundai', 'Suzuki', 'Volkswagen', 'Kia', 'Ford', 'Other'] },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'transmission', label: 'Transmission', type: 'select', options: ['Automatic', 'Manual'] },
      { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'] },
      { key: 'mileage_km', label: 'Mileage', type: 'number', unit: 'km' },
    ],
  },
  {
    id: 'real_estate',
    name: 'Real Estate & Rentals',
    slug: 'real-estate',
    icon: 'Home',
    description: 'Apartments for rent, villas, condominiums, and commercial office space',
    itemCount: 289,
    subcategories: ['Apartments for Rent', 'Apartments for Sale', 'Condominiums', 'Villas & Houses', 'Commercial & Offices', 'Land & Plots'],
    fields: [
      { key: 'property_type', label: 'Property Type', type: 'select', options: ['Apartment', 'Condo', 'Villa', 'Townhouse', 'Office'] },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
      { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
      { key: 'area_sqm', label: 'Area', type: 'number', unit: 'm²' },
      { key: 'furnished', label: 'Furnished', type: 'select', options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'] },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics & Mobiles',
    slug: 'electronics',
    icon: 'Smartphone',
    description: 'Smartphones, laptops, TVs, cameras, gaming consoles, and accessories',
    itemCount: 654,
    subcategories: ['Mobile Phones', 'Laptops & Computers', 'Tablets', 'Audio & Headphones', 'TVs & Home Audio', 'Cameras'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'storage', label: 'Storage', type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      { key: 'ram', label: 'RAM', type: 'select', options: ['4GB', '8GB', '16GB', '32GB', '64GB'] },
      { key: 'battery_health', label: 'Battery Health', type: 'text' },
    ],
  },
  {
    id: 'home_furniture',
    name: 'Home & Furniture',
    slug: 'home-furniture',
    icon: 'Armchair',
    description: 'Sofas, beds, dining sets, kitchen appliances, and home decor',
    itemCount: 198,
    subcategories: ['Living Room', 'Bedroom & Beds', 'Kitchen & Dining', 'Appliances', 'Office Furniture', 'Rugs & Curtains'],
  },
  {
    id: 'fashion_beauty',
    name: 'Fashion & Beauty',
    slug: 'fashion-beauty',
    icon: 'Shirt',
    description: 'Traditional Habesha clothing, shoes, watches, jewelry, and bags',
    itemCount: 145,
    subcategories: ['Traditional Habesha Kemis', 'Men’s Clothing', 'Women’s Clothing', 'Watches & Jewelry', 'Shoes & Boots', 'Bags'],
  },
  {
    id: 'jobs',
    name: 'Jobs & Services',
    slug: 'jobs-services',
    icon: 'Briefcase',
    description: 'Local services, technicians, drivers, tutors, and job openings',
    itemCount: 92,
    subcategories: ['Driver & Logistics', 'Home Repair & Electrician', 'Software & Design', 'Lessons & Tutoring', 'Cleaning & Housekeeping'],
  },
  {
    id: 'commercial_machinery',
    name: 'Commercial & Equipment',
    slug: 'commercial-machinery',
    icon: 'Cog',
    description: 'Generators, coffee processing machines, construction tools, and salon gear',
    itemCount: 76,
    subcategories: ['Generators & Power', 'Coffee Processing', 'Construction Gear', 'Restaurant & Cafe', 'Salon Equipment'],
  },
];

export const ADDIS_ABABA_AREAS: string[] = [
  'Bole',
  'Kazanchis',
  'Piassa',
  'Sarbet',
  'CMC',
  'Megenagna',
  'Gerji',
  'Hayahulet',
  'Old Airport',
  'Ayat',
  'Summit',
  'Lebu',
  'Gullele',
  'Lideta',
  'Kirkos',
  'Nifas Silk',
  'Yeka',
];

const INITIAL_MOCK_LISTINGS: Listing[] = [
  {
    id: 'cone-101',
    title: 'Toyota Vitz 2018 Automatic - Very Clean, Low Mileage',
    slug: 'toyota-vitz-2018-automatic-bole',
    description: 'Selling my personal Toyota Vitz 2018 model. Automatic transmission, pearl white exterior, spotless interior. Only driven 42,000 km in Addis Ababa. Full service history with Toyota Ethiopia. AC ice cold, original paint, zero accident history. Ready for inspection near Edna Mall.',
    price: 3650000,
    currency: 'ETB',
    is_negotiable: true,
    category_id: 'vehicles',
    category_name: 'Vehicles',
    subcategory: 'Hatchback',
    area: 'Bole',
    subcity: 'Bole Subcity',
    landmark: 'Near Edna Mall & Rwanda Embassy',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    ],
    attributes: {
      make: 'Toyota',
      model: 'Vitz',
      year: 2018,
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      mileage_km: 42000,
    },
    status: 'active',
    views_count: 342,
    favorites_count: 28,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    seller: {
      id: 'sel_01',
      name: 'Yonas Tadesse',
      phone_masked: '+251 91 ••• ••34',
      phone_revealed: '+251 91 123 4534',
      telegram_username: 'yonas_t',
      email: 'yonas.t@example.com',
      joined_at: '2023-04-12',
      rating: 4.9,
      total_listings: 4,
      verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
  },
  {
    id: 'cone-102',
    title: 'Modern 2-Bedroom Furnished Apartment in Bole Atlas with Generator',
    slug: 'modern-2-bedroom-apartment-bole-atlas',
    description: 'Spacious 125 sqm luxury apartment in the heart of Bole Atlas. 2 master bedrooms with en-suite bathrooms, guest washroom, modern open kitchen with built-in oven, washing machine, backup generator 24/7, reserve water tank, underground parking, and biometric security entrance. Monthly rental agreement.',
    price: 68000,
    currency: 'ETB',
    is_negotiable: false,
    category_id: 'real_estate',
    category_name: 'Real Estate & Rentals',
    subcategory: 'Apartments for Rent',
    area: 'Bole',
    subcity: 'Bole Subcity',
    landmark: 'Atlas Hotel area, 2 min from Checheho',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
    ],
    attributes: {
      property_type: 'Apartment',
      bedrooms: 2,
      bathrooms: 2.5,
      area_sqm: 125,
      furnished: 'Fully Furnished',
    },
    status: 'active',
    views_count: 520,
    favorites_count: 47,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2h ago
    updated_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    seller: {
      id: 'sel_02',
      name: 'Selam Properties',
      phone_masked: '+251 92 ••• ••88',
      phone_revealed: '+251 92 845 1288',
      telegram_username: 'selam_properties_et',
      email: 'rentals@selamprop.et',
      joined_at: '2022-09-01',
      rating: 5.0,
      total_listings: 12,
      verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
  },
  {
    id: 'cone-103',
    title: 'iPhone 15 Pro 256GB Natural Titanium (Dual SIM Physical + eSIM)',
    slug: 'iphone-15-pro-256gb-natural-titanium',
    description: 'iPhone 15 Pro 256GB in pristine condition. Natural Titanium color. Battery health is at 96%. Includes original Apple USB-C cable and high-grade Spigen casing. No scratches or dents. Works perfectly on Ethio Telecom and Safaricom 5G networks. Price is slightly negotiable for serious buyers.',
    price: 138000,
    currency: 'ETB',
    is_negotiable: true,
    category_id: 'electronics',
    category_name: 'Electronics & Mobiles',
    subcategory: 'Mobile Phones',
    area: 'Kazanchis',
    subcity: 'Kirkos Subcity',
    landmark: 'Behind UNECA, near Intercontinental',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80',
    ],
    attributes: {
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      storage: '256GB',
      ram: '8GB',
      battery_health: '96%',
    },
    status: 'active',
    views_count: 810,
    favorites_count: 65,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4h ago
    updated_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    seller: {
      id: 'sel_03',
      name: 'Dawit Mekonnen',
      phone_masked: '+251 97 ••• ••19',
      phone_revealed: '+251 97 314 9019',
      telegram_username: 'dawit_tech_et',
      joined_at: '2023-11-15',
      rating: 4.8,
      total_listings: 6,
      verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
  },
  {
    id: 'cone-104',
    title: 'Solid Ethiopian Wanza Wood Dining Table + 6 Handcrafted Chairs',
    slug: 'solid-wanza-wood-dining-table-sarbet',
    description: 'Custom-made dining set crafted from seasoned Ethiopian Wanza hardwood. Includes heavy dining table (2.1m x 1m) and 6 matching high-back chairs upholstered with durable woven fabric. Natural satin lacquer finish highlights the wood grain. Moving out of country so selling at a great discount.',
    price: 85000,
    currency: 'ETB',
    is_negotiable: true,
    category_id: 'home_furniture',
    category_name: 'Home & Furniture',
    subcategory: 'Kitchen & Dining',
    area: 'Sarbet',
    subcity: 'Kirkos Subcity',
    landmark: 'Behind Bisrate Gabriel Church',
    condition: 'used_good',
    images: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    ],
    attributes: {
      material: 'Solid Wanza Hardwood',
      seats: 6,
      finish: 'Satin Clear Varnish',
    },
    status: 'active',
    views_count: 215,
    favorites_count: 19,
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    seller: {
      id: 'sel_04',
      name: 'Marta Assefa',
      phone_masked: '+251 93 ••• ••72',
      phone_revealed: '+251 93 412 8872',
      email: 'marta.design@gmail.com',
      joined_at: '2024-01-20',
      rating: 4.7,
      total_listings: 2,
      verified: false,
    },
  },
  {
    id: 'cone-105',
    title: 'MacBook Pro 14" M3 Pro Chip (18GB Unified RAM, 512GB SSD) Space Black',
    slug: 'macbook-pro-14-m3-pro-space-black',
    description: 'Bought in UK 4 months ago. Battery cycle count only 24. 100% capacity. Space Black color with 70W MagSafe charger and original retail box. Perfect for developers, video editors, and designers in Addis. Keyboard layout is UK/US QWERTY.',
    price: 265000,
    currency: 'ETB',
    is_negotiable: false,
    category_id: 'electronics',
    category_name: 'Electronics & Mobiles',
    subcategory: 'Laptops & Computers',
    area: 'CMC',
    subcity: 'Yeka Subcity',
    landmark: 'CMC Michael, Near Sunshine Real Estate',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80',
    ],
    attributes: {
      brand: 'Apple',
      model: 'MacBook Pro 14" M3 Pro',
      ram: '18GB',
      storage: '512GB SSD',
    },
    status: 'active',
    views_count: 630,
    favorites_count: 53,
    created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    seller: {
      id: 'sel_01',
      name: 'Yonas Tadesse',
      phone_masked: '+251 91 ••• ••34',
      phone_revealed: '+251 91 123 4534',
      telegram_username: 'yonas_t',
      joined_at: '2023-04-12',
      rating: 4.9,
      total_listings: 4,
      verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
  },
  {
    id: 'cone-106',
    title: 'G+2 Luxury Villa with Garden & Security Room in Old Airport',
    slug: 'g-plus-2-villa-old-airport-addis',
    description: 'Immaculate residence in prestigious Old Airport district, walking distance to ICS International Community School and Golf Club. 4 spacious bedrooms, master with jacuzzi and walk-in closet, 2 family rooms, modern Italian kitchen plus separate dirty kitchen, servant quarters, landscaped garden, parking for 4 cars.',
    price: 32000000,
    currency: 'ETB',
    is_negotiable: true,
    category_id: 'real_estate',
    category_name: 'Real Estate & Rentals',
    subcategory: 'Villas & Houses',
    area: 'Old Airport',
    subcity: 'Nifas Silk Subcity',
    landmark: 'Behind Golf Club, near ICS',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    ],
    attributes: {
      property_type: 'Villa',
      bedrooms: 4,
      bathrooms: 4.5,
      area_sqm: 450,
      furnished: 'Unfurnished',
    },
    status: 'active',
    views_count: 940,
    favorites_count: 89,
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    seller: {
      id: 'sel_02',
      name: 'Selam Properties',
      phone_masked: '+251 92 ••• ••88',
      phone_revealed: '+251 92 845 1288',
      telegram_username: 'selam_properties_et',
      email: 'rentals@selamprop.et',
      joined_at: '2022-09-01',
      rating: 5.0,
      total_listings: 12,
      verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
  },
  {
    id: 'cone-107',
    title: 'Hyundai Tucson 2021 2.0L Petrol - Automatic Transmission',
    slug: 'hyundai-tucson-2021-automatic-gerji',
    description: 'Hyundai Tucson 2021 model, bought brand new from Marathon Motors Addis Ababa. Single owner, dealer serviced every 5,000 km. Panoramic sunroof, wireless phone charging, lane keep assist, rear camera. Mileage: 38,000 km. Selling due to relocation.',
    price: 6800000,
    currency: 'ETB',
    is_negotiable: true,
    category_id: 'vehicles',
    category_name: 'Vehicles',
    subcategory: 'SUV & 4WD',
    area: 'Gerji',
    subcity: 'Bole Subcity',
    landmark: 'Imperial roundabout, next to Roba Bakery',
    condition: 'like_new',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
    ],
    attributes: {
      make: 'Hyundai',
      model: 'Tucson',
      year: 2021,
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      mileage_km: 38000,
    },
    status: 'active',
    views_count: 480,
    favorites_count: 36,
    created_at: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
    seller: {
      id: 'sel_05',
      name: 'Amanuel Kebede',
      phone_masked: '+251 91 ••• ••45',
      phone_revealed: '+251 91 290 8845',
      telegram_username: 'amanuel_k',
      joined_at: '2023-08-10',
      rating: 4.9,
      total_listings: 1,
      verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
  },
  {
    id: 'cone-108',
    title: 'Custom Hand-Embroidered Habesha Kemis (Traditional Dress) - Pure Shemane Cotton',
    slug: 'custom-habesha-kemis-piassa',
    description: 'Gorgeous modern Ethiopian traditional dress (ሀበሻ ቀሚስ) with intricate gold and emerald green Tilf embroidery. Made from lightweight high-grade handwoven Shemane cotton from Chencha. Comes with matching Netela (ነጠላ). Perfect for weddings, holidays, and celebrations. Size: Medium / Adjustable.',
    price: 32000,
    currency: 'ETB',
    is_negotiable: false,
    category_id: 'fashion_beauty',
    category_name: 'Fashion & Beauty',
    subcategory: 'Traditional Habesha Kemis',
    area: 'Piassa',
    subcity: 'Arada Subcity',
    landmark: 'Churchill Road, near Degol Square',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
    ],
    attributes: {
      fabric: '100% Ethiopian Handwoven Shemane Cotton',
      embroidery: 'Handmade Gold & Green Tilf',
      includes: 'Matching Netela',
      size: 'Medium (Adjustable fit)',
    },
    status: 'active',
    views_count: 310,
    favorites_count: 42,
    created_at: new Date(Date.now() - 1000 * 60 * 1100).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 1100).toISOString(),
    seller: {
      id: 'sel_06',
      name: 'Helen Shemane Boutique',
      phone_masked: '+251 94 ••• ••60',
      phone_revealed: '+251 94 456 7860',
      telegram_username: 'helen_kemis',
      joined_at: '2023-01-14',
      rating: 5.0,
      total_listings: 9,
      verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    },
  },
  {
    id: 'cone-109',
    title: 'Commercial Silent Diesel Generator 25kVA Perkins Engine',
    slug: 'perkins-silent-generator-25kva-megenagna',
    description: 'High capacity 25 kVA soundproof canopy diesel generator with reliable Perkins engine and Stamford alternator. Automatic transfer switch (ATS) included. Perfect for cafes, clinics, supermarkets, or offices in Addis Ababa with frequent power cuts. 0 hours on meter, brand new with 1 year warranty.',
    price: 950000,
    currency: 'ETB',
    is_negotiable: true,
    category_id: 'commercial_machinery',
    category_name: 'Commercial & Equipment',
    subcategory: 'Generators & Power',
    area: 'Megenagna',
    subcity: 'Yeka Subcity',
    landmark: 'Zefmesh Grand Mall Area',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    ],
    attributes: {
      capacity: '25 kVA',
      engine: 'Perkins Diesel',
      soundproof: 'Yes (Silent Canopy)',
      warranty: '12 Months',
    },
    status: 'active',
    views_count: 180,
    favorites_count: 15,
    created_at: new Date(Date.now() - 1000 * 60 * 1400).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 1400).toISOString(),
    seller: {
      id: 'sel_07',
      name: 'Ethio Power Equipment',
      phone_masked: '+251 90 ••• ••11',
      phone_revealed: '+251 90 912 3411',
      telegram_username: 'ethio_power_sales',
      joined_at: '2022-05-18',
      rating: 4.6,
      total_listings: 15,
      verified: true,
    },
  },
];

// Helper to get favorites from storage
function getStoredFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveStoredFavorites(favs: Set<string>): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favs)));
}

// Helper to get revealed phones from storage
function getStoredRevealedPhones(): Record<string, string> {
  try {
    const raw = localStorage.getItem(REVEALED_PHONES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredRevealedPhone(id: string, phone: string): void {
  const map = getStoredRevealedPhones();
  map[id] = phone;
  localStorage.setItem(REVEALED_PHONES_KEY, JSON.stringify(map));
}

// -------------------------------------------------------------
// UNIFIED API CLIENT
// -------------------------------------------------------------

class ConeApiClient {
  private baseUrl: string;
  private useMock: boolean;
  private mockListings: Listing[];
  private lookups: Lookups | null = null;

  /** Real API only: load categories and areas once, so ids can be shown as names. */
  private async getLookups(): Promise<Lookups> {
    if (this.lookups) return this.lookups;
    const [cats, areas] = await Promise.all([
      this.request<{ items: ApiCategory[] }>('/categories'),
      this.request<{ items: ApiArea[] }>('/areas'),
    ]);
    this.lookups = { ...buildCategoryLookup(cats.items), ...buildAreaLookup(areas.items) };
    return this.lookups;
  }

  constructor() {
    this.baseUrl = BASE_URL;
    this.useMock = USE_MOCK;
    this.mockListings = [...INITIAL_MOCK_LISTINGS];
  }

  /**
   * Core request dispatch
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        const errorPayload: ApiErrorPayload = data || {
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText || 'An unexpected server error occurred',
          },
        };
        throw new ConeApiError(
          errorPayload.error.code,
          errorPayload.error.message,
          errorPayload.error.fields
        );
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ConeApiError) {
        throw err;
      }
      throw new ConeApiError(
        'NETWORK_ERROR',
        err.message || 'Unable to connect to Cone server. Please check your connection.'
      );
    }
  }

  // -----------------------------------------------------------
  // AUTH ENDPOINTS
  // -----------------------------------------------------------

  /**
   * Request 6-digit OTP code to Ethiopian phone number
   */
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    // Validate Ethiopian phone format
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    const isEthio = /^(?:\+251|0)?(9|7)\d{8}$/.test(cleaned);

    if (!isEthio) {
      throw new ConeApiError(
        'INVALID_PHONE',
        'Please enter a valid Ethiopian phone number starting with 09, 07, or +251.',
        { phone: 'Must be an Ethio Telecom (09) or Safaricom (07) mobile number' }
      );
    }

    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 400));
      return {
        success: true,
        message: `6-digit verification code sent to ${phone}. (Mock code: 123456)`,
      };
    }

    await this.request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return { success: true, message: `A 6-digit code was sent to ${phone}.` };
  }

  /**
   * Verify 6-digit OTP code and exchange for bearer token
   */
  async verifyOtp(
    phone: string,
    code: string,
    privacyConsent: boolean = true
  ): Promise<AuthResponse> {
    if (!code || code.trim().length !== 6) {
      throw new ConeApiError(
        'INVALID_OTP',
        'The verification code must be exactly 6 digits.',
        { code: 'Enter the 6-digit SMS code' }
      );
    }

    if (!privacyConsent) {
      throw new ConeApiError(
        'CONSENT_REQUIRED',
        'You must accept the terms of service and privacy consent to continue.',
        { privacy_consent: 'Consent required' }
      );
    }

    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 500));
      // In mock mode, allow 123456 or any 6-digit number
      if (code !== '123456' && !/^\d{6}$/.test(code)) {
        throw new ConeApiError('OTP_EXPIRED', 'Invalid or expired verification code. Use 123456 for mock test.');
      }

      const mockUser: User = {
        id: 'usr_' + phone.replace(/\D/g, '').slice(-6),
        phone: phone.startsWith('+251') ? phone : `+251${phone.replace(/^0/, '')}`,
        name: 'Addis User (' + phone.slice(-4) + ')',
        role: phone.endsWith('9999') ? 'super_admin' : phone.endsWith('8888') ? 'moderator' : 'user',
        privacy_accepted: true,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        created_at: new Date().toISOString(),
      };

      const token = 'mock_jwt_token_' + Math.random().toString(36).substring(2);
      setAuthToken(token);

      return {
        token,
        user: mockUser,
      };
    }

    const result = await this.request<{
      token?: string;
      user?: ApiUser;
      mfaRequired?: boolean;
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, consent: privacyConsent }),
    });

    if (result.mfaRequired || !result.token || !result.user) {
      throw new ConeApiError(
        'mfa_required',
        'Staff accounts need a second step (authenticator code), which this app does not have yet.'
      );
    }

    setAuthToken(result.token);
    return { token: result.token, user: mapUser(result.user) };
  }

  /**
   * Get current authenticated user session
   */
  async getMe(): Promise<{ user: User }> {
    const token = getAuthToken();
    if (!token) {
      throw new ConeApiError('UNAUTHENTICATED', 'No active session found.');
    }

    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 150));
      return {
        user: {
          id: 'usr_me_01',
          phone: '+251911234567',
          name: 'Addis Ababa Resident',
          role: 'user',
          privacy_accepted: true,
          created_at: '2024-02-01T00:00:00Z',
        },
      };
    }

    const me = await this.request<ApiUser>('/me');
    return { user: mapUser(me) };
  }

  /**
   * Sign out and clear stored session
   */
  async logout(): Promise<void> {
    try {
      if (!this.useMock) {
        await this.request('/auth/logout', { method: 'POST' });
      }
    } finally {
      clearAuthToken();
    }
  }

  // -----------------------------------------------------------
  // LISTINGS ENDPOINTS
  // -----------------------------------------------------------

  /**
   * Query listings with filters, search, sort, and pagination
   */
  async getListings(query: ListingsQuery = {}): Promise<ListingsResponse> {
    const favorites = getStoredFavorites();
    const revealedPhones = getStoredRevealedPhones();

    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 250));

      let filtered = [...this.mockListings];

      // Filter by Category
      if (query.category) {
        filtered = filtered.filter(
          (l) => l.category_id.toLowerCase() === query.category?.toLowerCase()
        );
      }

      // Filter by Subcategory
      if (query.subcategory) {
        filtered = filtered.filter(
          (l) => l.subcategory?.toLowerCase() === query.subcategory?.toLowerCase()
        );
      }

      // Filter by Area/Subcity
      if (query.area) {
        filtered = filtered.filter(
          (l) =>
            l.area.toLowerCase() === query.area?.toLowerCase() ||
            l.subcity?.toLowerCase().includes(query.area?.toLowerCase() || '')
        );
      }

      // Filter by Condition
      if (query.condition) {
        filtered = filtered.filter((l) => l.condition === query.condition);
      }

      // Filter by Negotiable
      if (query.is_negotiable !== undefined) {
        filtered = filtered.filter((l) => l.is_negotiable === query.is_negotiable);
      }

      // Filter by Min/Max Price
      if (query.min_price !== undefined && query.min_price > 0) {
        filtered = filtered.filter((l) => l.price >= query.min_price!);
      }
      if (query.max_price !== undefined && query.max_price > 0) {
        filtered = filtered.filter((l) => l.price <= query.max_price!);
      }

      // Search Query
      if (query.q && query.q.trim()) {
        const q = query.q.trim().toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.area.toLowerCase().includes(q) ||
            l.category_name.toLowerCase().includes(q)
        );
      }

      // Sort
      if (query.sort === 'price_asc') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (query.sort === 'price_desc') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (query.sort === 'popular') {
        filtered.sort((a, b) => b.views_count - a.views_count);
      } else {
        // Default newest
        filtered.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      // Inject favorites and revealed phones
      const page = query.page || 1;
      const limit = query.limit || 12;
      const total = filtered.length;
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit).map((l) => ({
        ...l,
        is_favorited: favorites.has(l.id),
        seller: {
          ...l.seller,
          phone_revealed: revealedPhones[l.id] || l.seller.phone_revealed,
        },
      }));

      return {
        listings: paged,
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    // Real API call
    const lookups = await this.getLookups();
    const params = buildListingsParams(query, lookups);
    const res = await this.request<{
      items: ApiListingSummary[];
      page: number;
      pageSize: number;
      total: number;
    }>(`/listings?${params.toString()}`);
    return {
      listings: res.items.map((i) => mapListingSummary(i, lookups)),
      total: res.total,
      page: res.page,
      limit: res.pageSize,
      total_pages: Math.max(1, Math.ceil(res.total / res.pageSize)),
    };
  }

  /**
   * Get single listing detail by ID
   */
  async getListingById(id: string): Promise<Listing> {
    const favorites = getStoredFavorites();
    const revealedPhones = getStoredRevealedPhones();

    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 200));
      const item = this.mockListings.find((l) => l.id === id);
      if (!item) {
        throw new ConeApiError('NOT_FOUND', `Listing with ID "${id}" was not found.`);
      }
      return {
        ...item,
        is_favorited: favorites.has(item.id),
        seller: {
          ...item.seller,
          phone_revealed: revealedPhones[item.id] || undefined,
        },
      };
    }

    const lookups = await this.getLookups();
    const raw = await this.request<ApiListing>(`/listings/${id}`);
    return mapListing(raw, lookups);
  }

  /**
   * Reveal phone number for a listing
   * REQUIRES sending "X-Device-Id" header with random ID from localStorage
   */
  async revealPhone(listingId: string): Promise<RevealPhoneResponse> {
    const deviceId = getDeviceId();

    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 350));
      const item = this.mockListings.find((l) => l.id === listingId);
      if (!item) {
        throw new ConeApiError('NOT_FOUND', 'Listing not found');
      }

      const revealed = item.seller.phone_revealed || '+251 91 123 4567';
      saveStoredRevealedPhone(listingId, revealed);

      return {
        phone: revealed,
        revealed_at: new Date().toISOString(),
      };
    }

    const res = await this.request<{ phone: string }>(`/listings/${listingId}/phone`, {
      method: 'POST',
      headers: {
        'X-Device-Id': deviceId,
      },
    });
    saveStoredRevealedPhone(listingId, res.phone);
    return { phone: res.phone, revealed_at: new Date().toISOString() };
  }

  /**
   * Toggle favorite state for a listing
   */
  async toggleFavorite(listingId: string): Promise<{ favorited: boolean }> {
    const favorites = getStoredFavorites();
    const isFav = favorites.has(listingId);

    if (!this.useMock) {
      // Server first: if the user is not signed in this throws and nothing is saved locally.
      await this.request(`/listings/${listingId}/favorite`, { method: isFav ? 'DELETE' : 'PUT' });
    }

    if (isFav) {
      favorites.delete(listingId);
    } else {
      favorites.add(listingId);
    }
    saveStoredFavorites(favorites);

    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 150));
    }
    return { favorited: !isFav };
  }

  /**
   * Report an ad/listing
   */
  async reportListing(listingId: string, payload: ReportPayload): Promise<ReportResponse> {
    if (!payload.reason) {
      throw new ConeApiError('INVALID_REPORT', 'A report reason must be selected.', {
        reason: 'Reason is required',
      });
    }

    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 400));
      return {
        success: true,
        message: 'Report received. Our Addis Ababa moderation team will review this ad.',
      };
    }

    await this.request(`/listings/${listingId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason: mapReportReason(payload.reason), note: payload.details }),
    });
    return { success: true, message: 'Report received. Our moderation team will review this ad.' };
  }

  /**
   * Get Categories list
   */
  async getCategories(): Promise<Category[]> {
    if (this.useMock) {
      return [...MOCK_CATEGORIES];
    }
    const lookups = await this.getLookups();
    void lookups; // also warms the cache used by listings
    const res = await this.request<{ items: ApiCategory[] }>('/categories');
    return mapCategories(res.items);
  }

  /**
   * Get Addis Ababa Areas list
   */
  async getAreas(): Promise<string[]> {
    if (this.useMock) {
      return [...ADDIS_ABABA_AREAS];
    }
    const res = await this.request<{ items: ApiArea[] }>('/areas');
    return Array.from(new Set(res.items.map((a) => a.name)));
  }

  /**
   * Get Seller Public Page info and their listings
   */
  async getSellerProfile(sellerId: string): Promise<{ seller: any; listings: Listing[] }> {
    if (this.useMock) {
      await new Promise((res) => setTimeout(res, 200));
      const sample = this.mockListings.find((l) => l.seller.id === sellerId) || this.mockListings[0];
      const sellerListings = this.mockListings.filter((l) => l.seller.id === sellerId);

      return {
        seller: {
          ...sample.seller,
          total_listings: sellerListings.length || 1,
        },
        listings: sellerListings.length > 0 ? sellerListings : [sample],
      };
    }

    const lookups = await this.getLookups();
    const [seller, list] = await Promise.all([
      this.request<ApiSeller>(`/sellers/${sellerId}`),
      this.request<{ items: ApiListingSummary[] }>(`/sellers/${sellerId}/listings?pageSize=50`),
    ]);
    return {
      seller: mapSeller(seller),
      listings: list.items.map((i) => mapListingSummary(i, lookups)),
    };
  }
}

// Single exported singleton instance containing EVERY API call
export const apiClient = new ConeApiClient();
