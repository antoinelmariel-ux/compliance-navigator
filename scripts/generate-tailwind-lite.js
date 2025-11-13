const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const items = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      items.push(...walk(fullPath));
    } else if (/\.(jsx?|tsx?|html|css)$/.test(entry.name)) {
      items.push(fullPath);
    }
  }
  return items;
}

const filesToScan = walk(path.join(repoRoot, 'src'));
filesToScan.push(path.join(repoRoot, 'index.html'));
filesToScan.push(path.join(repoRoot, 'mentions-legales.html'));

const rawClasses = new Set();
for (const filePath of filesToScan) {
  const content = fs.readFileSync(filePath, 'utf8');
  const attrRegex = /class(?:Name)?\s*=\s*"([^"]+)"/g;
  let match;
  while ((match = attrRegex.exec(content)) !== null) {
    match[1]
      .split(/\s+/)
      .filter(Boolean)
      .forEach((cls) => rawClasses.add(cls));
  }
}

const knownPrefix = [
  'bg',
  'text',
  'font',
  'leading',
  'tracking',
  'uppercase',
  'lowercase',
  'capitalize',
  'italic',
  'not-italic',
  'underline',
  'no-underline',
  'flex',
  'inline-flex',
  'grid',
  'inline-grid',
  'block',
  'inline-block',
  'hidden',
  'sr-only',
  'static',
  'relative',
  'absolute',
  'fixed',
  'sticky',
  'inset',
  'top',
  'right',
  'bottom',
  'left',
  'z',
  'p',
  'px',
  'py',
  'pt',
  'pb',
  'pl',
  'pr',
  'm',
  'mx',
  'my',
  'mt',
  'mb',
  'ml',
  'mr',
  'space',
  'w',
  'min-w',
  'max-w',
  'h',
  'min-h',
  'max-h',
  'border',
  'rounded',
  'shadow',
  'overflow',
  'truncate',
  'whitespace',
  'items',
  'justify',
  'content',
  'self',
  'gap',
  'grid-cols',
  'col-span',
  'list',
  'ring',
  'ring-offset',
  'opacity',
  'transition',
  'duration',
  'cursor',
  'outline',
  'from',
  'via',
  'to',
  'bg-opacity',
  'mx',
  'my',
];

function isTailwindClass(cls) {
  if (!cls) return false;
  if (cls.startsWith('aurora-') || cls.startsWith('hv-') || cls.startsWith('tourguide-')) return false;
  if (cls.startsWith('project-') || cls.startsWith('reactour__') || cls.startsWith('tg-')) return false;
  if (cls.startsWith('scrollbar-') || cls.startsWith('shepherd-') || cls.startsWith('tw-')) return false;
  if (cls.startsWith('timeline-') || cls.startsWith('animate__') || cls.startsWith('ProseMirror')) return false;
  if (cls.startsWith('ql-') || cls.startsWith('tox-') || cls.startsWith('Tiptap')) return false;
  if (cls.startsWith('Toastify__') || cls.startsWith('coveo-') || cls.startsWith('hds-')) return false;
  if (cls.startsWith('yo-') || cls.startsWith('rt-') || cls.startsWith('sl-')) return false;
  if (cls.startsWith('header-') || cls.startsWith('hero-') || cls.startsWith('banner-')) return false;
  if (cls.startsWith('-')) return true;
  if (cls.includes(':')) {
    const [variant, rest] = cls.split(':', 2);
    if (['sm', 'md', 'lg', 'xl', 'hover', 'focus', 'focus-visible', 'disabled'].includes(variant)) {
      return isTailwindClass(rest);
    }
  }
  return knownPrefix.some((prefix) => cls.startsWith(prefix));
}

const classes = new Set();
for (const cls of rawClasses) {
  if (isTailwindClass(cls)) {
    classes.add(cls);
  }
}
classes.add('-mb-3');

const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

const breakpointOrder = Object.fromEntries(
  Object.keys(breakpoints).map((key, index) => [key, index])
);

