---
title: Cookie Banner
version: 1.0
last_updated: 2026-07-02
---

# Cookie Banner Text

This document contains the recommended text and behavior for the cookie consent banner used on C-Ton-Tour.

It is intended for implementation in the user interface of the Service.

---

## 1. Banner Message (Initial View)

When a user first visits the Service, display the following message:

> We use essential cookies to make C-Ton-Tour work properly, including authentication, session management, and basic preferences.  
>  
> These cookies are required for the Service to function. We do not use analytics or advertising cookies.

---

## 2. User Options

The banner should provide the following options:

- **Accept essential cookies** (required for the Service)
- **Learn more** (link to Cookie Policy)

Since only essential cookies are used, no rejection toggle is required for functionality cookies.

If in the future non-essential cookies are introduced, a "Reject non-essential cookies" option must be added.

---

## 3. Secondary Information (Optional Link Text)

If the user clicks "Learn more", display or link to:

- Cookie Policy
- Privacy Policy

---

## 4. Technical Cookies Disclosure

By using the Service, the user acknowledges that the following essential cookies may be used:

- Authentication session cookies
- Login state cookies
- Basic preference storage (e.g. UI settings)

These cookies are necessary for the Service to function correctly.

---

## 5. Consent Storage

User consent (or acknowledgment) should be stored so that:

- The banner is not shown again on subsequent visits
- Consent choice is retained per device/browser
- The system remembers acceptance of essential cookies

---

## 6. No Tracking Statement

The banner should clearly indicate:

- No advertising cookies are used
- No behavioural tracking is performed
- No third-party analytics tools are active

---

## 7. Design Recommendation (UI Implementation)

Recommended layout:

- Small bottom banner or modal
- Clear primary button: **“Accept essential cookies”**
- Secondary link: **“Learn more”**
- Minimal visual obstruction of the application

---

## 8. Future Changes

If additional cookies are introduced in the future (e.g. analytics, marketing), the banner must be updated to:

- Request explicit user consent
- Allow rejection of non-essential cookies
- Provide granular cookie controls

---

## 9. Contact

For questions regarding cookies:

**Matteo CATEZ**  
Email: matteo.catez@orange.fr

---

## End of Cookie Banner