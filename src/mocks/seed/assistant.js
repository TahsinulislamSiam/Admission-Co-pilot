/**
 * Assistant knowledge base (AI-2, AI-3).
 * Rule-based "AI": matches keywords (Bangla + English) to grounded answers,
 * each with official source links. Falls back to an honest "no verified record"
 * response. Some keywords intentionally fail to demonstrate that state.
 */

export const knowledgeBase = [
  {
    keywords: ['seat', 'seats', 'আসন', 'কত আসন', 'আসন সংখ্যা', 'আছে'],
    answer: {
      bn: '**ঢাকা বিশ্ববিদ্যালয়**\n\n- **ক ইউনিট (বিজ্ঞান অনুষদ):** প্রায় ১,৭৯০ টি আসন\n- **খ ইউনিট (কলা ও সামাজিক বিজ্ঞান):** প্রায় ২,৪০৭ টি আসন\n- **গ ইউনিট (ব্যবসায় শিক্ষা):** প্রায় ১,২৫০ টি আসন\n\nমোট স্নাতক আসন প্রায় ৪,৩৬১। আবেদন ফি ৩৫০ টাকা।',
      en: "**University of Dhaka**\n\n- **A Unit (Science):** about 1,790 seats\n- **B Unit (Arts & Social Science):** about 2,407 seats\n- **C Unit (Business Studies):** about 1,250 seats\n\nTotal undergraduate seats ≈ 4,361. Application fee ৳350.",
    },
    sources: [
      { label: { bn: 'ঢাবি ভর্তি পোর্টাল', en: 'DU Admission Portal' }, url: 'https://admission.eis.du.ac.bd' },
      { label: { bn: 'বিজ্ঞপ্তি (২০২৬-২৭)', en: 'Admission Circular 2026-27' }, url: 'https://admission.eis.du.ac.bd/circular' },
    ],
  },
  {
    keywords: ['buet', 'বুয়েট', 'eligibility', 'যোগ্যতা', 'পাস মার্ক', 'minimum gpa', 'জিপিএ লাগবে', 'যোগ্যতা কী', 'যোগ্যতা কত'],
    answer: {
      bn: '**বুয়েট স্নাতক ভর্তির যোগ্যতা (২০২৬-২৭ সেশন)**\n\n- এসএসসি ও এইচএসসি উভয়ে **জিপিএ ৪.০** (আলাদাভাবে)\n- এসএসসি + এইচএসসি **সম্মিলিত জিপিএ ১৩.০০**\n- এইচএসসিতে পদার্থবিজ্ঞান, রসায়ন ও গণিত বিষয়ে ন্যূনতম নম্বর প্রয়োজন\n- পরীক্ষা: ১০০০ নম্বরের MCQ, সময় ৩ ঘণ্টা, নেগেটিভ মার্কিং নেই\n\nমোট আসন প্রায় ১,২১৫। আবেদন ফি ৪৫০ টাকা।',
      en: "**BUET undergraduate eligibility (2026-27)**\n\n- **GPA 4.00** in both SSC and HSC separately\n- **Combined GPA 13.00** (SSC + HSC)\n- Physics, Chemistry & Mathematics required in HSC\n- Exam: 1000-mark MCQ, 3 hours, no negative marking\n\nTotal seats ≈ 1,215. Application fee ৳450.",
    },
    sources: [
      { label: { bn: 'বুয়েট ভর্তি সাইট', en: 'BUET Admission' }, url: 'https://admission.buet.ac.bd' },
      { label: { bn: 'যোগ্যতার বিজ্ঞপ্তি', en: 'Eligibility circular' }, url: 'https://admission.buet.ac.bd/eligibility' },
    ],
  },
  {
    keywords: ['nsu', 'এনএসইউ', 'north south', 'নর্থ সাউথ', 'cse', 'সিএসই', 'কম্পিউটার', 'computer science'],
    answer: {
      bn: '**নর্থ সাউথ বিশ্ববিদ্যালয় — CSE খরচ (আনুমানিক)**\n\n- ক্রেডিট: ১৩৬\n- প্রতি ক্রেডিট টিউশন: ৭,৩০০ টাকা\n- অন্যান্য ফি: ~৯০,০০০ টাকা\n- **৪ বছরের মোট খরচ: ~১০,৮২,৮০০ টাকা**\n\nওয়েভার: উভয় পরীক্ষায় জিপিএ ৫.০০ হলে ৩০%, সম্মিলিত জিপিএ ৯.৭৫+ হলে ২০%।',
      en: "**North South University — CSE cost (approx.)**\n\n- Credits: 136\n- Tuition per credit: ৳7,300\n- Other fees: ~৳90,000\n- **Estimated 4-year total: ~৳1,082,800**\n\nWaivers: 30% for double GPA 5.00; 20% for combined GPA 9.75+.",
    },
    sources: [
      { label: { bn: 'এনএসইউ ভর্তি পেজ', en: 'NSU Admission' }, url: 'https://www.northsouth.edu/admission' },
      { label: { bn: 'টিউশন ও ফি', en: 'Tuition & fees' }, url: 'https://www.northsouth.edu/tuition-fees' },
    ],
  },
  {
    keywords: ['gst', 'জিএসটি', 'cluster', 'ক্লাস্টার', 'গুচ্ছ', 'গুচ্ছ ভর্তি', 'গুচ্ছত'],
    answer: {
      bn: '**GST (গুচ্ছ) ভর্তি পদ্ধতি**\n\n২০টি সাধারণ ও বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় একসাথে একটি **সম্মিলিত আবেদন ও পরীক্ষা** পদ্ধতিতে ভর্তি নেয়।\n\n- একটি অনলাইন আবেদনে সব বিশ্ববিদ্যালয়ে আবেদন করা যায়\n- একটি ঢাকা কেন্দ্রিক MCQ পরীক্ষা (নেগেটিভ মার্কিং সহ)\n- একাডেমিক ট্রান্সক্রিপ্ট যাচাই ও বিষয় পছন্দ অনলাইনে\n- ফলাফলের ভিত্তিতে মেধাক্রমে বিভিন্ন বিশ্ববিদ্যালয়ে ভর্তি\n\nসঠিক তারিখ ও তালিকা অফিসিয়াল সাইটে দেখুন।',
      en: "**GST (cluster) admission system**\n\n20 general science & technology universities admit students through a **combined application and exam**:\n\n- One online application covers all member universities\n- One MCQ exam (with negative marking)\n- Online subject choice after transcript verification\n- Merit-based admission across universities\n\nCheck the official site for exact dates and the university list.",
    },
    sources: [
      { label: { bn: 'GST অফিসিয়াল সাইট', en: 'GST official site' }, url: 'https://gstadmission.ac.bd' },
    ],
  },
  {
    keywords: ['budget', 'বাজেট', 'afford', 'খরচ', 'টাকা', 'lakh', 'লাখ', 'কোথায় ভর্তি', 'where can i'],
    answer: {
      bn: '**আপনার বাজেট অনুযায়ী পরামর্শ**\n\nযদি বাজেট **৫ লাখ টাকার আশেপাশে** হয়:\n\n- **পাবলিক বিশ্ববিদ্যালয়** — সবচেয়ে সাশ্রয়ী (মোট খরচ সাধারণত ৫০–৮০ হাজার টাকার মধ্যে)। যোগ্যতা পূরণ হলে প্রথমে এগুলোই বিবেচনা করুন।\n- **ওয়েভারসহ প্রাইভেট** — ভালো জিপিএ থাকলে ড্যাফোডিল (৬০% পর্যন্ত ওয়েভার), UIU (৫০%), AIUB (৫০%) বিবেচনা করা যায়। ওয়েভারের পরেও ৪ বছরে ৫–৮ লাখ লাগতে পারে।\n\nআপনার জিপিএ ও বাজেট দিয়ে **সুপারিশ পেজ**-এ হালনাগাদ ম্যাচ দেখুন।',
      en: "**Advice by budget**\n\nIf your budget is **around ৳500,000**:\n\n- **Public universities** — most affordable (total usually ৳50–80k). Consider these first if eligible.\n- **Private with waiver** — with a good GPA consider DIU (up to 60% waiver), UIU (50%), AIUB (50%). Even after waivers, 4 years may cost ৳500–800k.\n\nSee the **Recommendations** page for live matches based on your GPA and budget.",
    },
    sources: [
      { label: { bn: 'প্রাইভেট বিশ্ববিদ্যালয় তালিকা (এই অ্যাপ)', en: 'Private directory (this app)' }, url: '/app/private-universities' },
      { label: { bn: 'UGC অনুমোদিত তালিকা', en: 'UGC approved list' }, url: 'https://www.ugc.university' },
    ],
  },
  {
    keywords: ['deadline', 'last date', 'শেষ তারিখ', 'কবে', 'আবেদনের সময়', 'কখন', 'date', 'তারিখ'],
    answer: {
      bn: '**চলতি আবেদনের শেষ তারিখ (গুরুত্বপূর্ণ কিছু)**\n\n- ঢাকা বিশ্ববিদ্যালয়: **৩০ নভেম্বর ২০২৬**\n- বুয়েট: **১০ ডিসেম্বর ২০২৬**\n- জাহাঙ্গীরনগর বিশ্ববিদ্যালয়: **২০ নভেম্বর ২০২৬**\n- রুয়েট/কুয়েট/চুয়েট: **২৫–২৮ নভেম্বর ২০২৬**\n\nতারিখ বদলাতে পারে — সব সর্বশেষ তারিখ **পাবলিক হাব** পেজে একসাথে দেখুন।',
      en: "**Current application deadlines (selected)**\n\n- University of Dhaka: **30 Nov 2026**\n- BUET: **10 Dec 2026**\n- Jahangirnagar University: **20 Nov 2026**\n- RUET/KUET/CUET: **25–28 Nov 2026**\n\nDates may change — see all latest deadlines together on the **Public Hub** page.",
    },
    sources: [
      { label: { bn: 'পাবলিক বিশ্ববিদ্যালয় হাব (এই অ্যাপ)', en: 'Public hub (this app)' }, url: '/app/public-universities' },
    ],
  },
  {
    keywords: ['medical', 'মেডিকেল', 'mbbs', 'এমবিবিএস', 'dental', 'বিডিএস'],
    answer: {
      bn: '**মেডিকেল (MBBS) ভর্তি সংক্রান্ত**\n\nরাষ্ট্রীয় মেডিকেল কলেজে ভর্তি হয় **DGHS**-এর অধীনে একটি কেন্দ্রীয় পরীক্ষার ভিত্তিতে (বিজ্ঞান বিভাগ, জিপিএ ৯.০+ প্রয়োজনীয়তার ক্ষেত্রে)। বেসরকারি মেডিকেল কলেজের খরচ ও আসন আলাদা।\n\n**তবে সাবধান** — আমার কাছে মেডিকেল ভর্তির **যাচাই করা রেকর্ড এখনো নেই।** নিচের অফিসিয়াল লিংকে সরাসরি যাচাই করুন।',
      en: "**Medical (MBBS) admission**\n\nGovernment medical colleges admit via a central exam under **DGHS** (Science group, GPA 9.0+ typical). Private medical colleges have separate costs and seats.\n\n**However** — I do not have a **verified record** for medical admissions yet. Please verify on the official link below.",
    },
    sources: [
      { label: { bn: 'DGHS ভর্তি সাইট', en: 'DGHS admission' }, url: 'https://dghs.gov.bd' },
    ],
    noRecord: true,
  },
]

/** Suggested questions shown as chips above the chat input. */
export const suggestedQuestions = [
  { bn: 'ঢাকা বিশ্ববিদ্যালয়ের ক ইউনিটে কত আসন?', en: "How many seats in DU 'A' unit?" },
  { bn: 'বুয়েটে আবেদনের যোগ্যতা কী?', en: 'What is the eligibility for BUET?' },
  { bn: 'NSU-তে CSE পড়াতে মোট খরচ কত?', en: 'What is the total cost of CSE at NSU?' },
  { bn: 'GST ক্লাস্টার ভর্তি পদ্ধতি কীভাবে কাজ করে?', en: 'How does the GST cluster system work?' },
  { bn: 'আমার বাজেট ৫ লাখ — কোথায় ভর্তি হতে পারব?', en: 'My budget is 5 lakh BDT — where can I apply?' },
  { bn: 'মেডিকেল ভর্তির তারিখ কবে?', en: 'When are the medical admission dates?' },
]
