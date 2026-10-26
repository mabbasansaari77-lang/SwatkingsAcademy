export type Variant = 'accent' | 'navy' | 'outline-light' | 'outline-dark' | 'ghost' | 'danger';
export type Size = 'md' | 'lg' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  accent: 'btn-glow bg-accent-500 text-charcoal-950 hover:bg-accent-300',
  navy: 'bg-navy-800 text-crease hover:bg-navy-600',
  'outline-light': 'border-2 border-crease/60 text-crease backdrop-blur-sm hover:border-neon hover:bg-neon/10 hover:shadow-[0_0_24px_-6px_rgb(56_189_248/0.8)]',
  'outline-dark': 'border-2 border-navy-800 text-navy-800 hover:bg-navy-800 hover:text-crease',
  ghost: 'text-navy-800 hover:bg-navy-800/10',
  danger: 'bg-cherry text-white hover:bg-[#8f1d22]',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export function buttonClass(variant: Variant = 'navy', size: Size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}
