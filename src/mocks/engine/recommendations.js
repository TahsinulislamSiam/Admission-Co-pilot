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

  // --- Private universities (dept level, estimated total degree cost) ---
  for (const u of privateUniversities) {
    for (const d of u.departments) {
      const gpaOk = (profile.hscGpa ?? 0) >= 4.0 && (profile.sscGpa ?? 0) >= 4.0
      // Budget is checked against the low end of the range so an affordable
      // estimate is never hidden; the range itself is shown to the student.
      const withinBudget = profile.budget == null || (d.costMin ?? d.totalCost) <= profile.budget

      out.push({
        kind: 'private',
        id: d.id,
        universityId: u.id,
        university: u.name,
        shortName: u.shortName,
        city: u.city,
        department: d.name,
        deptKey: d.dept,
        seats: null,
        totalCost: d.totalCost,
        totalCostMin: d.costMin,
        totalCostMax: d.costMax,
        deadline: null,
        examDate: null,
        sourceUrl: u.sourceUrl,
        lastVerified: u.lastVerified,
        eligibility: withinBudget ? (gpaOk ? 'eligible' : 'stretch') : 'ineligible',
        matchScore: computePrivateScore(profile, u, d, withinBudget),
        reasons: buildPrivateReasons(profile, u, d, withinBudget),
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

const computePrivateScore = (p, u, d, withinBudget) => {
  let score = 45
  if (withinBudget) score += 20
  if (p.preferredSubjects?.includes(d.dept)) score += 15
  if (p.preferredCities?.some((c) => c === u.city.en)) score += 5
  if (u.rank) score += Math.max(0, 8 - u.rank) // shortlist rank nudge
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

const buildPrivateReasons = (p, u, d, withinBudget) => {
  const reasons = []
  const fmt = (n) => `৳${Number(n).toLocaleString('en-IN')}`
  if (d.costMin != null && d.costMax != null)
    reasons.push({
      bn: `আনুমানিক মোট খরচ ${fmt(d.costMin)} – ${fmt(d.costMax)}`,
      en: `Estimated total degree cost ${fmt(d.costMin)} – ${fmt(d.costMax)}`,
    })
  if (p.preferredSubjects?.includes(d.dept))
    reasons.push({ bn: `আপনার পছন্দের বিভাগ`, en: 'One of your preferred subjects' })
  if (withinBudget)
    reasons.push({ bn: `বাজেটের মধ্যে`, en: 'Within your budget' })
  else
    reasons.push({ bn: `বাজেটের চেয়ে বেশি খরচ`, en: 'Exceeds your budget' })
  if (u.rank)
    reasons.push({
      bn: `শীর্ষ ১০ বেসরকারি বিশ্ববিদ্যালয়ের তালিকায় #${u.rank}`,
      en: `Ranked #${u.rank} in the private university shortlist`,
    })
  return reasons
}
