import React from '../react.js';

const createIcon = (symbol) => {
  return ({ className = '', ...props }) => (
    <span
      className={`inline-flex items-center justify-center ${className}`.trim()}
      aria-hidden="true"
      {...props}
    >
      {symbol}
    </span>
  );
};

export const ChevronRight = createIcon('›');
export const ChevronLeft = createIcon('‹');
export const AlertTriangle = createIcon('⚠️');
export const CheckCircle = createIcon('✔️');
export const Settings = createIcon('⚙️');
export const FileText = createIcon('📄');
export const Users = createIcon('👥');
export const Calendar = createIcon('📅');
export const Info = createIcon('ℹ️');
export const Edit = createIcon('✏️');
export const Plus = createIcon('➕');
export const Trash2 = createIcon('🗑️');
export const Eye = createIcon('👁️');
export const GripVertical = createIcon('⋮⋮');
export const ArrowUp = createIcon('↑');
export const ArrowDown = createIcon('↓');
export const Send = createIcon('✉️');
export const Sparkles = createIcon('✨');
export const Target = createIcon('🎯');
export const Rocket = createIcon('🚀');
export const Compass = createIcon('🧭');
export const Close = createIcon('✕');
export const Download = createIcon('⬇️');
export const Upload = createIcon('📂');
export const Save = createIcon('💾');

export { createIcon };
