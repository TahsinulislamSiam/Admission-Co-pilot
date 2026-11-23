/** One-off: add the admin-login copy and drop the demo-login strings. */
const fs = require('fs')

const enAdd = {
  landing: { adminLogin: 'Admin Login' },
  auth: {
    adminLoginTitle: 'Admin sign in',
    adminLoginSubtitle: 'Restricted area — administrator accounts only.',
    adminLoginHint: 'Students should use the regular sign-in page.',
    notAdminAccount: 'This account is not an administrator.',
  },
}

const bnAdd = {
  landing: { adminLogin: 'অ্যাডমিন লগইন' },
  auth: {
    adminLoginTitle: 'অ্যাডমিন সাইন ইন',
    adminLoginSubtitle: 'সীমিত এলাকা — শুধু অ্যাডমিন অ্যাকাউন্টের জন্য।',
    adminLoginHint: 'শিক্ষার্থীরা সাধারণ লগইন পেজ ব্যবহার করুন।',
    notAdminAccount: 'এই অ্যাকাউন্টটি অ্যাডমিন নয়।',
  },
}

const DROP = ['demoAccounts', 'demoStudent', 'demoAdmin']

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
  for (const key of DROP) delete json.auth[key]
  fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8')
  console.log(
    file,
    'adminLogin:',
    json.landing.adminLogin,
    '| demo keys left:',
    DROP.filter((k) => k in json.auth).length
  )
}
