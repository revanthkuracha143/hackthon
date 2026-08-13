# 🩺 API DOCTOR — AI-Powered API Debugging & Repair Agent

> **"Your API is broken. Let AI find out why and fix it."**

API Doctor is an autonomous, developer-focused hackathon MVP that accepts a Node.js + Express project ZIP file, executes it in an isolated temporary workspace, captures API test failures (HTTP 4xx/5xx responses and runtime errors), performs intelligent source code analysis, queries LLMs for root-cause diagnosis, generates minimal code fixes, and automatically verifies whether the fix resolved the error.

---

## 📋 Table of Contents

- [1. Problem Statement](#1-problem-statement)
- [2. Solution Overview](#2-solution-overview)
- [3. Target Users](#3-target-users)
- [4. Key Features](#4-key-features)
- [5. System Architecture](#5-system-architecture)
- [6. Technology Stack](#6-technology-stack)
- [7. Repository Structure](#7-repository-structure)
- [8. Installation & Setup](#8-installation--setup)
- [9. Environment Variables](#9-environment-variables)
- [10. Running the Application](#10-running-the-application)
- [11. Try Demo Mode (30-Sec Test)](#11-try-demo-mode-30-sec-test)
- [12. Automated Testing](#12-automated-testing)
- [13. Security & Safety Model](#13-security--safety-model)
- [14. Future Improvements](#14-future-improvements)

---

## 1. Problem Statement

Debugging broken REST API endpoints usually requires reading cryptic stack traces, searching through controller files, crafting manual curl requests, making trial-and-error code edits, and repeatedly restarting the server to verify fixes. This process consumes valuable developer time during hackathons and production incident triage.

---

## 2. Solution Overview

API Doctor automates the entire debugging lifecycle in a safe 6-step visual journey:

```
UPLOAD ZIP ➔ PROJECT ANALYSIS ➔ RUN & TEST API ➔ AI DIAGNOSIS ➔ CODE DIFF ➔ AUTO-VERIFICATION
```

1. **Isolated Execution**: Unpacks uploaded ZIP into temporary system workspace (`/tmp/api-doctor-workspaces`).
2. **AST & Route Discovery**: Detects framework (Express), main entry point (`server.js`), and API routes (`/api/users/:id`).
3. **Process Spawning & Test Capture**: Launches Node.js server on isolated local ports, executes HTTP requests, and captures HTTP status, response body, stdout/stderr, and runtime stack traces.
4. **AI Diagnosis**: Feeds failure context & relevant source snippets to AI (Gemini / OpenAI / Mock mode) to produce structured JSON root-cause analyses.
5. **Code Fix & Visual Diff**: Displays Before/After code patches and diffs with clear rationale.
6. **Automated Retest & Verification**: Applies fix strictly to a temporary working copy (`workspace/patched`), restarts the server, retests the endpoint, and outputs **Before: 500 ❌ ➔ After: 200 ✅**.
7. **Original Preservation**: Never touches or mutates the developer's original uploaded files.

---

## 3. Target Users

- **Full-Stack & Backend Developers** looking to accelerate API debugging.
- **Hackathon Teams & Evaluators** needing instant root-cause analysis and automated verification.
- **QA Engineers** validating backend error handlers and edge-case behavior.

---

## 4. Key Features

- ⚡ **30-Second Demo Mode**: Built-in `examples/broken-express-api` bug scenario ready for single-click evaluation.
- 🛡️ **Zip Slip & Path Traversal Guard**: Secure ZIP validation and extraction.
- 🧠 **Multi-Provider AI Abstraction**: Supports Google Gemini (`gemini-2.5-flash`), OpenAI (`gpt-4o-mini`), and an offline Mock Provider.
- 🎨 **Modern Dark UI**: Designed with React 18, Vite, Tailwind CSS, Lucide icons, glassmorphism, and responsive status badges.
- 🧪 **Full Test Coverage**: Jest & Supertest integration suite testing end-to-end lifecycle.

---

## 5. System Architecture

```
                       +-------------------------------+
                       |   React + Vite Frontend UI    |
                       +---------------+---------------+
                                       | HTTP REST
                                       v
                       +---------------+---------------+
                       |   Express Backend Controller  |
                       +---------------+---------------+
                                       |
        +------------------+-----------+-----------+-------------------+
        |                  |                       |                   |
        v                  v                       v                   v
+---------------+  +---------------+       +---------------+   +---------------+
|  Workspace    |  |    Project    |       | Process & API |   |  AI & Fixer   |
|  Manager      |  |   Analyzer    |       |    Tester     |   |    Engine     |
+---------------+  +---------------+       +---------------+   +---------------+
| Temp Directory|  | Entry point & |       | Spawns Node   |   | Gemini/OpenAI |
| Isolation &   |  | Route         |       | child process |   | JSON Patch &  |
| Backup copies |  | discovery     |       | & HTTP runner |   | Visual Diff   |
+---------------+  +---------------+       +---------------+   +---------------+
```

---

## 6. Technology Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Vanilla CSS + Tailwind CSS
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (v18+) & Express
- **File & Process Tools**: `adm-zip`, `multer`, `diff`, `uuid`
- **Testing**: Jest & Supertest

### AI Integration
- **Providers**: Google Gemini (`v1beta`), OpenAI (`v1/chat/completions`), Offline Mock Engine

---

## 7. Repository Structure

```
api-doctor/
├── backend/
│   ├── src/
│   │   ├── controllers/         # ProjectController handlers (upload, test, diagnose, fix, verify)
│   │   ├── routes/              # Express API endpoints (/api/projects/...)
│   │   ├── services/
│   │   │   ├── ai/              # AiService (Gemini, OpenAI, Mock provider)
│   │   │   ├── analyzer/        # ProjectAnalyzer & CodeAnalyzer
│   │   │   ├── fixer/           # FixerService & Diff Generator
│   │   │   ├── tester/          # ProcessManager & ApiTester
│   │   │   └── workspace/       # WorkspaceManager (Zip extraction & temp copies)
│   │   └── server.js            # Express server entry point
│   ├── tests/                   # Jest & Supertest suite
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Header, WorkflowStepper, UploadZone, TestResultsTable, etc.
│   │   ├── services/            # API client
│   │   ├── App.jsx              # Main wizard application
│   │   └── index.css            # Tailwind CSS styling
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── examples/
│   └── broken-express-api/      # Intentionally broken Express API demo project
│       ├── controllers/
│       ├── routes/
│       ├── server.js            # Bug: req.params.userID vs req.params.id
│       └── README.md
├── .env.example
├── README.md
└── package.json                 # Monorepo root script runner
```

---

## 8. Installation & Setup

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-username/api-doctor.git
   cd api-doctor
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

---

## 9. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configurable options in `.env`:

```ini
# Server Configuration
PORT=5001
FRONTEND_URL=http://localhost:5173

# AI Configuration
# AI_PROVIDER options: 'gemini', 'openai', or 'mock' (default if no key set)
AI_PROVIDER=gemini
AI_API_KEY=your_api_key_here
AI_MODEL=gemini-2.5-flash
```

> 💡 **Note**: If no `AI_API_KEY` is specified, API Doctor seamlessly uses its built-in **Mock Diagnostic Engine**, allowing full testing offline!

---

## 10. Running the Application

Start both frontend and backend concurrently:

```bash
npm run dev
```

- **Frontend Dashboard**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Backend API**: Running on [http://localhost:5001](http://localhost:5001).

---

## 11. Try Demo Mode (30-Sec Test)

1. Open [http://localhost:5173](http://localhost:5173).
2. Click **"Try Demo API (30-Sec Test)"**.
3. Click **"Start API Analysis & Test Endpoints"**.
4. Observe HTTP 500 error on `GET /api/users/1`.
5. Click **"Investigate Failure with AI Doctor"**.
6. Review root cause: `req.params.userID` is undefined.
7. Click **"Review Code Fix & Diff"** ➔ **"Apply Fix & Verify API"**.
8. Verify final status: **Before: 500 ❌ ➔ After: 200 ✅**.

---

## 12. Automated Testing

Run the automated backend Jest test suite:

```bash
npm test
```

---

## 13. Security & Safety Model

- **Workspace Isolation**: Executed code runs inside isolated OS temp folders (`/tmp/api-doctor-workspaces/<id>`).
- **Zip Slip Defense**: Path normalization prevents malicious ZIP entries from escaping the workspace.
- **Process Boundaries**: Spawns isolated Node.js child processes on free ports with explicit 8-second execution timeouts.
- **Read-Only Original**: Fixes are applied only to `workspace/patched`. The original project files are never mutated.

---

## 14. Future Improvements

- Support for additional backend frameworks (Koa, Fastify, NestJS, Python FastAPI).
- Interactive AI chat to refine generated patches.
- Downloadable HTML debugging reports.

---

## 📜 License

MIT License. Built for Hackathons & Developer Productivity.
