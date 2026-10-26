import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Compass } from 'lucide-react'
import { BrandLockup } from '../components/Brand'

export function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-forest-950 text-[#F7F5EF]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            'radial-gradient(760px 540px at 15% 8%, rgba(120,201,164,0.14), transparent 62%), radial-gradient(620px 480px at 88% 92%, rgba(245,197,24,0.09), transparent 62%)',
        }}
      />
      <div className="map-grid pointer-events-none absolute inset-0 opacity-[0.35]" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[520px] w-[520px] rounded-full border border-white/[0.05]" />
      <div className="pointer-events-none absolute -right-10 top-1/3 h-[360px] w-[360px] rounded-full border border-gold-400/[0.09]" />

      <header className="relative z-10 mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 py-6 lg:px-10">
        <BrandLockup tone="light" size="md" subtitle="Float infrastructure" />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.13em] text-white/55 transition-colors hover:border-white/25 hover:text-white/80"
        >
          <ArrowLeft size={11} /> Home
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-1 items-center px-5 pb-20 pt-8 lg:px-10">
        <div className="max-w-[620px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/[0.07] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-gold-300">
            <Compass size={11} /> Off the map
          </div>

          <div className="mt-7 flex items-end gap-4">
            <span className="font-display text-[92px] font-medium leading-[0.82] tracking-[-0.07em] text-[#F7F5EF] sm:text-[124px]">
              4
            </span>
            <span className="mb-2 flex h-[58px] w-[58px] items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/[0.08] sm:mb-3 sm:h-[74px] sm:w-[74px]">
              <svg viewBox="0 0 60 60" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" aria-hidden="true">
                <circle cx="30" cy="30" r="17" stroke="#F5C518" strokeWidth="1.4" strokeDasharray="3 4" />
                <circle cx="30" cy="30" r="6.5" fill="#F5C518" />
              </svg>
            </span>
            <span className="font-display text-[92px] font-medium leading-[0.82] tracking-[-0.07em] text-[#F7F5EF] sm:text-[124px]">
              4<span className="text-gold-400">.</span>
            </span>
          </div>

          <h1 className="font-display mt-8 text-[clamp(28px,4vw,42px)] font-medium leading-[1.05] tracking-[-0.045em] text-balance">
            This route lost its float.
          </h1>
          <p className="mt-4 max-w-[440px] text-[13px] leading-[1.8] text-white/55">
            The page you were looking for has moved, settled, or never existed. Every other position in the network is
            still in balance.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <Link to="/" className="btn btn-gold h-11 px-5 text-[12px]">
              Back to home <ArrowUpRight size={13} />
            </Link>
            <Link
              to="/app"
              className="btn h-11 border border-white/14 bg-white/[0.06] px-5 text-[12px] text-white/80 hover:border-white/25 hover:bg-white/[0.1]"
            >
              Open agent app
            </Link>
            <Link
              to="/ops/login"
              className="btn h-11 px-4 text-[12px] text-white/50 hover:text-white/80"
            >
              Operator console
            </Link>
          </div>

          <div className="mt-12 grid max-w-[440px] grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-[10px] text-white/35 sm:grid-cols-3">
            {[
              ['Agent home', '/app'],
              ['Float network', '/app/network'],
              ['Report float', '/app/report'],
              ['Activity', '/app/activity'],
              ['Agent profile', '/app/profile'],
              ['Operator sign in', '/ops/login'],
            ].map(([label, href]) => (
              <Link key={href} to={href} className="transition-colors hover:text-gold-300">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <footer className="relative z-10 border-t border-white/[0.07]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-2 px-5 py-5 text-[9px] uppercase tracking-[0.14em] text-white/28 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <span>Floatal · Liquidity in balance</span>
          <span>Error 404 · Route not found</span>
        </div>
      </footer>
    </main>
  )
}
