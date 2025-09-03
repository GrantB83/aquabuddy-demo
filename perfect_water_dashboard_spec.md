## Perfect Water Internal Dashboard - Specification Document (Draft)

### Document Purpose
This specification defines the core capabilities, modules, and system requirements for the internal operations dashboard used by Perfect Water franchise stores. It is designed to replace or augment current Google Sheets + Apps Script workflows with a modern, scalable web-based platform, aligned with international best practice and adapted for Afrihost cPanel hosting with Node.js App Manager enabled.

---

## 1. System Objectives
- Streamline daily operations across multiple stores
- Improve data integrity, speed, and visibility
- Centralize core workflows (sales, invoicing, inventory, CRM)
- Enable future integrations (AI, WhatsApp, CRM, loyalty, etc.)
- Support role-based access and activity logging
- Ensure compliance with POPIA and customer privacy

---

## 2. System Architecture (Unified Node Option A)

The system will use a unified Node.js stack for both public and internal applications, simplifying development, maintenance, and scaling.

### Structure
- **Monorepo layout:** Separate apps for public web, admin, and API, with shared packages for DB schema, UI components, and utilities.
- **Public + Customer Portal:** Next.js (App Router) with Tailwind + shadcn/ui. Hosted on Afrihost Node.js App Manager. ISR (Incremental Static Regeneration) for speed and SEO.
- **Admin Dashboard:** Either integrated into Next.js under `/admin` routes or separate app, depending on complexity.
- **Backend API:** NestJS (REST), Prisma ORM to MySQL. Provides APIs for web apps and cron jobs.
- **Database:** MySQL (Afrihost cPanel). Structured for multi-tenancy with franchise_id and store_id keys.
- **Authentication:** NextAuth with JWT. Roles embedded in JWT claims.
- **RBAC:** NestJS guards + decorators, enforced on API endpoints; role-conditional rendering in UI.
- **Scheduling:** Cron jobs configured in cPanel hitting secured API endpoints or running Node scripts.
- **Logging/Monitoring:** Pino logs, Sentry (free tier) for error tracking.

### Packages & Libraries
- **Frontend:** `next`, `react`, `tailwindcss`, `@radix-ui/react-*`, `@/shadcn` components
- **Forms/Validation:** `react-hook-form`, `zod`, `@hookform/resolvers`
- **Auth:** `next-auth`, `jsonwebtoken`
- **Backend:** `@nestjs/core`, `@nestjs/common`, `@nestjs/jwt`, `@nestjs/config`, `@nestjs/swagger`, `class-validator`, `class-transformer`
- **Database:** `prisma`, `@prisma/client`
- **CSV parsing:** `csv-parse`
- **Phone numbers:** `libphonenumber-js` (E.164 compliance)
- **PDF generation:** `puppeteer` (with fallback to html-pdf-node or external service if blocked on host)
- **Logging:** `pino`, `pino-pretty`
- **Environment:** `dotenv`

### Deployment
- Two Node apps configured in Afrihost Node.js App Manager: `web` (Next.js) and `api` (NestJS).
- Domains mapped via reverse proxy: e.g. `pwltt.co.za` → web, `admin.pwltt.co.za` → admin routes, `api.pwltt.co.za` → NestJS API.
- Cron jobs via cPanel to run syncs and batch tasks.

### Security & Compliance
- Passwords hashed with Argon2id.
- JWT with HttpOnly, Secure cookies.
- CSRF protection for forms.
- Database audit logs for critical actions.
- POPIA compliance: PII minimization, encryption for sensitive fields.
- SPF/DKIM/DMARC configured for email deliverability.

---

## 3. Core Modules & Features

### 3.1 Dashboard Overview
- KPI widgets (daily sales, stock levels, top customers)
- Store-specific filters
- Quick access links to key modules

### 3.2 Customers (CRM)
- Integrated with Loyverse customer data
- Searchable, filterable customer records
- History of invoices, purchases, credit, loyalty
- E.164 phone formatting for reliable messaging
- Deduplication tool (AI + manual override)
- Match new sign-ups to existing records

### 3.3 Invoices
- View invoices by store/date/customer
- Generate PDF invoices (download/email)
- Assign entity codes (e.g., LTT / TND / BVR)
- Export options (CSV, PDF)

### 3.4 Inventory
- Live stock levels from Loyverse sync
- Low-stock flags
- Import/update pricing
- Manual adjustments

### 3.5 Transaction Sync
- Cron/On-demand sync with Loyverse Receipts, Items, Inventory, Categories, Modifiers, Discounts, Payment Types, Taxes, Stores, Customers, Employees, Shifts
- Show sync status + retry failed syncs

### 3.6 Reports
- Sales (daily, monthly, YTD, by store)
- Inventory movement
- Customer growth/segmentation
- Downloadable CSV/Excel

### 3.7 Staff Activity
- Logged activities by staff
- Performance tracking & sales leaderboards

### 3.8 Notifications & Tasks
- Daily reminders (sync, compliance checks)
- In-app alerts for errors or low stock
- Optional WhatsApp staff reminders later

### 3.9 Bank Reconciliation
- Upload CSV/OFX bank statements
- Parse & normalize transactions
- Rule-based and manual matching to invoices
- Flag unmatched payments
- Reconciliation summaries per period
- Export reconciled data

