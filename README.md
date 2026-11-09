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

Raut's admin dashboard is a responsive web application built with React and Next.js (App Router). It runs on the Next.js production server, uses email and password authentication, token refresh, role-based route protection and TanStack Query for server state.

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
| Marketing | API-backed promotions list with status tabs (active, scheduled, expired and drafts), search, pagination and delete; create/edit campaigns with discount, eligibility, schedule, usage limits, budget cap and DUO/peak-hour rules; referral programs and activity; read-only referral-code directory with user details, stats and pagination |
| Support Tickets | API-backed ticket list, creation, search and filters, agent assignment, replies and internal notes, status/priority updates, escalation and CSV export |
| Admin Users | API-backed admin list with Active/Invited/Deactivated tabs, search and pagination, invite and edit side panels, deactivate/reactivate, and a printable/exportable role permission matrix |
| Settings subpages | Placeholder pages for Audit Logs, Platform Config and System Health |
| Driver onboarding | Four-step driver application flow with English/Swahili UI, validation, document uploads and Flutter WebView hand-off |
| User experience | Responsive sidebar and header, loading skeletons, retryable error states, refresh indicators, toast feedback and print-friendly analytics |

Dashboard comparison is only available when the previous period falls inside the 365-day analytics limit. CSV exports include the overview, rides, revenue, drivers and peak hours, plus comparison sections when comparison is enabled. Print/PDF export uses the browser print dialog.

## Tech stack

