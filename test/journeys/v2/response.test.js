import { bannerPayloadFrom } from '../../../src/journeys/v2/response.js';
import { sampleServerPayload } from './fixtures.js';

const request = {
  callback_string: 'branch_view_callback__7',
  banner_payload: 1,
};
const view = { templateId: 'view-1', audienceRuleId: 'rule-1' };
const branch = (data) => ({ _branchViewData: data ? { data } : {} });
const payloadResponse = (journey = sampleServerPayload()) => ({
  use_v2_renderer: true,
  banner_payload: journey,
  template: '<html></html>',
  journey_link_data: {
    type: 'mobile',
    view_id: 'view-1',
    browser_fingerprint_id: 'bfp',
  },
});

describe('journeys/v2 bannerPayloadFrom', () => {
  it('adds the view, CTA callback and link data to the server payload', () => {
    const server = sampleServerPayload();
    expect(
      bannerPayloadFrom(payloadResponse(server), request, view, branch()),
    ).toEqual({
      render: server.render,
      dismissal: server.dismissal,
      cta: {
        script: server.cta.script,
        callbackString: 'branch_view_callback__7',
      },
      view: { id: 'view-1', audienceRuleId: 'rule-1' },
      linkData: {
        banner_id: 'view-1',
        journey_link_data: { type: 'mobile', view_id: 'view-1' },
      },
    });
  });

  it('applies $journeys_cta to the CTA script', () => {
    const payload = bannerPayloadFrom(
      payloadResponse(),
      request,
      view,
      branch({ $journeys_cta: 'https://shop.example.com/cta' }),
    );
    expect(payload.cta.script).toContain(
      'validate("https://shop.example.com/cta")',
    );
    expect(payload.cta.script).not.toContain('example.app.link');
  });

  it('returns null for the template shape, even with use_v2_renderer', () => {
    expect(
      bannerPayloadFrom(
        { use_v2_renderer: true, template: '<html></html>' },
        request,
        view,
        branch(),
      ),
    ).toBeNull();
  });

  it("returns null for a payload the request didn't ask for", () => {
    expect(
      bannerPayloadFrom(
        payloadResponse(),
        { callback_string: 'branch_view_callback__7' },
        view,
        branch(),
      ),
    ).toBeNull();
  });

  it('returns null for a payload without a CTA script or render', () => {
    const noCta = sampleServerPayload();
    delete noCta.cta;
    const noRender = sampleServerPayload();
    delete noRender.render;
    expect(
      bannerPayloadFrom(payloadResponse(noCta), request, view, branch()),
    ).toBeNull();
    expect(
      bannerPayloadFrom(payloadResponse(noRender), request, view, branch()),
    ).toBeNull();
    expect(
      bannerPayloadFrom(
        { ...payloadResponse(), banner_payload: null },
        request,
        view,
        branch(),
      ),
    ).toBeNull();
  });

  it('gives a payload without a dismissal an empty one, so a dismiss still completes', () => {
    const server = sampleServerPayload();
    delete server.dismissal;
    expect(
      bannerPayloadFrom(payloadResponse(server), request, view, branch())
        .dismissal,
    ).toEqual({});
  });

  it('accepts version 1 only', () => {
    const at = (version) => {
      const server = sampleServerPayload();
      if (version === undefined) delete server.version;
      else server.version = version;
      return bannerPayloadFrom(
        payloadResponse(server),
        request,
        view,
        branch(),
      );
    };
    expect(at(1)).not.toBeNull();
    expect(at(undefined)).toBeNull();
    expect(at(2)).toBeNull();
  });
});