### 3.10 Customer-Facing Website
- Public-facing site for Louis Trichardt franchise
- Aligns with [perfectwater.co.za](http://perfectwater.co.za) branding
- Pages: Home, About, Locations, Products, Contact
- Leads captured into CRM
- Initial deployment via Next.js Node app
- Future expansion: e-commerce, loyalty sign-ups, bookings

### 3.11 Admin Dashboard
- Bootstrap/shadcn-based UI in Next.js
- Secure login with RBAC
- Separate admin domain or path
- Features: invoices, reconciliation, compliance, customer management

### 3.12 Development Sequence
1. Scaffold Next.js web (public + /admin)
2. Setup Prisma schema, connect MySQL
3. Deploy NestJS API on Node App Manager
4. Configure NextAuth + RBAC
5. Add core modules incrementally
6. Configure cron jobs for syncs
7. Implement AI message review & send flow

### 3.13 Database Tables (Schema Overview)
The schema is **multi-tenant**: almost all business tables include `franchise_id` (and usually `store_id`) for data isolation.

| Table | Purpose | Key Fields | Relationships/Notes |
|---|---|---|---|
| franchise | Franchise/company entity and billing identity | `id`, `name`, `reg_number`, `vat_registered` (bool), `vat_number`, `address`, `primary_contact_id` | 1→N `store`, 1→N `entity`; used for RBAC scoping |
| entity | Letterhead/company details for documents | `id`, `franchise_id`, `display_name`, `address_lines`, `phone`, `email`, `vat_number`, `logo_url` | Used by `invoice`/`statement` rendering |
| store | Physical store/location | `id`, `franchise_id`, `name`, `code`, `address`, `timezone` | 1→N with `receipt`, `inventory`, `daily_compliance` |
| user | Application users (all roles) | `id`, `franchise_id` (nullable for super user), `email`, `phone_e164`, `password_hash`, `status` | N↔N `role` via `user_role`; scope by `franchise_id` |
| role | Role definitions | `id`, `name` (super_user, owner, manager, admin, cashier, customer) | N↔N with `user` |
| user_role | Map users to roles | `user_id`, `role_id`, `franchise_id` | Composite PK; supports cross-franchise roles if needed |
| customer | Customers (synced from Loyverse + site sign-ups) | `id`, `franchise_id`, `store_id` (nullable), `loyverse_customer_id`, `name`, `email`, `phone_e164`, `status` | De-dup rules on email/phone; referenced by `invoice`, `receipt` |
| item | Products/items | `id`, `franchise_id`, `loyverse_item_id`, `sku`, `name`, `category_id` (nullable), `price`, `tax_rate_id` | 1→N `receipt_line`, `invoice_line` |
| category | Item categories | `id`, `franchise_id`, `name`, `parent_id` (nullable) | Optional hierarchy |
| tax_rate | Tax/VAT configurations | `id`, `franchise_id`, `name`, `rate` (decimal), `active_from` | Used when pricing/invoicing |
| inventory | Current stock per item per store | `id`, `franchise_id`, `store_id`, `item_id`, `qty_on_hand`, `updated_at` | Sourced from Loyverse inventory sync |
| receipt | POS sales from Loyverse | `id`, `franchise_id`, `store_id`, `loyverse_receipt_id`, `customer_id` (nullable), `total`, `paid`, `payment_type_id`, `datetime` | 1→N `receipt_line` |
| receipt_line | Line items for receipts | `id`, `receipt_id`, `item_id`, `qty`, `unit_price`, `line_total` | |
| payment_type | Payment methods | `id`, `franchise_id`, `name` (cash/card/account/etc.) | Referenced by `receipt`, `payment` |
| invoice | Back-office invoices/statements | `id`, `franchise_id`, `store_id` (nullable), `customer_id`, `entity_id`, `number`, `status`, `subtotal`, `tax_total`, `grand_total`, `issued_at`, `due_at` | 1→N `invoice_line`, N↔N with `payment` via `payment_allocation` |
| invoice_line | Line items for invoices | `id`, `invoice_id`, `item_id` (nullable), `description`, `qty`, `unit_price`, `tax_rate_id`, `line_total` | |
| payment | Customer payments captured/reconciled | `id`, `franchise_id`, `store_id` (nullable), `customer_id`, `amount`, `method`, `received_at`, `reference` | N↔N `invoice` via `payment_allocation`; may link to `bank_transaction` |
| payment_allocation | Allocation of a payment to invoices | `payment_id`, `invoice_id`, `amount` | Composite PK |
| bank_transaction | Imported bank statement rows | `id`, `franchise_id`, `account_name`, `txn_date`, `amount`, `description`, `reference`, `raw_payload` (json) | Match candidates for `payment` |
| bank_match | Links bank txns to payments/invoices | `id`, `bank_transaction_id`, `payment_id` (nullable), `invoice_id` (nullable), `confidence`, `matched_by` | Supports rule-based + manual matching |
| employee | Store employees (from Loyverse) | `id`, `franchise_id`, `store_id`, `loyverse_employee_id`, `name`, `email`, `phone_e164` | Optional mapping to `user` |
| shift | Staff shifts (from Loyverse) | `id`, `employee_id`, `store_id`, `start`, `end`, `break_minutes` | |
| daily_compliance | Daily procedural checks | `id`, `franchise_id`, `store_id`, `date`, `submitted_by` (`user_id`), `cash_count`, `cleanliness_ok` (bool), `fridges_ok` (bool), `tds_points` (json), `notes` | 1→N `compliance_photo` |
| compliance_photo | Photos for compliance entries | `id`, `daily_compliance_id`, `photo_url`, `type` (meter/fridge/etc.), `taken_at` | Files stored on disk or S3-compatible storage |
| ai_message_log | AI-generated outbound messages | `id`, `franchise_id`, `customer_id`, `type` (payment_thanks/reminder/etc.), `message_text`, `context_json`, `created_by` (`user_id`), `created_at`, `sent_via` (whatsapp_web/cloud_api) | Auditable trail |
| audit_log | Critical admin actions | `id`, `user_id`, `action`, `resource`, `resource_id`, `before_json`, `after_json`, `ip`, `ua`, `created_at` | For compliance and troubleshooting |

**Indexing Guidelines**
- Add composite indexes such as `(franchise_id, store_id, created_at)` on high-churn tables (`receipt`, `invoice`, `payment`).
- Unique constraints: `customer(email)` (nullable, unique where not null), `customer(phone_e164)` (same), `item(sku, franchise_id)`.
- Foreign keys with `ON UPDATE CASCADE` and `ON DELETE RESTRICT` (or `SET NULL` where appropriate).

**Deduplication Rules**
- On customer sign-up, attempt exact match on `email` or `phone_e164`; then fuzzy match (name + phone last 4) before creating new records.

### 3.14 AI Messaging Module
- Draft messages via OpenAI (payment confirmations, reminders)
- Staff approval required before sending
- Prefilled wa.me links for free sending via WhatsApp Web
- Later upgrade path to WhatsApp Cloud API
- Logged in AI_Message_Log with metadata

---

## 4. Security & Roles
- Super User: Full access
- Franchise Owner: Manage franchise
- Store Manager: Operational control
- Admin Person: Limited admin
- Cashier: POS/sales only
- Guest: Minimal read access
- Registered Customer: Access to own dashboard

### 4.1 RBAC Policies & Route Guards
- **Principle of Least Privilege:** Users should have only the minimum permissions required.
- **Password Policies:** Minimum 12 chars, enforce complexity, expiry 90 days for staff.
- **Session Management:** JWT expiry 1h; refresh token 7d; idle timeout 30m for admin users.
- **MFA (optional):** TOTP (Google Authenticator) for Super User and Franchise Owner roles.
- **Route Guards (NestJS):** Decorators like `@Roles('manager')` enforce access; Next.js UI hides restricted links.
- **Audit:** All admin actions logged in `audit_log` with before/after state.
- **Data Isolation:** `franchise_id` scope enforced at query layer.

---

## 4.2 Prisma Schema Skeleton (Draft)
Below is an illustrative Prisma schema matching section 3.13.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Franchise {
  id           Int       @id @default(autoincrement())
  name         String
  vatNumber    String?
  vatRegistered Boolean  @default(false)
  stores       Store[]
  users        User[]
  entities     Entity[]
}

model Store {
  id          Int       @id @default(autoincrement())
  franchise   Franchise @relation(fields: [franchiseId], references: [id])
  franchiseId Int
  name        String
  code        String
  receipts    Receipt[]
  inventory   Inventory[]
  compliance  DailyCompliance[]
}

model User {
  id          Int       @id @default(autoincrement())
  franchiseId Int?
  franchise   Franchise? @relation(fields: [franchiseId], references: [id])
  email       String    @unique
  phoneE164   String?   @unique
  password    String
  roles       UserRole[]
  auditLogs   AuditLog[]
}

model Role {
  id    Int       @id @default(autoincrement())
  name  String    @unique
  users UserRole[]
}

model UserRole {
  userId Int
  roleId Int
  user   User @relation(fields: [userId], references: [id])
  role   Role @relation(fields: [roleId], references: [id])
  @@id([userId, roleId])
}

model Customer {
  id        Int    @id @default(autoincrement())
  franchiseId Int
  storeId   Int?
  name      String
  email     String? @unique
  phoneE164 String? @unique
  invoices  Invoice[]
  receipts  Receipt[]
}

model Item {
  id        Int     @id @default(autoincrement())
  franchiseId Int
  sku       String
  name      String
  price     Decimal @db.Decimal(10,2)
  inventory Inventory[]
  invoiceLines InvoiceLine[]
}

model Inventory {
  id        Int     @id @default(autoincrement())
  itemId    Int
  storeId   Int
  qtyOnHand Int
  updatedAt DateTime @updatedAt
  item      Item  @relation(fields: [itemId], references: [id])
  store     Store @relation(fields: [storeId], references: [id])
}

model Receipt {
  id        Int     @id @default(autoincrement())
  storeId   Int
  customerId Int?
  total     Decimal @db.Decimal(10,2)
  datetime  DateTime
  store     Store    @relation(fields: [storeId], references: [id])
  customer  Customer? @relation(fields: [customerId], references: [id])
  lines     ReceiptLine[]
}

model ReceiptLine {
  id        Int     @id @default(autoincrement())
  receiptId Int
  itemId    Int
  qty       Int
  unitPrice Decimal @db.Decimal(10,2)
  receipt   Receipt @relation(fields: [receiptId], references: [id])
  item      Item    @relation(fields: [itemId], references: [id])
}

model Invoice {
  id        Int     @id @default(autoincrement())
  customerId Int
  entityId  Int
  number    String  @unique
  status    String
  subtotal  Decimal @db.Decimal(10,2)
  total     Decimal @db.Decimal(10,2)
  issuedAt  DateTime
  dueAt     DateTime?
  customer  Customer @relation(fields: [customerId], references: [id])
  entity    Entity   @relation(fields: [entityId], references: [id])
  lines     InvoiceLine[]
}

model InvoiceLine {
  id        Int     @id @default(autoincrement())
  invoiceId Int
  description String
  qty       Int
  unitPrice Decimal @db.Decimal(10,2)
  invoice   Invoice @relation(fields: [invoiceId], references: [id])
}

model DailyCompliance {
  id        Int     @id @default(autoincrement())
  storeId   Int
  date      DateTime
  notes     String?
  store     Store @relation(fields: [storeId], references: [id])
}

model AuditLog {
  id        Int     @id @default(autoincrement())
  userId    Int
  action    String
  resource  String
  resourceId Int?
  beforeJson Json?
  afterJson  Json?
  createdAt DateTime @default(now())
  user      User @relation(fields: [userId], references: [id])
}
```

This schema is illustrative and should be expanded to cover all tables listed in Section 3.13. It establishes clear relationships, role mapping, and audit trails.

---

## 5. Testing & QA AI Messaging Module AI Messaging Module
- Draft messages via OpenAI (payment confirmations, reminders)
- Staff approval required before sending
- Prefilled wa.me links for free sending via WhatsApp Web
- Later upgrade path to WhatsApp Cloud API
- Logged in AI_Message_Log with metadata

---

## 4. Security & Roles
- Super User: Full access
- Franchise Owner: Manage franchise
- Store Manager: Operational control
- Admin Person: Limited admin
- Cashier: POS/sales only
- Guest: Minimal read access
- Registered Customer: Access to own dashboard

---

## 5. Testing & QA
- Unit tests (Zod schemas, NestJS services)
- Integration tests (API routes + DB)
- E2E tests (Playwright for workflows)
- Data seeding for QA environments

---

## 6. Roadmap (High-Level)
- **Phase 1:** Customer, Invoices, Sync
- **Phase 2:** Inventory, Reports, Dashboard
- **Phase 3:** Staff activity, Tasks, AI Messaging
- **Phase 4:** Bank Reconciliation, Loyalty, API integrations

---

## 7. Notes & Placeholders
- Loyalty program tracking
- Accountant role
- Xero export compatibility

---

## 8. Performance Considerations
- ISR for public site; SWR for dashboard
- MySQL indexes on franchise_id, store_id, date, customer phone/email
- Paginate all lists, avoid N+1 queries
- 3s load target on standard connections
- Support ≥50 concurrent users per store
- Scheduled backups, replication, failover plan

---

## 9. Documentation & Training
- Guides for owners, managers, cashiers
- Quick start videos
- Admin docs for roles, stores, integrations
- Onboarding plan for new staff
- Ongoing updates aligned with feature releases

---

## 10. cPanel Setup Steps (Initial Checklist)
1. **Prepare Environment**
   - Log into Afrihost cPanel and open **Node.js App Manager**.
   - Create two Node.js applications: one for `web` (Next.js) and one for `api` (NestJS).
   - Assign unique application ports (cPanel does this automatically).
   - Configure environment variables (.env) for each app (DB URL, JWT secret, OpenAI key, etc.).

2. **Database Setup**
   - In cPanel MySQL Databases, create a database (e.g., `pwltt_db`) and a user with full privileges.
   - Add connection string to `.env` for Prisma.
   - Run `prisma migrate deploy` to apply schema.

3. **Deploy Applications**
   - Build Next.js app locally (`next build`) with `output: 'standalone'` and upload `.next/standalone`.
   - Build NestJS (`npm run build`) and upload `/dist`.
   - Use cPanel’s File Manager or Git Version Control for deployments.

4. **Domains & Routing**
   - Map domains in cPanel:
     - `pwltt.co.za` → Next.js app
     - `admin.pwltt.co.za` → Next.js admin routes
     - `api.pwltt.co.za` → NestJS API

5. **Cron Jobs**
   - In cPanel Cron Jobs, schedule commands or curl calls:
     - `curl -s https://api.pwltt.co.za/internal/cron/sync` (hourly)
     - `curl -s https://api.pwltt.co.za/internal/cron/statements` (nightly)
   - Secure cron endpoints with secret tokens or headers.

6. **Testing**
   - Verify Next.js public site loads.
   - Verify API responds (e.g., `/health` endpoint).
   - Run end-to-end smoke test: login, create invoice, sync Loyverse data.

7. **Maintenance**
   - Enable automatic database backups in cPanel.
   - Rotate logs weekly.
   - Document environment variables and update procedure.

---

## 10. cPanel Setup Steps (Afrihost Node.js App Manager)

> Goal: get **Next.js (web)** and **NestJS (api)** running on Afrihost, connected to **MySQL**, with cron jobs and email ready.

### 10.1 Prepare the repository (local)
1) Monorepo folders: `/apps/web` (Next.js), `/apps/api` (NestJS), `/packages/db` (Prisma), `/packages/ui`, `/packages/lib`.
2) Create `.env.example` with keys used by both apps (see 10.3).
3) Install packages; run `prisma init`, define schema, and `prisma migrate dev` locally.
4) Implement a health endpoint in API: `GET /health` returns `{status:'ok'}`.
5) In web, create a simple `/` page and `/admin` placeholder to validate auth and RBAC wiring later.

