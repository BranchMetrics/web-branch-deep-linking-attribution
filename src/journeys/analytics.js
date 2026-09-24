'use strict';
goog.provide('journeys_analytics');

goog.require('utils');

// Link params that must not be echoed back in analytics payloads. Shared by
// journeys_utils.setJourneyLinkData (legacy) and journeys_v2.context.buildLinkData.
journeys_analytics.FILTERED_LINK_KEYS = [
  'browser_fingerprint_id',
  'app_id',
  'source',
  'open_app',
  'link_click_id',
];

// Decodes HTML entities out of journey_link_data string fields before they're sent up as
// analytics metadata.
journeys_analytics.decodeSymbols = function (str) {
  if (str === undefined || str === null) {
    return null;
  }
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&brvbar;/g, '¦')
    .replace(/&laquo;/g, '«')
    .replace(/&acute;/g, '´')
    .replace(/&middot;/g, '·')
    .replace(/&raquo;/g, '»')
    .replace(/&amp;/g, '&')
    .replace(/&iquest;/g, '¿')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Acirc;/g, 'Â')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Aring;/g, 'Å')
    .replace(/&AElig;/g, 'Æ')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&Euml;/g, 'Ë')
    .replace(/&Igrave;/g, 'Ì')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Icirc;/g, 'Î')
    .replace(/&Iuml;/g, 'Ï')
    .replace(/&ETH;/g, 'Ð')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&Ograve;/g, 'Ò')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Oslash;/g, 'Ø')
    .replace(/&Ugrave;/g, 'Ù')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ucirc;/g, 'Û')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&Yacute;/g, 'Ý')
    .replace(/&THORN;/g, 'Þ')
    .replace(/&szlig;/g, 'ß')
    .replace(/&agrave;/g, 'à')
    .replace(/&aacute;/g, 'á')
    .replace(/&acirc;/g, 'â')
    .replace(/&atilde;/g, 'ã')
    .replace(/&auml;/g, 'ä')
    .replace(/&aring;/g, 'å')
    .replace(/&aelig;/g, 'æ')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&euml;/g, 'ë')
    .replace(/&igrave;/g, 'ì')
    .replace(/&iacute;/g, 'í')
    .replace(/&icirc;/g, 'î')
    .replace(/&iuml;/g, 'ï')
    .replace(/&eth;/g, 'ð')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&ograve;/g, 'ò')
    .replace(/&oacute;/g, 'ó')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&otilde;/g, 'õ')
    .replace(/&ouml;/g, 'ö')
    .replace(/&oslash;/g, 'ø')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ucirc;/g, 'û')
    .replace(/&uuml;/g, 'ü')
    .replace(/&yacute;/g, 'ý')
    .replace(/&thorn;/g, 'þ')
    .replace(/&yuml;/g, 'ÿ');
};

// Builds the browser/device metadata block sent with every journeys pageview and dismiss request.
journeys_analytics.getPageviewMetadata = function (
  options,
  additionalMetadata,
) {
  var pageviewMetadata = utils.merge(
    {
      'url': (options && options.url) || utils.getWindowLocation(),
      'user_agent': navigator.userAgent,
      'language': navigator.language,
      'screen_width': screen.width || -1,
      'screen_height': screen.height || -1,
      'window_device_pixel_ratio': window.devicePixelRatio || 1,
    },
    additionalMetadata || {},
  );
  pageviewMetadata = utils.addPropertyIfNotNullorEmpty(
    pageviewMetadata,
    'model',
    utils.userAgentData ? utils.userAgentData.model : '',
  );
  pageviewMetadata = utils.addPropertyIfNotNullorEmpty(
    pageviewMetadata,
    'os_version',
    utils.userAgentData ? utils.userAgentData.platformVersion : '',
  );
  return pageviewMetadata;
};

// Builds the v1/dismiss request body: pageview-shaped request data plus journey_id/journey_name/
// view_id/view_name/channel/campaign/tags pulled off the currently-displayed journey's link data.
// branchView is passed explicitly to avoid a circular goog.require.
journeys_analytics.getDismissRequestData = function (
  branchView,
  dismissalSource,
  journeyLinkData,
  branch,
) {
  var metadata = {};
  var hostedDeeplinkData = utils.getHostedDeepLinkData();
  if (hostedDeeplinkData && Object.keys(hostedDeeplinkData).length > 0) {
    metadata['hosted_deeplink_data'] = hostedDeeplinkData;
  }

  var dismissRequestData = branchView._getPageviewRequestData(
    journeys_analytics.getPageviewMetadata(null, metadata),
    null,
    branch,
    true,
  );

  if (journeyLinkData && journeyLinkData['journey_link_data']) {
    utils.addPropertyIfNotNull(
      dismissRequestData,
      'journey_id',
      journeyLinkData['journey_link_data']['journey_id'],
    );
    utils.addPropertyIfNotNull(
      dismissRequestData,
      'journey_name',
      journeys_analytics.decodeSymbols(
        journeyLinkData['journey_link_data']['journey_name'],
      ),
    );
    utils.addPropertyIfNotNull(
      dismissRequestData,
      'view_id',
      journeyLinkData['journey_link_data']['view_id'],
    );
    utils.addPropertyIfNotNull(
      dismissRequestData,
      'view_name',
      journeys_analytics.decodeSymbols(
        journeyLinkData['journey_link_data']['view_name'],
      ),
    );
    utils.addPropertyIfNotNull(
      dismissRequestData,
      'channel',
      journeys_analytics.decodeSymbols(
        journeyLinkData['journey_link_data']['channel'],
      ),
    );
    utils.addPropertyIfNotNull(
      dismissRequestData,
      'campaign',
      journeys_analytics.decodeSymbols(
        journeyLinkData['journey_link_data']['campaign'],
      ),
    );
    try {
      utils.addPropertyIfNotNull(
        dismissRequestData,
        'tags',
        JSON.stringify(journeyLinkData['journey_link_data']['tags']),
      );
    } catch (_e) {
      dismissRequestData['tags'] = JSON.stringify([]);
    }
  }

  utils.addPropertyIfNotNull(
    dismissRequestData,
    'dismissal_source',
    dismissalSource,
  );

  return dismissRequestData;
};
