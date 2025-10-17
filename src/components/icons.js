import React from '../react.js';

const createIcon = (children) => {
  return ({ className = '', size = 16, strokeWidth = 1.5, ...props }) => (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {typeof children === 'function' ? children({ size, strokeWidth }) : children}
    </svg>
  );
};

export const ChevronRight = createIcon(
  <polyline points="9 6 15 12 9 18" />
);

export const ChevronLeft = createIcon(
  <polyline points="15 6 9 12 15 18" />
);

export const AlertTriangle = createIcon(
  <React.Fragment>
    <path d="M10.29 3.86L3.18 16.4a2 2 0 001.71 3h14.22a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <path d="M12 9v4" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
  </React.Fragment>
);

export const CheckCircle = createIcon(
  <React.Fragment>
    <circle cx="12" cy="12" r="9" />
    <polyline points="8 12 11 15 16 9" />
  </React.Fragment>
);

export const Settings = createIcon(
  <React.Fragment>
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
    <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
  </React.Fragment>
);

export const FileText = createIcon(
  <React.Fragment>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </React.Fragment>
);

export const Users = createIcon(
  <React.Fragment>
    <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </React.Fragment>
);

export const Calendar = createIcon(
  <React.Fragment>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </React.Fragment>
);

export const Info = createIcon(
  <React.Fragment>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="10" x2="12" y2="16" />
    <circle cx="12" cy="7" r="0.6" fill="currentColor" stroke="none" />
  </React.Fragment>
);

export const Edit = createIcon(
  <React.Fragment>
    <path d="M4 17.5V20h2.5l9.86-9.86a1.77 1.77 0 00-2.5-2.5z" />
    <path d="M13.5 6.5l2.5 2.5" />
  </React.Fragment>
);

export const Plus = createIcon(
  <React.Fragment>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </React.Fragment>
);

export const Trash2 = createIcon(
  <React.Fragment>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </React.Fragment>
);

export const Eye = createIcon(
  <React.Fragment>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </React.Fragment>
);

export const GripVertical = createIcon(
  <React.Fragment>
    <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" />
  </React.Fragment>
);

export const ArrowUp = createIcon(
  <React.Fragment>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </React.Fragment>
);

export const ArrowDown = createIcon(
  <React.Fragment>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="5 12 12 19 19 12" />
  </React.Fragment>
);

export const Send = createIcon(
  <React.Fragment>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <polyline points="3 7 12 13 21 7" />
  </React.Fragment>
);

export const Sparkles = createIcon(
  <React.Fragment>
    <path d="M5 3v4" />
    <path d="M3 5h4" />
    <path d="M17 15v4" />
    <path d="M15 17h4" />
    <path d="M12 7l1.5 4.5L18 13l-4.5 1.5L12 19l-1.5-4.5L6 13l4.5-1.5L12 7z" />
  </React.Fragment>
);

export const Target = createIcon(
  <React.Fragment>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="2" />
  </React.Fragment>
);

export const Rocket = createIcon(
  <React.Fragment>
    <path d="M12 2c-3 2-5 6-5 10 0 5.5 5 10 5 10s5-4.5 5-10c0-4-2-8-5-10z" />
    <circle cx="12" cy="10" r="2" />
    <path d="M9 14l-3 3 4 1 1 4 3-3" />
    <path d="M15 14l3 3-4 1" />
  </React.Fragment>
);

export const Compass = createIcon(
  <React.Fragment>
    <circle cx="12" cy="12" r="9" />
    <polygon points="12 7 16 12 12 17 8 12" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </React.Fragment>
);

export const Close = createIcon(
  <React.Fragment>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="6" y1="18" x2="18" y2="6" />
  </React.Fragment>
);

export const Download = createIcon(
  <React.Fragment>
    <line x1="12" y1="3" x2="12" y2="15" />
    <polyline points="8 11 12 15 16 11" />
    <path d="M5 19h14" />
  </React.Fragment>
);

export const Upload = createIcon(
  <React.Fragment>
    <line x1="12" y1="21" x2="12" y2="9" />
    <polyline points="8 13 12 9 16 13" />
    <path d="M5 5h14" />
  </React.Fragment>
);

export const Save = createIcon(
  <React.Fragment>
    <path d="M5 3h11l3 3v14a1 1 0 01-1 1H6a1 1 0 01-1-1V3z" />
    <rect x="9" y="13" width="6" height="5" />
    <path d="M7 3v6h8V3" />
  </React.Fragment>
);

export const Clipboard = createIcon(
  <React.Fragment>
    <rect x="5" y="4" width="14" height="18" rx="2" />
    <path d="M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z" />
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="9" y1="14" x2="13" y2="14" />
  </React.Fragment>
);

export const Lightbulb = createIcon(
  <React.Fragment>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 00-7 7c0 2.76 1.68 4.67 3 6a4 4 0 012 3v2h4v-2a4 4 0 012-3c1.32-1.33 3-3.24 3-6a7 7 0 00-7-7z" />
  </React.Fragment>
);

export const Mail = createIcon(
  <React.Fragment>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <polyline points="3 7 12 13 21 7" />
  </React.Fragment>
);

export { createIcon };
