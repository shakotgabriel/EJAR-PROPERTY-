// src/components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 py-6 text-center">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} Ejar. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
