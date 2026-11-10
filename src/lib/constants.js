/**
 * App-wide constants shared by UI, mock data and services.
 */

export const APP_NAME = 'Admission Copilot BD'

export const STORAGE_KEYS = {
  auth: 'acbd-auth',
  language: 'acbd-language',
  testEngine: 'acbd-test-engine',
  assistant: 'acbd-assistant',
}

export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
}

export const GROUPS = ['science', 'commerce', 'arts']

export const GROUP_LABELS = {
  science: { en: 'Science', bn: 'বিজ্ঞান' },
  commerce: { en: 'Commerce', bn: 'ব্যবসায় শিক্ষা' },
  arts: { en: 'Arts', bn: 'মানবিক' },
}

export const EXAM_PATTERNS = ['MCQ', 'Written', 'MCQ + Written']

export const DEPARTMENT_NAMES = {
  CSE: { en: 'Computer Science & Engineering', bn: 'কম্পিউটার সায়েন্স ও ইঞ্জিনিয়ারিং' },
  EEE: { en: 'Electrical & Electronic Engineering', bn: 'ইলেকট্রিক্যাল ও ইলেকট্রনিক ইঞ্জিনিয়ারিং' },
  BBA: { en: 'Business Administration', bn: 'বিজনেস অ্যাডমিনিস্ট্রেশন' },
  CIVIL: { en: 'Civil Engineering', bn: 'সিভিল ইঞ্জিনিয়ারিং' },
  ENGLISH: { en: 'English', bn: 'ইংরেজি' },
  LAW: { en: 'Law', bn: 'আইন' },
  PHARMACY: { en: 'Pharmacy', bn: 'ফার্মেসি' },
  ECON: { en: 'Economics', bn: 'অর্থনীতি' },
  ENV: { en: 'Environmental Science', bn: 'পরিবেশ বিজ্ঞান' },
}

export const MISTAKE_TYPES = ['concept', 'careless', 'time', 'guess']

/** Color mapping used for mistake-type badges and charts. */
export const MISTAKE_TYPE_COLORS = {
  concept: '#e11d48',
  careless: '#d97706',
  time: '#0284c7',
  guess: '#7c3aed',
}

export const ELIGIBILITY_STATUS = {
  ELIGIBLE: 'eligible',
  STRETCH: 'stretch',
  INELIGIBLE: 'ineligible',
}

export const CIRCULAR_STATUSES = ['pending_review', 'approved', 'rejected']

/** NFR-1: assistant requests must time out at 10 seconds. */
export const ASSISTANT_TIMEOUT_MS = 10000