### 10.2 Create the MySQL database (cPanel)
1) cPanel → **MySQL® Databases**: create DB (e.g., `pwltt_prod`).
2) Create DB user & strong password; grant **ALL PRIVILEGES** on the DB.
3) Note **host**, **db name**, **username**, **password**; you’ll put these in env vars.
4) From local, point Prisma to production DSN and run `prisma migrate deploy` once the API is up (or via temporary SSH if available).

### 10.3 Environment variables
Define the following (separate for `web` and `api` in Node App Manager):
- **Shared:** `NODE_ENV=production`, `DATABASE_URL=mysql://USER:PASS@HOST:3306/DB`, `NEXTAUTH_SECRET`, `JWT_SECRET`, `APP_BASE_URL`, `API_BASE_URL`
- **Auth (NextAuth):** `NEXTAUTH_URL=https://pwltt.co.za`
- **Mail (SMTP):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- **OpenAI (AI messaging):** `OPENAI_API_KEY`
- **Cron security:** `CRON_SECRET` (custom string used to protect internal cron routes)

### 10.4 Deploy the API (NestJS)
1) cPanel → **Setup Node.js App** → Create Application:
   - App root: `/apps/api`
   - Node version: latest stable available
   - Application startup file: `dist/main.js` (we’ll build before starting)
