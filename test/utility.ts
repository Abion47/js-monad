export function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function toBeTrue(received: any) {
  return {
    message: () => `expected ${received} to be true`,
    pass:
      received === true || (received instanceof Boolean && received.valueOf()),
  };
}

export function toBeFalse(received: any) {
  return {
    message: () => `expected ${received} to be false`,
    pass:
      received === false ||
      (received instanceof Boolean && !received.valueOf()),
  };
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeTrue(): R;
      toBeFalse(): R;
    }
  }
}

export {};
