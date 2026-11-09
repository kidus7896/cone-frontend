import React from 'react';
import { Home, Search, PlusCircle, User, Heart } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';

export const MobileNav: React.FC = () => {
  const { path, navigate } = useRouter();
  const { isAuthenticated } = useAuth();

  const isHome = path === '/';
  const isBrowse = path.startsWith('/browse');
  const isSignIn = path === '/signin';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md md:hidden">
      {/* Home */}
      <button
        onClick={() => navigate('/')}
        className={`flex flex-col items-center justify-center gap-1 w-16 py-1 ${
          isHome ? 'text-emerald-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Home className="h-5 w-5" />
        <span className="text-[10px]">Home</span>
      </button>

      {/* Browse */}
      <button
        onClick={() => navigate('/browse')}
        className={`flex flex-col items-center justify-center gap-1 w-16 py-1 ${
          isBrowse ? 'text-emerald-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Search className="h-5 w-5" />
        <span className="text-[10px]">Browse</span>
      </button>

      {/* Center Post Button */}
      <button
        onClick={() => {
          if (!isAuthenticated) {
            navigate('/signin?redirect=/post');
          } else {
            navigate('/post');
          }
        }}
        className="flex -mt-5 flex-col items-center justify-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg active:scale-95 transition-transform">
          <PlusCircle className="h-6 w-6" />
        </div>
        <span className="text-[10px] font-bold text-slate-800 mt-1">Post Ad</span>
      </button>

      {/* Favorites / Saved */}
      <button
        onClick={() => navigate('/browse?saved=true')}
        className="flex flex-col items-center justify-center gap-1 w-16 py-1 text-slate-500 hover:text-emerald-600"
      >
        <Heart className="h-5 w-5" />
        <span className="text-[10px]">Saved</span>
      </button>

      {/* Account / Sign In */}
      <button
        onClick={() => {
          if (isAuthenticated) {
            navigate('/browse');
          } else {
            navigate('/signin');
          }
        }}
        className={`flex flex-col items-center justify-center gap-1 w-16 py-1 ${
          isSignIn ? 'text-emerald-600 font-bold' : 'text-slate-500'
        }`}
      >
        <User className="h-5 w-5" />
        <span className="text-[10px]">{isAuthenticated ? 'Account' : 'Sign In'}</span>
      </button>
    </nav>
  );
};