2) Upload code (git or file manager). If SSH is available, run:
   - `npm ci`
   - `npm run build` (produces `/dist`)
   - Set env vars (10.3) in the Node app settings.
   - Click **Restart App**.
3) Test `https://api.pwltt.co.za/health` (after domain mapping in 10.6).

### 10.5 Deploy the Web (Next.js)
1) cPanel → **Setup Node.js App** → Create Application:
   - App root: `/apps/web`
   - Node version: latest stable
   - Startup: `.output/server/index.mjs` (for App Router with standalone output) **or** `server.js` if you wrap custom server.
2) Build locally for standalone:
   - `NEXT_TELEMETRY_DISABLED=1`
   - `npm ci && npm run build`
   - Ensure `next.config.js` uses `output: 'standalone'` and ISR where useful.
3) Upload `.next/standalone`, `.next/static`, `public/`, and `package.json` (as needed). Alternatively build on server if allowed.
4) Set env vars (10.3) and **Restart App**.
5) Open root URL to verify homepage renders.

### 10.6 Domains & routing
1) cPanel → **Domains/Subdomains**:
   - `pwltt.co.za` → web app
   - `admin.pwltt.co.za` → (either a route in web `/admin` or a second web app)
   - `api.pwltt.co.za` → API app
2) Ensure SSL (AutoSSL/Let’s Encrypt) is enabled on all hostnames.

