# Milestone 3 implementation status

Status: complete. The final quality run passed on 2026-08-06.

This milestone adds two local-first document generators:

- `/tools/letterhead-generator`
- `/tools/payment-receipt-generator`

## Architecture

- `src/domain/documents` contains the typed document model, Zod validation, Indian date/currency/amount-to-words formatting, safe filename rules, logo processing and pure document calculators.
- `src/components/documents` contains the shared accessible form, local logo uploader and responsive A4 preview.
- `src/lib/documents` contains lazy PDF generation with `pdf-lib`, browser download handling, print preparation and user-facing export errors.
- The existing registry and `ToolPage` route shell provide metadata, sources, related tools, privacy messaging and shared navigation.

Document payload construction and validation are independent of React. The preview only renders text nodes and image data URLs; entered text is never treated as HTML.

## Export strategy

PDF download is generated in the browser as a vector PDF. Local Noto Sans Devanagari font files are embedded when needed so Latin, Devanagari and the Indian rupee symbol remain selectable and printable. Full font embedding is used for complex-script reliability. Browser Print is the fallback and is styled for A4 paper with page breaks. No document is sent to a backend.

Only PNG, JPEG and WebP logos are accepted. Files are signature-checked, size-limited, dimension-checked and resized locally before preview/export. SVG and unsupported files are rejected.

## Validation and privacy

- Business identity fields are required where needed; optional website values accept HTTP/HTTPS only and safely normalize bare domains.
- Letterhead dates are real local calendar dates; body text is plain text with a length limit and page splitting.
- Receipt numbers allow letters, numbers, spaces, hyphens and slashes. Amounts must be finite, positive, decimal-safe, at most two decimal places and within the configured maximum. Payment notes and display fields have bounded lengths.
- Amount-to-words uses the Indian numbering system and includes paise when present.
- Receipt output is a declaration of entered payment information, not bank confirmation, settlement proof, GST evidence or account verification.
- Fields, logos, QR payloads and generated documents remain in browser memory. Analytics receives only tool and format metadata; sensitive property names are rejected by policy.

## Known limitations

- The built-in PDF renderer embeds Latin and Devanagari fonts. Other scripts should use browser Print → Save as PDF for the best available system-font fallback.
- A logo must be a decodable raster image supported by the browser. Animated images, SVG and malformed files are intentionally unsupported.
- Browser PDF and print output can vary slightly with installed fonts, browser print settings and background-graphics preferences; A4 and background graphics are documented in the UI.
- The automated browser coverage uses Chromium. Other engines should be checked before promising pixel-identical exports.
