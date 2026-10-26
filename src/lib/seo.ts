import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

type Seo = {
  title: string
  description: string
}

const SITE = 'Floatal'

const PAGE_SEO: Array<{ match: RegExp; seo: Seo }> = [
  {
    match: /^\/$/,
    seo: {
      title: 'Floatal – Liquidity in balance',
      description:
        "Floatal keeps mobile-money agents funded. Report a float position, find excess nearby, and settle every movement with two-sided reconciliation — one calm system for agents and the operators who run them.",
    },
  },
  {
    match: /^\/app\/login$/,
    seo: {
      title: 'Agent sign in – Floatal',
      description:
        'Sign in to the Floatal agent app with the mobile number registered to your float account. Report float, find liquidity nearby and confirm handovers on the go.',
    },
  },
  {
    match: /^\/app\/request\//,
    seo: {
      title: 'Rebalance request – Floatal',
      description:
        'Follow a Floatal rebalance from request to two-sided confirmation, with amounts, counterparty details and settlement history in one place.',
    },
  },
  {
    match: /^\/app\/?$/,
    seo: {
      title: 'Agent home – Floatal',
      description:
        'Your float position, nearby liquidity and pending handovers at a glance. Floatal keeps every agent balance in view.',
    },
  },
  {
    match: /^\/app\/network$/,
    seo: {
      title: 'Float network – Floatal',
      description:
        'See agents with excess float around you, compare distance and capacity, and request the liquidity your position needs.',
    },
  },
  {
    match: /^\/app\/report$/,
    seo: {
      title: 'Report float – Floatal',
      description:
        'Report your current float position in seconds. Reports save offline and sync automatically when your connection returns.',
    },
  },
  {
    match: /^\/app\/activity$/,
    seo: {
      title: 'Agent activity – Floatal',
      description:
        'A complete, reconciled history of every float report, rebalance request and two-sided confirmation on your account.',
    },
  },
  {
    match: /^\/app\/profile$/,
    seo: {
      title: 'Agent profile – Floatal',
      description:
        'Manage your Floatal agent profile, float thresholds, notification preferences and offline sync settings.',
    },
  },
  {
    match: /^\/ops\/login$/,
    seo: {
      title: 'Operator sign in – Floatal',
      description:
        'Sign in to the Floatal operator console to run one market at a time — network visibility, rebalancing and agent operations.',
    },
  },
  {
    match: /^\/ops\/?$/,
    seo: {
      title: 'Network overview – Floatal',
      description:
        'Live market health, float coverage and rebalancing activity for your agent network, scoped to a single market and currency.',
    },
  },
  {
    match: /^\/ops\/network$/,
    seo: {
      title: 'Market network – Floatal',
      description:
        'Map agent positions across your market, spot low-float clusters and see where excess liquidity is available.',
    },
  },
  {
    match: /^\/ops\/rebalancing$/,
    seo: {
      title: 'Rebalancing desk – Floatal',
      description:
        'Review, flag and reconcile rebalance requests across the network with a full audit trail for every handover.',
    },
  },
  {
    match: /^\/ops\/agents$/,
    seo: {
      title: 'Agent directory – Floatal',
      description:
        'Search and manage the agents in your market, including float status, thresholds, transaction history and account health.',
    },
  },
  {
    match: /^\/ops\/settings$/,
    seo: {
      title: 'Workspace settings – Floatal',
      description:
        'Configure your Floatal operator workspace, market defaults, thresholds and team access.',
    },
  },
]

export function seoFor(pathname: string): Seo {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const entry = PAGE_SEO.find((item) => item.match.test(normalized))
  if (entry) return entry.seo
  return {
    title: 'Page not found – Floatal',
    description: `That page is not part of ${SITE}. Head back to the homepage or open the agent app.`,
  }
}

function setMeta(selector: string, value: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector)
  if (element) element.setAttribute('content', value)
}

function setCanonical(value: string) {
  const element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (element) element.setAttribute('href', value)
}

export function RouteSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const { title, description } = seoFor(pathname)
    document.title = title

    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:title"]', title)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[name="twitter:title"]', title)
    setMeta('meta[name="twitter:description"]', description)

    const url = `https://floatal.app${pathname === '/' ? '/' : pathname}`
    setCanonical(url)
    setMeta('meta[property="og:url"]', url)

    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (pathname.startsWith('/app') || pathname.startsWith('/ops')) {
      if (robots) robots.content = 'noindex, nofollow'
    } else if (robots) {
      robots.content = 'index, follow'
    }
  }, [pathname])

  return null
}
