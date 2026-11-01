# Raut Admin Dashboard

Admin web application for **Raut**, a ride-hailing and public transport platform operating in Tanzania. The dashboard gives Raut administrators a single place to manage customers, drivers, rides, routes, payouts, transactions, driver documents and notifications.

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

Administrators can review platform activity, inspect records in detail panels, filter and paginate lists, and perform operational actions such as verifying drivers, suspending accounts, cancelling rides or routes, and approving payouts.

## Features

| Area | Capabilities |
| --- | --- |
| Dashboard | Customer, driver, ride and revenue summaries; recent rides; top drivers; manual refresh |
| Customers | Search, active/inactive filtering, pagination, customer details, role changes, deactivate and reactivate accounts |
| Drivers | Search, status summary, driver details, document review, verify, reject, suspend and unsuspend drivers; approve or reject documents; delete drivers (single and bulk) |
| Rides | Filter by status, driver and date range; summary counts; ride details; cancel with reason and refund option |
| Routes | Filter by status, driver, origin, destination and date range; summary counts; route details; cancel route |
| Payouts | Filter by status, method, driver and date range; payout summary; details; approve, reject and retry payouts |
| Transactions | Filter by status, type and date range; transaction summary; paginated transaction table |
| Notifications | Unread count, notification panel, mark one/all as read, dismiss notifications |
| Settings | Read-only profile and access details for the signed-in administrator |
| User experience | Responsive sidebar and header, loading skeletons, retryable error states, refresh indicators and toast feedback |

## Tech stack

