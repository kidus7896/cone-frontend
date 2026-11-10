import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-4 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>&copy; {new Date().getFullYear()} Cone Marketplace. Addis Ababa, Ethiopia.</p>
        <div className="flex items-center gap-4 text-[11px]">
          <span>English / አማርኛ</span>
          <span>•</span>
          <span>Community Classifieds</span>
        </div>
      </div>
    </footer>
  );
};
