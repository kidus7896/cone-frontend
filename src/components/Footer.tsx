import React from 'react';
import { MapPin, ShieldCheck, PhoneCall, AlertTriangle } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { ADDIS_ABABA_AREAS } from '../api/client';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer className="border-t border-slate-200 bg-white pt-10 pb-20 md:pb-12 text-slate-600 text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Addis Ababa Trust & Safety Banner */}
        <div className="mb-10 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 border border-emerald-200/60 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-slate-900">
                Safe Trading in Addis Ababa
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Meet in well-lit, public areas such as Bole Edna Mall, Dembel City Center, or Kazanchis. Always physically inspect vehicles, apartments, or electronics in daylight before any payment.
                <strong className="text-emerald-800 font-semibold"> Never send advance mobile bank transfers or deposits.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-1">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer mb-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-extrabold text-base">
                ▲
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">CONE</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              The direct community classifieds for Addis Ababa, Ethiopia. Fast, clean, and authentic local peer-to-peer commerce.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Addis Ababa, Ethiopia</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Top Categories
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigate('/browse?category=vehicles')}
                  className="hover:text-emerald-600 transition-colors"
                >
                  Vehicles & Cars
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/browse?category=real_estate')}
                  className="hover:text-emerald-600 transition-colors"
                >
                  Real Estate & Rentals
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/browse?category=electronics')}
                  className="hover:text-emerald-600 transition-colors"
                >
                  Phones & Electronics
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/browse?category=home_furniture')}
                  className="hover:text-emerald-600 transition-colors"
                >
                  Home & Furniture
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/browse?category=fashion_beauty')}
                  className="hover:text-emerald-600 transition-colors"
                >
                  Traditional Habesha Wear
                </button>
              </li>
            </ul>
          </div>

          {/* Addis Ababa Subcities */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Popular Subcities
            </h5>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
              {ADDIS_ABABA_AREAS.slice(0, 8).map((area) => (
                <li key={area}>
                  <button
                    onClick={() => navigate(`/browse?area=${encodeURIComponent(area)}`)}
                    className="hover:text-emerald-600 transition-colors truncate"
                  >
                    {area}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety & Help */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Community & Safety
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-700 font-medium">Verified local sellers</span>
              </li>
              <li>
                <span className="text-slate-700 font-medium">Direct phone & Telegram</span>
              </li>
              <li>
                <span className="text-slate-700 font-medium">No hidden fees</span>
              </li>
              <li>
                <button
                  onClick={() => navigate('/signin')}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  Sign in with Ethiopian Mobile
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} Cone Marketplace. Built for Addis Ababa, Ethiopia.
          </div>
          <div className="flex gap-4">
            <span>English / አማርኛ</span>
            <span>•</span>
            <span>Community Rules</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
