// scripts/codemods/retire-utils.mjs
//
// One-off codemod that retired the shared `utils` object: rewrites every
// `utils.<name>` to its new home and adds (or merges) the import. Run from the
// repo root. Fails on any member without a MAP row.
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, dirname } from 'node:path';
import { execSync } from 'node:child_process';

// name -> [module under src/, exported name, kind]
//   'fn'      named export, `utils.x` -> `x`
//   'env'     env reader,   `utils.x(...)` -> `getEnv().y(...)`
//   'envcall' env flag read as a value, `utils.x` -> `getEnv().y()`
const MAP = {
  // state.ts constants
  navigationTimingAPIEnabled: ['env/env.ts', 'navigationTimingAPIEnabled', 'envcall'],
  dismissEventToSourceMapping: ['journeys/constants.ts', 'dismissEventToSourceMapping', 'fn'],
  httpMethod: ['lib/http.ts', 'httpMethod', 'fn'],
  bannerThemes: null, // unused anywhere: deleted, so any use fails as unmapped
  // lib/objects.ts
  merge: ['lib/objects.ts', 'merge', 'fn'],
  isKey: ['lib/objects.ts', 'isKey', 'fn'],
  snakeToCamel: ['lib/objects.ts', 'snakeToCamel', 'fn'],
  addPropertyIfNotNull: ['lib/objects.ts', 'addPropertyIfNotNull', 'fn'],
  addPropertyIfNotNullorEmpty: ['lib/objects.ts', 'addPropertyIfNotNullorEmpty', 'fn'],
  removePropertiesFromObject: ['lib/objects.ts', 'removePropertiesFromObject', 'fn'],
  validateParameterType: ['lib/objects.ts', 'validateParameterType', 'fn'],
  convertValueToString: ['lib/objects.ts', 'convertValueToString', 'fn'],
  convertObjectValuesToString: ['lib/objects.ts', 'convertObjectValuesToString', 'fn'],
  getBooleanOrNull: ['lib/objects.ts', 'getBooleanOrNull', 'fn'],
  isBoolean: ['lib/objects.ts', 'isBoolean', 'fn'],
  cleanBannerText: ['lib/objects.ts', 'cleanBannerText', 'fn'],
  delay: ['lib/objects.ts', 'delay', 'fn'],
  // lib/encoding.ts
  base64encode: ['lib/encoding.ts', 'base64encode', 'fn'],
  base64Decode: ['lib/encoding.ts', 'base64Decode', 'fn'],
  isBase64Encoded: ['lib/encoding.ts', 'isBase64Encoded', 'fn'],
  encodeBFPs: ['lib/encoding.ts', 'encodeBFPs', 'fn'],
  decodeBFPs: ['lib/encoding.ts', 'decodeBFPs', 'fn'],
  // lib/url.ts
  extractDeeplinkPath: ['lib/url.ts', 'extractDeeplinkPath', 'fn'],
  extractMobileDeeplinkPath: ['lib/url.ts', 'extractMobileDeeplinkPath', 'fn'],
  isValidURL: ['lib/url.ts', 'isValidURL', 'fn'],
  processReferringLink: ['lib/url.ts', 'processReferringLink', 'fn'],
  generateDynamicBNCLink: ['lib/url.ts', 'generateDynamicBNCLink', 'fn'],
  removeTrailingDotZeros: ['lib/url.ts', 'removeTrailingDotZeros', 'fn'],
  // lib/validation.ts
  calculateDiffBetweenArrays: ['lib/validation.ts', 'calculateDiffBetweenArrays', 'fn'],
  validateCommerceEventParams: ['lib/validation.ts', 'validateCommerceEventParams', 'fn'],
  isStandardEvent: ['lib/validation.ts', 'isStandardEvent', 'fn'],
  separateEventAndCustomData: ['lib/validation.ts', 'separateEventAndCustomData', 'fn'],
  // lib/dma.ts
  allowDMAParamURLMap: ['lib/dma.ts', 'allowDMAParamURLMap', 'fn'],
  shouldAddDMAParams: ['lib/dma.ts', 'shouldAddDMAParams', 'fn'],
  setDMAParams: ['lib/dma.ts', 'setDMAParams', 'fn'],
  // lib/session_data.ts
  whiteListSessionData: ['lib/session_data.ts', 'whiteListSessionData', 'fn'],
  whiteListJourneysLanguageData: ['lib/session_data.ts', 'whiteListJourneysLanguageData', 'fn'],
  // lib/hosted_data.ts
  prioritizeDeeplinkPaths: ['lib/hosted_data.ts', 'prioritizeDeeplinkPaths', 'fn'],
  processHostedDeepLinkData: ['lib/hosted_data.ts', 'processHostedDeepLinkData', 'fn'],
  mergeHostedDeeplinkData: ['lib/hosted_data.ts', 'mergeHostedDeeplinkData', 'fn'],
  // lib/messages.ts, lib/brtt.ts
  messages: ['lib/messages.ts', 'messages', 'fn'],
  formatMessage: ['lib/messages.ts', 'formatMessage', 'fn'],
  calculateBrtt: ['lib/brtt.ts', 'calculateBrtt', 'fn'],
  // core/utils/url.ts -> env delegates dropped, the rest to core/url.ts
  getWindowLocation: ['env/env.ts', 'windowLocation', 'env'],
  getParameterByName: ['core/url.ts', 'getParameterByName', 'fn'],
  cleanLinkData: ['core/url.ts', 'cleanLinkData', 'fn'],
  getClickIdAndSearchStringFromLink: ['env/env.ts', 'clickIdAndSearchStringFromLink', 'env'],
  hashValue: ['core/url.ts', 'hashValue', 'fn'],
  getParamValue: ['core/url.ts', 'getParamValue', 'fn'],
  getInitialReferrer: ['core/url.ts', 'getInitialReferrer', 'fn'],
  getCurrentUrl: ['env/env.ts', 'currentUrl', 'env'],
  // core/utils/platform.ts -> env delegates dropped, the rest to core/platform.ts
  timeSinceNavigationStart: ['env/env.ts', 'timeSinceNavigationStart', 'env'],
  getPlatformByUserAgent: ['core/platform.ts', 'getPlatformByUserAgent', 'fn'],
  isSafari11OrGreater: ['core/platform.ts', 'isSafari11OrGreater', 'fn'],
  isIOSWKWebView: ['core/platform.ts', 'isIOSWKWebView', 'fn'],
  addEvent: ['core/platform.ts', 'addEvent', 'fn'],
  getBrowserLanguageCode: ['env/env.ts', 'browserLanguageCode', 'env'],
  getScreenHeight: ['env/env.ts', 'screenHeight', 'env'],
  getScreenWidth: ['env/env.ts', 'screenWidth', 'env'],
  getUserData: ['core/platform.ts', 'getUserData', 'fn'],
  isIframe: ['env/env.ts', 'isIframe', 'env'],
  isIframeAndFromSameOrigin: ['core/platform.ts', 'isIframeAndFromSameOrigin', 'fn'],
  getClientHints: ['core/platform.ts', 'getClientHints', 'fn'],
  // core/utils/page_data.ts
  getHostedDeepLinkData: ['env/env.ts', 'hostedDeepLinkData', 'env'],
  openGraphDataAsObject: ['core/page_data.ts', 'openGraphDataAsObject', 'fn'],
  getAdditionalMetadata: ['core/page_data.ts', 'getAdditionalMetadata', 'fn'],
};