### 10.7 Cron jobs (cPanel → Cron)
Create cron entries calling secured API routes or node scripts:
- Hourly Loyverse sync:
  - `curl -s -H "X-CRON-KEY: $CRON_SECRET" https://api.pwltt.co.za/internal/cron/loyverse-sync`
- Nightly statements (02:15):
  - `curl -s -H "X-CRON-KEY: $CRON_SECRET" https://api.pwltt.co.za/internal/cron/statements`
- Nightly AI reminders (02:45):
  - `curl -s -H "X-CRON-KEY: $CRON_SECRET" https://api.pwltt.co.za/internal/cron/ai-reminders`

> Alternative: run `node dist/main.js cron:<task>` commands directly if preferred.

### 10.8 Email deliverability
1) In cPanel, configure **Email Deliverability**: set **SPF**, **DKIM**, **DMARC** for `pwltt.co.za`.
2) Test sending invoices/statements to a Gmail + Outlook address.

### 10.9 File uploads & backups
1) Store uploads under `/apps/web/uploads` (or `/apps/api/uploads`) with proper write permissions.
2) Schedule backups: DB dump nightly to a secured folder; weekly offsite copy.
3) Consider moving large media to S3-compatible storage (Wasabi/Backblaze) if growth accelerates.

### 10.10 Observability & safety
1) Enable application logs (Pino) to file; rotate weekly.
2) Add Sentry DSN to both apps for error tracking.
3) Create an `audit_log` table and log critical admin actions.

---

## Appendix A: Prisma Schema (Skeleton)
> Provider: **MySQL**. This is a starter schema reflecting Section 3.13. Field types/lengths can be tuned during implementation. Monetary values use `Decimal`.

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum Status {
  ACTIVE
  INACTIVE
}

enum MessageChannel {
  whatsapp_web
  cloud_api
}

model Franchise {
  id             Int       @id @default(autoincrement())
  name           String
  regNumber      String?   @db.VarChar(64)
  vatRegistered  Boolean   @default(false)
  vatNumber      String?   @db.VarChar(64)
  address        String?   @db.Text
  primaryContact Int?      // user id (optional)
  stores         Store[]
  entities       Entity[]
  users          User[]
  customers      Customer[]
  items          Item[]
  categories     Category[]
  taxRates       TaxRate[]
  inventories    Inventory[]
  receipts       Receipt[]
  invoices       Invoice[]
  payments       Payment[]
  bankTxns       BankTransaction[]
  employees      Employee[]
  dailyChecks    DailyCompliance[]
  messages       AIMessageLog[]

  @@index([name])
}