const pseudoVariants = ['hover', 'focus', 'focus-visible', 'disabled'];
const pseudoVariantOrder = Object.fromEntries(
  pseudoVariants.map((key, index) => [key, index])
);

const spacingScale = {
  '0': '0rem',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
};

const sizingScale = {
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '12': '3rem',
  '40': '10rem',
};

const widths = {
  ...sizingScale,
  full: '100%',
  auto: 'auto',
};

const heights = {
  ...sizingScale,
  full: '100%',
};

const maxWidths = {
  md: '28rem',
  lg: '32rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
};

const fontSizes = {
  xs: { size: '0.75rem', lineHeight: '1rem' },
  sm: { size: '0.875rem', lineHeight: '1.25rem' },
  base: { size: '1rem', lineHeight: '1.5rem' },
  lg: { size: '1.125rem', lineHeight: '1.75rem' },
  xl: { size: '1.25rem', lineHeight: '1.75rem' },
  '2xl': { size: '1.5rem', lineHeight: '2rem' },
  '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
  '4xl': { size: '2.25rem', lineHeight: '2.5rem' },
};

const fontWeights = {
  'font-medium': '500',
  'font-semibold': '600',
  'font-bold': '700',
};

const lineHeights = {
  'leading-tight': '1.25',
  'leading-snug': '1.375',
  'leading-relaxed': '1.625',
};

const gradientDirections = {
  'bg-gradient-to-r': 'to right',
  'bg-gradient-to-br': 'to bottom right',
};

const colorHex = {
  black: '#000000',
  white: '#ffffff',
  'blue-50': '#eff6ff',
  'blue-100': '#dbeafe',
  'blue-200': '#bfdbfe',
  'blue-300': '#93c5fd',
  'blue-400': '#60a5fa',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'blue-700': '#1d4ed8',
  'blue-800': '#1e40af',
  'blue-900': '#1e3a8a',
  'emerald-50': '#ecfdf5',
  'emerald-100': '#d1fae5',
  'emerald-200': '#a7f3d0',
  'emerald-500': '#10b981',
  'emerald-600': '#059669',
  'emerald-700': '#047857',
  'emerald-800': '#065f46',
  'emerald-900': '#064e3b',
  'gray-50': '#f9fafb',
  'gray-100': '#f3f4f6',
  'gray-200': '#e5e7eb',
  'gray-300': '#d1d5db',
  'gray-400': '#9ca3af',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  'green-50': '#f0fdf4',
  'green-100': '#dcfce7',
  'green-200': '#bbf7d0',
  'green-600': '#16a34a',
  'green-700': '#15803d',
  'green-800': '#166534',
  'red-50': '#fef2f2',
  'red-100': '#fee2e2',
  'red-200': '#fecaca',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-700': '#b91c1c',
  'pink-400': '#f472b6',
  'pink-500': '#ec4899',
  'pink-600': '#db2777',
  'yellow-50': '#fefce8',
  'yellow-100': '#fef9c3',
  'yellow-200': '#fef08a',
  'yellow-300': '#fde68a',
  'yellow-500': '#f59e0b',
  'yellow-600': '#d97706',
  'yellow-700': '#b45309',
  'yellow-800': '#92400e',
  'yellow-900': '#78350f',
  'orange-50': '#fff7ed',
};

const ringColors = {
  'blue-200': '191,219,254',
  'blue-400': '96,165,250',
  'blue-500': '59,130,246',
  'green-400': '74,222,128',
  'green-500': '34,197,94',
  'red-400': '248,113,113',
  'red-500': '239,68,68',
  'pink-400': '244,114,182',
};

const ringOpacityDefault = '0.45';

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}

