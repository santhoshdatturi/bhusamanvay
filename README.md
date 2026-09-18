<p align="center">
  <img src="public/logo.svg" width="110" height="110" alt="BhuSamanvay Logo" />
</p>

<h1 align="center">BhuSamanvay</h1>

<p align="center">
  <strong>Unified Indian Land Records Digitization, Multi-Lingual AI OCR, & Geospatial Cadastral Intelligence Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=flat-square" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169e1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Coverage-28_States_+_8_UTs-green?style=flat-square" alt="Indian States Coverage" />
</p>

---

## Overview

**BhuSamanvay** is an enterprise-grade, full-stack land intelligence platform purpose-built for the ingestion, extraction, human review, and canonical normalization of Indian land records and cadastral spatial maps.

Across India, land records are fragmented across state-specific Land Record Management Systems (LRMS) such as Dharani, MeeBhoomi, MahaBhumi, Bhulekh, AnyRoR, and Bhoomi. These documents vary in format, terminology, scripts, and structure.

BhuSamanvay provides a unified 4-phase digitization lifecycle to transform unstructured PDFs, scanned village maps, and land registries into strictly typed canonical relational structures with bounding box evidence, per-field confidence scoring, and spatial GeoJSON integration.

---

## Key Features

- **Multi-Modal AI Vision & OCR Extraction**: Seamless extraction of regional script land documents (Hindi, Telugu, Marathi, Kannada, Gujarati, Tamil, etc.) with bounding-box citations and per-field confidence metrics.
- **8 Standardized Land Record Document Taxonomies**:
  - `spatial_map`: Village cadastral maps, Tippon, FMB (Field Measurement Book), boundary coordinates, and GeoJSON geometries.
  - `ownership`: Record of Rights (ROR), Jamabandi, 7/12 extract, patta passbooks, ownership shares.
  - `parcel`: Khasra/survey plot numbers, total vs cultivable area, soil classification, boundary demarcations.
  - `cultivation`: Pahani, Khasra Girdawari, crop cycles (Kharif, Rabi, Zaid), irrigation sources, tenant data.
  - `mutation`: Namantaran, Dakhil Kharij, transfer deeds, inheritance sanctions, order numbers.
  - `account_holding`: Khatauni, Khata registers, consolidated holding records.
  - `encumbrance`: Non-encumbrance / Encumbrance Certificates (EC), mortgages, bank charges, lease caveats.
  - `property_card`: Urban property registers, Nazool land records, Akhiv Patrika, municipal ward/plot allocations.
- **Pan-India Geographic Coverage**: First-class enum validation and state-level scoping across all **28 States and 8 Union Territories**.
- **Human-in-the-Loop Workbench**: Interactive side-by-side verification UI featuring synchronized PDF rendering, field-level confidence indicators, and schema editing prior to database commit.
- **Developer REST API & Token Scopes**: Granular API keys with capability-based scopes (`docs:read`, `files:upload`, `documents:write`, `extraction:run`, `canonical:write`, `digitized:read`, `admin:manage`).
- **Interactive Documentation Portal**: Built-in developer portal at `/docs` with live cURL examples, parameter specifications, schema catalogs, and lifecycle guides.
- **Secure Cloud Object Storage**: AWS S3 / Cloudflare R2 presigned upload and download flows with 15-minute cryptographically signed expiring URLs.
- **Enterprise Access & Audit**: Built-in Better-Auth with role-based permissions (`admin`, `reviewer`) and complete audit logging.

---

## Digitization Lifecycle

```mermaid
flowchart LR
    A[Raw Document Scan / PDF] -->|POST /api/files/upload| B(File Provisioned)
    B -->|POST /api/documents| C[Document Registered: uploaded]
    C -->|POST /api/documents/:id/process| D[AI Vision OCR Extraction]
    D --> E[Staged Schema: extracted]
    E -->|Reviewer Verification| F{Human Review}
    F -->|Correction / Approval| G[POST /api/documents/:id/commit]
    G --> H[(Canonical Relational DB)]
```

