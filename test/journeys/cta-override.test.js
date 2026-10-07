import { createContext } from '../../src/core/context.js';
import { applyCtaOverride } from '../../src/journeys/cta-override.js';
import {
  CTA_SCRIPT_ID,
  installCtaScript,
} from '../../src/journeys/cta-script.js';

const SCRIPT =
  'window.top.location.replace(validate("https://a.test/app"));\nwindow.top.location = validate("https://a.test/store");';

describe('journeys/cta-override', () => {
  it('leaves html alone without $journeys_cta', () => {
    expect(applyCtaOverride({ _branchViewData: {} }, SCRIPT)).toBe(SCRIPT);
    expect(applyCtaOverride(null, SCRIPT)).toBe(SCRIPT);
    // a non-string truthy value has no length
    expect(
      applyCtaOverride(
        { _branchViewData: { data: { $journeys_cta: 5 } } },
        SCRIPT,
      ),
    ).toBe(SCRIPT);
  });

  it('points every validate() at $journeys_cta and turns replace( into an assignment', () => {
    const branch = {
      _branchViewData: { data: { $journeys_cta: 'https://custom.test' } },
    };
    expect(applyCtaOverride(branch, SCRIPT)).toBe(
      'window.top.location = validate("https://custom.test")\nwindow.top.location = validate("https://custom.test")',
    );
  });
});

describe('journeys/cta-script', () => {
  afterEach(() => document.getElementById(CTA_SCRIPT_ID)?.remove());

  it('appends #branch-journey-cta to the body with the nonce', () => {
    const ctx = createContext();
    ctx.nonce = 'n0nce';
    const el = installCtaScript(ctx, 'window.__x = 1;');
    expect(el.id).toBe('branch-journey-cta');
    expect(el.getAttribute('nonce')).toBe('n0nce');
    expect(el.parentNode).toBe(document.body);
  });
});
