# CLS baseline

The layout shift the Web SDK's banners cause today, as measured by this suite.
`config.mjs` locks these numbers in; this file explains them. Update both
together when a change moves them.

- SDK 2.86.1 (`dist/build.min.js`), recorded 2026-10-02
- Chromium 153 (Playwright 1.63), on macOS and in
  `mcr.microsoft.com/playwright:v1.63.0-noble` (CI); both measure the same
- Phone: Pixel 7 layout, 412x839. Desktop: 1280x800
- Page: `hosts/article.html`, at the top and scrolled 400px

Google rates CLS up to **0.1 good**, up to **0.25 needs improvement**, above
that **poor**.

## Results

### Phone

| Banner | Size | At top | Scrolled | Rating |
|---|---|---|---|---|
| legacy standard top | 412x77 | 0.096 | 0.084 | good |
| v2 standard top | 412x75 | 0.081 | 0.084 | good |
| legacy full page | 412x839 | 1.16 | 1.18 | poor |
| v2 full page | 412x839 | 0.551 | 0.881 | poor |

### Desktop

| Banner | Size | At top | Scrolled | Rating |
|---|---|---|---|---|
| legacy desktop center | 800x617 | 0.368 | 0.368 | poor |
| v2 desktop center | 580x400 | 0 | 0 | good |
| legacy desktop corner | 430x430 | 0.244 | 0.244 | needs improvement |
| v2 desktop corner | 450x220 | 0 | 0 | good |

Loading the SDK with no banner causes no shift on either device.

Every v2 and desktop value measures the same on every load, with one known
exception: legacy desktop corner, scrolled, measured 0.250 and 0.278 in one
baseline run, and 0.244 in about 340 loads since; the cause isn't known.

The legacy phone banners vary a little: their CSS transitions count for more
or less depending on which frames get painted, and so on how busy the machine
is. Run one at a time (as the suite does), legacy standard top measured
0.090-0.102 at the top, and legacy full page 1.146-1.188 at the top and
1.128-1.276 scrolled, in a few discrete steps. The suite checks the median of
three loads, which stayed within 0.094-0.102, 1.146-1.179 and 1.129-1.228 over
16 runs; the table gives the middle of those, and all of it is inside the 10%
tolerance. A later run of 10 had a full page, scrolled median of 1.28, above
the 5% first used, so the band is 10%. Run alongside the
other tests they spread further (0.998-1.28 for full page).

## What the numbers mean

**Desktop: v2 causes no layout shift; legacy does, even though the page never
moves.** Legacy center and corner banners slide in an iframe the size of the
viewport by animating its position. Chrome counts every frame of that as a
shift, so the banner alone puts the page at 0.368 (center) or 0.244 (corner).
v2 brings its banners in without moving any element's layout.

**Phone, standard top: both renderers are just inside "good".** A top banner
pushes the whole page down by its height, and that push is the shift. The two
banners are within 2px of each other in height, so the comparison is fair:
legacy measures about 0.096 at the top of the page against 0.081 for v2, and
both measure 0.084 once the reader has scrolled. Either way, a top banner
uses most of the "good" budget on its own.

**Phone, full page: both renderers are poor.** v2 is under half of legacy at
the top of the page (0.551 against 1.16), but it gets much worse when the
reader has scrolled (0.881) while legacy barely changes (1.18). Full-page banners are
the largest CLS cost the SDK has.

**Bottom banners barely register.** A bottom banner covers content rather than
pushing it, so only its own slide-in counts (under 0.01 when last checked, on
an iPhone layout). It is not part of the suite.

**Closing a banner doesn't count here.** Chrome ignores shifts within 500ms of
a tap or click, and the suite closes every banner the way a user would. No
banner shifted anything after that window, so every number above is the
banner's entrance.

## Limits

- One stage banner per row. Template design (size, layout) is part of each
  number, not just the renderer. Standard top banners are matched in height;
  the desktop ones are not, but the v2 zeros don't depend on size.
- One synthetic page. Real pages with more above the fold, sticky elements or
  late-loading content will measure differently. The suite is for catching SDK
  changes, not for predicting a customer's score.
- Chromium only, with emulated devices. That is where CLS is measured for
  Google's Core Web Vitals, but Safari users never report it.
