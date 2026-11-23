import '@testing-library/jest-dom/vitest'

// Silence act() warnings from ResizeObserver used by Recharts in jsdom
global.ResizeObserver = global.ResizeObserver || class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom does not implement Element.scrollTo (the assistant page scrolls on mount)
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {}
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}

// Radix Select / Dialog call the Pointer Events capture API, missing in jsdom
if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {}
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {}
