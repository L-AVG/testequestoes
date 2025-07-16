import React from 'react';

const SpeakerOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.59-1.025l-4.148 4.148A.75.75 0 016 6.75H4.5a.75.75 0 00-.75.75v9a.75.75 0 00.75.75H6a.75.75 0 01.53.22l4.148 4.148c.975.975 2.59.31 2.59-1.025V4.06zM18.28 7.72a.75.75 0 011.06 0l-5.656 5.657a.75.75 0 01-1.06-1.06L18.28 7.72z" />
    <path d="M19.344 13.377a.75.75 0 00-1.06-1.06l-5.656 5.656a.75.75 0 101.06 1.06l5.656-5.656z" />
  </svg>
);

export default SpeakerOffIcon;
