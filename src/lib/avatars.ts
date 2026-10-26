// Local portrait set used across the demo so avatars stay available offline.
const WOMEN = Array.from({ length: 8 }, (_, index) => `/avatars/w-${String(index + 1).padStart(2, '0')}.jpg`)
const MEN = Array.from({ length: 8 }, (_, index) => `/avatars/m-${String(index + 1).padStart(2, '0')}.jpg`)

const FEMALE_NAMES = new Set([
  'ama',
  'efua',
  'akosua',
  'abena',
  'nana',
  'ngozi',
  'wanjiku',
  'faith',
  'aline',
  'claudine',
  'fatou',
  'isatou',
  'adjoa',
  'yaa',
  'grace',
  'esther',
  'zainab',
])

const hashOf = (value: string) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000
  }
  return hash
}

export function portraitFor(name: string): string {
  const clean = name.trim().toLowerCase()
  const firstName = clean.split(/\s+/)[0] ?? clean
  const pool = FEMALE_NAMES.has(firstName) ? WOMEN : MEN
  return pool[hashOf(clean) % pool.length]
}
