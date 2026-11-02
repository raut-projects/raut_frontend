# Raut Admin Dashboard

Admin web application for **Raut**, a ride-hailing and public transport platform operating in Tanzania. The dashboard gives Raut administrators a single place to manage customers, drivers, rides, routes, payouts, transactions, driver documents and notifications.

This repository also contains the **driver onboarding flow** used by the Raut Flutter app through a WebView.

This repository contains the **frontend only**. A compatible Raut backend API is required for authentication and data.

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Application routes](#application-routes)
- [Driver onboarding](#driver-onboarding)
- [Authentication and authorization](#authentication-and-authorization)
- [API integration](#api-integration)
- [Backend endpoints](#backend-endpoints)
- [Data fetching and state](#data-fetching-and-state)
- [Project structure](#project-structure)
- [UI and styling](#ui-and-styling)
- [Build and deployment](#build-and-deployment)
- [Legal documents](#legal-documents)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)

## Overview

Raut's admin dashboard is a responsive web application built with React and Next.js (App Router). It is exported as static files, uses phone-based OTP authentication, token refresh, role-based route protection and TanStack Query for server state.

Administrators can review platform activity, inspect records in detail panels, filter and paginate lists, export analytics, and perform operational actions such as verifying drivers, suspending accounts, cancelling rides or routes, and approving payouts.

A separate onboarding route guides drivers through personal, licence, vehicle and payment details. It is designed to run inside the Raut Flutter app's WebView and is not linked from the admin dashboard.

## Features

| Area | Capabilities |
| --- | --- |
| Dashboard | Customer, driver, ride and revenue summaries; recent rides; top drivers; analytics charts; 7D/30D/90D/custom date ranges; previous-period comparison; CSV export; print/PDF export; automatic refresh every 60 seconds |
| Customers | Search, active/inactive filtering, pagination, customer details, role changes, deactivate and reactivate accounts, delete accounts (single and bulk) |
| Drivers | Search, status summary, driver details, document review, verify, reject, suspend and unsuspend drivers; approve or reject documents; delete drivers (single and bulk) |
| Rides | Filter by status, driver and date range; summary counts; ride details; cancel with reason and refund option |
| Routes | Filter by status, driver, origin, destination and date range; summary counts; route details; cancel route with an option to cancel active rides |
| Payouts | Filter by status, method, driver and date range; payout summary; details; approve, reject and retry payouts |
| Transactions | Filter by status, type and date range; transaction summary; paginated transaction table |
| Notifications | Unread count in the header, notification panel, mark one/all as read, dismiss notifications |
| Settings | Read-only profile and access details for the signed-in administrator |
| Live Rides | Placeholder page; tracking and live-trip data are not implemented yet |
| Promotions | Placeholder page; campaign management is not implemented yet |
| Support Tickets | Placeholder page; support workflows are not implemented yet |
| Settings subpages | Placeholder pages for Admin Users, Audit Logs, Platform Config and System Health |
| Driver onboarding | Four-step driver application flow with English/Swahili UI, validation, document uploads and Flutter WebView hand-off |
| User experience | Responsive sidebar and header, loading skeletons, retryable error states, refresh indicators, toast feedback and print-friendly analytics |

Dashboard comparison is only available when the previous period falls inside the 365-day analytics limit. CSV exports include the overview, rides, revenue, drivers and peak hours, plus comparison sections when comparison is enabled. Print/PDF export uses the browser print dialog.

## Tech stack

| Technology | Purpose |
| --- | --- |
| [React 19](https://react.dev/) | UI library |
| [TypeScript 6](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Next.js 16](https://nextjs.org/) | App Router, development server and static export |
| [TanStack Query 5](https://tanstack.com/query) | Server state, caching, polling and mutations |
| [Zustand 5](https://github.com/pmndrs/zustand) | Persisted driver onboarding state |
| [React Hook Form 7](https://react-hook-form.com/) | Onboarding forms |
| [Zod 4](https://zod.dev/) | Onboarding form validation |
| [Recharts 3](https://github.com/recharts/recharts) | Dashboard analytics charts |
| [Radix UI](https://radix-ui.com/primitives) and [shadcn/ui](https://ui.shadcn.com/) | Accessible UI primitives and component patterns |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling and design tokens |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | Animation utilities |
| [Lucide](https://lucide.dev/) | Icons |
| [ESLint 10](https://eslint.org/) | Linting |
| [Inter](https://fonts.google.com/specimen/Inter) | Primary typeface |

## Requirements

- Node.js `>=20.9.0` (required by Next.js 16)
- npm
- A running Raut backend API
- A valid access token when opening the driver onboarding route

## Getting started

1. Clone the repository:

   ```bash
   git clone https://github.com/raut-projects/raut_frontend.git
   cd raut_frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   # macOS / Linux
   cp .env.example .env

   # Windows PowerShell
   Copy-Item .env.example .env
   ```

4. Set the backend API URL in `.env`:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

   Use the backend origin without a trailing slash.

5. Optionally override the roles that grant dashboard access:

   ```env
   NEXT_PUBLIC_ADMIN_ROLES=admin,super_admin
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

   Next.js prints the local URL, typically `http://localhost:3000`.

7. To work on the driver onboarding flow, open:

   ```text
   http://localhost:3000/onboarding?token=<access-token>&lang=en
   ```

   Use `lang=sw` for Swahili. The token is stored in the browser for subsequent onboarding requests.

`.env` is ignored by Git. Never commit real credentials or secrets.

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | None | Base URL of the Raut backend API, for example `http://localhost:8000`. Trailing slashes are removed automatically. Inlined at build time, so rebuild after changing it. |
| `NEXT_PUBLIC_ADMIN_ROLES` | No | `admin,super_admin` | Comma-separated list of roles allowed through the admin gate. Values such as `administrator`, `superadmin`, `super-admin` and `owner` are normalized. Other known roles such as `platform_manager`, `operator`, `support`, `analyst`, `finance` and `marketing` are normalized but do not grant access unless added here. Inlined at build time. |

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server with hot module reloading |
| `npm run build` | Create a static export of the app in `out/` |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm run lint` | Run ESLint across the repository |
| `npm run start` | Serve the static export in `out/` locally |
| `npm run preview` | Serve the static export in `out/` locally for verification |

`npm run start` and `npm run preview` serve the existing `out/` directory. Run `npm run build` first.

## Application routes

| Route | Access | Description |
| --- | --- | --- |
| `/login` | Public | Phone number entry and OTP verification |
| `/request-admin` | Signed in, non-admin | Enter the admin secret to upgrade the account |
| `/onboarding` | Public / WebView | Driver onboarding flow; expects `token` and optional `lang` query parameters |
| `/` | Admin | Dashboard overview and analytics |
| `/customers` | Admin | Customer management |
| `/drivers` | Admin | Driver and document management |
| `/rides` | Admin | Ride management |
| `/routes` | Admin | Route management |
| `/payouts` | Admin | Payout review and processing |
| `/transactions` | Admin | Transaction history |
| `/live-rides` | Admin | Live rides placeholder (Coming soon) |
| `/promotions` | Admin | Promotions placeholder (Coming soon) |
| `/support-tickets` | Admin | Support tickets placeholder (Coming soon) |
| `/settings` | Admin | Signed-in account profile and access details |
| `/settings/admin-users` | Admin | Admin users placeholder (Coming soon) |
| `/settings/audit-logs` | Admin | Audit logs placeholder (Coming soon) |
| `/settings/platform` | Admin | Platform configuration placeholder (Coming soon) |
| `/settings/system-health` | Admin | System health placeholder (Coming soon) |
| `*` | Public | Render the exported `404.html` page, which redirects to `/` |

`RequireAuth` protects the admin-access request page. `RequireAdmin` protects the dashboard route group and revalidates the signed-in user's role against `GET /auth/me` before opening admin pages.

## Driver onboarding

The onboarding route is a standalone, mobile-first flow built for the Raut Flutter app's WebView. It is not part of the admin sidebar and does not require an admin role.

### Entry parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `token` | Yes | Access token passed by the Flutter app. It is stored through the token store for API calls. |
| `lang` | No | `en` (default) or `sw`. Controls the onboarding UI language. |

Progress is persisted in `localStorage` under `driver-onboarding-storage`, so a driver can leave and resume the flow. Completed steps are tracked in the same store.

### Steps

1. **Personal information** — first name, last name, email, preferred language and terms acceptance. The values are kept in the onboarding store; no backend request is made at this step.
2. **Driver information** — national ID, licence number, profile photo and licence photo. Photos are uploaded to `POST /drivers/documents`, then the personal and driver details are saved with `PUT /users/me`.
3. **Vehicle information** — vehicle type (Bodaboda, car or Bajaji), plate number, manufacturer, model, year, colour, seats, ownership type, owner details and vehicle documents. Manufacturer and model options come from `public/data/vehicle.json`. Files are uploaded to `POST /drivers/documents`, and the vehicle is created with `POST /drivers/vehicles`.
4. **Payment details** — account name, address, mobile-money number and mobile network, saved with `PUT /drivers/payment-details`.

After the payment step succeeds, the page calls the Flutter bridge:

```ts
window.FlutterOnboarding?.onComplete({
  success: true,
  message: 'Onboarding completed successfully',
});
```

If the page is opened outside the WebView, it falls back to a browser alert. Cancelling calls `window.FlutterOnboarding.onCancel()` when available; in a standalone browser it asks for confirmation and returns to `/`.

### Validation and uploads

- Forms use React Hook Form with Zod schemas in `src/schemas/onboardingSchemas.ts`.
- Driver photos must be images up to 5 MB.
- Vehicle photos and documents accept images or PDF up to 5 MB.
- Supported document types include `profile_photo`, `license`, `vehicle_photo`, `registration`, `insurance` and `sticker_photo`.
- Errors from form validation and uploads are shown inline. Step-level API failures currently fall back to browser alerts.

### Legacy onboarding helper

`src/services/onboarding.ts` contains an older `submitOnboarding` helper that references `POST /drivers/register` and `POST /drivers/onboarding/complete`. The current step-based UI does not call that helper, so those two endpoints are not required by the active onboarding flow.

## Authentication and authorization

1. The administrator enters a phone number on `/login`.
2. The app sends a six-digit OTP through `POST /auth/otp/send`.
3. `POST /auth/otp/verify` returns the session, access token and optional refresh token.
4. The session and tokens are persisted in `localStorage` and exposed through a small external store.
5. `RequireAdmin` revalidates the role every five minutes (`ROLE_REVALIDATE_MS`). A missing or stale role is checked against `GET /auth/me`.
6. Non-admin accounts are redirected to `/request-admin`, where the admin secret is submitted to `POST /admin/promote`.
7. If the promoted access token still does not grant an admin role, the user is asked to sign in again.
8. Authenticated requests that return `401` attempt a token refresh through `POST /auth/refresh`. If refresh fails, the session is cleared and the user returns to `/login`.

If role revalidation fails because the server cannot be reached, the app keeps the last trusted role instead of signing the administrator out. A `401` still clears the session.

The default admin roles are `admin` and `super_admin`. Override them with `NEXT_PUBLIC_ADMIN_ROLES`. Role aliases are normalized in `src/lib/roles.ts`:

- `administrator` becomes `admin`.
- `superadmin`, `super-admin` and `owner` become `super_admin`.
- `platform_manager`, `operator`, `support`, `analyst`, `finance` and `marketing` remain as their own roles.

The dashboard currently has a single admin gate: every configured admin role can open every admin page. Fine-grained permissions must be enforced by the backend.

Tokens are stored in browser `localStorage`. This keeps the static app usable across reloads, but it does not replace server-side authorization. The backend must enforce permissions for every admin endpoint.

The onboarding flow writes its access token into the same token store used by API helpers, but it does not create an admin session.

## API integration

The backend base URL and endpoint paths live in `src/lib/config.ts`.

```ts
export const API_ROUTES = {
  otpSend: '/auth/otp/send',
  otpVerify: '/auth/otp/verify',
  refresh: '/auth/refresh',
  me: '/auth/me',
  notifications: '/notifications/',
  promote: '/admin/promote',
  users: '/admin/users',
  drivers: '/admin/drivers',
  rides: '/admin/rides',
  routes: '/admin/routes',
  documents: '/admin/documents',
  transactions: '/admin/transactions',
  payouts: '/admin/payouts',
  analyticsOverview: '/admin/analytics/overview',
  analyticsRevenue: '/admin/analytics/revenue',
  analyticsDrivers: '/admin/analytics/drivers',
  analyticsRides: '/admin/analytics/rides',
  analyticsPeakHours: '/admin/analytics/peak-hours',
}
```

Onboarding endpoints are currently called directly from `src/services/uploads.ts` and the onboarding step components rather than being added to `API_ROUTES`.

Admin requests go through `src/services/http.ts` and the `apiGet`, `apiPost`, `apiPut` and `apiDelete` helpers in `src/services/api.ts`.

### Request behavior

- JSON bodies by default; the admin promotion request uses form encoding.
- Bearer token attached to authenticated requests.
- Automatic token refresh before an expired token is used and after a `401`.
- 15-second request timeout using `AbortController`.
- Error messages are extracted from common response shapes (`message`, `error.message`, `detail`, validation details).
- Responses wrapped in `{ data: ... }` are unwrapped automatically.
- Responses with `success: false` are treated as errors.
- List endpoints accept `page` and `page_size`, along with filters and `sort_by`/`sort_order` where supported.
- If `NEXT_PUBLIC_API_BASE_URL` is empty, requests fail with a connection-style error.
- Onboarding uploads use a direct `fetch` with `FormData` because multipart requests bypass the JSON HTTP helper.

### Response mapping

Raw API records are normalized in `src/services/mappers.ts`. Mappers provide consistent labels, currency and date formatting, status booleans and fallback values so pages do not depend directly on backend field names.

## Backend endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/otp/send` | Send an OTP to a phone number |
| `POST` | `/auth/otp/verify` | Verify an OTP and create a session |
| `POST` | `/auth/refresh` | Refresh an access token |
| `GET` | `/auth/me` | Fetch the signed-in user and role |
| `POST` | `/admin/promote` | Promote a signed-in account to admin using a secret |
| `GET` | `/notifications/` | List notifications |
| `POST` | `/notifications/{id}/read` | Mark a notification as read |
| `GET` | `/admin/users` | List users/customers |
| `PUT` | `/admin/users/{id}/role` | Change a user's role |
| `PUT` | `/admin/users/{id}/deactivate` | Deactivate a user |
| `PUT` | `/admin/users/{id}/reactivate` | Reactivate a user |
| `DELETE` | `/admin/users/{id}` | Delete a user/account (customers and drivers) |
| `GET` | `/admin/drivers` | List drivers |
| `PUT` | `/admin/drivers/{id}/verify` | Verify a driver |
| `PUT` | `/admin/drivers/{id}/reject` | Reject a driver application |
| `PUT` | `/admin/drivers/{id}/suspend` | Suspend a driver |
| `PUT` | `/admin/drivers/{id}/unsuspend` | Reinstate a driver |
| `GET` | `/admin/rides` | List rides |
| `PUT` | `/admin/rides/{id}/cancel` | Cancel a ride |
| `GET` | `/admin/routes` | List routes |
| `PUT` | `/admin/routes/{id}/cancel` | Cancel a route |
| `GET` | `/admin/documents` | List driver documents |
| `PUT` | `/admin/documents/{id}/approve` | Approve a driver document |
| `PUT` | `/admin/documents/{id}/reject` | Reject a driver document |
| `GET` | `/admin/transactions` | List transactions |
| `GET` | `/admin/payouts` | List payouts |
| `PUT` | `/admin/payouts/{id}/approve` | Approve a payout |
| `PUT` | `/admin/payouts/{id}/reject` | Reject a payout |
| `PUT` | `/admin/payouts/{id}/retry` | Retry a payout |
| `GET` | `/admin/analytics/overview` | Aggregate dashboard metrics |
| `GET` | `/admin/analytics/revenue` | Revenue analytics |
| `GET` | `/admin/analytics/drivers` | Driver performance analytics |
| `GET` | `/admin/analytics/rides` | Ride analytics |
| `GET` | `/admin/analytics/peak-hours` | Peak-hour analytics used by the dashboard charts |
| `POST` | `/drivers/documents` | Upload an onboarding document (`multipart/form-data`) |
| `PUT` | `/users/me` | Save personal and driver details during onboarding |
| `POST` | `/drivers/vehicles` | Create a vehicle during onboarding |
| `PUT` | `/drivers/payment-details` | Save mobile-money payout details during onboarding |

Analytics endpoints receive a `period` of `day`, `week` or `month`, plus `days_back` where applicable. Dashboard custom ranges are capped at 365 days.

The unused legacy onboarding helper also references `POST /drivers/register` and `POST /drivers/onboarding/complete`. They are not part of the active UI flow.

## Data fetching and state

TanStack Query is configured in `src/lib/queryClient.ts`:

- Queries are considered stale after 30 seconds.
- Inactive query data is garbage-collected after 5 minutes.
- Failed queries retry once; mutations do not retry.
- Queries refetch when the window regains focus or the network reconnects.

Polling is configured per hook:

- Dashboard, customer lists and notifications refetch every 60 seconds.
- Driver, ride, route, payout and transaction lists refetch every 30 seconds.
- Ride, route and transaction summary queries refetch every 60 seconds.
- Driver documents load on demand when a driver detail panel opens.
- List queries use `keepPreviousData` so pagination and filter changes do not flash an empty table.

Query keys are centralized in `src/lib/queryKeys.ts`.

The typical data flow is:

```text
Page -> Hook -> Service -> API helper -> HTTP client -> Backend
                  |
                  +-> Mapper -> Normalized UI data
```

- `src/app/*` defines the App Router routes and contains the active page screens.
- `src/components/*` contains the shared shell, panels, dialogs, charts and shadcn-style UI components.
- `src/hooks/*` wrap TanStack Query and admin mutations.
- `src/services/*` contain endpoint functions, request behavior and mappers.
- `src/lib/*` contains configuration, roles, query keys, date ranges, exports and the query client.
- `src/store/onboardingStore.ts` holds the persisted onboarding state.
- `src/schemas/onboardingSchemas.ts` holds the onboarding validation schemas.

List services normalize pagination into `{ items, total, page, limit }`. Some summary cards fetch a larger overview page and calculate counts client-side. The dashboard uses `Promise.allSettled` so a failing analytics endpoint does not hide the rest of the page.

## Project structure

```text
raut_frontend/
├─ public/
│  ├─ assets/images/       Vehicle and mobile-network images
│  ├─ data/vehicle.json    Manufacturer and model catalogue for onboarding
│  ├─ favicon.svg
│  ├─ icons.svg
│  ├─ logo.jpg
│  └─ logo.png
├─ src/
│  ├─ app/                 App Router routes, layouts, providers and global CSS
│  │  ├─ (dashboard)/      Admin-only route group and shared shell
│  │  ├─ login/            OTP sign-in route
│  │  ├─ onboarding/       Driver onboarding route
│  │  ├─ request-admin/    Admin promotion route
│  │  ├─ globals.css       Tailwind import, theme tokens and shared component classes
│  │  ├─ layout.tsx        Root layout, metadata and Inter font
│  │  ├─ not-found.tsx     Static-export 404 page that redirects to the dashboard
│  │  └─ providers.tsx     TanStack Query and toast providers
│  ├─ components/          Shared layout, navigation, panels, dialogs, toasts, charts and UI primitives
│  │  ├─ analytics/        Dashboard metric cards and Recharts visualizations
│  │  └─ ui/               shadcn-style components (sidebar, table, badge, sheet, tooltip and others)
│  ├─ hooks/               TanStack Query hooks and session helpers
│  ├─ lib/                 API config, env, roles, query client, query keys, date ranges and exports
│  ├─ onboarding/          The four onboarding step components
│  ├─ schemas/             Zod validation schemas
│  ├─ services/            API services, HTTP client, token store, uploads and mappers
│  ├─ store/               Zustand onboarding store
│  ├─ styles/              Legacy Flutter theme constants
│  ├─ types/               Shared TypeScript type definitions
│  └─ views/               Legacy route screens, not used by the App Router
├─ .env.example            Documented environment variables
├─ eslint.config.js        ESLint flat configuration
├─ next.config.ts          Next.js static export configuration
├─ package.json            Dependencies and scripts
├─ postcss.config.mjs      Tailwind CSS PostCSS plugin
├─ README.md
└─ tsconfig.json           TypeScript configuration
```

### Repository notes

- `src/views/requestAdmin.tsx` is a legacy duplicate of `src/app/request-admin/page.tsx`; the App Router page is the active one.
- `vite.config.ts` and the empty `src/pages/` directory are leftovers. The app builds with Next.js, not Vite.

### Key modules

| Path | Responsibility |
| --- | --- |
| `src/services/http.ts` | Authenticated fetch wrapper, token refresh, timeout and error handling |
| `src/services/api.ts` | `apiGet`, `apiPost`, `apiPut`, `apiDelete` and query-string building |
| `src/services/auth.ts` | OTP sign-in, session creation, role resolution and admin promotion |
| `src/services/adminActions.ts` | Verify/reject/suspend drivers, cancel rides/routes and manage users |
| `src/services/dashboard.ts` | Analytics aggregation, comparison windows and dashboard mapping |
| `src/services/tokenStore.ts` | localStorage session/token persistence and subscriptions |
| `src/services/mappers.ts` | API response normalization and display formatting |
| `src/services/uploads.ts` | Multipart document uploads for onboarding |
| `src/services/onboarding.ts` | Legacy complete-flow onboarding helper, not used by the current UI |
| `src/lib/config.ts` | Base URL, API routes, OTP and role revalidation constants |
| `src/lib/roles.ts` | Role normalization, aliases and admin-role checks |
| `src/lib/queryClient.ts` | TanStack Query client configuration |
| `src/lib/queryKeys.ts` | Centralized query key factory |
| `src/lib/dateRange.ts` | Analytics presets, custom ranges, limits and comparison windows |
| `src/lib/analyticsExport.ts` | Analytics CSV generation and download |
| `src/lib/i18n.ts` | English and Swahili onboarding translations and URL language parsing |
| `src/components/RequireAdmin.tsx` | Server-confirmed admin route gate |
| `src/components/RequireAuth.tsx` | Signed-in route gate |
| `src/components/Layout.tsx` | Sidebar, header and page content shell |
| `src/components/app-sidebar.tsx` | Grouped navigation, settings submenu and sign-out |
| `src/components/Header.tsx` | Page title, notification panel and account summary |
| `src/components/ComingSoon.tsx` | Shared placeholder for unreleased dashboard pages |
| `src/components/queryStates.tsx` | Table skeletons, error states and refresh indicator |
| `src/components/analytics/` | Dashboard metric cards and Recharts visualizations |
| `src/components/ui/` | shadcn-style UI primitives built on Radix UI |
| `src/onboarding/` | Personal, driver, vehicle and payment step components |
| `src/store/onboardingStore.ts` | Persisted onboarding progress, token and language |
| `src/schemas/onboardingSchemas.ts` | Zod validation rules for each onboarding step |

## UI and styling

Tailwind CSS 4 is configured through `src/app/globals.css` using the CSS-first `@theme` API and the `@tailwindcss/postcss` plugin.

- Brand palette: greyscale (`brand-50` through `brand-500`) with black accents (`brand-600` through `brand-900`).
- Shared card shadow: `shadow-card`.
- Primary font: Inter, loaded through `next/font`.
- Reusable classes: `nav-link`, `nav-link-active`, `stat-card`, `table-th`, `table-td` and `badge`.
- UI primitives live in `src/components/ui` and follow the shadcn configuration in `components.json` (style `radix-nova`).
- Animation utilities come from `tw-animate-css`.

The interface is responsive. The sidebar is fixed on desktop and becomes an overlay on smaller screens. Tables scroll horizontally on narrow viewports. Dashboard analytics are print-friendly, with navigation and controls hidden when printing.

Accessibility conventions include labeled controls, `aria-label` attributes for icon buttons, live-region loading and toast feedback, focus-visible outlines and semantic table markup.

## Build and deployment

Before deploying, run:

```bash
npm run lint
npm run typecheck
npm run build
```

The static export is written to `out/`.

Deploy the contents of `out/` to any static host. Next.js emits one directory per route (`customers/index.html`, `transactions/index.html`, and so on) because `trailingSlash` is enabled, so routes such as `/customers` work on reload without an SPA fallback. Images are unoptimized because the site is statically exported. Unknown paths render the exported `404.html`, which redirects to `/`.

To verify the export locally after building:

```bash
npm run start
```

Environment variables prefixed with `NEXT_PUBLIC_` are inlined at build time. Rebuild the app after changing the backend URL or admin roles.

## Legal documents

- [Community Guidelines](./COMMUNITY_GUIDELINES.md)
- [Privacy Policy](./PRIVACY_POLICY.md)
- [Terms of Service](./TERMS_OF_SERVICE.md)

## Known limitations

- Live Rides, Promotions, Support Tickets, Admin Users, Audit Logs, Platform Config and System Health are placeholder pages.
- There is currently no automated test suite or CI configuration.
- There is no role-level UI beyond the admin gate; every configured admin role sees every admin page.
- The dashboard builds some summary cards from the analytics overview response and falls back to list totals when fields or endpoints are unavailable.
- Driver, document and payout summaries fetch up to 100 records and calculate some totals client-side.
- Dashboard cards render zero or empty states when an analytics endpoint fails, so partial data is expected during backend incidents.
- The app is a static export: there is no Next.js server runtime, server-side rendering or built-in API layer. All admin data comes from the external Raut backend.
- The onboarding flow is designed for a Flutter WebView. Outside the WebView it falls back to browser alerts and redirects, and it is not linked from the admin navigation.
- Onboarding validation and upload errors are shown inline, but step-level API failures use browser alerts.
- The header search input is presentational and does not filter or search data yet.
- No license file is present in this repository.

## Contributing

1. Create a feature branch from the appropriate base branch.
2. Keep API endpoint changes in `src/lib/config.ts` and domain logic in `src/services`.
3. Normalize new response shapes in `src/services/mappers.ts`.
4. Add or update query keys in `src/lib/queryKeys.ts`.
5. When changing onboarding, keep the step components, Zod schemas, onboarding store and translations in sync.
6. Run `npm run lint`, `npm run typecheck` and `npm run build` before opening a pull request.
7. Do not commit `.env`, tokens or other secrets.
