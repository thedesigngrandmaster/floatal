import type { CountryCode, Currency } from './types'

export interface Market {
  code: CountryCode
  name: string
  currency: Currency
  dialCode: string
  locale: string
  timezone: string
  capital: string
  localLength: number
  thresholds: { lowThreshold: number; criticalThreshold: number }
  step: number
  targetFloat: number
  coordinates: { lat: number; lng: number }
  zones: string[]
}

export const MARKETS: Market[] = [
  {
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    dialCode: '+233',
    locale: 'en-GH',
    timezone: 'Africa/Accra',
    capital: 'Accra',
    localLength: 9,
    thresholds: { lowThreshold: 5_000, criticalThreshold: 2_000 },
    step: 500,
    targetFloat: 18_000,
    coordinates: { lat: 5.56, lng: -0.2 },
    zones: ['Osu', 'East Legon', 'Labone', 'Spintex', 'Madina'],
  },
  {
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    dialCode: '+234',
    locale: 'en-NG',
    timezone: 'Africa/Lagos',
    capital: 'Lagos',
    localLength: 10,
    thresholds: { lowThreshold: 900_000, criticalThreshold: 350_000 },
    step: 50_000,
    targetFloat: 2_400_000,
    coordinates: { lat: 6.5244, lng: 3.3792 },
    zones: ['Lekki', 'Yaba', 'Ikeja GRA', 'Surulere', 'Victoria Island'],
  },
  {
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    dialCode: '+254',
    locale: 'en-KE',
    timezone: 'Africa/Nairobi',
    capital: 'Nairobi',
    localLength: 9,
    thresholds: { lowThreshold: 70_000, criticalThreshold: 25_000 },
    step: 5_000,
    targetFloat: 250_000,
    coordinates: { lat: -1.2921, lng: 36.8219 },
    zones: ['Westlands', 'Kibera', 'Karen', 'Kilimani', 'Eastleigh'],
  },
  {
    code: 'RW',
    name: 'Rwanda',
    currency: 'RWF',
    dialCode: '+250',
    locale: 'en-RW',
    timezone: 'Africa/Kigali',
    capital: 'Kigali',
    localLength: 9,
    thresholds: { lowThreshold: 850_000, criticalThreshold: 300_000 },
    step: 50_000,
    targetFloat: 2_200_000,
    coordinates: { lat: -1.9441, lng: 30.0619 },
    zones: ['Kiyovu', 'Nyamirambo', 'Remera', 'Kimironko', 'Gikondo'],
  },
  {
    code: 'GM',
    name: 'Gambia',
    currency: 'GMD',
    dialCode: '+220',
    locale: 'en-GM',
    timezone: 'Africa/Banjul',
    capital: 'Banjul',
    localLength: 7,
    thresholds: { lowThreshold: 30_000, criticalThreshold: 12_000 },
    step: 2_500,
    targetFloat: 110_000,
    coordinates: { lat: 13.4549, lng: -16.579 },
    zones: ['Serrekunda', 'Banjul', 'Bakau', 'Brikama', 'Kololi'],
  },
]

export const DEFAULT_MARKET: CountryCode = 'GH'

export const marketByCode = Object.fromEntries(
  MARKETS.map((market) => [market.code, market]),
) as Record<CountryCode, Market>

export function marketOf(agent: { country: CountryCode }) {
  return marketByCode[agent.country]
}

export function currencyOf(country: CountryCode): Currency {
  return marketByCode[country].currency
}

export function marketName(country: CountryCode) {
  return marketByCode[country].name
}

