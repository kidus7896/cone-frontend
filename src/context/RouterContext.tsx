import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  path: string;
  search: string;
  queryParams: URLSearchParams;
  navigate: (to: string) => void;
  setMeta: (title: string, description?: string) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUrl, setCurrentUrl] = useState(() => ({
    path: window.location.pathname || '/',
    search: window.location.search || '',
  }));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentUrl({
        path: window.location.pathname || '/',
        search: window.location.search || '',
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    if (to === currentUrl.path + currentUrl.search) return;

    window.history.pushState({}, '', to);
    const [newPath, newSearch] = to.split('?');
    setCurrentUrl({
      path: newPath || '/',
      search: newSearch ? `?${newSearch}` : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setMeta = (title: string, description?: string) => {
    document.title = title;
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', description);
      }

      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', title);
      }
    }
  };

  const queryParams = new URLSearchParams(currentUrl.search);

  return (
    <RouterContext.Provider
      value={{
        path: currentUrl.path,
        search: currentUrl.search,
        queryParams,
        navigate,
        setMeta,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return ctx;
};
