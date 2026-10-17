/**
 * Types for the matchers that `expo-router/testing-library` registers on `expect(screen)`.
 * Expo Router 57 ships the matchers at runtime but not their TypeScript declarations.
 * Kept outside `__tests__/` so Jest does not treat it as a test file.
 */
export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePathname(pathname: string): R;
      toHavePathnameWithParams(pathname: string): R;
      toHaveSegments(segments: string[]): R;
      toHaveSearchParams(params: Record<string, string | string[]>): R;
      toHaveRouterState(state: unknown): R;
    }
  }
}
