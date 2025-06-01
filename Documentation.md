# Project Management App – Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Feature Overview](#feature-overview)
3. [Design Choices](#design-choices)
4. [Database Schema](#database-schema)
5. [Architectural Patterns](#architectural-patterns)
6. [Component Structure](#component-structure)
7. [API & Data Flow](#api--data-flow)
8. [Security Considerations](#security-considerations)
9. [Deployment & DevOps](#deployment--devops)
10. [Extensibility & Future Improvements](#extensibility--future-improvements)

---

## Introduction

This document provides a comprehensive overview of the Project Management App, detailing its features, design decisions, database schema, architectural patterns, and other technical aspects.

---

## Feature Overview

### 1. User Authentication

- **Registration & Login:** Secure user registration and login with hashed passwords.
- **Session Management:** Persistent sessions using JWT or cookies.
- **Role Management:** Support for different user roles (e.g., Admin, Member).

### 2. Project Management

- **CRUD Operations:** Create, read, update, and delete projects.
- **Team Assignment:** Assign users to projects.
- **Project Details:** View project description, status, and timeline.

### 3. Task Management

- **CRUD Operations:** Create, read, update, and delete tasks.
- **Assignment:** Assign tasks to users.
- **Status Tracking:** Track task status (To Do, In Progress, Done).
- **Due Dates & Priorities:** Set deadlines and priorities for tasks.

### 4. Kanban Board

- **Drag & Drop:** Move tasks between columns (statuses).
- **Real-Time Updates:** Reflect changes instantly for all users.

### 5. Gantt Chart

- **Timeline Visualization:** Visualize project and task timelines.
- **Dependencies:** (Planned) Show task dependencies.

### 6. Analytics Dashboard

- **Project Metrics:** Visualize progress, completed tasks, overdue items.
- **User Productivity:** Track user contributions.

---

## Design Choices

- **Next.js:** Chosen for its hybrid static & server rendering, routing, and API support.
- **TypeScript:** Ensures type safety and maintainability.
- **Prisma ORM:** Simplifies database access and migrations.
- **SST (Serverless Stack):** Enables scalable, serverless deployment.
- **Tailwind CSS:** Provides utility-first, customizable styling.
- **TRPC:** Type-safe API communication between frontend and backend.
- **Component-Driven Development:** Promotes reusability and modularity.

---

## Database Schema

#### Example Prisma Schema (Excerpt)

```prisma
model User {
  id               String               @id @default(cuid())
  name             String
  email            String              @unique
  password         String

  // Relations
  projectAssignments ProjectAssignment[]
  tasksAssigned      Task[]             @relation("AssignedTasks")
  tasksCreated       Task[]             @relation("CreatedTasks")
}

model Project {
  id                 String              @id @default(cuid())
  name               String
  details            String
  createdAt          DateTime            @default(now())
  summary            String?
  // Relations
  projectAssignments ProjectAssignment[]
  tasks              Task[]
}

model ProjectAssignment {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  projectId  String
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  assignedAt DateTime @default(now())
  role       String?
}

model Task {
  id            String       @id @default(cuid())
  title         String
  description   String
  status        TaskStatus   @default(TODO)
  priority      TaskPriority @default(MEDIUM)
  startDate     DateTime   @default(now())
  deadline      DateTime
  tags          String[]     // Array of tag strings
  type          TaskType     @default(TASK)

  // Project relationship
  projectId     String
  project       Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Created by user
  createdById   String
  createdBy     User         @relation("CreatedTasks", fields: [createdById], references: [id], onDelete: Cascade)

  // Assigned to user (optional)
  assignedToId  String?
  assignedTo    User?        @relation("AssignedTasks", fields: [assignedToId], references: [id], onDelete: Cascade)

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

enum TaskType {
  BUG
  FEATURE
  IMPROVEMENT
  TASK
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}
```

---

## Architectural Patterns

- **Monorepo Structure:** Keeps frontend, backend, and infrastructure code together.
- **API Layer:** Uses Next.js API routes and TRPC for type-safe, efficient communication.
- **Component-Based UI:** React components for modular, reusable UI.
- **Repository Pattern:** Encapsulates data access logic (via Prisma).
- **Serverless Deployment:** SST for scalable, cost-effective hosting.

---

## Component Structure

- **UI Components:** Buttons, modals, forms, cards, etc.
- **Feature Components:** KanbanBoard, GanttChart, AnalyticsDashboard.
- **Layout Components:** Sidebar, Navbar, Breadcrumbs, BackButton.
- **Page Components:** Dashboard, Projects, Tasks, Analytics, Auth.

---

## API & Data Flow

- **Frontend:** Uses React hooks and context for state management.
- **Backend:** Next.js API routes and TRPC routers handle business logic.
- **Database:** Prisma ORM manages data access and migrations.
- **Data Fetching:** SWR or React Query (if used) for efficient data fetching and caching.

---

## Security Considerations

- **Authentication:** Secure password hashing, JWT/cookie-based sessions.
- **Authorization:** Role-based access control for sensitive actions.
- **Input Validation:** Server-side validation for all API endpoints.
- **Environment Variables:** Secrets managed via `.env` files.

---

## Deployment & DevOps

- **SST:** Serverless deployment for scalability and cost efficiency.
- **CI/CD:** (Recommended) Use GitHub Actions or similar for automated testing and deployment.
- **Linting & Formatting:** Enforced via ESLint and Prettier.

---

## Extensibility & Future Improvements

- **Notifications:** Real-time updates and notifications for users.
- **Integrations:** Calendar, Slack, or email integrations.
- **Advanced Analytics:** More detailed reporting and insights.
- **Custom Workflows:** Allow users to define custom task statuses and flows.
- **Mobile App:** React Native or PWA for mobile support.

---
