/** One-off: i18n strings for the professors section (student + admin). */
const fs = require('fs')

const enAdd = {
  nav: { professors: 'Faculty Directory' },
  professors: {
    title: 'Faculty Directory',
    subtitle:
      'Professors at the universities on your list — their department, research fields and contact.',
    searchPlaceholder: 'Search a professor or a university',
    allFields: 'All research fields',
    rank: 'QS #{{rank}}',
    website: 'University site',
    email: 'Email',
    profile: 'Profile',
    emailUnavailable: 'No public email',
    emptyTitle: 'No professors yet',
    emptyBody: 'An admin has not added faculty for these universities yet.',
  },
  admin: {
    nav: { professors: 'Professors' },
    professors: {
      title: 'Professors',
      subtitle: 'Add or remove university faculty; students see them in their Faculty Directory.',
      addHeading: 'Add a professor',
      universitySection: 'University',
      professorSection: 'Professor',
      university: 'University name',
      universityPlaceholder: 'e.g. Stanford University',
      rank: 'QS rank (optional)',
      city: 'City',
      country: 'Country',
      website: 'University website',
      directory: 'Faculty directory URL',
      name: 'Professor name',
      namePlaceholder: 'e.g. Fei-Fei Li',
      titleLabel: 'Title',
      titlePlaceholder: 'e.g. Professor of Computer Science',
      email: 'Email',
      department: 'Department',
      profileUrl: 'Profile URL',
      researchFields: 'Research fields',
      researchFieldsPlaceholder: 'Machine Learning, Computer Vision',
      researchFieldsHint: 'Separate fields with commas — students can filter by them.',
      add: 'Add professor',
      adding: 'Adding…',
      added: 'Professor added',
      removed: '{{name}} removed',
      directory: 'Directory ({{count}})',
      searchPlaceholder: 'Search the directory',
      remove: 'Remove professor',
      noEmail: 'No public email',
      emptyTitle: 'No professors yet',
      emptyBody: 'Add the first professor with the form above.',
      errors: {
        nameAndUniversityRequired: 'Professor name and university are required.',
        serverError: 'Could not save the professor. Try again.',
      },
    },
  },
}

const bnAdd = {
  nav: { professors: 'শিক্ষক তালিকা' },
  professors: {
    title: 'শিক্ষক তালিকা',
    subtitle:
      'আপনার তালিকার বিশ্ববিদ্যালয়গুলোর শিক্ষক — বিভাগ, গবেষণার ক্ষেত্র ও যোগাযোগের তথ্য।',
    searchPlaceholder: 'শিক্ষক বা বিশ্ববিদ্যালয় খুঁজুন',
    allFields: 'সব গবেষণা ক্ষেত্র',
    rank: 'কিউএস #{{rank}}',
    website: 'বিশ্ববিদ্যালয় সাইট',
    email: 'ইমেইল',
    profile: 'প্রোফাইল',
    emailUnavailable: 'প্রকাশ্য ইমেইল নেই',
    emptyTitle: 'এখনো কোনো শিক্ষক নেই',
    emptyBody: 'এই বিশ্ববিদ্যালয়গুলোর জন্য অ্যাডমিন এখনো শিক্ষক যোগ করেননি।',
  },
  admin: {
    nav: { professors: 'শিক্ষক' },
    professors: {
      title: 'শিক্ষক',
      subtitle: 'বিশ্ববিদ্যালয়ের শিক্ষক যোগ বা রিমুভ করুন; শিক্ষার্থীরা শিক্ষক তালিকায় দেখবে।',
      addHeading: 'শিক্ষক যোগ করুন',
      universitySection: 'বিশ্ববিদ্যালয়',
      professorSection: 'শিক্ষক',
      university: 'বিশ্ববিদ্যালয়ের নাম',
      universityPlaceholder: 'যেমন: স্ট্যানফোর্ড বিশ্ববিদ্যালয়',
      rank: 'কিউএস র‍্যাঙ্ক (ঐচ্ছিক)',
      city: 'শহর',
      country: 'দেশ',
      website: 'বিশ্ববিদ্যালয় ওয়েবসাইট',
      directory: 'ফ্যাকাল্টি ডিরেক্টরি লিংক',
      name: 'শিক্ষকের নাম',
      namePlaceholder: 'যেমন: ফেই-ফেই লি',
      titleLabel: 'পদবি',
      titlePlaceholder: 'যেমন: কম্পিউটার সায়েন্সের অধ্যাপক',
      email: 'ইমেইল',
      department: 'বিভাগ',
      profileUrl: 'প্রোফাইল লিংক',
      researchFields: 'গবেষণার ক্ষেত্র',
      researchFieldsPlaceholder: 'মেশিন লার্নিং, কম্পিউটার ভিশন',
      researchFieldsHint: 'কমা দিয়ে আলাদা করুন — শিক্ষার্থীরা এগুলো দিয়ে ফিল্টার করতে পারবে।',
      add: 'শিক্ষক যোগ করুন',
      adding: 'যোগ হচ্ছে…',
      added: 'শিক্ষক যোগ হয়েছে',
      removed: '{{name}} রিমুভ হয়েছে',
      directory: 'তালিকা ({{count}})',
      searchPlaceholder: 'তালিকায় খুঁজুন',
      remove: 'শিক্ষক রিমুভ',
      noEmail: 'প্রকাশ্য ইমেইল নেই',
      emptyTitle: 'এখনো কোনো শিক্ষক নেই',
      emptyBody: 'উপরের ফর্ম দিয়ে প্রথম শিক্ষক যোগ করুন।',
      errors: {
        nameAndUniversityRequired: 'শিক্ষকের নাম ও বিশ্ববিদ্যালয় দিতে হবে।',
        serverError: 'শিক্ষক সেভ করা যায়নি। আবার চেষ্টা করুন।',
      },
    },
  },
}

const merge = (base, add) => {
  for (const [k, v] of Object.entries(add)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      base[k] = merge(base[k] && typeof base[k] === 'object' ? base[k] : {}, v)
    } else base[k] = v
  }
  return base
}

for (const [file, add] of [
  ['en', enAdd],
  ['bn', bnAdd],
]) {
  const p = `src/locales/${file}.json`
  const json = JSON.parse(fs.readFileSync(p, 'utf8'))
  merge(json, add)
  fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8')
  console.log(file, '· nav.professors:', json.nav.professors, '· admin.nav:', Object.keys(json.admin.nav).join(','))
}
