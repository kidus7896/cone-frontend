import React, { useEffect, useState } from 'react';
import { CheckCircle2, MapPin, Calendar, Phone, ArrowLeft } from 'lucide-react';
import { Listing, Seller } from '../types';
import { apiClient } from '../api/client';
import { useRouter } from '../context/RouterContext';
import { ListingCard } from '../components/ListingCard';
import { ErrorMessage } from '../components/ErrorMessage';

interface SellerProfileProps {
  id: string;
}

export const SellerProfile: React.FC<SellerProfileProps> = ({ id }) => {
  const { navigate, setMeta } = useRouter();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.getSellerProfile(id);
        setSeller(data.seller);
        setListings(data.listings);

        setMeta(
          `${data.seller.name} - Verified Seller on Cone Addis Ababa`,
          `Check out active classifieds listings by ${data.seller.name} in Addis Ababa, Ethiopia.`
        );
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeller();
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 animate-pulse space-y-4">
        <div className="h-20 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="h-56 sm:h-64 bg-slate-200 rounded-xl sm:rounded-2xl" />
          <div className="h-56 sm:h-64 bg-slate-200 rounded-xl sm:rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <ErrorMessage error={error || 'Seller not found'} className="mb-4" />
        <button
          onClick={() => navigate('/browse')}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white py-4 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {seller.avatar_url ? (
                <img
                  src={seller.avatar_url}
                  alt={seller.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-2xl">
                  {seller.name.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900">{seller.name}</h1>
                  {seller.verified && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Verified Addis Seller</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {seller.joined_at}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-800">
                    {listings.length} Active Listings
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          All Listings by {seller.name} ({listings.length})
        </h2>

        {listings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-sm">
            No active listings found for this seller.
          </div>
        )}
      </div>
    </div>
  );
};