function escapeClass(name) {
  return name.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

function formatDeclarations(decls, indent = '  ') {
  return Object.entries(decls)
    .map(([prop, value]) => `${indent}${prop}: ${value};`)
    .join('\n');
}

function indentBlock(block, spaces) {
  const pad = ' '.repeat(spaces);
  return block
    .split('\n')
    .map((line) => (line ? pad + line : line))
    .join('\n');
}

function spacingValue(token) {
  if (token === 'px') return '1px';
  if (spacingScale[token]) return spacingScale[token];
  return null;
}

function generateSpacing(property, token) {
  const value = spacingValue(token);
  if (!value) return null;
  const declarations = {};
  if (property === 'p') {
    declarations.padding = value;
  } else if (property === 'px') {
    declarations['padding-left'] = value;
    declarations['padding-right'] = value;
  } else if (property === 'py') {
    declarations['padding-top'] = value;
    declarations['padding-bottom'] = value;
  } else if (property === 'pt') {
    declarations['padding-top'] = value;
  } else if (property === 'pb') {
    declarations['padding-bottom'] = value;
  } else if (property === 'pl') {
    declarations['padding-left'] = value;
  } else if (property === 'pr') {
    declarations['padding-right'] = value;
  } else if (property === 'm') {
    declarations.margin = value;
  } else if (property === 'mx') {
    declarations['margin-left'] = value;
    declarations['margin-right'] = value;
  } else if (property === 'my') {
    declarations['margin-top'] = value;
    declarations['margin-bottom'] = value;
  } else if (property === 'mt') {
    declarations['margin-top'] = value;
  } else if (property === 'mb') {
    declarations['margin-bottom'] = value;
  } else if (property === 'ml') {
    declarations['margin-left'] = value;
  } else if (property === 'mr') {
    declarations['margin-right'] = value;
  }
  return { declarations };
}

function getColor(token) {
  if (token.includes('/')) {
    const [baseToken, alphaToken] = token.split('/');
    const hex = colorHex[baseToken];
    if (!hex) return null;
    const rgb = hexToRgb(hex);
    const alpha = (parseInt(alphaToken, 10) / 100).toFixed(2);
    return { type: 'rgba', value: `rgba(${rgb}, ${alpha})` };
  }
  const hex = colorHex[token];
  if (!hex) return null;
  return { type: 'hex', value: hex, rgb: hexToRgb(hex) };
}

function baseRule(base) {
  if (base === 'absolute') return { declarations: { position: 'absolute' } };
  if (base === 'relative') return { declarations: { position: 'relative' } };
  if (base === 'fixed') return { declarations: { position: 'fixed' } };
  if (base === 'sticky') return { declarations: { position: 'sticky' } };
  if (base === 'block') return { declarations: { display: 'block' } };
  if (base === 'flex') return { declarations: { display: 'flex' } };
  if (base === 'inline-flex') return { declarations: { display: 'inline-flex' } };
  if (base === 'grid') return { declarations: { display: 'grid' } };
  if (base === 'hidden') return { declarations: { display: 'none' } };
  if (base === 'flex-row') return { declarations: { 'flex-direction': 'row' } };
  if (base === 'flex-col') return { declarations: { 'flex-direction': 'column' } };
  if (base === 'flex-col-reverse') return { declarations: { 'flex-direction': 'column-reverse' } };
  if (base === 'flex-wrap') return { declarations: { 'flex-wrap': 'wrap' } };
  if (base === 'flex-1') return { declarations: { flex: '1 1 0%' } };
  if (base === 'items-center') return { declarations: { 'align-items': 'center' } };
  if (base === 'items-start') return { declarations: { 'align-items': 'flex-start' } };
  if (base === 'items-end') return { declarations: { 'align-items': 'flex-end' } };
  if (base === 'items-baseline') return { declarations: { 'align-items': 'baseline' } };
  if (base === 'justify-between') return { declarations: { 'justify-content': 'space-between' } };
  if (base === 'justify-center') return { declarations: { 'justify-content': 'center' } };
  if (base === 'justify-end') return { declarations: { 'justify-content': 'flex-end' } };
  if (base === 'justify-start') return { declarations: { 'justify-content': 'flex-start' } };
  if (base === 'self-start') return { declarations: { 'align-self': 'flex-start' } };
  if (base === 'self-end') return { declarations: { 'align-self': 'flex-end' } };
  if (base === 'self-stretch') return { declarations: { 'align-self': 'stretch' } };
  if (base === 'self-auto') return { declarations: { 'align-self': 'auto' } };
  if (base === 'w-full') return { declarations: { width: '100%' } };
  if (base.startsWith('w-')) {
    const token = base.replace('w-', '');
    const value = widths[token];
    if (value) return { declarations: { width: value } };
  }
  if (base.startsWith('h-')) {
    const token = base.replace('h-', '');
    const value = heights[token];
    if (value) return { declarations: { height: value } };
  }
  if (base === 'min-h-screen') return { declarations: { 'min-height': '100vh' } };
  if (base === 'min-w-0') return { declarations: { 'min-width': '0' } };
  if (base.startsWith('max-w-')) {
    const token = base.replace('max-w-', '');
    const value = maxWidths[token];
    if (value) return { declarations: { 'max-width': value } };
  }
  if (base.startsWith('p-') || base.startsWith('m-')) {
    const [property, token] = base.split('-');
    const spacing = generateSpacing(property, token);
    if (spacing) return spacing;
  }
  if (base.includes('-')) {
    const [property, token] = base.split('-');
    if (['px', 'py', 'pt', 'pb', 'pl', 'pr', 'mx', 'my', 'mt', 'mb', 'ml', 'mr'].includes(property)) {
      const spacing = generateSpacing(property, token);
      if (spacing) return spacing;
    }
  }
  if (base === 'mx-auto') return { declarations: { 'margin-left': 'auto', 'margin-right': 'auto' } };
  if (base === 'ml-auto') return { declarations: { 'margin-left': 'auto' } };
  if (base === 'mr-auto') return { declarations: { 'margin-right': 'auto' } };
  if (base === 'overflow-y-auto') return { declarations: { 'overflow-y': 'auto' } };
  if (base === 'resize-y') return { declarations: { resize: 'vertical' } };
  if (base.startsWith('gap-')) {
    const token = base.replace('gap-', '');
    const value = spacingValue(token);
    if (value) return { declarations: { gap: value } };
  }
  if (base.startsWith('space-y-')) {
    const token = base.replace('space-y-', '');
    const value = spacingValue(token);
    if (value) {
      return {
        nested: [
          {
            selector: '> :not([hidden]) ~ :not([hidden])',
            declarations: { 'margin-top': value },
          },
        ],
      };
    }
  }
  if (base.startsWith('space-x-')) {
    const token = base.replace('space-x-', '');
    const value = spacingValue(token);
    if (value) {
      return {
        nested: [
          {
            selector: '> :not([hidden]) ~ :not([hidden])',
            declarations: { 'margin-left': value },
          },
        ],
      };
    }
  }
  if (base.startsWith('grid-cols-')) {
    const token = base.replace('grid-cols-', '');
    return { declarations: { 'grid-template-columns': `repeat(${token}, minmax(0, 1fr))` } };
  }
  if (base.startsWith('col-span-')) {
    const value = parseInt(base.replace('col-span-', ''), 10);
    return { declarations: { 'grid-column': `span ${value} / span ${value}` } };
  }
  if (base === 'list-disc') return { declarations: { 'list-style-type': 'disc' } };
  if (base === 'list-inside') return { declarations: { 'list-style-position': 'inside' } };
  if (base === 'sr-only') {
    return {
      custom:
        `.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }`,
    };
  }
  if (base === 'uppercase') return { declarations: { 'text-transform': 'uppercase' } };
  if (base === 'underline') return { declarations: { 'text-decoration': 'underline' } };
  if (base === 'italic') return { declarations: { 'font-style': 'italic' } };
  if (base.startsWith('text-')) {
    const token = base.replace('text-', '');
    if (fontSizes[token]) {
      const { size, lineHeight } = fontSizes[token];
      return { declarations: { 'font-size': size, 'line-height': lineHeight } };
    }
    if (token === '[11px]') {
      return { declarations: { 'font-size': '11px', 'line-height': '1rem' } };
    }
    if (['center', 'left', 'right'].includes(token)) {
      return { declarations: { 'text-align': token } };
    }
    if (token === 'current') {
      return { declarations: { color: 'currentColor' } };
    }
    const colorInfo = getColor(token);
    if (colorInfo) {
      if (colorInfo.type === 'rgba') {
        return { declarations: { '--tw-text-opacity': '1', color: colorInfo.value } };
      }
      return {
        declarations: {
          '--tw-text-opacity': '1',
          color: `rgba(${colorInfo.rgb}, var(--tw-text-opacity))`,
        },
      };
    }
  }
  if (fontWeights[base]) return { declarations: { 'font-weight': fontWeights[base] } };
  if (base === 'font-mono') {
    return {
      declarations: {
        'font-family': "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      },
    };
  }
  if (lineHeights[base]) return { declarations: { 'line-height': lineHeights[base] } };
  if (base === 'tracking-wide') return { declarations: { 'letter-spacing': '0.05em' } };
  if (base.startsWith('bg-gradient-to')) {
    const direction = gradientDirections[base];
    if (direction) {
      return { declarations: { 'background-image': `linear-gradient(${direction}, var(--tw-gradient-stops))` } };
    }
  }
  if (base.startsWith('from-')) {
    const colorInfo = getColor(base.replace('from-', ''));
    if (colorInfo) {
      if (colorInfo.type === 'rgba') {
        return {
          declarations: {
            '--tw-gradient-from': colorInfo.value,
            '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to, rgba(255, 255, 255, 0))',
          },
        };
      }
      return {
        declarations: {
          '--tw-gradient-from': `rgb(${colorInfo.rgb})`,
          '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to, rgba(255, 255, 255, 0))',
        },
      };
    }
  }
  if (base.startsWith('via-')) {
    const colorInfo = getColor(base.replace('via-', ''));
    if (colorInfo) {
      if (colorInfo.type === 'rgba') {
        return {
          declarations: {
            '--tw-gradient-stops': `var(--tw-gradient-from), ${colorInfo.value}, var(--tw-gradient-to, rgba(255, 255, 255, 0))`,
          },
        };
      }
      return {
        declarations: {
          '--tw-gradient-stops': `var(--tw-gradient-from), rgb(${colorInfo.rgb}), var(--tw-gradient-to, rgba(255, 255, 255, 0))`,
        },
      };
    }
  }
  if (base.startsWith('to-')) {
    const colorInfo = getColor(base.replace('to-', ''));
    if (colorInfo) {
      if (colorInfo.type === 'rgba') {
        return { declarations: { '--tw-gradient-to': colorInfo.value } };
      }
      return { declarations: { '--tw-gradient-to': `rgb(${colorInfo.rgb})` } };
    }
  }
  if (base.startsWith('bg-opacity-')) {
    const value = parseInt(base.replace('bg-opacity-', ''), 10) / 100;
    return { declarations: { '--tw-bg-opacity': value.toString() } };
  }
  if (base.startsWith('bg-')) {
    const colorInfo = getColor(base.replace('bg-', ''));
    if (colorInfo) {
      if (colorInfo.type === 'rgba') {
        return { declarations: { '--tw-bg-opacity': '1', 'background-color': colorInfo.value } };
      }
      return {
        declarations: {
          '--tw-bg-opacity': '1',
          'background-color': `rgba(${colorInfo.rgb}, var(--tw-bg-opacity))`,
        },
      };
    }
  }
  if (base === 'border') return { declarations: { 'border-width': '1px' } };
  if (base.startsWith('border-')) {
    const token = base.replace('border-', '');
    if (token === '2') return { declarations: { 'border-width': '2px' } };
    if (token === 'b') return { declarations: { 'border-bottom-width': '1px' } };
    if (token === 't') return { declarations: { 'border-top-width': '1px' } };
    if (token === 'dashed') return { declarations: { 'border-style': 'dashed' } };
    if (token === 'transparent') return { declarations: { 'border-color': 'transparent' } };
    const colorInfo = getColor(token);
    if (colorInfo) {
      if (colorInfo.type === 'rgba') {
        return { declarations: { '--tw-border-opacity': '1', 'border-color': colorInfo.value } };
      }
      return {
        declarations: {
          '--tw-border-opacity': '1',
          'border-color': `rgba(${colorInfo.rgb}, var(--tw-border-opacity))`,
        },
      };
    }
  }
  if (base === 'rounded') return { declarations: { 'border-radius': '0.25rem' } };
  if (base === 'rounded-lg') return { declarations: { 'border-radius': '0.75rem' } };
  if (base === 'rounded-xl') return { declarations: { 'border-radius': '0.75rem' } };
  if (base === 'rounded-2xl') return { declarations: { 'border-radius': '1rem' } };
  if (base === 'rounded-3xl') return { declarations: { 'border-radius': '1.5rem' } };
  if (base === 'rounded-full') return { declarations: { 'border-radius': '9999px' } };
  if (base === 'rounded-t-2xl') {
    return {
      declarations: {
        'border-top-left-radius': '1rem',
        'border-top-right-radius': '1rem',
      },
    };
  }
  if (base === 'shadow-sm') {
    return {
      declarations: {
        '--tw-shadow': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'box-shadow': 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
      },
    };
  }
  if (base === 'shadow') {
    return {
      declarations: {
        '--tw-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'box-shadow': 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
      },
    };
  }
  if (base === 'shadow-md') {
    return {
      declarations: {
        '--tw-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'box-shadow': 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
      },
    };
  }
  if (base === 'shadow-lg' || base === 'hover:shadow-lg') {
    return {
      declarations: {
        '--tw-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'box-shadow': 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
      },
    };
  }
  if (base === 'shadow-xl') {
    return {
      declarations: {
        '--tw-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'box-shadow': 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
      },
    };
  }
  if (base === 'shadow-2xl') {
    return {
      declarations: {
        '--tw-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'box-shadow': 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
      },
    };
  }
  if (base === 'shadow-inner') {
    return {
      declarations: {
        '--tw-shadow': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'box-shadow': 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
      },
    };
  }
  if (base === 'transition-all') {
    return { declarations: { transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)' } };
  }
  if (base === 'transition-colors') {
    return {
      declarations: {
        transition:
          'color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 150ms cubic-bezier(0.4, 0, 0.2, 1), fill 150ms cubic-bezier(0.4, 0, 0.2, 1), stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    };
  }
  if (base === 'duration-300') return { declarations: { 'transition-duration': '300ms' } };
  if (base === 'duration-500') return { declarations: { 'transition-duration': '500ms' } };
  if (base === 'cursor-move') return { declarations: { cursor: 'move' } };
  if (base === 'cursor-grab') return { declarations: { cursor: 'grab' } };
  if (base === 'cursor-not-allowed') return { declarations: { cursor: 'not-allowed' } };
  if (base.startsWith('opacity-')) {
    const value = parseInt(base.replace('opacity-', ''), 10) / 100;
    return { declarations: { opacity: value.toString() } };
  }
  if (base === 'outline-none') {
    return { declarations: { outline: '2px solid transparent', 'outline-offset': '2px' } };
  }
  if (base.startsWith('ring-offset-')) {
    const token = base.replace('ring-offset-', '');
    if (token === '2') return { declarations: { '--tw-ring-offset-width': '2px' } };
    const colorInfo = getColor(token);
    if (colorInfo) {
      if (colorInfo.type === 'rgba') {
        return { declarations: { '--tw-ring-offset-color': colorInfo.value } };
      }
      return { declarations: { '--tw-ring-offset-color': `rgb(${colorInfo.rgb})` } };
    }
  }
  if (base === 'ring-2') {
    return { ringWidth: '2px' };
  }
  if (base.startsWith('ring-')) {
    const token = base.replace('ring-', '');
    if (ringColors[token]) {
      return { ringColor: `rgba(${ringColors[token]}, ${ringOpacityDefault})` };
    }
    if (token === 'current') {
      return { ringColor: 'currentColor' };
    }
  }
  if (base.startsWith('hover:bg-')) {
    const colorInfo = getColor(base.replace('hover:bg-', ''));
    if (colorInfo) {
      if (colorInfo.type === 'rgba') {
        return { declarations: { '--tw-bg-opacity': '1', 'background-color': colorInfo.value } };
      }
      return {
        declarations: {
          '--tw-bg-opacity': '1',
          'background-color': `rgba(${colorInfo.rgb}, var(--tw-bg-opacity))`,
        },
      };
    }
  }
  if (base.startsWith('hover:text-')) {
    const colorInfo = getColor(base.replace('hover:text-', ''));
    if (colorInfo) {
      if (colorInfo.type === 'rgba') {
        return { declarations: { '--tw-text-opacity': '1', color: colorInfo.value } };
      }
      return {
        declarations: {
          '--tw-text-opacity': '1',
          color: `rgba(${colorInfo.rgb}, var(--tw-text-opacity))`,
        },
      };
    }
  }
  if (base.startsWith('hover:border-')) {
    const colorInfo = getColor(base.replace('hover:border-', ''));
    if (colorInfo) {
      if (colorInfo.type === 'rgba') {
        return { declarations: { '--tw-border-opacity': '1', 'border-color': colorInfo.value } };
      }
      return {
        declarations: {
          '--tw-border-opacity': '1',
          'border-color': `rgba(${colorInfo.rgb}, var(--tw-border-opacity))`,
        },
      };
    }
  }
  if (base === 'hover:underline') {
    return { declarations: { 'text-decoration': 'underline' } };
  }
  if (base === '-mb-3') {
    return { declarations: { 'margin-bottom': `-${spacingValue('3')}` } };
  }
  if (base === 'inset-0') {
    return { declarations: { top: '0', right: '0', bottom: '0', left: '0' } };
  }
  if (base === 'top-0') {
    return { declarations: { top: '0' } };
  }
  if (base === 'z-10') return { declarations: { 'z-index': '10' } };
  if (base === 'z-50') return { declarations: { 'z-index': '50' } };
  if (base === 'whitespace-nowrap') {
    return { declarations: { 'white-space': 'nowrap' } };
  }
  if (base === 'whitespace-pre-line') {
    return { declarations: { 'white-space': 'pre-line' } };
  }
  return null;
}

function buildRule(cls) {
  const segments = cls.split(':');
  const base = segments.pop();
  const variants = segments;

  let rule = baseRule(base);

  if (!rule && variants.includes('hover')) {
    rule = baseRule(`hover:${base}`);
  }
  if (!rule && variants.includes('focus')) {
    rule = baseRule(base.startsWith('ring') || base.startsWith('outline') ? `ring${base.slice(4)}` : base);
    if (!rule) {
      rule = baseRule(`focus:${base}`);
    }
  }
  if (!rule && variants.includes('focus-visible')) {
    rule = baseRule(base.startsWith('ring') ? base : `focus-visible:${base}`);
  }
  if (!rule && variants.includes('disabled')) {
    rule = baseRule(base.startsWith('opacity') || base.startsWith('cursor') ? base : `disabled:${base}`);
  }

  if (!rule) return '';

  const responsive = variants.filter((variant) => breakpoints[variant]);
  const pseudoParts = variants.filter((variant) => ['hover', 'focus', 'focus-visible', 'disabled'].includes(variant));

  let pseudoSelector = '';
  for (const pseudo of pseudoParts) {
    if (pseudo === 'hover') pseudoSelector += ':hover';
    if (pseudo === 'focus') pseudoSelector += ':focus';
    if (pseudo === 'focus-visible') pseudoSelector += ':focus-visible';
    if (pseudo === 'disabled') pseudoSelector += ':disabled';
  }

  const escaped = escapeClass(cls);
  const rules = [];

  if (rule.custom) {
    rules.push(rule.custom);
  }

  const declarations = { ...(rule.declarations || {}) };
  if (rule.ringColor) {
    declarations['--tw-ring-color'] = rule.ringColor;
  }

  if (Object.keys(declarations).length) {
    rules.push(`.${escaped}${pseudoSelector} {`);
    rules.push(formatDeclarations(declarations));
    rules.push('}');
  }

  if (rule.ringWidth) {
    const width = rule.ringWidth;
    const selector = `.${escaped}${pseudoSelector || ':focus'}`;
    rules.push(`${selector} {`);
    rules.push('  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);');
    rules.push(`  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(${width} + var(--tw-ring-offset-width)) var(--tw-ring-color);`);
    rules.push('  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);');
    rules.push('}');
  }

  if (rule.nested) {
    for (const nested of rule.nested) {
      rules.push(`.${escaped}${pseudoSelector} ${nested.selector} {`);
      rules.push(formatDeclarations(nested.declarations));
      rules.push('}');
    }
  }

  let css = rules.join('\n');
  for (const breakpoint of responsive) {
    css = `@media (min-width: ${breakpoints[breakpoint]}) {\n${indentBlock(css, 2)}\n}`;
  }

  return css;
}

const classMetaCache = new Map();

function getClassMeta(cls) {
  if (classMetaCache.has(cls)) {
    return classMetaCache.get(cls);
  }

  const segments = cls.split(':');
  segments.pop();

  let maxBreakpointIndex = -1;
  let pseudoIndex = -1;

  for (const segment of segments) {
    if (breakpoints[segment]) {
      const index = breakpointOrder[segment] ?? 0;
      if (index > maxBreakpointIndex) {
        maxBreakpointIndex = index;
      }
    } else if (Object.prototype.hasOwnProperty.call(pseudoVariantOrder, segment)) {
      const index = pseudoVariantOrder[segment];
      if (index > pseudoIndex) {
        pseudoIndex = index;
      }
    }
  }

  const hasResponsive = maxBreakpointIndex >= 0;
  const hasPseudo = pseudoIndex >= 0;

  let stage = 0;
  if (hasResponsive && hasPseudo) {
    stage = 3;
  } else if (hasPseudo) {
    stage = 2;
  } else if (hasResponsive) {
    stage = 1;
  }

  const meta = { stage, maxBreakpointIndex, pseudoIndex };
  classMetaCache.set(cls, meta);
  return meta;
}

const sortedClasses = [...classes].sort((a, b) => {
  const aMeta = getClassMeta(a);
  const bMeta = getClassMeta(b);

  if (aMeta.stage !== bMeta.stage) {
    return aMeta.stage - bMeta.stage;
  }

  if ((aMeta.stage === 1 || aMeta.stage === 3) && aMeta.maxBreakpointIndex !== bMeta.maxBreakpointIndex) {
    return aMeta.maxBreakpointIndex - bMeta.maxBreakpointIndex;
  }

  if ((aMeta.stage === 2 || aMeta.stage === 3) && aMeta.pseudoIndex !== bMeta.pseudoIndex) {
    return aMeta.pseudoIndex - bMeta.pseudoIndex;
  }

  return a.localeCompare(b);
});

const generated = [];
const handled = new Set();

for (const cls of sortedClasses) {
  if (!cls) continue;
  const css = buildRule(cls);
  if (css) {
    generated.push(css);
    handled.add(cls);
  }
}

const missing = [...classes].filter((cls) => !handled.has(cls));
if (missing.length) {
  console.error('Missing classes:', missing);
}

const header = `/* Tailwind-inspired utility subset generated locally */\n:root {\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgba(59, 130, 246, 0.5);\n  --tw-ring-inset: var(--tw-empty,/*!*/ /*!*/);\n  --tw-shadow: 0 0 #0000;\n  --tw-bg-opacity: 1;\n  --tw-text-opacity: 1;\n  --tw-border-opacity: 1;\n}\n*, ::before, ::after {\n  box-sizing: border-box;\n  border-width: 0;\n  border-style: solid;\n  border-color: #e5e7eb;\n}\nhtml {\n  line-height: 1.5;\n  -webkit-text-size-adjust: 100%;\n  font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;\n}\nbody {\n  margin: 0;\n  line-height: inherit;\n  font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;\n}\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n`;

const outputPath = path.join(__dirname, '..', 'src', 'styles', 'tailwind-internal.css');
fs.writeFileSync(outputPath, header + '\n' + generated.join('\n\n'));
console.log('CSS generated at', outputPath);
if (missing.length) {
  console.log('Unmapped classes:', missing.join(', '));
}
