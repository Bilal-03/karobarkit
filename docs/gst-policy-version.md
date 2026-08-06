# GST policy-version model

KarobarKit keeps GST policy as controlled application data rather than as a timeless percentage constant or a runtime API response.

Each policy version has:

- a stable ID;
- an explicit effective start and optional end date;
- an active, historical or provisional status;
- an independent last-verified date;
- official source IDs;
- rate presets with their own effective dates, status and source IDs.

The active Milestone 4 bundle is `gst-general-rates-2025-09-22-v1`. It is effective from 22 September 2025 and was last verified on 6 August 2026. It contains only the 5% and 18% headline presets. The absence of a preset is intentional: it prevents an unclassified calculator from turning an official category-specific rate into a general recommendation.

Policy validation checks source authority, HTTPS official domains, date completeness, source references, active and expired ranges, overlapping active versions, duplicate rates, verification dates and the UI/policy preset contract. Tests exercise invalid bundles directly.

The freshness check uses a 180-day review interval. A stale policy produces a review-due warning; it does not silently alter a rate or claim that the rate is wrong. Updating the bundle requires a reviewed source update in code and a new test/documentation pass. The browser never fetches or replaces policy data at runtime.
