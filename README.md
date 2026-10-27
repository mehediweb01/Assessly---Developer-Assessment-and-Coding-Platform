# Assessly --- Developer Assessment & Coding Platform

Assessly is a developer assessment platform designed to help companies
create technical assessments, invite candidates, collect submissions,
and review candidate performance in one place.

**Live Demo:**
[Assessly](https://assessly-developer-assessment-and-c.vercel.app/)

---

## Overview

Assessly provides an assessment workflow for companies and candidates,
with role-based access and a structured process from assessment creation
to submission and evaluation.

### User Roles

- **Admin** --- manages company accounts and administrative
  operations.
- **Company** --- creates and manages assessments, adds questions,
  invites candidates, reviews submissions, and manages assessment
  credits.
- **Candidate** --- receives invitations, verifies access, starts
  assessments, answers questions, and submits attempts.

## Key Features

- **Authentication and authorization**
  - Email/password authentication
  - Google sign-in support
  - Role-based access control for Admin, Company, and Candidate
  - Protected routes and password hashing
- **Assessment management**
  - Create, update, publish, and close assessments
  - Configure duration and assessment details
  - Add multiple question types to an assessment
- **Question types**
  - Multiple-choice questions (MCQ)
  - Written questions
  - Coding questions
- **Candidate invitations**
  - Invite registered candidates to an assessment
  - Invitation status tracking
  - OTP-based invitation verification
- **Timed assessment attempts**
  - Candidates start an assessment through an invitation
  - Attempt records track start time, expiry time, and status
  - Server-side checks help prevent unauthorized or duplicate
    attempts
- **Submissions and evaluation**
  - Store candidate answers against the relevant attempt and
    question
  - Automatically evaluate MCQ answers
  - Support review and manual evaluation for written and coding
    responses
- **Payments and assessment credits**
  - bKash payment integration workflow
  - Payment history and transaction records
  - Company assessment-credit tracking
- **API design**
  - Versioned REST API under `/api/v1`
  - Request validation and consistent API responses
  - Role-protected endpoints

> Feature availability depends on the current deployed version. Some
> integrations or workflows may require valid environment configuration.

## Technology Stack

Area Technologies

---

Frontend Next.js, React, TypeScript, Tailwind CSS
Backend Node.js, Express.js, TypeScript
Database PostgreSQL
ORM Prisma
Temporary data / OTP Redis
Authentication JWT, bcrypt, Google OAuth
Payments bKash Checkout API
Deployment Vercel (live frontend)

## Assessment Workflow

1.  An Admin creates a Company account.
2.  The Company creates an assessment and adds MCQ, written, and/or
    coding questions.
3.  The Company invites a registered Candidate.
4.  The Candidate verifies and accepts the invitation.
5.  The Candidate views the assessment and starts an attempt.
6.  Assessly records the attempt start and expiry times.
7.  The Candidate answers questions and submits the attempt.
8.  MCQ answers can be auto-evaluated; written and coding answers can be
    reviewed manually.
9.  The Company reviews the submission and assessment outcome.

## Project Structure

The backend is organized by feature/module to keep controllers,
services, routes, and validations separate.

```text
src/
├── app/
│   ├── routes/
│   ├── middlewares/
│   └── errors/
├── config/
├── lib/
│   ├── prisma.ts
│   └── redis.ts
├── modules/
│   ├── auth/
│   ├── user/
│   ├── admin/
│   ├── assessment/
│   ├── question/
│   ├── invitation/
│   ├── attempt/
│   ├── submission/
│   └── payment/
├── templates/
├── utils/
├── app.ts
└── server.ts

prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

_Adjust this tree to match the final repository structure._

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- PostgreSQL
- Redis (for OTP and temporary invitation verification data)
- Google OAuth credentials, email-provider credentials, and bKash
  credentials if you want to run those integrations locally

### Installation

```bash
git clone https://github.com/mehediweb01/Assessly---Developer-Assessment-and-Coding-Platform.git
cd Assessly---Developer-Assessment-and-Coding-Platform
npm install
```

Create a `.env` file in the project root. Example variables:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/assessly"
REDIS_URL="redis://localhost:6379"

JWT_ACCESS_SECRET="replace-with-a-long-random-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="replace-with-another-long-random-secret"
JWT_REFRESH_EXPIRES_IN="7d"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL=""

RESEND_API_KEY=""
EMAIL_FROM=""

BKASH_APP_KEY=""
BKASH_APP_SECRET=""
BKASH_USERNAME=""
BKASH_PASSWORD=""
BKASH_BASE_URL=""

ADMIN_EMAIL=""
ADMIN_PASSWORD=""
```

Only configure variables used by your current implementation. Never
commit real secrets or your `.env` file.

### Database Setup

Run the Prisma migration command configured in your project:

```bash
npx prisma migrate dev
npx prisma generate
```

If your Prisma 7 setup uses a separate `prisma.config.ts`, make sure it
loads the environment variables correctly before running Prisma
commands.

### Run Locally

Use the scripts defined in `package.json`. A typical setup may use:

```bash
npm run dev
```

For production, build and run the compiled application using the scripts
configured in your repository.

## API Overview

The API is versioned under `/api/v1`. Exact routes may vary with the
implementation.

---

Area Example endpoint Purpose

---

Authentication `/api/v1/auth/login` Sign in

Assessments `/api/v1/assessment` List or create
assessments based on
role

Assessment details `/api/v1/assessment/:assessmentId` Retrieve assessment
details

Start assessment `/api/v1/assessment/:assessmentId/start` Create or resume an
attempt

Attempts `/api/v1/attempts/:attemptId` Retrieve an attempt and
its questions

Submissions `/api/v1/attempts/:attemptId/answers/:questionId` Save an answer, if
supported by the
implementation

Invitations `/api/v1/invitation` Retrieve invitations

Payments `/api/v1/payment` View payment records

---

For the full request/response contract, use the project's Postman
collection or API documentation if available.

## Security Notes

- Store passwords as hashes; never store plaintext passwords.
- Keep secrets in environment variables or your deployment provider's
  secret manager.
- Derive the authenticated user ID and role from the verified
  session/token, not from client-supplied identity fields.
- Validate input and enforce role-based permissions on the server.
- Verify payment status with the bKash server before adding credits;
  do not trust frontend redirects alone.
- Protect assessment answer keys from candidate-facing responses.
- Use database constraints and transactions where duplicate attempts
  or payment-credit updates must be prevented.

## Future Improvements

- More detailed reporting and analytics for companies
- Expanded audit logging and activity history
- Stronger anti-cheating controls
- Additional assessment and evaluation options
- More complete automated API documentation and integration tests

## Contributing

Contributions and suggestions are welcome. If you find a bug or have an
improvement, please open an issue or submit a pull request in the
project repository.

## License

No license has been specified yet. Add a `LICENSE` file before
distributing the project for reuse.
