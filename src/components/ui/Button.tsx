import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', children, className = '', ...props }: PropsWithChildren<Props>) {
  const cls = variant === 'primary'
    ? 'bcvb-btn'
    : variant === 'outline'
      ? 'bcvb-btn bcvb-btn--outline'
      : 'bcvb-btn bcvb-btn--ghost';

  return (
    <button className={`${cls} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
