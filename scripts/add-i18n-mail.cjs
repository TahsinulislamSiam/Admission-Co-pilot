/**
 * One-off: promote the mail strings to a shared `mail.*` namespace (student and
 * admin pages use the same view) and drop the now-unused `admin.mail` block.
 */
const fs = require('fs')

const enExtra = {
  subtitleStudent: 'Read notices from your admission team and reply — messages stay inside the app.',
  subtitleAdmin: 'Send notices to a student and read their replies — all inside the app.',
  searchContacts: 'Search people',
}

const bnExtra = {
  subtitleStudent: 'ভর্তি টিমের নোটিশ পড়ুন ও উত্তর দিন — বার্তা অ্যাপের ভেতরেই থাকে।',
  subtitleAdmin: 'শিক্ষার্থীকে নোটিশ পাঠান এবং তাদের উত্তর পড়ুন — সব অ্যাপের ভেতরেই।',
  searchContacts: 'নাম বা ইমেইল খুঁজুন',
}

for (const [file, extra] of [
  ['en', enExtra],
  ['bn', bnExtra],
]) {
  const p = `src/locales/${file}.json`
  const json = JSON.parse(fs.readFileSync(p, 'utf8'))
  const old = json.admin?.mail ?? {}

  const mail = {
    title: old.title,
    subtitleStudent: extra.subtitleStudent,
    subtitleAdmin: extra.subtitleAdmin,
    inbox: old.inbox,
    sentTab: old.sentTab,
    unread: old.unread,
    emptyTitle: old.emptyTitle,
    emptyInbox: old.emptyInbox,
    emptySent: old.emptySent,
    from: old.from,
    to: old.to,
    reply: old.reply,
    replySubject: old.replySubject,
    compose: old.compose,
    toLabel: old.toLabel,
    toPlaceholder: old.toPlaceholder,
    searchContacts: extra.searchContacts,
    subject: old.subject,
    message: old.message,
    messagePlaceholder: old.messagePlaceholder,
    send: old.send,
    sending: old.sending,
    sent: old.sent,
    errors: old.errors,
  }

  json.mail = mail
  json.nav.mail = file === 'en' ? 'Mail' : 'মেইল'
  delete json.admin.mail

  fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8')
  console.log(file, '· mail keys:', Object.keys(mail).length, '· nav.mail:', json.nav.mail)
}
