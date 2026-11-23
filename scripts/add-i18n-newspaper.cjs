/**
 * Adds the newspaper-section copy to both locales (idempotent).
 *   node scripts/add-i18n-newspaper.cjs
 */
const fs = require('node:fs')
const path = require('node:path')

const COPY = {
  en: {
    nav: 'Newspaper',
    newspaper: {
      title: 'Newspaper',
      subtitle: "National and international headlines, refreshed automatically from each paper's feed",
      refresh: 'Refresh',
      updated: 'Updated {{when}}',
      all: 'All',
      national: 'National',
      international: 'International',
      papersTitle: 'Featured papers',
      papersSubtitle: "Tap a card to open the paper's own website",
      visitSite: 'Visit site',
      readMore: 'Read full story',
      emptyTitle: 'No headlines right now',
      emptyBody: 'Fresh stories appear here automatically as soon as the feeds publish them.',
      errorTitle: 'Could not load the news',
      errorBody: 'Check the connection and hit refresh.',
      disclaimer:
        "Headlines come straight from each publisher's feed — open the source site to read the full report.",
    },
  },
  bn: {
    nav: 'সংবাদপত্র',
    newspaper: {
      title: 'সংবাদপত্র',
      subtitle: 'জাতীয় ও আন্তর্জাতিক শিরোনাম, প্রতিটি পত্রিকার ফিড থেকে স্বয়ংক্রিয়ভাবে হালনাগাদ',
      refresh: 'রিফ্রেশ',
      updated: 'হালনাগাদ {{when}}',
      all: 'সব',
      national: 'জাতীয়',
      international: 'আন্তর্জাতিক',
      papersTitle: 'নির্বাচিত পত্রিকা',
      papersSubtitle: 'পত্রিকার নিজস্ব ওয়েবসাইটে যেতে কার্ডে ক্লিক করুন',
      visitSite: 'ওয়েবসাইট',
      readMore: 'সম্পূর্ণ সংবাদ',
      emptyTitle: 'এখন কোনো শিরোনাম নেই',
      emptyBody: 'ফিডে নতুন সংবাদ এলে এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।',
      errorTitle: 'সংবাদ আনা যায়নি',
      errorBody: 'সংযোগ পরীক্ষা করে আবার রিফ্রেশ করুন।',
      disclaimer:
        'শিরোনাম সরাসরি প্রকাশকের ফিড থেকে আসে — সম্পূর্ণ প্রতিবেদন পড়তে মূল সাইটে যান।',
    },
  },
}

for (const [lang, copy] of Object.entries(COPY)) {
  const file = path.join(__dirname, '..', 'src', 'locales', `${lang}.json`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  json.nav = { ...json.nav, newspaper: copy.nav }
  json.newspaper = copy.newspaper
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
  console.log(`${lang}: nav.newspaper + newspaper.* written`)
}
