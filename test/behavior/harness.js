/**
 * Black-box behavior harness. Each scenario gets a fresh JSDOM window, evaluates
 * the built SDK bundle in it, fakes only the outer boundaries (XHR, JSONP
 * script tags, clock, storage, cookies, UA, URL), and records a trace of
 * everything observable. Imports nothing from src/.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM, ResourceLoader, VirtualConsole } from 'jsdom';
import { API, UA } from './fixtures.js';

const BUNDLE_PATH = process.env.BEHAVIOR_BUNDLE || 'dist/build.min.js';
const BUNDLE = readFileSync(BUNDLE_PATH, 'utf8');
export const EPOCH = Date.UTC(2026, 0, 15, 12, 0, 0);

// jsdom internals, resolved from jsdom itself, for observing navigation.
const jsdomRequire = createRequire(
  createRequire(import.meta.url).resolve('jsdom'),
);
const { implForWrapper } = jsdomRequire('./jsdom/living/generated/utils.js');
const { serializeURL } = jsdomRequire('whatwg-url');

/** Never fetches anything; only carries the user agent. */
class NoNetworkLoader extends ResourceLoader {
  fetch() {
    return null;
  }
}

/** Lets jsdom's own async work (iframe load events) settle. */
const settle = async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

/** Deterministic clock installed on the JSDOM window before the SDK loads. */
function installClock(win, onUncaught) {
  let now = EPOCH;
  let nextId = 1;
  const timers = new Map(); // id -> { at, fn, args, every }
  const RealDate = win.Date;
  function FakeDate(...a) {
    if (!new.target) return new RealDate(now).toString();
    return a.length ? new RealDate(...a) : new RealDate(now);
  }
  FakeDate.prototype = RealDate.prototype;
  FakeDate.now = () => now;
  FakeDate.UTC = RealDate.UTC;
  FakeDate.parse = RealDate.parse;
  win.Date = FakeDate;
  const add = (fn, ms, args, every) => {
    const id = nextId++;
    timers.set(id, { at: now + Math.max(0, ms | 0), fn, args, every });
    return id;
  };
  win.setTimeout = (fn, ms, ...args) => add(fn, ms, args, 0);
  win.setInterval = (fn, ms, ...args) => add(fn, ms, args, Math.max(1, ms | 0));
  win.clearTimeout = win.clearInterval = (id) => timers.delete(id);
  win.requestAnimationFrame = (fn) => add(() => fn(now - EPOCH), 16, [], 0);
  win.cancelAnimationFrame = (id) => timers.delete(id);
  Object.defineProperty(win.performance, 'now', { value: () => now - EPOCH });
  Object.defineProperty(win.performance, 'timing', {
    value: { navigationStart: EPOCH - 500 },
  });

  const nextDue = () => {
    let next = null;
    for (const [id, t] of timers) {
      if (!next || t.at < next[1].at || (t.at === next[1].at && id < next[0])) {
        next = [id, t];
      }
    }
    return next;
  };

  return {
    now: () => now,
    /**
     * Runs due timers in time order until idle or `limitMs` elapsed, letting
     * jsdom's own async work settle before each one.
     */
    async run(limitMs = 60000) {
      const end = now + limitMs;
      for (;;) {
        await settle();
        const next = nextDue();
        if (!next || next[1].at > end) break;
        const [id, t] = next;
        now = t.at;
        if (t.every) t.at = now + t.every;
        else timers.delete(id);
        try {
          if (typeof t.fn === 'function') t.fn(...t.args);
          else win.eval(String(t.fn));
        } catch (e) {
          // A browser reports these and carries on with the next task.
          onUncaught(e);
        }
      }
      now = Math.max(now, end);
    },
  };
}

// The SDK version differs between builds, so it never goes into a trace.
const VERSION = (() => {
  const { window } = new JSDOM('', { runScripts: 'outside-only' });
  window.eval(BUNDLE);
  return window.branch.sdk.replace(/^web/, '');
})();
const norm = (s) =>
  typeof s === 'string' ? s.split(VERSION).join('<VERSION>') : s;

const tag = (v) => Object.prototype.toString.call(v);

