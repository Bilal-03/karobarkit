# Browser matrix

Repository E2E coverage uses Chromium with device emulation. Physical devices and non-Chromium engines were unavailable, so they are not marked as passed.

| Browser/device                                              | Navigation/forms | QR         | PDF/print  | Accessibility | Status     |
| ----------------------------------------------------------- | ---------------- | ---------- | ---------- | ------------- | ---------- |
| Chromium desktop                                            | PASS             | PASS       | PASS       | PASS          | PASS       |
| Chromium mobile emulation (320/360/390/430)                 | PASS             | PASS       | PASS       | PASS          | PASS       |
| Chromium tablet/desktop emulation (768/1024/1280/1440/1920) | PASS             | PASS       | PASS       | PASS          | PASS       |
| Safari / iOS Safari                                         | NOT TESTED       | NOT TESTED | NOT TESTED | NOT TESTED    | NOT TESTED |
| Firefox                                                     | NOT TESTED       | NOT TESTED | NOT TESTED | NOT TESTED    | NOT TESTED |
| Edge                                                        | NOT TESTED       | NOT TESTED | NOT TESTED | NOT TESTED    | NOT TESTED |
| Android Chrome physical device                              | NOT TESTED       | NOT TESTED | NOT TESTED | NOT TESTED    | NOT TESTED |

The Chromium matrix completed with 226 passed tests and 34 intentional skips. The one desktop-1280 letterhead download timeout observed in the long serial run passed on focused rerun.
