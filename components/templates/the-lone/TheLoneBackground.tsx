import React from 'react';

interface TheLoneBackgroundProps {
  children?: React.ReactNode;
}

export const TheLoneBackground: React.FC<TheLoneBackgroundProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#000000] text-white overflow-hidden">
      {/* Background base is pure black #000000 (RGB 0, 0, 0) */}
      <div className="relative z-10 h-full w-full max-w-md mx-auto">
        {children}
      </div>
    </div>
  );
};
