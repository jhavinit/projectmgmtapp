# README.md

## Project Management App

A modern web-based project management application built with Next.js, TypeScript, Prisma, and SST. The app provides tools for managing projects, tasks, analytics, and team collaboration, featuring Kanban boards, Gantt charts, and more.

### Features

- User authentication (register, login)
- Project and task management
- Kanban board and Gantt chart views
- Analytics dashboard
- Responsive UI with reusable components
- Serverless deployment with SST
- Database integration via Prisma

### Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Prisma ORM
- **Database:** (Configured via Prisma, see `prisma/`)
- **Deployment:** SST (Serverless Stack)
- **Linting/Formatting:** ESLint, Prettier
- **Other:** TRPC for type-safe APIs

### Getting Started

#### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL (or your configured database)

#### Installation

```sh
git clone <repo-url>
cd projectmgmtapp
npm install
```

#### Environment Variables

Copy `.env.example` to `.env` and configure your database and other secrets.

#### Database Setup

```sh
npx prisma generate
npx prisma db push

# in case of migration
npx prisma migrate dev

```

#### SST Setup

Go to and fill values for:
NEXTAUTH_URL: "",
NEXTAUTH_SECRET: "",
DATABASE_URL: "",
HUGGING_FACE_API_KEY: "",

```
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "projectmgmtapp",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    new sst.aws.Nextjs("MyWeb", {
      environment: {
        NEXTAUTH_URL: "",
        NEXTAUTH_SECRET: "",
        DATABASE_URL: "",
        HUGGING_FACE_API_KEY: "",
      },
    });
  },
});
```

#### Running the App

```sh
npm run dev
```

#### Building for Production

```sh
npm run build
# npm start
```

#### Linting & Formatting

```sh
npm run lint
npm run format
```

#### Testing

```sh
npm run test
```

#### How to deploy

```sh
npx sst deploy --stage prod
```

### Project Structure

- `src/components/` – Reusable UI components (KanbanBoard, GanttChart, etc.)
- `src/pages/` – Next.js pages (dashboard, analytics, projects, tasks, auth)
- `src/server/` – Server-side logic, API routes, TRPC routers
- `src/utils/` – Utility functions and API helpers
- `prisma/` – Prisma schema and migrations
- `public/` – Static assets
- `styles/` – Global styles (Tailwind CSS)

### Scripts

- `start-database.sh` – Helper script to start the local database

### Deployment

Deployment is managed via SST. See [sst.config.ts](sst.config.ts) for configuration.

---

## Project Requirements Document

### Functional Requirements

1. **User Authentication**

   - Register, login, and logout functionality
   - Secure password storage

2. **Project Management**

   - Create, update, delete, and view projects
   - Assign users to projects

3. **Task Management**

   - Create, update, delete, and view tasks
   - Assign tasks to users
   - Track task status (To Do, In Progress, Done)

4. **Views**

   - Kanban board for task management
   - Gantt chart for project timelines

5. **Analytics**

   - Dashboard with project/task analytics

6. **Navigation**

   - Sidebar, breadcrumbs, and back button for easy navigation

7. **Responsive Design**
   - Mobile and desktop support

### Non-Functional Requirements

- **Performance:** Fast load times, optimized assets
- **Security:** Secure authentication, environment variable management
- **Scalability:** Serverless deployment with SST
- **Maintainability:** Modular codebase, linting, and formatting enforced

### External Dependencies

- Node.js, npm/yarn
- PostgreSQL (or configured DB)
- Prisma ORM
- SST for deployment

### Environment Variables

- Database connection string
- JWT secret (if applicable)
- AWS

---