| Technology | Purpose |
| --- | --- |
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Next.js 16](https://nextjs.org/) | App Router, development server and static export |
| [TanStack Query 5](https://tanstack.com/query) | Server state, caching and mutations |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling and design tokens |
| [ESLint 10](https://eslint.org/) | Linting |
| [Inter](https://fonts.google.com/specimen/Inter) | Primary typeface |

## Requirements

- Node.js `>=20.9.0` (required by Next.js 16)
- npm
- A running Raut backend API

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

5. Start the development server:

   ```bash
   npm run dev
   ```

   Next.js prints the local URL, typically `http://localhost:3000`.

`.env` is ignored by Git. Never commit real credentials or secrets.

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | None | Base URL of the Raut backend API, for example `http://localhost:8000`. Trailing slashes are removed automatically. Inlined at build time, so rebuild after changing it. |
| `NEXT_PUBLIC_ADMIN_ROLES` | No | `admin,super_admin` | Comma-separated list of roles allowed through the admin gate. Role aliases such as `administrator`, `superadmin` and `owner` are normalized. Inlined at build time. |

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server with hot module reloading |
| `npm run build` | Create a static export of the app in `out/` |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm run lint` | Run ESLint across the repository |
| `npm run start` | Serve the static export in `out/` locally |
| `npm run preview` | Serve the static export in `out/` locally for verification |

## Application routes

| Route | Access | Description |
| --- | --- | --- |
| `/login` | Public | Phone number entry and OTP verification |
| `/request-admin` | Signed in, non-admin | Enter the admin secret to upgrade the account |
| `/` | Admin | Dashboard overview |
| `/customers` | Admin | Customer management |
| `/drivers` | Admin | Driver and document management |
| `/rides` | Admin | Ride management |
| `/routes` | Admin | Route management |
| `/payouts` | Admin | Payout review and processing |
| `/transactions` | Admin | Transaction history |
| `/settings` | Admin | Signed-in account profile and access details |
| `*` | Public | Render the exported `404.html` page |

`RequireAuth` protects authenticated pages. `RequireAdmin` revalidates the signed-in user's role against `GET /auth/me` before opening admin routes.

## Authentication and authorization

1. The administrator enters a phone number on `/login`.
2. The app sends a six-digit OTP through `POST /auth/otp/send`.
3. `POST /auth/otp/verify` returns the session, access token and optional refresh token.
4. The session and tokens are persisted in `localStorage` and exposed through a small external store.
5. `RequireAdmin` revalidates the role every five minutes (`ROLE_REVALIDATE_MS`). A missing or stale role is checked against `GET /auth/me`.
6. Non-admin accounts are redirected to `/request-admin`, where the admin secret is submitted to `POST /admin/promote`.
7. If the promoted access token still does not grant an admin role, the user is asked to sign in again.
8. Authenticated requests that return `401` attempt a token refresh through `POST /auth/refresh`. If refresh fails, the session is cleared and the user returns to `/login`.

The default admin roles are `admin` and `super_admin`. Override them with `NEXT_PUBLIC_ADMIN_ROLES`.

Tokens are stored in browser `localStorage`. This keeps the static app usable across reloads, but it does not replace server-side authorization. The backend must enforce permissions for every admin endpoint.

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

Requests go through `src/services/http.ts` and the `apiGet`, `apiPost`, `apiPut` and `apiDelete` helpers in `src/services/api.ts`.

### Request behavior

- JSON bodies by default; the admin promotion request uses form encoding.
- Bearer token attached to authenticated requests.
- Automatic token refresh before an expired token is used and after a `401`.
- 15-second request timeout using `AbortController`.
- Error messages are extracted from common response shapes (`message`, `error.message`, `detail`, validation details).
- Responses wrapped in `{ data: ... }` are unwrapped automatically.
- List endpoints accept `page` and `page_size`, along with `sort_by` and `sort_order` where supported.

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
| `GET` | `/admin/analytics/revenue` | Daily revenue analytics |
| `GET` | `/admin/analytics/drivers` | Driver performance analytics |
| `GET` | `/admin/analytics/rides` | Daily ride analytics |
| `GET` | `/admin/analytics/peak-hours` | Peak-hour analytics used by the dashboard charts |

## Data fetching and state

TanStack Query is configured in `src/lib/queryClient.ts`:

- Queries are considered stale after 30 seconds.
- Inactive query data is garbage-collected after 5 minutes.
- Failed queries retry once; mutations do not retry.
- Queries refetch when the window regains focus or the network reconnects.

Query keys are centralized in `src/lib/queryKeys.ts`.

The typical data flow is:

```text
Page -> Hook -> Service -> API helper -> HTTP client -> Backend
                  |
                  +-> Mapper -> Normalized UI data
```

- `src/app/*` defines the App Router routes, layouts, guards and providers.
- `src/views/*` render screens and handle local UI state.
- `src/hooks/*` wrap TanStack Query and admin mutations.
- `src/services/*` contain endpoint functions, request behavior and mappers.
- `src/lib/*` contains configuration, roles, query keys and the query client.

List services normalize pagination into `{ items, total, page, limit }`. Some summary cards fetch a larger overview page and calculate counts client-side.

## Project structure

```text
raut_frontend/
├─ public/
│  ├─ favicon.svg
│  └─ icons.svg
├─ src/
│  ├─ app/                 App Router routes, layouts, providers and global CSS
│  │  ├─ (dashboard)/      Admin-only route group and shared shell
│  │  ├─ login/            OTP sign-in route
│  │  ├─ request-admin/    Admin promotion route
│  │  ├─ globals.css       Tailwind import, theme tokens and shared component classes
│  │  ├─ layout.tsx        Root layout, metadata and Inter font
│  │  └─ providers.tsx     TanStack Query and toast providers
│  ├─ components/          Shared layout, navigation, panels, dialogs, toasts, query states, checkbox and analytics charts
│  ├─ hooks/               TanStack Query hooks and session helpers
│  ├─ lib/                 API config, env, roles, query client, query keys
│  ├─ services/            API services, HTTP client, token store and mappers
│  ├─ types/               Shared TypeScript type definitions
│  └─ views/               Route-level screens
├─ .env.example            Documented environment variables
├─ eslint.config.js        ESLint flat configuration
├─ next.config.ts          Next.js static export configuration
├─ package.json            Dependencies and scripts
├─ postcss.config.mjs      Tailwind CSS PostCSS plugin
├─ README.md
└─ tsconfig.json           TypeScript configuration
```

### Key modules

| Path | Responsibility |
| --- | --- |
| `src/services/http.ts` | Authenticated fetch wrapper, token refresh, timeout and error handling |
| `src/services/tokenStore.ts` | localStorage session/token persistence and subscriptions |
| `src/services/mappers.ts` | API response normalization and display formatting |
| `src/lib/config.ts` | Base URL, API routes, OTP and role revalidation constants |
| `src/lib/roles.ts` | Role normalization, aliases and admin-role checks |
| `src/lib/queryClient.ts` | TanStack Query client configuration |
| `src/lib/queryKeys.ts` | Centralized query key factory |
| `src/components/RequireAdmin.tsx` | Server-confirmed admin route gate |
| `src/components/RequireAuth.tsx` | Signed-in route gate |
| `src/components/Layout.tsx` | Sidebar, header and page content shell |
| `src/lib/env.ts` | Reads `NEXT_PUBLIC_*` configuration at build time |
| `src/components/SidePanel.tsx` | Shared slide-over panel |
| `src/components/Checkbox.tsx` | Custom reusable checkbox component |
| `src/components/reasonDialog.tsx` | Reason, role and confirmation dialogs |
| `src/components/queryStates.tsx` | Table skeletons, error states and refresh indicator |
| `src/components/GateLoader.tsx` | Full-page loading state while a route guard resolves the session |
| `src/components/ActionIcon.tsx` | Shared icon button used by table row actions |
| `src/components/analytics/` | Dashboard metric cards and Recharts visualizations |
| `src/components/toastProvider.tsx` | Success, error and info notifications |
| `src/types/` | Shared TypeScript type definitions |

## UI and styling

Tailwind CSS 4 is configured through `src/app/globals.css` using the CSS-first `@theme` API and the `@tailwindcss/postcss` plugin.

- Brand palette: greyscale (`brand-50` through `brand-500`) with black accents (`brand-600` through `brand-900`).
- Shared card shadow: `shadow-card`.
- Primary font: Inter, loaded through `next/font`.
- Reusable classes: `nav-link`, `nav-link-active`, `stat-card`, `table-th`, `table-td` and `badge`.

The interface is responsive. The sidebar is fixed on desktop and becomes an overlay on smaller screens. Tables scroll horizontally on narrow viewports.

Accessibility conventions include labeled controls, `aria-label` attributes for icon buttons, live-region loading and toast feedback, focus-visible outlines and semantic table markup.

## Build and deployment

Before deploying, run:

```bash
npm run lint
npm run build
```

The static export is written to `out/`.

Deploy the contents of `out/` to any static host. Next.js emits one directory per route (`customers/index.html`, `transactions/index.html`, and so on) because `trailingSlash` is enabled, so routes such as `/customers` work on reload without an SPA fallback. Unknown paths render the exported `404.html`.

## Legal documents

- [Community Guidelines](./COMMUNITY_GUIDELINES.md)
- [Privacy Policy](./PRIVACY_POLICY.md)
- [Terms of Service](./TERMS_OF_SERVICE.md)

## Known limitations

- There is currently no automated test suite or CI configuration.
- The dashboard builds its summary cards from the analytics overview response and falls back to list totals when fields or endpoints are unavailable.
- Driver, document and payout summaries fetch up to 100 records and calculate some totals client-side.
- Dashboard cards render zero or empty states when an analytics endpoint fails, so partial data is expected during backend incidents.
- The app is a static export: there is no Next.js server runtime, server-side rendering or built-in API layer. All data comes from the external Raut backend.
- No license file is present in this repository.

## Contributing

1. Create a feature branch from the appropriate base branch.
2. Keep API endpoint changes in `src/lib/config.ts` and domain logic in `src/services`.
3. Normalize new response shapes in `src/services/mappers.ts`.
4. Add or update query keys in `src/lib/queryKeys.ts`.
5. Run `npm run lint` and `npm run build` before opening a pull request.
6. Do not commit `.env`, tokens or other secrets.
