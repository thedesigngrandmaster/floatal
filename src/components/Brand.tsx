import { cx } from '../lib/format'
import { BRAND_MARK_PATH } from './brandMarkPath'

export function BrandMark({
  size = 34,
  className,
  framed = true,
}: {
  size?: number
  className?: string
  framed?: boolean
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {framed ? <rect width="512" height="512" rx="112" fill="#0C4232" /> : null}
      <path d={BRAND_MARK_PATH} fill="#F5C518" />
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
