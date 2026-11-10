import '@testing-library/jest-dom/vitest'

// Silence act() warnings from ResizeObserver used by Recharts in jsdom
global.ResizeObserver = global.ResizeObserver || class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
