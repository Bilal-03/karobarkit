# Performance audit

This is a local production-server assessment, not field Core Web Vitals. Lighthouse and network throttling were unavailable in the environment.

## Baseline measurements

- Production build completed successfully in approximately 14 seconds after compilation/cache warm-up.
- Local HTML responses: homepage 292 ms TTFB / 292 ms total; tools directory 431 ms / 433 ms; GST Calculator 10 ms / 10 ms; GST Invoice 12 ms / 12 ms.
- Browser chunks: approximately 2.2 MB uncompressed; largest chunk approximately 1.15 MB.
- No third-party analytics or advertising scripts are loaded.

## Review

The homepage, directory, category and search shells are server-rendered. Registry search is dependency-free. Document and QR interactions are client components scoped to tool routes; no global PDF or QR runtime is imported into the homepage shell. Font assets are self-hosted through `@fontsource`.

Targets of LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 are not claimed without field or Lighthouse evidence. Repeat measurement with Lighthouse on slow 4G and a mid-range Android device before public launch.
