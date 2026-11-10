/**
 * Recommendation engine (AI-4).
 * Scores university-department pairs against the student profile and returns
 * the top 10 with match reasons, total cost and eligibility badges.
 */
import { publicUniversities } from '../seed/publicUniversities'
import { privateUniversities } from '../seed/privateUniversities'

/**
 * @param {object} profile - { sscGpa, hscGpa, group, budget, preferredSubjects, preferredCities, needsHostel }
 */
export function buildRecommendations(profile) {
  const out = []

  // --- Public universities ---
  for (const u of publicUniversities) {
    for (const unit of u.units) {
      if (unit.group !== profile.group) continue
      const e = unit.eligibility || {}
      const gpaOk = (profile.hscGpa ?? 0) >= (e.hscGpa ?? 0) && (profile.sscGpa ?? 0) >= (e.sscGpa ?? 0)

      // Public total cost estimate: fees + nominal 4-year expenses
      const totalCost = u.applicationFee + 25000

      out.push({
        kind: 'public',
        id: `${u.id}::${unit.id}`,
        universityId: u.id,
        unitId: unit.id,
        university: u.name,
        shortName: u.shortName,
        city: u.city,
        department: unit.name,
        deptKey: null,
        seats: unit.seats,
        totalCost,
        deadline: unit.applicationDeadline,
        examDate: unit.examDate,
        sourceUrl: u.sourceUrl,
        lastVerified: u.lastVerified,
        eligibility: gpaOk ? 'eligible' : 'stretch',
        matchScore: computePublicScore(profile, u, unit, gpaOk),
        reasons: buildPublicReasons(profile, u, unit, gpaOk),
      })
    }
  }

  // --- Private universities (dept level, waiver-adjusted cost) ---
  for (const u of privateUniversities) {
    for (const d of u.departments) {
      if (!deptMatchesGroup(d.dept, profile.group)) continue
      const waiver = bestWaiver(d.waiverRules, profile)
      const costAfterWaiver = waiver
        ? Math.round(d.totalCost * (1 - waiver.discountPct / 100))
        : d.totalCost

      const gpaOk = (profile.hscGpa ?? 0) >= 4.0 && (profile.sscGpa ?? 0) >= 4.0
      const withinBudget = profile.budget == null || costAfterWaiver <= profile.budget

      out.push({
        kind: 'private',
        id: d.id,
        universityId: u.id,
        university: u.name,
        shortName: u.shortName,
        city: u.city,
        department: d.name,
        deptKey: d.dept,
        seats: d.seats,
        totalCost: costAfterWaiver,
        totalCostBeforeWaiver: d.totalCost,
        waiverPct: waiver ? waiver.discountPct : 0,
        deadline: d.deadline,
        examDate: null,
        sourceUrl: u.sourceUrl,
        lastVerified: u.lastVerified,
        eligibility: withinBudget ? (gpaOk ? 'eligible' : 'stretch') : 'ineligible',
        matchScore: computePrivateScore(profile, u, d, costAfterWaiver, waiver, withinBudget),
        reasons: buildPrivateReasons(profile, u, d, waiver, withinBudget),
      })
    }
  }

  return out.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10)
}

const computePublicScore = (p, u, unit, gpaOk) => {
  let score = 60
  if (gpaOk) score += 25
  const gpaSlack = (p.hscGpa ?? 0) - (unit.eligibility?.hscGpa ?? 0)
  score += Math.min(10, Math.max(0, gpaSlack * 4))
  if (p.preferredCities?.some((c) => c === u.city.en)) score += 5
  return Math.min(99, Math.round(score))
}

const computePrivateScore = (p, u, d, cost, waiver, withinBudget) => {
  let score = 45
  if (withinBudget) score += 20
  if (waiver) score += Math.round(waiver.discountPct / 3)
  if (p.preferredSubjects?.includes(d.dept)) score += 15
  if (p.preferredCities?.some((c) => c === u.city.en)) score += 5
  return Math.min(99, Math.round(score))
}

const buildPublicReasons = (p, u, unit, gpaOk) => {
  const reasons = []
  reasons.push(
    gpaOk
      ? { bn: `আপনার জিপিএ এই ইউনিটের যোগ্যতা পূরণ করে`, en: 'Your GPA meets this unit\'s eligibility' }
      : { bn: `যোগ্যতা সীমান্তে — ভালো প্রস্তুতি নিলে সম্ভব`, en: 'Borderline eligibility — possible with good preparation' }
  )
  reasons.push({ bn: `মাত্র ৳${(u.applicationFee + 25000).toLocaleString('en-IN')} মোট খরচ — সবচেয়ে সাশ্রয়ী`, en: `Total cost only ৳${(u.applicationFee + 25000).toLocaleString('en-IN')} — most affordable` })
  if (p.preferredCities?.some((c) => c === u.city.en))
    reasons.push({ bn: `আপনার পছন্দের শহর ${u.city.bn}`, en: `In your preferred city ${u.city.en}` })
  reasons.push({ bn: `${unit.seats} টি আসন`, en: `${unit.seats} seats` })
  return reasons
}

const buildPrivateReasons = (p, u, d, waiver, withinBudget) => {
  const reasons = []
  if (waiver)
    reasons.push({
      bn: `আপনার জিপিএ-তে ${waiver.discountPct}% ওয়েভার পাওয়া যাবে`,
      en: `Your GPA qualifies for a ${waiver.discountPct}% waiver`,
    })
  if (p.preferredSubjects?.includes(d.dept))
    reasons.push({ bn: `আপনার পছন্দের বিভাগ`, en: 'One of your preferred subjects' })
  if (withinBudget)
    reasons.push({ bn: `বাজেটের মধ্যে`, en: 'Within your budget' })
  else
    reasons.push({ bn: `বাজেটের চেয়ে বেশি খরচ`, en: 'Exceeds your budget' })
  reasons.push({ bn: `${d.credits} ক্রেডিট, ৪ বছরের প্রোগ্রাম`, en: `${d.credits} credits, 4-year program` })
  return reasons
}

const bestWaiver = (rules, profile) =>
  (rules || [])
    .filter((r) => (profile.sscGpa ?? 0) >= r.minSscGpa && (profile.hscGpa ?? 0) >= r.minHscGpa)
    .sort((a, b) => b.discountPct - a.discountPct)[0] || null

const deptGroupMap = {
  science: ['CSE', 'EEE', 'CIVIL', 'PHARMACY', 'ENV', 'ECON', 'BBA', 'ENGLISH', 'LAW'],
  commerce: ['BBA', 'ECON', 'ENGLISH', 'LAW'],
  arts: ['ENGLISH', 'LAW', 'ECON', 'ENV', 'BBA'],
}
const deptMatchesGroup = (dept, group) => (deptGroupMap[group] || []).includes(dept)
