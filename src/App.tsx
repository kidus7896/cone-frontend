import React from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { ListingDetail } from './pages/ListingDetail';
import { SignIn } from './pages/SignIn';
import { SellerProfile } from './pages/SellerProfile';

import { PostListing } from './pages/PostListing';
import { MyListings } from './pages/MyListings';

function AppContent() {
  const { path } = useRouter();

  // Match routes
  const listingMatch = path.match(/^\/listing\/([^/?#]+)/);
  const sellerMatch = path.match(/^\/seller\/([^/?#]+)/);

  let pageContent: React.ReactNode = null;

  if (listingMatch) {
    pageContent = <ListingDetail id={listingMatch[1]} />;
  } else if (sellerMatch) {
    pageContent = <SellerProfile id={sellerMatch[1]} />;
  } else if (path === '/post') {
    pageContent = <PostListing />;
  } else if (path === '/my/listings') {
    pageContent = <MyListings />;
  } else if (path === '/browse') {
    pageContent = <Browse />;
  } else if (path === '/signin') {
    pageContent = <SignIn />;
  } else if (path === '/' || path === '') {
    pageContent = <Home />;
  } else {
    // Fallback 404 or redirect
    pageContent = <Browse />;
  }

  // Hide header & footer on dedicated sign in screen for minimal distraction
  const isSignInScreen = path === '/signin';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {!isSignInScreen && <Header />}
      {!isSignInScreen && (
        <div className="h-[132px] md:h-[88px] flex-shrink-0" aria-hidden="true" />
      )}
      <main className="flex-1">{pageContent}</main>
      {!isSignInScreen && <Footer />}
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
