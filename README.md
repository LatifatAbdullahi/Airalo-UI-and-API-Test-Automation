# Airalo Test Automation

Automated tests for Airalo: **UI** (eSIM package selection on the website) and **API** (Partner API: token, submit order, get eSIM details). Built with **Playwright** and **TypeScript**.

---

## Prerequisites

- **Node.js** (LTS, e.g. 18+)
- **npm**

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Install Playwright browsers (first time only)

```bash
npx playwright install
```

### 3. Environment variables for API tests

API tests need credentials and an email. Create a `.env` file in the project root:

```env
CLIENT_ID=your_partner_client_id
CLIENT_SECRET=your_partner_client_secret
ORDER_TO_EMAIL=your-email@example.com
```

Without a valid `.env`, API tests will fail with a clear error.



## Running the tests

| Command | What it runs |
|--------|----------------|
| `npm test` | All tests (UI + API) |
| `npm run test:ui-only` | Only UI tests (`@ui`) |
| `npm run test:ui-only:headed` | UI tests with browser visible |
| `npm run test:api-only` | All API tests (`@api`) |
| `npm run test:api-token` | Only API token test (`@api-token`) |
| `npm run test:api-order` | Only API order + eSIM test (`@api-order`) |
| `npm run test:ui` | Playwright UI mode (pick and run tests) |
| `npm run report` | Open the last HTML report |

For clarity:

```bash
# Run everything
npm test

# Run only UI tests
npm run test:ui-only

# Run only API tests (requires .env)
npm run test:api-only

# Run only the “submit order” API test
npm run test:api-order
```

---

## Overview of the test cases and approach

### UI tests (`tests/ui/`, tag: `@ui`)

**Scope:** One flow: select a Japan eSIM package on the Airalo website and check that the package price matches the total price.

**Approach:**

- **Page Object Model:** All interaction and locators live in `pages/home-page.ts`. The spec in `tests/ui/home-page.spec.ts` only calls page methods and performs assertions (no selectors or implementation details in the spec).
- **Flow:** Navigate → assert home page (logo visible) → type "Japan" in search → select Japan from results → assert location heading visible and contains "Japan" → click Unlimited tab → scroll to "7 days" → select 7-day package → get package price and total price from the page → assert they are equal.
- **Assertions:** Done in the spec only: logo visible, location heading visible and text "Japan", and `packagePrice === totalPrice`. Compared prices are also logged with `console.log`.
- **Locators:** Prefer semantic locators (`getByRole`, `getByTestId`, `getByText`, `getByLabel`, `getByAltText`). Total price is resolved with `getByText(/£[\d.]+/).last()` so it stays stable if the DOM structure changes.
- **Config:** UI tests use `baseURL: https://www.airalo.com/` from `playwright.config.ts` and run in the Chromium project.

---

### API tests (`tests/api/`, tag: `@api`)

**Scope:** Partner API: obtain OAuth2 token, submit an order for 6 eSIMs, then retrieve and validate details for each eSIM.

**Approach:**

- **Client layer:** `api/partner-api.client.ts` holds all HTTP calls and response typing. It exposes:
  - `getToken(request)` – POST `/token` (form body), returns `{ accessToken, statusCode, response }`.
  - `submitOrder(request, accessToken, options)` – POST `/orders` (multipart), returns `{ order, statusCode, response }`.
  - `getSim(request, accessToken, iccid)` – GET `/sims/{iccid}`, returns `{ sim, statusCode, response }`.
  - `getSimIccidsFromOrder(order)` – parses the order response and returns the list of ICCIDs.
- **Config:** `api/config.ts` reads from `.env` (base URL, client id/secret, order email). Test data (quantity, package id) is in `testOrder` there.
- **Two groups of tests** (so they can be run separately):
  - **Token (`@api-token`):** In a `beforeAll`, obtain the token. The test asserts status 200, that `accessToken` matches `response.data.access_token`, and that `expires_in` is a number.
  - **Order and eSIM (`@api-order`):** In a `beforeAll`, obtain the token. The test submits an order with the configured quantity and package, then:
    - Asserts response status 200 and that the order payload has the expected `package_id`, quantity, and a `sims` array of length 6.
    - Asserts each sim in the order has a non-empty `iccid`.
    - Gets ICCIDs via `getSimIccidsFromOrder(order)`, then for each ICCID calls `getSim(...)` and asserts status 200, response shape, and that the returned eSIM has the correct `iccid` and expected field types (e.g. `id`, `created_at`, `matching_id`, `qrcode`, `qrcode_url` when present).
- **Assertions:** All assertions are in the spec. The client does not assert; it only performs requests and returns typed results (and throws on HTTP errors). I validated status codes, response structure, and that order and eSIM details match expectations.

---

## Project structure

```
├── api/
│   ├── config.ts              # API config from env + testOrder
│   └── partner-api.client.ts  # getToken, submitOrder, getSim, getSimIccidsFromOrder
├── elements/
│   └── locators.json         # UI selectors (homepage)
├── pages/
│   └── home-page.ts           # UI page object (HomePage)
├── tests/
│   ├── api/
│   │   └── partner-api.spec.ts  # @api token + order/eSIM tests
│   └── ui/
│       └── home-page.spec.ts    # @ui Japan eSIM flow
├── playwright.config.ts       # Test config, projects (chromium, api)
├── package.json
└── README.md
```

---

## CI

The repo includes a GitHub Actions workflow (`.github/workflows/playwright.yml`) that runs on push/PR to `main`: installs dependencies and browsers, runs `npx playwright test`, and uploads the HTML report and (on failure) test results as artifacts.
