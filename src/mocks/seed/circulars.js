/**
 * Circular drafts (AI-1): uploaded PDF circulars with AI-extracted fields.
 * Nothing is published until an admin approves (status: pending_review).
 */
export const circulars = [
  {
    id: 'circ-1',
    universityId: 'ju',
    universityName: { en: 'Jahangirnagar University', bn: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়' },
    title: { en: 'Undergraduate Admission Circular 2026-27', bn: 'স্নাতক (সম্মান) ভর্তি বিজ্ঞপ্তি ২০২৬-২৭' },
    fileName: 'ju-admission-circular-2026.pdf',
    fileSize: 1845231,
    uploadedBy: 'admin@example.com',
    uploadedAt: '2026-11-09T09:30:00Z',
    status: 'pending_review',
    extracted: {
      applicationStart: '2026-10-20',
      applicationDeadline: '2026-11-20',
      examDate: '2027-01-12',
      minSscGpa: 3.0,
      minHscGpa: 3.0,
      applicationFee: 320,
      departments: [
        { name: { en: 'A Unit — Mathematical & Physical Sciences', bn: 'ক ইউনিট — গণিত ও ভৌত বিজ্ঞান' }, seats: 580 },
        { name: { en: 'B Unit — Arts & Humanities', bn: 'খ ইউনিট — কলা ও মানববিদ্যা' }, seats: 580 },
        { name: { en: 'C Unit — Business Studies', bn: 'গ ইউনিট — ব্যবসায় শিক্ষা' }, seats: 580 },
      ],
    },
    rawText: {
      en: 'JAHANGIRNAGAR UNIVERSITY\nUndergraduate Admission Circular 2026-27\n\nApplications open: 20 October 2026. Application deadline: 20 November 2026.\nAdmission test: 12 January 2027.\n\nMinimum requirement: SSC GPA 3.00 and HSC GPA 3.00.\nApplication fee: 320 BDT (per unit).\n\nA Unit (Mathematical & Physical Sciences): 580 seats.\nB Unit (Arts & Humanities): 580 seats.\nC Unit (Business Studies): 580 seats.\nExam pattern: MCQ, 80 marks, 60 minutes, negative marking 0.25 per wrong answer.',
      bn: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়\nস্নাতক (সম্মান) ভর্তি বিজ্ঞপ্তি ২০২৬-২৭\n\nআবেদন শুরু: ২০ অক্টোবর ২০২৬। আবেদনের শেষ তারিখ: ২০ নভেম্বর ২০২৬।\nভর্তি পরীক্ষা: ১২ জানুয়ারি ২০২৭।\n\nন্যূনতম যোগ্যতা: এসএসসি জিপিএ ৩.০০ এবং এইচএসসি জিপিএ ৩.০০।\nআবেদন ফি: ৩২০ টাকা (প্রতি ইউনিট)।\n\nক ইউনিট (গণিত ও ভৌত বিজ্ঞান): ৫৮০ আসন।\nখ ইউনিট (কলা ও মানববিদ্যা): ৫৮০ আসন।\nগ ইউনিট (ব্যবসায় শিক্ষা): ৫৮০ আসন।\nপরীক্ষার ধরন: MCQ, ৮০ নম্বর, ৬০ মিনিট, প্রতিটি ভুল উত্তরে ০.২৫ নেগেটিভ মার্কিং।',
    },
  },
  {
    id: 'circ-2',
    universityId: 'sust',
    universityName: { en: 'Shahjalal University of Science & Technology', bn: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়' },
    title: { en: 'Undergraduate Admission Circular 2026-27', bn: 'স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৬-২৭' },
    fileName: 'sust-circular-2026.pdf',
    fileSize: 2098576,
    uploadedBy: 'admin@example.com',
    uploadedAt: '2026-11-04T14:10:00Z',
    status: 'approved',
    reviewedAt: '2026-11-06T11:00:00Z',
    reviewedBy: 'admin@example.com',
    extracted: {
      applicationStart: '2026-11-01',
      applicationDeadline: '2026-12-05',
      examDate: '2027-01-22',
      minSscGpa: 3.5,
      minHscGpa: 3.5,
      applicationFee: 350,
      departments: [
        { name: { en: 'A Unit — Science', bn: 'ক ইউনিট — বিজ্ঞান' }, seats: 1060 },
        { name: { en: 'B Unit — Arts & Social Science', bn: 'খ ইউনিট — কলা ও সামাজিক বিজ্ঞান' }, seats: 600 },
      ],
    },
    rawText: {
      en: 'SHAHJALAL UNIVERSITY OF SCIENCE AND TECHNOLOGY\nAdmission Circular 2026-27\n\nApplication period: 1 November to 5 December 2026. Admission test: 22 January 2027.\nMinimum GPA: SSC 3.50, HSC 3.50.\nApplication fee: 350 BDT.\nA Unit (Science): 1060 seats. B Unit (Arts & Social Science): 600 seats.',
      bn: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়\nভর্তি বিজ্ঞপ্তি ২০২৬-২৭\n\nআবেদন: ১ নভেম্বর থেকে ৫ ডিসেম্বর ২০২৬। ভর্তি পরীক্ষা: ২২ জানুয়ারি ২০২৭।\nন্যূনতম জিপিএ: এসএসসি ৩.৫০, এইচএসসি ৩.৫০।\nআবেদন ফি: ৩৫০ টাকা।\nক ইউনিট (বিজ্ঞান): ১০৬০ আসন। খ ইউনিট (কলা ও সামাজিক বিজ্ঞান): ৬০০ আসন।',
    },
  },
  {
    id: 'circ-3',
    universityId: 'ru',
    universityName: { en: 'University of Rajshahi', bn: 'রাজশাহী বিশ্ববিদ্যালয়' },
    title: { en: 'Undergraduate Admission Circular 2026-27', bn: 'স্নাতক (সম্মান) ভর্তি বিজ্ঞপ্তি ২০২৬-২৭' },
    fileName: 'ru-admission-2026.pdf',
    fileSize: 1620440,
    uploadedBy: 'admin@example.com',
    uploadedAt: '2026-11-02T10:00:00Z',
    status: 'rejected',
    rejectReason: 'OCR missed several department seat counts; needs re-upload with clearer scan.',
    reviewedAt: '2026-11-03T16:45:00Z',
    extracted: {
      applicationStart: '2026-11-10',
      applicationDeadline: '2026-12-15',
      examDate: '2027-01-25',
      minSscGpa: 3.0,
      minHscGpa: 3.0,
      applicationFee: 300,
      departments: [],
    },
    rawText: {
      en: 'UNIVERSITY OF RAJSHAHI\nAdmission Circular 2026-27 (draft OCR — partial)',
      bn: 'রাজশাহী বিশ্ববিদ্যালয়\nভর্তি বিজ্ঞপ্তি ২০২৬-২৭ (খসড়া OCR — আংশিক)',
    },
  },
]
