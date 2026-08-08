# Rollback plan

1. Identify the active production release and deployment commit in the hosting provider.
2. Stop promotion of the affected build and redeploy the last known-good commit from the release history.
3. If a regulatory source or calculation is in question, disable the affected tool route at the hosting layer or replace its visible form with a warning and links to methodology/sources; do not substitute an invented rate or calculation.
4. Preserve the failing release identifier, route, browser, timestamp and safe error digest. Do not collect user amounts or documents.
5. Communicate the affected tool, scope, known limitation and correction status on the status/support channel.
6. After rollback, run production smoke checks for `/`, `/tools`, `/tools/gst-calculator`, `/tools/gst-invoice-generator`, `/sitemap.xml`, `/robots.txt` and 404 behavior.

Current limitation: no hosting provider, production release identifier or emergency feature-flag mechanism is configured in this repository. Those operational steps must be assigned before launch.