/** Turns values into stable, JSON-safe trace data. */
export function clean(v, seen = new Set()) {
  if (v === undefined) return '<undefined>';
  if (typeof v === 'function') return '<function>';
  if (typeof v === 'string') return norm(v);
  if (v === null || typeof v !== 'object') return v;
  if (seen.has(v)) return '<cycle>';
  seen.add(v);
  try {
    if (tag(v) === '[object Error]') return { error: norm(v.message) };
    if (tag(v) === '[object ArrayBuffer]') {
      return `<ArrayBuffer ${v.byteLength}>`;
    }
    if (typeof v.nodeType === 'number') return `<node ${v.nodeName}>`;
    if (v.window === v) return '<window>';
    if (Array.isArray(v)) return v.map((x) => clean(x, seen));
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = clean(v[k], seen);
    return out;
  } finally {
    seen.delete(v);
  }
}

/** Parses a JSON or form-encoded request body for the trace. */
function parseBody(body) {
  if (body == null) return null;
  if (typeof body !== 'string') return '<binary>';
  try {
    return clean(JSON.parse(body));
  } catch {}
  const o = {};
  for (const pair of body.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const k = eq === -1 ? pair : pair.slice(0, eq);
    const val = eq === -1 ? '' : pair.slice(eq + 1);
    o[decodeURIComponent(k)] = norm(
      decodeURIComponent(val.replace(/\+/g, ' ')),
    );
  }
  return o;
}

/** Decodes the base64 JSON payload a JSONP POST carries in `data`/`post_data`. */
function decodePostData(value, win) {
  try {
    return clean(JSON.parse(win.atob(value)));
  } catch {
    return norm(value);
  }
}

function splitUrl(u, win) {
  const url = new URL(u);
  const query = {};
  for (const [k, val] of url.searchParams) {
    query[k] =
      k === 'data' || k === 'post_data' ? decodePostData(val, win) : norm(val);
  }
  return { origin: url.origin, path: url.pathname, query };
}

const sortKeys = (o) =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

const readStorage = (store) => {
  const out = {};
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    out[k] = store.getItem(k);
  }
  return out;
};

/**
 * Route specs (per endpoint path):
 *   { status, body }       XHR: responds with status and JSON (or string) body;
 *                          JSONP: calls the callback with `body`
 *   { script }             JSONP: calls the callback with the value of the JS
 *                          expression `script` evaluated in the page
 *   { networkError: true } XHR onerror / JSONP script error event
 *   { timeout: true }      XHR ontimeout / JSONP never answers
 *   { throwOnSend: true }  XHR send() throws synchronously
 *   function (request)     returns one of the above; `request` is the fake
 *                          XHR (with `.body`) or the JSONP <script>
 *
 * @param {object} opts
 * @param {string=} opts.url        page URL (default https://shop.example.com/product/42)
 * @param {string=} opts.referrer
 * @param {string=} opts.ua         navigator.userAgent
 * @param {object=} opts.local      localStorage seed {key: value}
 * @param {object=} opts.session    sessionStorage seed
 * @param {string[]=} opts.cookies  document.cookie seed lines
 * @param {string=} opts.html       page body HTML (og tags go in opts.head)
 * @param {string=} opts.head
 * @param {object=} opts.routes     endpoint path -> route spec
 * @param {function=} opts.before   (window, { cb, push }) => void, runs
 *                                  before the bundle
 */
