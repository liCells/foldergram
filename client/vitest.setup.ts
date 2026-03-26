import { afterEach } from 'vitest';

if (!globalThis.matchMedia) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  });
}

if (!globalThis.ResizeObserver) {
  class MockResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  }

  globalThis.ResizeObserver = MockResizeObserver as typeof ResizeObserver;
}

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(Date.now()), 0);
}

if (!globalThis.cancelAnimationFrame) {
  globalThis.cancelAnimationFrame = (handle: number) => {
    window.clearTimeout(handle);
  };
}

Object.defineProperty(globalThis, 'scrollTo', {
  writable: true,
  value: () => {}
});

afterEach(() => {
  window.localStorage.clear();
});