// Keys of the utils object at the start of the task (Object.keys(utils)).
const KEYS = `navigationTimingAPIEnabled dismissEventToSourceMapping httpMethod bannerThemes merge isKey snakeToCamel addPropertyIfNotNull addPropertyIfNotNullorEmpty removePropertiesFromObject validateParameterType convertValueToString convertObjectValuesToString getBooleanOrNull isBoolean cleanBannerText delay base64encode base64Decode isBase64Encoded encodeBFPs decodeBFPs extractDeeplinkPath extractMobileDeeplinkPath isValidURL processReferringLink generateDynamicBNCLink removeTrailingDotZeros calculateDiffBetweenArrays validateCommerceEventParams isStandardEvent separateEventAndCustomData allowDMAParamURLMap shouldAddDMAParams setDMAParams whiteListSessionData whiteListJourneysLanguageData prioritizeDeeplinkPaths processHostedDeepLinkData mergeHostedDeeplinkData messages formatMessage calculateBrtt getWindowLocation getParameterByName cleanLinkData getClickIdAndSearchStringFromLink hashValue getParamValue getInitialReferrer getCurrentUrl timeSinceNavigationStart getPlatformByUserAgent isSafari11OrGreater isIOSWKWebView addEvent getBrowserLanguageCode getScreenHeight getScreenWidth getUserData isIframe isIframeAndFromSameOrigin getClientHints getHostedDeepLinkData openGraphDataAsObject getAdditionalMetadata`.split(' ');
{
  const rows = Object.keys(MAP);
  const missing = KEYS.filter((k) => !(k in MAP));
  const extra = rows.filter((k) => !KEYS.includes(k));
  if (KEYS.length !== 66 || missing.length || extra.length) {
    console.error('MAP/keys mismatch', { count: KEYS.length, missing, extra });
    process.exit(1);
  }
}