model Entity {
  id          Int       @id @default(autoincrement())
  franchiseId Int
  displayName String
  address     String?   @db.Text
  phone       String?   @db.VarChar(32)
  email       String?   @db.VarChar(191)
  vatNumber   String?   @db.VarChar(64)
  logoUrl     String?   @db.VarChar(512)
  franchise   Franchise @relation(fields: [franchiseId], references: [id])
  invoices    Invoice[]
}

model Store {
  id          Int          @id @default(autoincrement())
  franchiseId Int
  name        String
  code        String?      @db.VarChar(32)
  address     String?      @db.Text
  timezone    String?      @db.VarChar(64)
  franchise   Franchise    @relation(fields: [franchiseId], references: [id])
  receipts    Receipt[]
  inventories Inventory[]
  employees   Employee[]
  shifts      Shift[]
  dailyChecks DailyCompliance[]
  invoices    Invoice[]
  payments    Payment[]

  @@unique([franchiseId, code])
}

model Role {
  id    Int     @id @default(autoincrement())
  name  String  @unique // super_user, owner, manager, admin, cashier, customer
  users UserRole[]
}

model User {
  id           Int        @id @default(autoincrement())
  franchiseId  Int?
  email        String?    @unique(map: "user_email_unique") @db.VarChar(191)
  phoneE164    String?    @unique(map: "user_phone_unique") @db.VarChar(32)
  passwordHash String?    @db.VarChar(255)
  status       Status     @default(ACTIVE)
  franchise    Franchise? @relation(fields: [franchiseId], references: [id])
  roles        UserRole[]
  auditLogs    AuditLog[]
  messages     AIMessageLog[] @relation("MessageCreatedBy")
}

model UserRole {
  userId      Int
  roleId      Int
  franchiseId Int?
  user        User @relation(fields: [userId], references: [id])
  role        Role @relation(fields: [roleId], references: [id])

  @@id([userId, roleId, franchiseId])
}

model Customer {
  id                  Int        @id @default(autoincrement())
  franchiseId         Int
  storeId             Int?
  loyverseCustomerId  String?    @unique(map: "loyv_customer_unique")
  name                String
  email               String?    @unique(map: "customer_email_unique") @db.VarChar(191)
  phoneE164           String?    @unique(map: "customer_phone_unique") @db.VarChar(32)
  status              Status     @default(ACTIVE)
  franchise           Franchise  @relation(fields: [franchiseId], references: [id])
  store               Store?     @relation(fields: [storeId], references: [id])
  receipts            Receipt[]
  invoices            Invoice[]
  payments            Payment[]
  messages            AIMessageLog[]

  @@index([franchiseId, storeId])
}

model Category {
  id          Int         @id @default(autoincrement())
  franchiseId Int
  name        String
  parentId    Int?
  franchise   Franchise   @relation(fields: [franchiseId], references: [id])
  items       Item[]
}

model TaxRate {
  id          Int        @id @default(autoincrement())
  franchiseId Int
  name        String
  rate        Decimal    @db.Decimal(5,4)
  activeFrom  DateTime?
  franchise   Franchise  @relation(fields: [franchiseId], references: [id])
  invoiceLines InvoiceLine[]
}

model Item {
  id             Int        @id @default(autoincrement())
  franchiseId    Int
  loyverseItemId String?    @unique
  sku            String?    @db.VarChar(64)
  name           String
  categoryId     Int?
  price          Decimal     @db.Decimal(10,2)
  franchise      Franchise   @relation(fields: [franchiseId], references: [id])
  category       Category?   @relation(fields: [categoryId], references: [id])
  receiptLines   ReceiptLine[]
  invoiceLines   InvoiceLine[]
  inventories    Inventory[]

  @@unique([franchiseId, sku])
}

model Inventory {
  id          Int       @id @default(autoincrement())
  franchiseId Int
  storeId     Int
  itemId      Int
  qtyOnHand   Decimal   @db.Decimal(12,3)
  updatedAt   DateTime  @updatedAt
  franchise   Franchise @relation(fields: [franchiseId], references: [id])
  store       Store     @relation(fields: [storeId], references: [id])
  item        Item      @relation(fields: [itemId], references: [id])

  @@unique([storeId, itemId])
}

model PaymentType {
  id          Int        @id @default(autoincrement())
  franchiseId Int
  name        String
  franchise   Franchise  @relation(fields: [franchiseId], references: [id])
  receipts    Receipt[]
  payments    Payment[]
}

model Receipt {
  id               Int         @id @default(autoincrement())
  franchiseId      Int
  storeId          Int
  loyverseReceiptId String     @unique
  customerId       Int?
  total            Decimal     @db.Decimal(10,2)
  paid             Decimal     @db.Decimal(10,2)
  paymentTypeId    Int?
  datetime         DateTime
  franchise        Franchise   @relation(fields: [franchiseId], references: [id])
  store            Store       @relation(fields: [storeId], references: [id])
  customer         Customer?   @relation(fields: [customerId], references: [id])
  paymentType      PaymentType? @relation(fields: [paymentTypeId], references: [id])
  lines            ReceiptLine[]
}

model ReceiptLine {
  id         Int     @id @default(autoincrement())
  receiptId  Int
  itemId     Int
  qty        Decimal @db.Decimal(12,3)
  unitPrice  Decimal @db.Decimal(10,2)
  lineTotal  Decimal @db.Decimal(10,2)
  receipt    Receipt @relation(fields: [receiptId], references: [id])
  item       Item    @relation(fields: [itemId], references: [id])
}