export function createPage(opts = {}) {
  const trace = [];
  let clock = null;
  /** Appends to the trace, stamped with the fake time since page load. */
  const push = (entry) =>
    trace.push({ at: clock ? clock.now() - EPOCH : 0, ...entry });
  const virtualConsole = new VirtualConsole();
  // jsdom reports what it can't do (e.g. navigation) here; that is observable.
  virtualConsole.on('jsdomError', (e) => push({ jsdomError: norm(e.message) }));
  const dom = new JSDOM(
    `<!doctype html><html><head>${opts.head || ''}</head><body>${opts.html || ''}</body></html>`,
    {
      url: opts.url || 'https://shop.example.com/product/42',
      referrer: opts.referrer || undefined,
      runScripts: 'outside-only',
      pretendToBeVisual: true,
      virtualConsole,
      resources: new NoNetworkLoader({
        userAgent: opts.ua || UA.desktopChrome,
      }),
    },
  );
  const win = dom.window;
  // Chrome and Safari both expose the legacy alias.
  if (/AppleWebKit/.test(win.navigator.userAgent)) win.webkitURL = win.URL;
  clock = installClock(win, (e) => push({ uncaught: clean(e) }));

  // jsdom doesn't implement navigation, so record where the page would go.
  // Every Location write (location = x, location.href = x, assign, replace)
  // ends up in this one method.
  const location = implForWrapper(win.location);
  const locationNavigate = location._locationObjectNavigate;
  location._locationObjectNavigate = function (url, flags = {}) {
    push({
      navigate: norm(serializeURL(url)),
      ...(flags.replacement ? { replace: true } : {}),
    });
    return locationNavigate.call(this, url, flags);
  };
  const routes = { ...API.defaults(), ...(opts.routes || {}) };
  const routeFor = (path, req) => {
    const spec = routes[path] || { status: 200, body: {} };
    return typeof spec === 'function' ? spec(req) : spec;
  };

  for (const [k, v] of Object.entries(opts.local || {})) {
    win.localStorage.setItem(k, v);
  }
  for (const [k, v] of Object.entries(opts.session || {})) {
    win.sessionStorage.setItem(k, v);
  }
  for (const c of opts.cookies || []) win.document.cookie = c;

  for (const level of ['log', 'warn', 'error', 'info', 'debug']) {
    win.console[level] = (...args) =>
      push({ console: level, args: clean(args) });
  }

  // XHR
  function FakeXHR() {
    this.readyState = 0;
    this.status = 0;
    this.responseType = '';
    this.requestHeaders = {};
  }
  Object.assign(FakeXHR.prototype, {
    open(method, url) {
      this.method = method;
      this.url = url;
    },
    setRequestHeader(n, v) {
      this.requestHeaders[n] = v;
    },
    send(body) {
      this.body = body;
      const u = splitUrl(this.url, win);
      push({
        xhr: this.method,
        ...u,
        headers: clean(this.requestHeaders),
        body: parseBody(body),
        responseType: this.responseType || '',
        timeout: this.timeout ?? null,
      });
      const spec = routeFor(u.path, this);
      if (spec.throwOnSend) throw new win.Error('send blocked');
      win.setTimeout(() => respondTo(this, spec), 1);
    },
    abort() {},
  });
  win.XMLHttpRequest = FakeXHR;

  function respondTo(xhr, spec) {
    if (spec.timeout) {
      xhr.readyState = 4;
      xhr.status = 0;
      xhr.onreadystatechange?.();
      xhr.ontimeout?.({ type: 'timeout' });
      return;
    }
    if (spec.networkError) {
      xhr.readyState = 4;
      xhr.status = 0;
      xhr.onreadystatechange?.();
      xhr.onerror?.({ type: 'error' });
      return;
    }
    const text =
      typeof spec.body === 'string'
        ? spec.body
        : JSON.stringify(spec.body ?? {});
    xhr.status = spec.status ?? 200;
    xhr.responseText = text;
    if (xhr.responseType === 'arraybuffer') {
      const bytes = new win.Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
      xhr.response = bytes.buffer;
    } else {
      xhr.response = text;
    }
    xhr.responseURL = xhr.url;
    xhr.readyState = 4;
    xhr.onreadystatechange?.();
    xhr.onload?.();
  }

  // JSONP: record <script src> appended anywhere, answer via window[callback].
  // Other external scripts (the snippet's SDK loader) are only recorded.
  // Inline scripts run when inserted, as in a browser (Journey CTA scripts).
  const origAppend = win.Node.prototype.appendChild;
  const origInsert = win.Node.prototype.insertBefore;
  const onNode = (node) => {
    if (node?.tagName !== 'SCRIPT') return;
    if (!node.src) {
      if (/^$|javascript/.test(node.type) && node.isConnected) {
        try {
          win.eval(node.text);
        } catch (e) {
          push({ uncaught: clean(e) });
        }
      }
      return;
    }
    const u = splitUrl(node.src, win);
    const cb = new URL(node.src).searchParams.get('callback');
    if (!cb) {
      push({ script: node.src, async: node.async });
      return;
    }
    push({
      jsonp: u.path,
      origin: u.origin,
      query: u.query,
      nonce: node.getAttribute('nonce'),
    });
    win.setTimeout(() => {
      const spec = routeFor(u.path, node);
      if (spec.timeout) return;
      if (spec.networkError) {
        node.dispatchEvent(new win.Event('error'));
        return;
      }
      if (typeof win[cb] === 'function') {
        win[cb](spec.script ? win.eval(`(${spec.script})`) : spec.body);
      }
      node.dispatchEvent(new win.Event('load'));
    }, 1);
  };
  win.Node.prototype.appendChild = function (n) {
    const r = origAppend.call(this, n);
    onNode(n);
    return r;
  };
  win.Node.prototype.insertBefore = function (n, ref) {
    const r = origInsert.call(this, n, ref);
    onNode(n);
    return r;
  };

  /** A callback that records its arguments into the trace. */
  const cb =
    (name) =>
    (...args) =>
      push({ callback: name, args: clean(args) });

  if (opts.before) opts.before(win, { cb, push });
  win.eval(BUNDLE);
  const branch = win.branch;

  let finished = false;
  const page = {
    win,
    branch,
    trace,
    clock,
    cb,
    /** Appends an entry to the trace (stamped with the fake time). */
    push,
    /** Runs `fn`, recording its return value or what it throws. */
    record(label, fn) {
      try {
        push({ [label]: clean(fn()) });
      } catch (e) {
        push({ [label]: { threw: clean(e) } });
      }
    },
    /** Records listener events. */
    listen(name = 'listener') {
      const fn = (event, data) =>
        push({ event: name, name: event, data: clean(data) });
      branch.addListener(fn);
      return fn;
    },
    step(label) {
      push({ step: label });
    },
    /** Advances the fake clock by `ms`, firing due timers. */
    run(ms) {
      return clock.run(ms);
    },
    /** Runs to idle, then snapshots everything persistent and visible. */
    async finish() {
      if (finished) throw new Error('finish() called twice');
      finished = true;
      await clock.run();
      const doc = win.document;
      // JSONP URLs carry base64 payloads that are already decoded in the
      // trace; keep only endpoint and callback here.
      const html = (el) => {
        const copy = el.cloneNode(true);
        for (const script of copy.querySelectorAll('script[src]')) {
          const url = new URL(script.src);
          const cb = url.searchParams.get('callback');
          if (cb) script.src = `${url.origin}${url.pathname}?callback=${cb}`;
        }
        return norm(copy.outerHTML);
      };
      const iframes = [...doc.querySelectorAll('iframe')].map((f) => ({
        id: f.id,
        html: norm(f.contentDocument?.documentElement?.outerHTML ?? null),
      }));
      return {
        trace,
        storage: {
          local: sortKeys(clean(readStorage(win.localStorage))),
          session: sortKeys(clean(readStorage(win.sessionStorage))),
          cookie: doc.cookie.split('; ').filter(Boolean).sort().map(norm),
        },
        location: win.location.href,
        dom: {
          head: html(doc.head),
          body: html(doc.body),
          iframes,
        },
      };
    },
  };
  return page;
}

/** Serialises a finished page for toMatchFileSnapshot. */
export function serialize(result) {
  return `${JSON.stringify(result, null, 2)}\n`;
}

/**
 * Finishes `page` and compares it with test/behavior/__recorded__/<name>.json.
 * The path is resolved from the scenario file, which lives in scenarios/.
 */
export async function snap(name, page) {
  await expect(serialize(await page.finish())).toMatchFileSnapshot(
    `../__recorded__/${name}.json`,
  );
}

/** Loads a second page that shares the first page's storage (next page view). */
export function nextPage(prev, opts = {}) {
  return createPage({
    ...opts,
    local: { ...readStorage(prev.win.localStorage), ...(opts.local || {}) },
    session: {
      ...readStorage(prev.win.sessionStorage),
      ...(opts.session || {}),
    },
    cookies: prev.win.document.cookie.split('; ').filter(Boolean),
  });
}
