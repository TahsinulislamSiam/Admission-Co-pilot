import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseFeed, scrapeOgImage, decodeEntities, stripHtml, getNews, clearNewsCache } from './news.js'

/**
 * The newspaper section has no XML dependency, so the parser is the one piece
 * that must be pinned down: CDATA, entities, media images and both date formats.
 */

const source = {
  id: 'test-paper',
  name: { en: 'Test Paper', bn: 'টেস্ট পত্রিকা' },
  site: 'https://example.com',
  scope: 'national',
}

const rss = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Test Paper</title>
    <item>
      <title><![CDATA[ঢাবি ভর্তি পরীক্ষা &amp; সময়সূচি]]></title>
      <link>https://example.com/a</link>
      <description><![CDATA[<p>ভর্তি পরীক্ষার <b>সময়সূচি</b> প্রকাশিত</p>]]></description>
      <media:content url="https://example.com/a.jpg" height="451"/>
      <pubDate>Mon, 23 Nov 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Second story</title>
      <link>https://example.com/b</link>
      <description>No image here</description>
      <dc:date>2026-11-22T08:30:00Z</dc:date>
    </item>
    <item>
      <title>No link at all</title>
      <description>should be skipped</description>
    </item>
  </channel>
</rss>`

afterEach(() => {
  clearNewsCache()
  vi.unstubAllGlobals()
})

describe('parseFeed', () => {
  it('reads titles, links, summaries, images and dates', () => {
    const items = parseFeed(rss, source)

    // the entry without a link is dropped
    expect(items).toHaveLength(2)

    const [first, second] = items
    expect(first.title).toBe('ঢাবি ভর্তি পরীক্ষা & সময়সূচি')
    expect(first.url).toBe('https://example.com/a')
    expect(first.summary).toBe('ভর্তি পরীক্ষার সময়সূচি প্রকাশিত')
    expect(first.image).toBe('https://example.com/a.jpg')
    expect(first.publishedAt).toBe('2026-11-23T10:00:00.000Z')
    expect(first.source).toMatchObject({ id: 'test-paper', scope: 'national' })

    expect(second.image).toBeNull()
    expect(second.publishedAt).toBe('2026-11-22T08:30:00.000Z')
  })

  it('parses atom entries and href links', () => {
    const atom = `<feed><entry>
      <title>Atom story</title>
      <link rel="alternate" href="https://example.com/c"/>
      <summary>Atom summary</summary>
      <updated>2026-11-21T12:00:00Z</updated>
    </entry></feed>`

    const [item] = parseFeed(atom, source)
    expect(item.title).toBe('Atom story')
    expect(item.url).toBe('https://example.com/c')
    expect(item.publishedAt).toBe('2026-11-21T12:00:00.000Z')
  })
})

describe('helpers', () => {
  it('decodes named and numeric entities', () => {
    expect(decodeEntities('a &amp; b &#39;c&#39; &#8217;d&#8217;')).toBe('a & b \'c\' ’d’')
  })

  it('strips markup and collapses whitespace', () => {
    expect(stripHtml('<p>one   <b>two</b></p>\n<p>three</p>')).toBe('one two three')
  })

  it('finds the og:image thumbnail of an article page', () => {
    const html = `<html><head>
      <meta property="og:image" content="https://example.com/pic.jpg" />
    </head></html>`
    expect(scrapeOgImage(html)).toBe('https://example.com/pic.jpg')
    expect(scrapeOgImage('<html></html>')).toBeNull()
  })
})

describe('getNews', () => {
  it('merges feeds, dedupes by url and survives a dead feed', async () => {
    const feed = (title, url) =>
      `<rss><channel><item><title>${title}</title><link>${url}</link>
        <pubDate>Mon, 23 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>`

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input) => {
        const url = String(input)
        if (url.includes('jagonews24')) throw new Error('boom')
        const body = url.includes('daily-star')
          ? feed('Shared story', 'https://www.thedailystar.net/x') // same story as below
          : feed('Bangla story', 'https://www.thedailystar.net/x')
        return { ok: true, status: 200, text: async () => body }
      })
    )

    const result = await getNews({ scope: 'national', limit: 10 })

    expect(result.items).toHaveLength(1) // duplicate url collapsed
    expect(result.failed).toContain('jagonews24') // dead feed reported, not thrown
    expect(result.counts.national).toBe(1)
  })

  it('caches each feed so a repeat read does not refetch', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '<rss><channel><item><title>One</title><link>https://x.test/1</link></item></channel></rss>',
    }))
    vi.stubGlobal('fetch', fetchSpy)

    await getNews({ scope: 'national', limit: 5 })
    const afterFirst = fetchSpy.mock.calls.length
    await getNews({ scope: 'national', limit: 5 })

    expect(fetchSpy.mock.calls.length).toBe(afterFirst) // second read served from cache
  })
})
