/**
 * Newspaper section: pulls public RSS feeds (national + international), parses
 * them without any XML dependency, and caches the result in memory so the UI can
 * poll cheaply.
 *
 * No API key and no database: every read is either a cache hit or a fresh fetch
 * of the publishers' own feeds. A feed that fails or times out is skipped, so one
 * dead publisher never blanks the whole page.
 */
const CACHE_TTL = 10 * 60 * 1000 // news items
const PAPERS_TTL = 30 * 60 * 1000 // featured-paper thumbnails (og:image scrape)
const FETCH_TIMEOUT = 9000
const UA = 'AdmissionCopilot/1.0 (+student newspaper section)'

/** The two papers featured as link cards with a thumbnail. */
export const PAPERS = [
  {
    id: 'prothom-alo',
    name: { en: 'Prothom Alo', bn: 'প্রথম আলো' },
    url: 'https://www.prothomalo.com',
    feed: 'https://www.prothomalo.com/feed',
    scope: 'national',
    accent: '#e11d48',
  },
  {
    id: 'daily-star',
    name: { en: 'The Daily Star', bn: 'দ্য ডেইলি স্টার' },
    url: 'https://www.thedailystar.net',
    feed: 'https://www.thedailystar.net/taxonomy/term/107/rss.xml',
    scope: 'national',
    accent: '#0f766e',
  },
]

/** Every feed the section aggregates. */
export const FEEDS = [
  {
    id: 'prothom-alo',
    name: { en: 'Prothom Alo', bn: 'প্রথম আলো' },
    site: 'https://www.prothomalo.com',
    url: 'https://www.prothomalo.com/feed',
    scope: 'national',
  },
  {
    id: 'daily-star',
    name: { en: 'The Daily Star', bn: 'দ্য ডেইলি স্টার' },
    site: 'https://www.thedailystar.net',
    url: 'https://www.thedailystar.net/taxonomy/term/107/rss.xml',
    scope: 'national',
  },
  {
    id: 'jagonews24',
    name: { en: 'Jago News 24', bn: 'যগোনিউজ২৪' },
    site: 'https://www.jagonews24.com',
    url: 'https://www.jagonews24.com/rss/rss.xml',
    scope: 'national',
  },
  {
    id: 'bbc-bangla',
    name: { en: 'BBC Bangla', bn: 'বিবিসি বাংলা' },
    site: 'https://www.bbc.com/bengali',
    url: 'https://feeds.bbci.co.uk/bengali/rss.xml',
    scope: 'international',
  },
  {
    id: 'bbc-world',
    name: { en: 'BBC World', bn: 'বিবিসি ওয়ার্ল্ড' },
    site: 'https://www.bbc.com/news/world',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    scope: 'international',
  },
  {
    id: 'dw',
    name: { en: 'DW', bn: 'ডিডব্লিউ' },
    site: 'https://www.dw.com',
    url: 'https://rss.dw.com/rdf/rss-en-all',
    scope: 'international',
  },
]

// ------------------------------------------------------------------ parsing
const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
  '#8217': '’',
  '#8216': '‘',
  '#8220': '“',
  '#8221': '”',
  '#8211': '–',
  '#8212': '—',
}

export const decodeEntities = (s = '') =>
  String(s).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, code) => {
    if (code[0] === '#') {
      const hex = code[1] === 'x' || code[1] === 'X'
      const n = parseInt(hex ? code.slice(2) : code.slice(1), hex ? 16 : 10)
      return Number.isFinite(n) && n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : m
    }
    return ENTITIES[code.toLowerCase()] ?? m
  })

export const stripHtml = (s = '') =>
  decodeEntities(
    String(s)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim()

const cdata = (s = '') => String(s).replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim()

/** First `<tag ...>value</tag>` inside an XML chunk (handles CDATA). */
const tag = (xml, name) => {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i')
  const m = xml.match(re)
  return m ? cdata(m[1]) : ''
}

/** `url` attribute of `<tag ...>` (media:content, media:thumbnail, enclosure). */
const tagUrl = (xml, name) => {
  const re = new RegExp(`<${name}\\b[^>]*\\burl=["']([^"']+)["']`, 'i')
  const all = [...xml.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))]
  for (const m of all) {
    const u = m[0].match(/\burl=["']([^"']+)["']/i)?.[1]
    if (u) return decodeEntities(u)
  }
  return re.test(xml) ? '' : ''
}