model Invoice {
  id          Int        @id @default(autoincrement())
  franchiseId Int
  storeId     Int?
  customerId  Int
  entityId    Int
  number      String     @unique
  status      String     @db.VarChar(32)
  subtotal    Decimal    @db.Decimal(10,2)
  taxTotal    Decimal    @db.Decimal(10,2)
  grandTotal  Decimal    @db.Decimal(10,2)
  issuedAt    DateTime
  dueAt       DateTime?
  franchise   Franchise  @relation(fields: [franchiseId], references: [id])
  store       Store?     @relation(fields: [storeId], references: [id])
  customer    Customer   @relation(fields: [customerId], references: [id])
  entity      Entity     @relation(fields: [entityId], references: [id])
  lines       InvoiceLine[]
  allocations PaymentAllocation[]
}

model InvoiceLine {
  id          Int      @id @default(autoincrement())
  invoiceId   Int
  itemId      Int?
  description String
  qty         Decimal  @db.Decimal(12,3)
  unitPrice   Decimal  @db.Decimal(10,2)
  taxRateId   Int?
  lineTotal   Decimal  @db.Decimal(10,2)
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])
  item        Item?    @relation(fields: [itemId], references: [id])
  taxRate     TaxRate? @relation(fields: [taxRateId], references: [id])
}

model Payment {
  id          Int        @id @default(autoincrement())
  franchiseId Int
  storeId     Int?
  customerId  Int
  amount      Decimal    @db.Decimal(10,2)
  method      String     @db.VarChar(64)
  receivedAt  DateTime
  reference   String?    @db.VarChar(128)
  franchise   Franchise  @relation(fields: [franchiseId], references: [id])
  store       Store?     @relation(fields: [storeId], references: [id])
  customer    Customer   @relation(fields: [customerId], references: [id])
  allocations PaymentAllocation[]
  bankMatches BankMatch[]
}

model PaymentAllocation {
  paymentId Int
  invoiceId Int
  amount    Decimal @db.Decimal(10,2)
  payment   Payment @relation(fields: [paymentId], references: [id])
  invoice   Invoice @relation(fields: [invoiceId], references: [id])

  @@id([paymentId, invoiceId])
}

model BankTransaction {
  id           Int        @id @default(autoincrement())
  franchiseId  Int
  accountName  String     @db.VarChar(128)
  txnDate      DateTime
  amount       Decimal    @db.Decimal(12,2)
  description  String?    @db.VarChar(512)
  reference    String?    @db.VarChar(128)
  rawPayload   Json
  franchise    Franchise  @relation(fields: [franchiseId], references: [id])
  matches      BankMatch[]

  @@index([franchiseId, txnDate])
}

model BankMatch {
  id                 Int             @id @default(autoincrement())
  bankTransactionId  Int
  paymentId          Int?
  invoiceId          Int?
  confidence         Decimal         @db.Decimal(5,4)
  matchedBy          String          @db.VarChar(32) // rule/manual
  bankTxn            BankTransaction @relation(fields: [bankTransactionId], references: [id])
  payment            Payment?        @relation(fields: [paymentId], references: [id])
  invoice            Invoice?        @relation(fields: [invoiceId], references: [id])
}

model Employee {
  id                 Int       @id @default(autoincrement())
  franchiseId        Int
  storeId            Int
  loyverseEmployeeId String?   @unique
  name               String
  email              String?   @db.VarChar(191)
  phoneE164          String?   @db.VarChar(32)
  franchise          Franchise @relation(fields: [franchiseId], references: [id])
  store              Store     @relation(fields: [storeId], references: [id])
  shifts             Shift[]
}

model Shift {
  id        Int      @id @default(autoincrement())
  employeeId Int
  storeId   Int
  start     DateTime
  end       DateTime?
  breakMin  Int?     @default(0)
  employee  Employee @relation(fields: [employeeId], references: [id])
  store     Store    @relation(fields: [storeId], references: [id])
}

model DailyCompliance {
  id            Int       @id @default(autoincrement())
  franchiseId   Int
  storeId       Int
  date          DateTime
  submittedById Int
  cashCount     Decimal?  @db.Decimal(10,2)
  cleanlinessOk Boolean   @default(false)
  fridgesOk     Boolean   @default(false)
  tdsPoints     Json?
  notes         String?   @db.Text
  franchise     Franchise @relation(fields: [franchiseId], references: [id])
  store         Store     @relation(fields: [storeId], references: [id])
  submittedBy   User      @relation(fields: [submittedById], references: [id])
  photos        CompliancePhoto[]

  @@unique([storeId, date])
}

model CompliancePhoto {
  id                Int             @id @default(autoincrement())
  dailyComplianceId Int
  photoUrl          String          @db.VarChar(512)
  type              String?         @db.VarChar(64)
  takenAt           DateTime?
  dailyCompliance   DailyCompliance @relation(fields: [dailyComplianceId], references: [id])
}

model AIMessageLog {
  id           Int            @id @default(autoincrement())
  franchiseId  Int
  customerId   Int?
  type         String         @db.VarChar(64)
  messageText  String         @db.Text
  contextJson  Json?
  createdById  Int
  createdAt    DateTime       @default(now())
  sentVia      MessageChannel @default(whatsapp_web)
  franchise    Franchise      @relation(fields: [franchiseId], references: [id])
  customer     Customer?      @relation(fields: [customerId], references: [id])
  createdBy    User           @relation("MessageCreatedBy", fields: [createdById], references: [id])
}