const SKIP = new Set([
  'src/core/utils.ts', // deleted by this task
  'src/core/state.ts', // deleted by this task
  'test/test-utils.js', // UMD script: reads window.utils.merge ...
  'test/setup.js', // ... which test/setup.js provides by hand
]);
// Plain pathspecs: `*` matches across directories, so top-level files count too.
const files = execSync("git ls-files 'src/*.js' 'src/*.ts' 'test/*.js'", { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter((f) => !SKIP.has(f) && !f.startsWith('test/golden/'));

const IMPORT_RE = /^import \{ utils \} from '[^']+';\n/m;
// `utils.js` / `utils.ts` are paths (e.g. test-utils.js), not members.
const MEMBER_RE = /\butils\.(?!(?:js|ts)\b)(\w+)/g;
const unknown = new Set();
const warnings = [];

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  if (!IMPORT_RE.test(src)) {
    if (MEMBER_RE.test(src)) unknown.add(`${file}: utils.* without an import (comment?)`);
    MEMBER_RE.lastIndex = 0;
    continue;
  }
  const self = 'src/' === file.slice(0, 4) ? file.slice(4) : null;
  const needed = new Map(); // module -> Set(names)
  const need = (mod, name) => {
    if (mod === self) return;
    (needed.get(mod) ?? needed.set(mod, new Set()).get(mod)).add(name);
  };
  const before = src;
  src = src.replace(MEMBER_RE, (m, name) => {
    const target = MAP[name];
    if (!target) {
      unknown.add(`${file}: ${name}`);
      return m;
    }
    const [mod, exp, kind] = target;
    if (kind === 'env' || kind === 'envcall') {
      need('env/env.ts', 'getEnv');
      return kind === 'env' ? `getEnv().${exp}` : `getEnv().${exp}()`;
    }
    need(mod, exp);
    return exp;
  });

  // Shadowing check: a bare identifier with an imported name already in the
  // file (a local, a param, an object key) needs a look by hand.
  const stripped = before.replace(MEMBER_RE, '');
  for (const names of needed.values()) {
    for (const name of names) {
      const re = new RegExp(`(?<![./\\w$'"])${name}(?![\\w$'"])`, 'g');
      const hits = [...stripped.matchAll(re)].length;
      if (hits) warnings.push(`${file}: bare '${name}' already appears ${hits}x`);
    }
  }

  const newImports = [];
  for (const [mod, names] of needed) {
    let rel = relative(dirname(file), `src/${mod}`).replace(/\.ts$/, '.js');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    const esc = rel.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    const existing = new RegExp(`^import \\{([^}]*)\\} from '${esc}';`, 'm');
    const m = src.match(existing);
    if (m) {
      const have = m[1].split(',').map((s) => s.trim()).filter(Boolean);
      const haveLocal = new Set(have.map((s) => s.split(/\s+as\s+/).pop()));
      const merged = [...have, ...[...names].filter((n) => !haveLocal.has(n))];
      src = src.replace(existing, `import { ${merged.join(', ')} } from '${rel}';`);
    } else {
      newImports.push(`import { ${[...names].sort().join(', ')} } from '${rel}';`);
    }
  }
  src = src.replace(IMPORT_RE, newImports.length ? `${newImports.join('\n')}\n` : '');
  writeFileSync(file, src);
}

if (warnings.length) console.warn(`check by hand:\n${warnings.join('\n')}`);
if (unknown.size) {
  console.error(`unmapped:\n${[...unknown].join('\n')}`);
  process.exit(1);
}
