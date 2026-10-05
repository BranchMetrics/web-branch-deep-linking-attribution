// Type declarations only, never bundled. Covers legacy browser APIs and the
// host page's module globals that the SDK feature-detects at runtime.

// UMD export in index.js: the host page's AMD loader or CommonJS environment.
declare const define: ((id: string, factory: () => unknown) => void) & {
  amd?: unknown;
};
declare const exports: unknown;
declare const module: { exports: unknown };

// Old IE.
declare const ActiveXObject: new (progId: string) => XMLHttpRequest;

interface Window {
  ActiveXObject?: unknown;
  // The loader snippet's stub (with its call queue `_q`), replaced by the SDK.
  branch?: any;
}

interface HTMLElement {
  // Old IE computed style.
  currentStyle?: Record<string, string>;
}

interface Element {
  // Old IE event API.
  attachEvent?: (event: string, listener: Function) => boolean;
}

interface Document {
  // Prefixed Page Visibility API.
  mozHidden?: boolean;
  msHidden?: boolean;
  webkitHidden?: boolean;
}

interface Navigator {
  // User-Agent Client Hints. Chromium only, not yet in TypeScript's DOM lib.
  userAgentData?: {
    getHighEntropyValues(hints: string[]): Promise<Record<string, any>>;
  };
}