model AuditLog {
  id         Int      @id @default(autoincrement())
  userId     Int
  action     String   @db.VarChar(64)
  resource   String   @db.VarChar(64)
  resourceId Int?
  beforeJson Json?
  afterJson  Json?
  ip         String?  @db.VarChar(64)
  ua         String?  @db.VarChar(255)
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}
```

> **Notes**
> - Consider partitioning or archival strategies for high-growth tables (`receipt`, `invoice`, `audit_log`).
> - Monetary fields use `Decimal`; prefer integer cents if you ever need exact rounding controls.

---

## Appendix B: RBAC & Route Guards (NestJS)
This shows how to enforce roles and franchise scoping.

```ts
// roles.enum.ts
export enum RoleName {
  SUPER_USER = 'super_user',
  OWNER = 'owner',
  MANAGER = 'manager',
  ADMIN = 'admin',
  CASHIER = 'cashier',
  CUSTOMER = 'customer',
}

// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);

// roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { RoleName } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // injected by JWT auth guard
    return required.some(r => user.roles?.includes(r));
  }
}

// tenant.guard.ts (franchise scoping)
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    const franchiseId = parseInt(req.headers['x-franchise-id'] || req.query.franchiseId || req.body?.franchiseId);
    if (!franchiseId) throw new ForbiddenException('Franchise scope required');
    if (user.role !== 'super_user' && user.franchiseId !== franchiseId) {
      throw new ForbiddenException('Forbidden for this franchise');
    }
    req.franchiseId = franchiseId;
    return true;
  }
}

// example.controller.ts
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles(RoleName.MANAGER, RoleName.OWNER, RoleName.SUPER_USER)
@Get('invoices')
findInvoices(@Req() req) {
  return this.invoiceService.list({ franchiseId: req.franchiseId });
}
```

**Policies & Practices**
- Enforce **least privilege**: default-deny, opt-in route access via `@Roles`.
- JWT payload should include: `userId`, `roles[]`, `franchiseId` (for non-super users), `exp`.
- Add **MFA** for super users/owners when feasible.
- Session timeout (e.g., 12h) and refresh tokens for longer-lived sessions.
- Log every access-denied event to `audit_log` for review.

---

## Appendix C: .env Template (Example)
This file defines environment variables for both **web** (Next.js) and **api** (NestJS). Replace placeholders with actual values.

```dotenv
# Common
NODE_ENV=production
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DBNAME
JWT_SECRET=replace_with_long_random_string
NEXTAUTH_SECRET=replace_with_long_random_string
APP_BASE_URL=https://pwltt.co.za
API_BASE_URL=https://api.pwltt.co.za

# NextAuth (web)
NEXTAUTH_URL=https://pwltt.co.za

# Mail (SMTP)
SMTP_HOST=mail.pwltt.co.za
SMTP_PORT=465
SMTP_USER=no-reply@pwltt.co.za
SMTP_PASS=replace_with_password
SMTP_FROM="Perfect Water <no-reply@pwltt.co.za>"

# OpenAI
OPENAI_API_KEY=replace_with_openai_key

# Cron security
CRON_SECRET=replace_with_long_random_string
```

---

## Appendix C: .env Template (Copy & Customize)
> Create separate env files for **web (Next.js)** and **api (NestJS)** in cPanel Node App Manager. Do **not** commit real secrets.

### Web (.env for Next.js)
```
NODE_ENV=production
APP_BASE_URL=https://pwltt.co.za
API_BASE_URL=https://api.pwltt.co.za

# NextAuth
NEXTAUTH_URL=https://pwltt.co.za
NEXTAUTH_SECRET=replace-with-strong-random

# Auth provider (if using email/password or magic links)
JWT_SECRET=replace-with-strong-random

# Database (web may not need direct DB access; keep only if required)
# DATABASE_URL=mysql://USER:PASS@HOST:3306/DBNAME

# OpenAI (AI Messaging)
OPENAI_API_KEY=sk-...

# Optional feature flags
FEATURE_AI_MESSAGING=true
FEATURE_BANK_RECONCILIATION=true
```

### API (.env for NestJS)
```
NODE_ENV=production
APP_BASE_URL=https://pwltt.co.za
API_BASE_URL=https://api.pwltt.co.za

# Database
DATABASE_URL=mysql://USER:PASS@HOST:3306/DBNAME

# JWT
JWT_SECRET=replace-with-strong-random
TOKEN_TTL_HOURS=12

# Cron security (protect internal cron endpoints)
CRON_SECRET=replace-with-secret-used-in-cron-header

# SMTP (invoices/statements)
SMTP_HOST=smtp.pwltt.co.za
SMTP_PORT=587
SMTP_USER=no-reply@pwltt.co.za
SMTP_PASS=replace-me
SMTP_FROM="Perfect Water Louis Trichardt <no-reply@pwltt.co.za>"

# OpenAI (AI Messaging)
OPENAI_API_KEY=sk-...

# File storage
UPLOADS_DIR=/home/USER/apps/web/uploads
# or S3-compatible later
# S3_ENDPOINT=
# S3_BUCKET=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=

# Loyverse (if using API keys)
LOYVERSE_API_KEY=replace-me
LOYVERSE_BASE_URL=https://api.loyverse.com
```

---

**Last Updated:** 2025-09-03