1. **Upload (`/api/files/upload`)**: Multipart PDF/image stream ingested to S3/R2 object storage with hash verification.
2. **Register (`/api/documents`)**: Document metadata, assigned Indian state, and document taxonomy registered.
3. **Extract (`/api/documents/:id/process`)**: AI spatial OCR analyzes layout, parses fields, and stages structured JSON with confidence ratings.
4. **Commit (`/api/documents/:id/commit`)**: Human reviewer inspects and commits the verified record to the canonical database tables.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Database** | [Neon Serverless PostgreSQL](https://neon.tech/) |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) + [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) |
| **Validation** | [Zod](https://zod.dev/) + [Drizzle-Zod](https://github.com/drizzle-team/drizzle-orm/tree/main/packages/drizzle-zod) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Base UI](https://base-ui.com/) |
| **Icons** | [Hugeicons React](https://hugeicons.com/) |
| **Authentication** | [Better-Auth](https://better-auth.com/) + Drizzle Adapter |
| **Storage** | [AWS SDK S3 Client](https://aws.amazon.com/sdk-for-javascript/) (S3 / Cloudflare R2 / GCS) |
| **AI / OCR** | [LangChain](https://js.langchain.com/) + Google GenAI (Gemini) |

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **Package Manager**: `npm`, `pnpm`, or `bun`
- **PostgreSQL**: Neon database instance or local PostgreSQL `15+`
- **Object Storage**: S3-compatible bucket (AWS S3, Tigris, Cloudflare R2, or MinIO)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/santhoshdatturi/bhusamanvay.git
   cd bhusamanvay
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and provide your credentials:
   ```bash
   cp .env.example .env
   ```

   Configure the required variables:
   ```env
   # Database (Neon PostgreSQL)
   DATABASE_URL=postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/bhusamanvay?sslmode=require
   DATABASE_URL_UNPOOLED=postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/bhusamanvay?sslmode=require

   # Better Auth
   BETTER_AUTH_SECRET=your-secret-key-min-32-chars-long-for-encryption
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Object Storage (S3 / R2 / GCS)
   AWS_ENDPOINT_URL_S3=https://storage.googleapis.com
   AWS_REGION=auto
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key

   # Logging
   LOG_LEVEL=debug
   ```

4. **Synchronize Database Schema:**
   ```bash
   npm run db:push
   ```

5. **Create Initial Admin User:**
   ```bash
   npm run user:create -- --name="Admin User" --email="admin@bhusamanvay.gov.in" --password="SuperSecurePassword123!" --role="admin"
   ```

6. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js local development server with Turbopack |
| `npm run build` | Compiles the production build |
| `npm run start` | Runs the production build server |
| `npm run lint` | Executes ESLint across all TypeScript and React files |
| `npm run typecheck` | Validates TypeScript types across the entire codebase (`tsc --noEmit`) |
| `npm run db:push` | Pushes Drizzle ORM schema changes directly to the PostgreSQL database |
| `npm run db:generate` | Generates SQL migration files from Drizzle schema |
| `npm run db:migrate` | Runs pending database migrations |
| `npm run user:create` | CLI tool to create admin or reviewer user accounts |

---

## Architecture & Directory Structure

```
bhusamanvay/
├── app/                        # Next.js App Router (Pages, Layouts, API Routes)
│   ├── (dashboard)/            # Authenticated Reviewer & Admin Dashboard
│   │   ├── documents/          # Document Ingestion, Workbench, & Viewer
│   │   └── api-keys/           # API Key Management & Token Scopes
│   ├── (docs)/                 # Public Interactive API Documentation
│   │   └── docs/               # Pipeline, Auth, Endpoints, & State References
│   ├── api/                    # REST API Endpoints (/files, /documents, /digitized, etc.)
│   ├── auth/                   # Authentication Pages (Sign In)
│   ├── layout.tsx              # Root Layout & Theming
│   └── globals.css             # Tailwind CSS Design Tokens & Base Styles
├── components/                 # React UI Components
│   ├── api-keys/               # API Key Creation & Token Dialogs
│   ├── auth/                   # Login Forms & Auth Cards
│   ├── docs/                   # API Documentation Layout, Sidebar, & Code Blocks
│   ├── documents/              # Extraction Panel, Canonical Views, & PDF Viewer
│   ├── layout/                 # Sidebar, App Navigation, & Header
│   └── ui/                     # shadcn/ui Component Primitives
├── lib/                        # Core Application Services & Utilities
│   ├── actions/                # Server Actions (Mutations & Validation)
│   ├── auth/                   # Better-Auth Configuration & Server Boundaries
│   ├── constants/              # Indian States, Document Enums, & Lookup Tables
│   ├── db/                     # Drizzle ORM Setup, Neon Connection, & Migrations
│   │   └── schema/             # Canonical, Documents, Files, Auth, & Key Schemas
│   ├── services/               # Isolated Domain Business Logic & Storage Handlers
│   ├── storage/                # S3 Object Storage Client & Presigned URL Engines
│   ├── validations/            # Zod Schemas for Input Validation
│   └── utils.ts                # Styling & Helper Utilities
├── public/                     # Static Assets (Brand Logo, Icons)
│   └── logo.png                # Official BhuSamanvay Emblem
├── scripts/                    # Maintenance & Seed Scripts (User Provisioning)
└── drizzle.config.ts           # Drizzle Kit Configuration
```

---

## API Overview

All API requests require an authorized `Bearer <API_KEY>` token passed in the `Authorization` header.

| Method | Endpoint | Required Scope | Description |
|---|---|---|---|
| `POST` | `/api/files/upload` | `files:upload` | Multipart file upload to secure cloud storage |
| `POST` | `/api/files` | `files:upload` | Provision a file record metadata entry |
| `GET` | `/api/files/:id` | `docs:read` | Retrieve file details and 15-minute presigned download URL |
| `DELETE` | `/api/files/:id` | `documents:write` | Remove file and associated object from storage |
| `POST` | `/api/documents` | `documents:write` | Register uploaded file as a land record document |
| `GET` | `/api/documents` | `docs:read` | List, search, filter, and paginate documents |
| `GET` | `/api/documents/:id` | `docs:read` | Retrieve full document metadata and staged extraction |
| `PATCH` | `/api/documents/:id` | `documents:write` | Update document title or state classification |
| `POST` | `/api/documents/:id/process` | `extraction:run` | Trigger AI multi-lingual OCR & spatial data extraction |
| `POST` | `/api/documents/:id/commit` | `canonical:write` | Commit verified extraction to canonical relational tables |
| `GET` | `/api/digitized/:docType` | `digitized:read` | Query canonical records by state, district, or survey number |
| `GET` | `/api/digitized/:docType/:id`| `digitized:read` | Retrieve specific canonical record by UUID |

Full interactive endpoint specifications, JSON request/response bodies, and error code references are available in the in-app documentation portal at `/docs`.

---

## License

This project is proprietary software developed for the BhuSamanvay Land Records Digitization initiative.