const firstImage = (chunk, summary) => {
  const candidates = [
    tagUrl(chunk, 'media:content'),
    tagUrl(chunk, 'media:thumbnail'),
    tagUrl(chunk, 'enclosure'),
    tagUrl(chunk, 'image'),
    chunk.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
    String(summary).match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
  ]
  for (const c of candidates) {
    if (c && /^https?:\/\//i.test(c)) return c
  }
  return null
}

const toIso = (raw) => {
  const s = stripHtml(raw)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Parse an RSS 2.0 or Atom document into normalised items. */
export const parseFeed = (xml, source) => {
  const blocks = [
    ...String(xml).matchAll(/<item\b[\s\S]*?<\/item>/gi),
    ...String(xml).matchAll(/<entry\b[\s\S]*?<\/entry>/gi),
  ].map((m) => m[0])

  const items = []
  for (const block of blocks) {
    const title = stripHtml(tag(block, 'title'))
    let url = stripHtml(tag(block, 'link')) || tag(block, 'guid')
    if (!url) {
      // atom: <link rel="alternate" href="..."/>
      url = block.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i)?.[1] ?? ''
    }
    if (!title || !url) continue
    const description = tag(block, 'description') || tag(block, 'summary') || tag(block, 'content')
    const image = firstImage(block, description)
    const summary = stripHtml(description).slice(0, 240)
    const publishedAt =
      toIso(tag(block, 'pubDate')) ??
      toIso(tag(block, 'dc:date')) ??
      toIso(tag(block, 'published')) ??
      toIso(tag(block, 'updated'))

    items.push({
      id: `${source.id}:${url}`,
      title,
      url,
      summary,
      image,
      publishedAt,
      source: { id: source.id, name: source.name, site: source.site, scope: source.scope },
    })
  }
  return items
}

/** Read `og:image` from an article page (fallback when a feed carries no image). */
export const scrapeOgImage = (html) => {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ]
  for (const re of patterns) {
    const m = String(html).match(re)
    if (m?.[1]) return decodeEntities(m[1])
  }
  return null
}

// ------------------------------------------------------------------ fetching
const cache = new Map() // url -> { at, items, error }

const getCached = (key, ttl) => {
  const hit = cache.get(key)
  return hit && Date.now() - hit.at < ttl ? hit : null
}

const fetchText = async (url) => {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'application/rss+xml, application/xml, text/xml, text/html' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

const loadFeed = async (feed) => {
  const cached = getCached(feed.url, CACHE_TTL)
  if (cached) return cached
  try {
    const xml = await fetchText(feed.url)
    const items = parseFeed(xml, feed)
    const entry = { at: Date.now(), items, error: null }
    cache.set(feed.url, entry)
    return entry
  } catch (err) {
    // serve stale rather than nothing, but remember the failure
    const stale = cache.get(feed.url)
    const entry = { at: stale?.at ?? 0, items: stale?.items ?? [], error: String(err.message ?? err) }
    if (stale) cache.set(feed.url, entry)
    return entry
  }
}

const dedupe = (items) => {
  const seen = new Set()
  const out = []
  for (const it of items) {
    const key = it.url.replace(/[?#].*$/, '')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(it)
  }
  return out
}

/**
 * Aggregated news for the section.
 * @param {{ scope?: 'all'|'national'|'international', limit?: number }} opts
 */
export const getNews = async ({ scope = 'all', limit = 24 } = {}) => {
  const feeds = FEEDS.filter((f) => scope === 'all' || f.scope === scope)
  const settled = await Promise.all(feeds.map(loadFeed))
  const items = dedupe(settled.flatMap((s) => s.items)).sort(
    (a, b) => new Date(b.publishedAt ?? 0) - new Date(a.publishedAt ?? 0)
  )

  return {
    scope,
    fetchedAt: new Date().toISOString(),
    updatedAt: settled.reduce((max, s) => Math.max(max, s.at), 0) || null,
    counts: {
      national: items.filter((i) => i.source.scope === 'national').length,
      international: items.filter((i) => i.source.scope === 'international').length,
    },
    failed: feeds.filter((_f, idx) => settled[idx].error).map((f) => f.id),
    sources: feeds.map((f) => ({ id: f.id, name: f.name, site: f.site, scope: f.scope })),
    items: items.slice(0, Math.max(1, Math.min(Number(limit) || 24, 60))),
  }
}

/** The two featured papers, each with a real thumbnail pulled from its latest story. */
export const getPapers = async () => {
  const cached = getCached('papers', PAPERS_TTL)
  if (cached) return cached.papers

  const papers = await Promise.all(
    PAPERS.map(async (paper) => {
      const feed = FEEDS.find((f) => f.id === paper.id) ?? paper
      const { items } = await loadFeed(feed)
      const latest = items[0] ?? null
      let thumbnail = latest?.image ?? null
      if (!thumbnail && latest?.url) {
        try {
          thumbnail = scrapeOgImage(await fetchText(latest.url))
        } catch {
          thumbnail = null
        }
      }
      return {
        id: paper.id,
        name: paper.name,
        url: paper.url,
        accent: paper.accent,
        thumbnail,
        headline: latest?.title ?? null,
        headlineUrl: latest?.url ?? paper.url,
      }
    })
  )

  cache.set('papers', { at: Date.now(), papers })
  return papers
}

/** Test helper: drop every cached entry. */
export const clearNewsCache = () => cache.clear()
