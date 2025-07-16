
import React from 'react';

const BotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a3.375 3.375 0 00-3.375 3.375v1.5c0 1.864 1.51 3.375 3.375 3.375h9.75c1.864 0 3.375-1.511 3.375-3.375v-1.5A3.375 3.375 0 0018.375 6.75h-9.75z"
      clipRule="evenodd"
    />
  </svg>
);

export default BotIcon;
