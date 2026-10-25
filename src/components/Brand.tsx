import { cx } from '../lib/format'

export function BrandMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="15" fill="#0C4232" />
      <rect
        x="0.6"
        y="0.6"
        width="62.8"
        height="62.8"
        rx="14.4"
        stroke="rgba(255,255,255,0.13)"
        strokeWidth="1.2"
      />
      <path
        d="M21.5 47V27.5C21.5 21.1 25.6 17 32 17h12.5"
        stroke="#F7F5EF"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M21.5 34.5h18" stroke="#F5C518" strokeWidth="5" strokeLinecap="round" />
      <circle cx="45.5" cy="46" r="4.5" fill="#F5C518" />
    </svg>
  )
}

export function Brand({
  tone = 'dark',
  size = 'md',
  className,
  showDot = true,
}: {
  tone?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showDot?: boolean
}) {
  const sizes = {
    sm: 'text-[17px]',
    md: 'text-[21px]',
    lg: 'text-[27px]',
  }
  return (
    <span className={cx('inline-flex items-baseline gap-[3px]', className)}>
      <span
        className={cx(
          'font-display font-semibold tracking-[-0.045em] leading-none',
          sizes[size],
          tone === 'dark' ? 'text-forest-900' : 'text-[#F7F5EF]',
        )}
      >
        floatal
      </span>
      {showDot && (
        <span
          className={cx(
            'inline-block h-[4px] w-[4px] translate-y-[-1px] rounded-full',
            tone === 'dark' ? 'bg-forest-600' : 'bg-gold-400',
          )}
        />
      )}
    </span>
  )
}

export function BrandLockup({
  tone = 'dark',
  size = 'md',
  subtitle,
  className,
}: {
  tone?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <BrandMark size={size === 'lg' ? 42 : size === 'sm' ? 28 : 34} />
      <div className="flex flex-col">
        <Brand tone={tone} size={size} />
        {subtitle && (
          <span
            className={cx(
              'mt-1 text-[9px] font-medium uppercase tracking-[0.18em]',
              tone === 'dark' ? 'text-muted' : 'text-white/40',
            )}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