| Technology | Purpose |
| --- | --- |
| [React 19](https://react.dev/) | UI library |
| [TypeScript 6](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Next.js 16](https://nextjs.org/) | App Router, development server and production server |
| [TanStack Query 5](https://tanstack.com/query) | Server state, caching, polling and mutations |
| [Zustand 5](https://github.com/pmndrs/zustand) | Shared client state for authentication, onboarding, tickets, toasts and list views |
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
| `NEXT_PUBLIC_REFERRAL_BASE_URL` | No | `https://raut.app/signup` | Base URL used to build referral signup links (`{base}?ref=CODE`). Inlined at build time, so rebuild after changing it. |
| `NEXT_PUBLIC_USE_MOCK_MARKETING` | No | `true` | Serves built-in sample promotions while the promotions API is unavailable. Referral APIs always use the backend. Set to `false` to disable promotion samples. Inlined at build time. |
| `NEXT_PUBLIC_USE_MOCK_ADMIN_USERS` | No | `true` | Serves the built-in sample admin users while the backend admin-users endpoints are unavailable. Set to `false` to use the real API. Inlined at build time. |

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server with hot module reloading |
| `npm run build` | Build the app for the Next.js production server |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm run lint` | Run ESLint across the repository |
| `npm run start` | Start the production server |
| `npm run preview` | Start the production server for verification |

Run `npm run build` before `npm run start` or `npm run preview`.

## Application routes

| Route | Access | Description |
| --- | --- | --- |
| `/login` | Public | Email and password sign-in |
| `/request-admin` | Signed in, non-admin | Enter the admin secret to upgrade the account |
| `/onboarding` | Public / WebView | Driver onboarding flow; expects `token` and optional `lang` query parameters |
| `/` | Admin | Dashboard overview and analytics |
| `/customers` | Admin | Customer management |
| `/drivers` | Admin | Driver and document management |
| `/rides` | Admin | Ride management |
| `/routes` | Admin | Route management |
| `/payouts` | Admin | Payout review and processing |
| `/payouts/batch` | Admin | Pending payout batch review and approval |
| `/transactions` | Admin | Transaction history |
| `/live-rides` | Admin | Live rides placeholder (Coming soon) |
| `/marketing` | Admin | API-backed promotion campaigns grouped by status tab, with search, pagination and delete |
| `/marketing/promotions/new` | Admin | Create a promotion campaign and activate it or save it as a draft |
| `/marketing/promotions/[id]/edit` | Admin | Edit an existing campaign and save changes or a draft |
| `/marketing/referrals` | Admin | Referral-code stats, status tabs, search, user-type/date filters, pagination, Create Referral dialog, shareable Referral Created dialog, row actions and bulk selection actions |
| `/support-tickets` | Admin | API-backed ticket search, filters, pagination, status actions and CSV export |
| `/support-tickets/new` | Admin | Create a support ticket for a rider or driver |
| `/support-tickets/[id]` | Admin | Ticket detail, agent assignment, replies/internal notes, status/priority updates and escalation |
| `/settings` | Admin | Signed-in account profile and access details |
| `/settings/admin-users` | Admin | Admin user list with status tabs, search, invite and edit panels, deactivate/reactivate and a role permission matrix |
| `/settings/audit-logs` | Admin | Audit logs placeholder (Coming soon) |
| `/settings/platform` | Admin | Platform configuration placeholder (Coming soon) |
| `/settings/system-health` | Admin | System health placeholder (Coming soon) |
| `*` | Public | Render the not-found page |

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

1. The administrator enters an email address and password on `/login`.
2. `POST /auth/login` validates the credentials.
3. The response returns the session, access token and optional refresh token.
4. The session and tokens are persisted in `localStorage` and exposed to React through the Zustand auth store.
5. `RequireAdmin` revalidates the role every five minutes (`ROLE_REVALIDATE_MS`). A missing or stale role is checked against `GET /auth/me`.
6. Non-admin accounts are redirected to `/request-admin`, where the admin secret is submitted to `POST /admin/promote`.
7. If the promoted access token still does not grant an admin role, the user is asked to sign in again.
8. Authenticated requests that return `401` attempt a token refresh through `POST /auth/refresh`. If refresh fails, the session is cleared and the user returns to `/login`.

If role revalidation fails because the server cannot be reached, the app keeps the last trusted role instead of signing the administrator out. A `401` still clears the session.

Access-token expiry is also watched client-side. While an admin session is active, a timer is scheduled for the stored `expiresAt`; when it elapses, the app signs out and shows “Your session expired. Please sign in again.” There is no pre-expiry warning. Background tabs are checked when they regain focus or become visible. Requests still refresh an expired access token before using it, and a successful refresh moves the timer to the new expiry.

The default admin roles are `admin` and `super_admin`. Override them with `NEXT_PUBLIC_ADMIN_ROLES`. Role aliases are normalized in `src/lib/roles.ts`:

- `administrator` becomes `admin`.
- `superadmin`, `super-admin` and `owner` become `super_admin`.
- `platform_manager`, `operator`, `support`, `analyst`, `finance` and `marketing` remain as their own roles.
- The Admin Users page also understands `operations_agent`, `support_agent`, `finance_manager`, `finance_agent`, `marketing_manager` and `marketing_agent` as distinct roles. These are labels for the permission matrix and do not add admin-gate access unless listed in `NEXT_PUBLIC_ADMIN_ROLES`.

The dashboard currently has a single admin gate: every configured admin role can open every admin page. Fine-grained permissions must be enforced by the backend.

Tokens are stored in browser `localStorage`, so the session can be restored across reloads. This does not replace server-side authorization; the backend must enforce permissions for every admin endpoint.

The onboarding flow writes its access token into the same token store used by API helpers, but it does not create an admin session.

## API integration

The backend base URL and endpoint paths live in `src/lib/config.ts`.

```ts
export const API_ROUTES = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',
  notifications: '/notifications/',
  promote: '/admin/promote',
  users: '/admin/users',
  adminUserInvite: '/admin/users/invite',
  adminUser: (userId) => `/admin/users/${userId}`,
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
  marketingPromotions: '/admin/marketing/promotions',
  users: '/admin/users',
}
```

The promotion detail route is built with `API_ROUTES.marketingPromotion(id)`.

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
| `POST` | `/auth/login` | Sign in with an email address and password |
| `POST` | `/auth/refresh` | Refresh an access token |
| `GET` | `/auth/me` | Fetch the signed-in user and role |
| `POST` | `/admin/promote` | Promote a signed-in account to admin using a secret |
| `GET` | `/notifications/` | List notifications |
| `POST` | `/notifications/{id}/read` | Mark a notification as read |
| `GET` | `/admin/users` | List users/customers |
| `GET` | `/admin/users` | List admin users (`status`, `search`, `page`, `page_size`) |
| `POST` | `/admin/users/invite` | Invite an admin user |
| `PATCH` | `/admin/users/{id}` | Update an admin user's role, permission overrides and 2FA |
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
| `POST` | `/admin/support/tickets` | Create a support ticket |
| `GET` | `/admin/support/tickets` | List and filter support tickets |
| `GET` | `/admin/support/agents` | List eligible ticket assignees and roles |
| `GET` | `/admin/support/tickets/{ticket_id}` | Get ticket details |
| `GET` | `/admin/support/tickets/{ticket_id}/messages` | List ticket messages and internal notes |
| `POST` | `/admin/support/tickets/{ticket_id}/messages` | Reply or add an internal note |
| `PATCH` | `/admin/support/tickets/{ticket_id}/assignment` | Assign or reassign a ticket |
| `POST` | `/admin/support/tickets/{ticket_id}/assign-to-me` | Claim an unassigned ticket |
| `PATCH` | `/admin/support/tickets/{ticket_id}/status` | Update ticket status |
| `PATCH` | `/admin/support/tickets/{ticket_id}/priority` | Change ticket priority |
| `POST` | `/admin/support/tickets/{ticket_id}/escalate` | Escalate a ticket |
| `GET` | `/admin/marketing/promotions` | List promotion campaigns (`status`, `search`, `page`, `page_size`) |
| `POST` | `/admin/marketing/promotions` | Create a promotion campaign |
| `GET` | `/admin/marketing/promotions/{id}` | Get a promotion campaign |
| `PATCH` | `/admin/marketing/promotions/{id}` | Update a promotion campaign |
| `DELETE` | `/admin/marketing/promotions/{id}` | Delete a promotion campaign |
| `POST` | `/referrals/programs` | Create a referral program |
| `GET` | `/referrals/programs` | List referral programs (`active_only`) |
| `GET` | `/referrals/programs/{program_id}` | Get a referral program |
| `PUT` | `/referrals/programs/{program_id}` | Update a referral program |
| `POST` | `/referrals/programs/{program_id}/enroll` | Enroll a user (`user_id`) |
| `POST` | `/referrals/programs/{program_id}/enroll/bulk` | Bulk enroll users (`user_ids`) |
| `DELETE` | `/referrals/programs/{program_id}/enroll/{user_id}` | Unenroll a user |
| `GET` | `/referrals/users` | List users with referral codes (`limit`, `offset`) |
| `GET` | `/referrals/users/{user_id}` | Get a user's referral details |
| `GET` | `/referrals/relationships` | List relationships (`limit`, `offset`, `status`) |
| `GET` | `/referrals/stats` | Referral stats (`period`) |
| `GET` | `/referrals/top-referrers` | Top referrers (`limit`) |
| `GET` | `/referrals/payments/pending` | List pending referral payments |
| `POST` | `/referrals/payments/{payment_id}/pay` | Mark payment as paid |
| `GET` | `/referrals/my-code` | Get the authenticated user's referral code |
| `POST` | `/referrals/process` | Process a referral code |
| `GET` | `/admin/users` | Search riders and drivers for referral assignment (`search`, `is_driver`, `page`, `page_size`) |
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

Support ticket creation sends `requester_id`, `requester_type`, `subject`, `category`, `priority` and `message`. Replies and internal notes send `body` and `is_internal`; assignments send `assignee_id`.

Promotion create/update sends `code`, `name`, `description`, `discount_type`, `discount_value`, optional caps (`max_discount_tzs`, `max_ride_value_tzs`, `minimum_ride_tzs`), `eligibility` (`new_users`, `existing_users`, `phones`), `starts_at`, `ends_at`, `per_user_limit`, `total_uses_limit`, `budget_cap_tzs`, `peak_hours_only`, `peak_hours_label`, `duo_only`, notification flags and `status` (`draft`, `active` or `scheduled`). Referral codes are exposed through the documented referral-user endpoints; the contract does not define admin endpoints to create, edit, delete, or send individual codes.

The marketing endpoints above are the frontend-side contract. Response mapping is intentionally tolerant in `src/services/marketing.ts` and `src/services/referrals.ts`; if the backend uses different paths or field names, update those services and `API_ROUTES` rather than the page components.

Referral API types live in `src/lib/referrals.ts`, endpoint functions in `src/services/referrals.ts`, and React Query hooks in `src/hooks/useReferrals.ts`. The `reward_config` value is JSON-safe and deliberately opaque to the frontend. The Referral codes directory lists codes returned by `GET /referrals/users` and opens details through `GET /referrals/users/{user_id}`; it does not call undocumented per-code endpoints.

Marketing mock mode is on by default (`NEXT_PUBLIC_USE_MOCK_MARKETING` unset or `true`) for promotions only. It serves sample promotions from `src/lib/mockMarketing.ts` and shows a **Sample data** badge on the promotions page. Referral APIs always use the backend. Set `NEXT_PUBLIC_USE_MOCK_MARKETING=false` and rebuild to disable promotion samples.

Admin User Management uses the same approach. `src/services/adminUsers.ts` maps list, invite, update and activate/deactivate responses tolerantly, including `user`, `admin`, `page_size` and pagination aliases. Invite sends `name`, `phone`, `email`, `role`, `two_factor_required` and `send_welcome_sms`; updates send `role`, `permissions` and `two_factor_required`. Until the endpoints are available, set `NEXT_PUBLIC_USE_MOCK_ADMIN_USERS` unset or `true` to use the seeded admins in `src/lib/mockAdminUsers.ts`. Mock changes stay in memory for the current session; set the flag to `false` and rebuild to use the real API.

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
- Support ticket lists and details refetch every 30 seconds; eligible agents are cached for 5 minutes.
- Promotion lists, referral-code lists and referral stats refetch every 60 seconds; referral-code stats are cached for 1 minute.
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
- `src/store/*` contains shared client state; onboarding progress is persisted, while other stores are in memory.
- `src/schemas/onboardingSchemas.ts` holds the onboarding validation schemas.

List services normalize pagination into `{ items, total, page, limit }`. Some summary cards fetch a larger overview page and calculate counts client-side. The dashboard uses `Promise.allSettled` so a failing analytics endpoint does not hide the rest of the page.

### Client state (Zustand)

Zustand stores hold shared client-only state. Server data stays in TanStack Query.

| Store | Persistence | Responsibility |
| --- | --- | --- |
| `authStore` | Memory, hydrated from `tokenStore` | Mirrors the signed-in session for React components; tokens remain in `tokenStore`. |
| `onboardingStore` | `localStorage` (`driver-onboarding-storage`) | Onboarding progress, token and language. |
| `pageViewStore` | Memory | List filters and pagination retained across navigation within the tab. |
| `toastStore` | Memory | Transient toast notifications. |

The auth store starts empty so the static export and the first client render match. `Providers` hydrates it after mount, and route gates wait for hydration before redirecting. Signing out clears the token store, query cache, page views and toasts. Onboarding progress is not cleared because it belongs to a separate driver flow.

List filters and pagination survive navigation but reset on a full reload. Support ticket, promotion and referral-code records are fetched from the backend; promotion tabs plus referral status, search, user type, date range and page are kept in `pageViewStore`.

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
│  │  ├─ login/            Email and password sign-in route
│  │  ├─ onboarding/       Driver onboarding route
│  │  ├─ request-admin/    Admin promotion route
│  │  ├─ globals.css       Tailwind import, theme tokens and shared component classes
│  │  ├─ layout.tsx        Root layout, metadata and Inter font
│  │  ├─ not-found.tsx     Not-found page that redirects to the dashboard
│  │  └─ providers.tsx     TanStack Query and toast providers
│  ├─ components/          Shared layout, navigation, panels, dialogs, toasts, charts and UI primitives
│  │  ├─ analytics/        Dashboard metric cards and Recharts visualizations
│  │  ├─ marketing/        Promotion cards/forms plus referral stats, tabs, table, create and success dialogs
│  │  ├─ platformConfig/   Platform configuration forms and shared config primitives
│  │  └─ ui/               shadcn-style components (sidebar, table, badge, sheet, tooltip and others)
│  ├─ hooks/               TanStack Query hooks and session helpers
│  ├─ lib/                 API config, env, roles, query client, query keys, date ranges and exports
│  ├─ onboarding/          The four onboarding step components
│  ├─ schemas/             Zod validation schemas
│  ├─ services/            API services, HTTP client, token store, uploads and mappers
│  ├─ store/               Zustand stores for authentication, onboarding, toasts and list views
│  ├─ styles/              Legacy Flutter theme constants
│  └─ types/               Shared TypeScript type definitions
├─ .env.example            Documented environment variables
├─ eslint.config.js        ESLint flat configuration
├─ next.config.ts          Next.js configuration
├─ package.json            Dependencies and scripts
├─ postcss.config.mjs      Tailwind CSS PostCSS plugin
├─ README.md
└─ tsconfig.json           TypeScript configuration
```

### Key modules

| Path | Responsibility |
| --- | --- |
| `src/services/http.ts` | Authenticated fetch wrapper, token refresh, timeout and error handling |
| `src/services/api.ts` | `apiGet`, `apiPost`, `apiPatch`, `apiPut`, `apiDelete` and query-string building |
| `src/services/supportTickets.ts` | Support ticket endpoints, API response mapping and ticket mutation payloads |
| `src/services/marketing.ts` | Promotion endpoints, tolerant response mapping, mutation payloads and the mock-mode switch |
| `src/services/referralCodes.ts` | Legacy referral-code helpers; the active referral-code directory uses the documented referral-user API |
| `src/services/referrals.ts` | Referral-program, enrollment, stats, user, relationship, payment, and user referral-code API functions |
| `src/hooks/useReferrals.ts` | React Query hooks and mutation invalidation for referral-program APIs |
| `src/lib/mockMarketing.ts` | Sample promotions, in-memory mock CRUD/list behavior and the promotion mock-data flag |
| `src/lib/referrals.ts` | Referral API request/response types and JSON-safe reward configuration |
| `src/lib/marketing.ts` | Promotion types, status labels, form defaults, date/currency formatting, promo-code generation, CSV parsing and payload mapping |
| `src/lib/referralCodes.ts` | Referral-code types, status/user-type/reward labels, defaults, code generation, link building, filters, action eligibility and payload mapping |
| `src/schemas/marketingSchemas.ts` | Zod validation for promotion campaigns |
| `src/services/adminUsers.ts` | Admin user list, invite, update and activate/deactivate endpoints with tolerant response mapping and the mock-mode switch |
| `src/lib/mockAdminUsers.ts` | Seeded admin users, in-memory mock list/CRUD behavior and the mock-data flag |
| `src/lib/adminUsers.ts` | Admin role catalog, permission matrix, status labels, formatting helpers and matrix CSV export |
| `src/schemas/adminUserSchemas.ts` | Zod validation for inviting and editing admin users |
| `src/services/auth.ts` | Email and password sign-in, session creation, role resolution and admin promotion |
| `src/services/adminActions.ts` | Verify/reject/suspend drivers, cancel rides/routes and manage users |
| `src/services/dashboard.ts` | Analytics aggregation, comparison windows and dashboard mapping |
| `src/services/tokenStore.ts` | localStorage session/token persistence and subscriptions |
| `src/services/mappers.ts` | API response normalization and display formatting |
| `src/services/uploads.ts` | Multipart document uploads for onboarding |
| `src/services/onboarding.ts` | Legacy complete-flow onboarding helper, not used by the current UI |
| `src/lib/config.ts` | Base URL, API routes and role revalidation constants |
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
| `src/store/authStore.ts` | Browser session state synchronized with the token store |
| `src/store/onboardingStore.ts` | Persisted onboarding progress, token and language |
| `src/store/pageViewStore.ts` | In-memory list filters and pagination retained across navigation, reset on sign-out |
| `src/store/toastStore.ts` | Transient toast notifications |
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

The production build is written to `.next/`.

Deploy the app to a host that can run the Next.js production server. The server is required for routes with runtime parameters, including `/support-tickets/[id]` and `/marketing/promotions/[id]/edit`.

To run the production build locally:

```bash
npm run start
```

Environment variables prefixed with `NEXT_PUBLIC_` are inlined at build time. Rebuild the app after changing the backend URL or admin roles.

## Legal documents

- [Community Guidelines](./COMMUNITY_GUIDELINES.md)
- [Privacy Policy](./PRIVACY_POLICY.md)
- [Terms of Service](./TERMS_OF_SERVICE.md)

## Known limitations

- Live Rides, Audit Logs, Platform Config and System Health are placeholder pages.
- There is currently no automated test suite or CI configuration.
- There is no role-level UI beyond the admin gate; every configured admin role sees every admin page. The Admin Users page is also intentionally not gated by role for now: any signed-in admin can open it.
- The Admin Users permission matrix and per-admin overrides are informational. They are displayed, printed and exported, but the backend must enforce them before they restrict access.
- Admin Users mock mode is enabled by default until the backend endpoints are ready. Sample invites, role changes and status changes are held in memory and reset on a full reload; set `NEXT_PUBLIC_USE_MOCK_ADMIN_USERS=false` to use the real API.
- The dashboard builds some summary cards from the analytics overview response and falls back to list totals when fields or endpoints are unavailable.
- Driver, document and payout summaries fetch up to 100 records and calculate some totals client-side.
- Batch payout review loads all pending payouts and checks failed payouts for driver-level history. Phone verification is only considered verified when the API explicitly provides a verification flag or timestamp. Pending payouts refresh every 30 seconds; approved and processing statuses refresh every 10 seconds, and failure history refreshes every five minutes.
- Batch approval uses the existing per-payout endpoint sequentially, so a batch can partially succeed. The UI blocks batches over TZS 50,000 because the backend does not yet provide a server-verified step-up 2FA flow; the backend must also enforce this threshold before high-value approvals are enabled.
- Payout receipts open the browser print dialog, where they can be printed or saved as PDF.
- Dashboard cards render zero or empty states when an analytics endpoint fails, so partial data is expected during backend incidents.
- Admin data comes from the external Raut backend. The Next.js server serves the app and its dynamic routes, including `/support-tickets/[id]` and `/marketing/promotions/[id]/edit`.
- The marketing and referral API paths and payload field names are defined by this frontend contract. If the backend differs, adjust `API_ROUTES` and the corresponding service; the existing referral-code UI tolerates several field aliases and derives status from dates and pending counts when the API omits it.
- Marketing mock mode applies to promotions only. Sample promotion changes are held in memory and reset on a full reload; referral APIs always use the real backend.
- Referral assignment search queries `/admin/users` with `is_driver` set from the selected user type. The user must be assigned before a code can be created.
- Referral edit only changes expiry and maximum uses; status changes use the separate activate/deactivate actions. Delete is available only when completed and pending referral counts are both zero, and Send to User currently supports SMS and email.
- DUO-only promotion targeting is disabled in the form when the DUO feature flag is switched off in platform configuration.
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
