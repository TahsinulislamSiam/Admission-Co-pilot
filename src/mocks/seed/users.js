/**
 * Seed users for the mock API.
 * Login with: student@example.com / password123 or admin@example.com / admin123
 */
export const seedUsers = [
  {
    id: 'u1',
    name: 'রাকিব হাসান',
    nameEn: 'Rakib Hasan',
    email: 'student@example.com',
    password: 'password123',
    role: 'student',
    token: 'mock-jwt-u1',
    createdAt: '2026-09-02T10:00:00Z',
    profile: {
      sscGpa: 5,
      hscGpa: 4.75,
      group: 'science',
      budget: 600000,
      preferredSubjects: ['CSE', 'EEE'],
      preferredCities: ['Dhaka'],
      needsHostel: true,
      phone: '01712345678',
    },
  },
  {
    id: 'u2',
    name: 'অ্যাডমিন',
    nameEn: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    token: 'mock-jwt-u2',
    createdAt: '2026-01-05T09:00:00Z',
    profile: null,
  },
]

/** Strip password before sending to the client. */
export const publicUser = (u) => {
  if (!u) return null
  const { password: _password, ...rest } = u
  return rest
}
