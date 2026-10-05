---
name: Public QR links
description: How shareable questionnaire links should handle Replit Preview and production.
---

Replit Preview can require a workspace login even when the published deployment is public. A QR generated from `window.location.origin` in Preview can therefore point recipients to an inaccessible development host.

**Why:** the user encountered a login prompt after scanning a QR from a printed profile.

**How to apply:** Generate shareable QR codes and links from the verified primary production URL returned by `getDeploymentInfo()`, never from the current origin or `REPLIT_DOMAINS`. Previously exported PDFs keep their encoded destination and must be regenerated.
