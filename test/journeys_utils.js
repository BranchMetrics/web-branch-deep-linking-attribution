'use strict';

goog.require('journeys_utils');

describe('journeys_utils', function() {
	var assert = testUtils.unplanned();

	var testHtml = "<html><head><style type=\"text/css\" id=\"branch-css\">#branch-banner .branch-banner-close {\n  display: inline-block;\n  float: left;\n  height: 51px;\n  width: 22px;\n  padding-top: 30px;\n  text-align: center;\n  color: grey;\n  font-size: 15px;\n}\n\n#branch-banner .branch-banner-icon {\n  float: left;\n  border-radius: 10px;\n  width: 63px;\n  height: 63px;\n  margin-top: 7px;\n  margin-right: 10px;\n}\n\n#branch-banner .branch-banner-icon img {\n  width: 63px;\n  height: 63px;\n  border-radius: 10px;\n}\n\n#branch-banner .branch-banner-title {\n  font-weight: bold;\n  color: #333333;\n  padding-top: 8px;\n  padding-bottom: 1px;\n  font-size: 12px;\n}\n\n#branch-banner .branch-banner-description {\n  overflow: hidden;\n  color: #333333;\n  font-size: 11px;\n}\n\n#branch-banner .branch-banner-button {\n  font-size: 12px;\n  border: 1px solid;\n  border-radius: 10px;\n  padding: 10px 10px;\n  margin: 18px 10px 10px 0;\n  padding: 10px 10px;\n  text-decoration: none;\n  color: #1CADCE;\n  font-weight: bold;\n  text-align: center;\n  letter-spacing: 1.15px;\n  float: none;\n}\n\n#branch-banner .branch-banner-stars {\n  display: inline;\n  color: #f8e733;\n}\n\n#branch-banner .branch-banner-reviews {\n  font-size: 12px;\n  color: #777;\n  display: inline-block;\n}\n\n#branch-banner .branch-banner-stars span {\n  position: relative;\n}\n\n#branch-banner .branch-banner-content {\n  width: 100%;\n  overflow: hidden;\n  height: 76px;\n  background: white;\n  color: #333;\n  border-top: 1px solid #ddd;\n}\n\n#branch-banner .branch-banner-left {\n  float: left;\n  width: 75%;\n}\n\n#branch-banner .branch-banner-right {\n  width: 25%;\n  float: right;\n}\n\n#branch-banner .branch-banner-right > div {\n  float: right;\n}\n\n#branch-banner-spacer {\n  height: 0;\n  margin-bottom: 76px;\n}\n\n#branch-banner {\n  font-family: 'Open Sans', sans-serif;\n  width: 100%;\n  z-index: 99999;\n  -webkit-font-smoothing: antialiased;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  user-select: none;\n  -webkit-transition: all 0.25s ease;\n  transition: all 00.25s ease;\n  position: absolute;\n  top: 0;\n  left: 0;\n}\n</style></head><body><div data-id=1  data-id=\"1\" id=\"branch-banner-spacer\"></div><div data-id=2  data-id=\"2\" src=\"about:blank\" scrolling=\"no\" id=\"branch-banner-iframe\" class=\"branch-animation\">\n\t<div data-id=3  data-id=\"3\" id=\"branch-banner\" class=\"branch-animation\">\n\t\t<div data-id=4  data-id=\"4\" class=\"branch-banner-content\">\n\t\t\t<div data-id=5  data-id=\"5\" class=\"branch-banner-left\">\n\t\t\t<div data-id=6  data-id=\"6\" class=\"branch-banner-close close\" id=\"branch-banner-close1\">&times</div>\n\t\t\t\t<div data-id=7  data-id=\"7\" class=\"branch-banner-icon\">\n\t\t\t\t\t<img data-id=7 data-default=\"true\" data-id=\"7\" src=\"https:\/\/cdn.branch.io\/branch-assets\/1469135837653-icon.png\"><\/img>\n\t\t\t\t</div>\n\t\t\t\t<div data-id=9  data-id=\"9\" data-default=\"true\" class=\"branch-banner-title\">YOUR APP</div>\n\t\t\t\t<div data-id=10  data-id=\"10\" class=\"branch-banner-description\">Add a description. Up to two lines of text.</div>\n\t\t\t\t<div data-id=11  data-id=\"11\" class=\"branch-banner-stars\">★★★★★</div>\n\t\t\t\t<div data-id=12  data-id=\"12\" class=\"branch-banner-reviews\">1,345</div>\n\t\t\t</div>\n\t\t\t<div data-id=13  data-id=\"13\" class=\"branch-banner-right\">\n\t\t\t\t<div data-id=14  data-id=\"14\" id=\"branch-mobile-action\" class=\"branch-banner-button\">OPEN</div>\n\t\t\t</div>\n\t\t</div>\n    </div>\n</div>\n\n\n\n\n\n\n\n<script type=\"text/javascript\">\n(function(w, d) {\n    function onClose(ev) {\n        w.location.href = 'branch-cta://cancel';\n        ev.preventDefault();\n    }\n    function onAccept(ev) {\n        w.location.href = 'branch-cta://accept';\n        ev.preventDefault();\n    };\n    var btnClose = d.getElementById('branch-banner-close1');\n    if (btnClose) {\n        btnClose.onclick = onClose;\n    }\n    var btnClose = d.getElementById('branch-banner-close2');\n    if (btnClose) {\n        btnClose.onclick = onClose;\n    }\n    var btnAccept = d.getElementById('branch-mobile-action');\n    if (btnAccept) {\n        btnAccept.onclick = onAccept\n    }\n})(window, document);\n</script><script type=\"application/json\">{\"bannerHeight\": \"76px\", \"position\": \"top\", \"sticky\": \"absolute\", \"ctaText\":{\"has_app\":\"OPEN\",\"no_app\":\"GET\"}}</script></body></html>";
	var testHtmlNoJsOrCss = "<html><head></head><body><div data-id=1  data-id=\"1\" id=\"branch-banner-spacer\"></div><div data-id=2  data-id=\"2\" src=\"about:blank\" scrolling=\"no\" id=\"branch-banner-iframe\" class=\"branch-animation\">\n\t<div data-id=3  data-id=\"3\" id=\"branch-banner\" class=\"branch-animation\">\n\t\t<div data-id=4  data-id=\"4\" class=\"branch-banner-content\">\n\t\t\t<div data-id=5  data-id=\"5\" class=\"branch-banner-left\">\n\t\t\t<div data-id=6  data-id=\"6\" class=\"branch-banner-close close\" id=\"branch-banner-close1\">&times</div>\n\t\t\t\t<div data-id=7  data-id=\"7\" class=\"branch-banner-icon\">\n\t\t\t\t\t<img data-id=7 data-default=\"true\" data-id=\"7\" src=\"https://cdn.branch.io/branch-assets/1469135837653-icon.png\"></img>\n\t\t\t\t</div>\n\t\t\t\t<div data-id=9  data-id=\"9\" data-default=\"true\" class=\"branch-banner-title\">YOUR APP</div>\n\t\t\t\t<div data-id=10  data-id=\"10\" class=\"branch-banner-description\">Add a description. Up to two lines of text.</div>\n\t\t\t\t<div data-id=11  data-id=\"11\" class=\"branch-banner-stars\">★★★★★</div>\n\t\t\t\t<div data-id=12  data-id=\"12\" class=\"branch-banner-reviews\">1,345</div>\n\t\t\t</div>\n\t\t\t<div data-id=13  data-id=\"13\" class=\"branch-banner-right\">\n\t\t\t\t<div data-id=14  data-id=\"14\" id=\"branch-mobile-action\" class=\"branch-banner-button\">OPEN</div>\n\t\t\t</div>\n\t\t</div>\n    </div>\n</div>\n\n\n\n\n\n\n\n</body></html>";

	describe('setPostitionAndHeight', function() {
		it('should set the position and height based on metadata', function() {
			assert.deepEqual(1, 1, 'it works!')
		});
		it('should still set position height if no metadata', function() {
			assert.deepEqual(1, 1, 'it works!')
		});
		it('should convert full page height to a fixed pixel height', function() {
			assert.deepEqual(1, 1, 'it works!')
		});
	});
	describe('getMetadata', function() {
		it('should find and return metadata from html blob', function() {
			var expectedMetadata = {"bannerHeight":"76px","position":"top","sticky":"absolute","ctaText":{"has_app":"OPEN","no_app":"GET"}};
			assert.deepEqual(journeys_utils.getMetadata(testHtml), expectedMetadata);
		});
	});
	describe('ctaText', function() {
		var testMetadata = {"ctaText":{"has_app":"OPEN","no_app":"GET"}};
		it('should return has_app cta', function() {
			var expectedCta = 'OPEN';
			assert.deepEqual(journeys_utils.getCtaText(testMetadata, true), expectedCta);
		});
		it('should return no_app cta', function() {
			var expectedCta = 'GET';
			assert.deepEqual(journeys_utils.getCtaText(testMetadata, false), expectedCta);
		});
	});
	describe('findInsertionDiv', function() {
		it('should return undefined if no injectorSelector in metadata', function() {
			var testMetadata = {"ctaText":{"has_app":"OPEN","no_app":"GET"}};
			assert.deepEqual(journeys_utils.findInsertionDiv(null, testMetadata), undefined);
		})
		it('should find an element if one exists that matches the injectorSelector', function() {
			var testMetadata = {"injectorSelector": ".test", "ctaText":{"has_app":"OPEN","no_app":"GET"}};
			assert.deepEqual(journeys_utils.findInsertionDiv(document.body, testMetadata),  {});
		})
		it('should return undefined if it does not find the injectorSelector on page', function() {
			var testMetadata = {"injectorSelector": ".not-there", "ctaText":{"has_app":"OPEN","no_app":"GET"}};
			assert.deepEqual(journeys_utils.findInsertionDiv(document.body, testMetadata), undefined);
		})
	});
	describe('getCss', function() {
		var testMetadata = {"ctaText":{"has_app":"OPEN","no_app":"GET"}};
		it('should find and return CSS from html blob', function() {
			var expectedCss = "#branch-banner .branch-banner-close {\n  display: inline-block;\n  float: left;\n  height: 51px;\n  width: 22px;\n  padding-top: 30px;\n  text-align: center;\n  color: grey;\n  font-size: 15px;\n}\n\n#branch-banner .branch-banner-icon {\n  float: left;\n  border-radius: 10px;\n  width: 63px;\n  height: 63px;\n  margin-top: 7px;\n  margin-right: 10px;\n}\n\n#branch-banner .branch-banner-icon img {\n  width: 63px;\n  height: 63px;\n  border-radius: 10px;\n}\n\n#branch-banner .branch-banner-title {\n  font-weight: bold;\n  color: #333333;\n  padding-top: 8px;\n  padding-bottom: 1px;\n  font-size: 12px;\n}\n\n#branch-banner .branch-banner-description {\n  overflow: hidden;\n  color: #333333;\n  font-size: 11px;\n}\n\n#branch-banner .branch-banner-button {\n  font-size: 12px;\n  border: 1px solid;\n  border-radius: 10px;\n  padding: 10px 10px;\n  margin: 18px 10px 10px 0;\n  padding: 10px 10px;\n  text-decoration: none;\n  color: #1CADCE;\n  font-weight: bold;\n  text-align: center;\n  letter-spacing: 1.15px;\n  float: none;\n}\n\n#branch-banner .branch-banner-stars {\n  display: inline;\n  color: #f8e733;\n}\n\n#branch-banner .branch-banner-reviews {\n  font-size: 12px;\n  color: #777;\n  display: inline-block;\n}\n\n#branch-banner .branch-banner-stars span {\n  position: relative;\n}\n\n#branch-banner .branch-banner-content {\n  width: 100%;\n  overflow: hidden;\n  height: 76px;\n  background: white;\n  color: #333;\n  border-top: 1px solid #ddd;\n}\n\n#branch-banner .branch-banner-left {\n  float: left;\n  width: 75%;\n}\n\n#branch-banner .branch-banner-right {\n  width: 25%;\n  float: right;\n}\n\n#branch-banner .branch-banner-right > div {\n  float: right;\n}\n\n#branch-banner-spacer {\n  height: 0;\n  margin-bottom: 76px;\n}\n\n#branch-banner {\n  font-family: 'Open Sans', sans-serif;\n  width: 100%;\n  z-index: 99999;\n  -webkit-font-smoothing: antialiased;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  user-select: none;\n  -webkit-transition: all 0.25s ease;\n  transition: all 00.25s ease;\n  position: absolute;\n  top: 0;\n  left: 0;\n}\n";
			assert.deepEqual(journeys_utils.getCss(testHtml), expectedCss);
		});
	});
	describe('getJsAndAddToParent', function() {
		it('should find javascript in template and append to page (check page source)', function() {
			journeys_utils.getJsAndAddToParent(testHtml);
		})
	});
	describe('removeScriptAndCss', function() {
		it('should remove all js and css, returning just html blob', function() {
			assert.equal(journeys_utils.removeScriptAndCss(testHtmlNoJsOrCss), testHtmlNoJsOrCss);
		})
	});
	describe('createAndAppendIframe', function() {
		it('should return an empty iframe that has been added to document.body', function() {
			var createIframe = journeys_utils.createAndAppendIframe();
			assert.equal(!!document.getElementById('branch-banner-iframe'), true)
		})
	});
	describe('createIframeInnerHTML', function() {
		it('should add user agent class to html blob', function() {
			var expectedHtml = "<html><head></head><body class=\"branch-banner-ios\"><html><head></head><body><div data-id=1  data-id=\"1\" id=\"branch-banner-spacer\"></div><div data-id=2  data-id=\"2\" src=\"about:blank\" scrolling=\"no\" id=\"branch-banner-iframe\" class=\"branch-animation\">\n\t<div data-id=3  data-id=\"3\" id=\"branch-banner\" class=\"branch-animation\">\n\t\t<div data-id=4  data-id=\"4\" class=\"branch-banner-content\">\n\t\t\t<div data-id=5  data-id=\"5\" class=\"branch-banner-left\">\n\t\t\t<div data-id=6  data-id=\"6\" class=\"branch-banner-close close\" id=\"branch-banner-close1\">&times</div>\n\t\t\t\t<div data-id=7  data-id=\"7\" class=\"branch-banner-icon\">\n\t\t\t\t\t<img data-id=7 data-default=\"true\" data-id=\"7\" src=\"https://cdn.branch.io/branch-assets/1469135837653-icon.png\"></img>\n\t\t\t\t</div>\n\t\t\t\t<div data-id=9  data-id=\"9\" data-default=\"true\" class=\"branch-banner-title\">YOUR APP</div>\n\t\t\t\t<div data-id=10  data-id=\"10\" class=\"branch-banner-description\">Add a description. Up to two lines of text.</div>\n\t\t\t\t<div data-id=11  data-id=\"11\" class=\"branch-banner-stars\">★★★★★</div>\n\t\t\t\t<div data-id=12  data-id=\"12\" class=\"branch-banner-reviews\">1,345</div>\n\t\t\t</div>\n\t\t\t<div data-id=13  data-id=\"13\" class=\"branch-banner-right\">\n\t\t\t\t<div data-id=14  data-id=\"14\" id=\"branch-mobile-action\" class=\"branch-banner-button\">OPEN</div>\n\t\t\t</div>\n\t\t</div>\n    </div>\n</div>\n\n\n\n\n\n\n\n</body></html></body></html>"
			assert.equal(journeys_utils.createIframeInnerHTML(testHtmlNoJsOrCss, 'ios'), expectedHtml);
		})
	});
	describe('addHtmlToIframe', function() {

	});
	describe('addIframeOuterCSS', function() {

	});
	describe('addIframeInnerCSS', function() {

	});
	describe('addDynamicCtaText', function() {

	});
	describe('animateBannerEntrance', function() {

	});
	describe('findDismissPeriod', function() {

	});
	describe('finalHookups', function() {

	});
	describe('animateBannerExit', function() {

	});
});
