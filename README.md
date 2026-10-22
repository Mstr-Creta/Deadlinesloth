# Assignment Deadline Sloth

**A calmer way to turn scattered deadlines into a plan you can actually follow.** Assignment Deadline Sloth takes assignment briefs, syllabi, meeting notes, and personal task lists and turns them into ordered tasks with dates, effort estimates, priorities, and a clear next step.

It is built with React and Vite, a FastAPI backend, and optional local task extraction with Gemma served by Ollama. You can explore the app with sample data without installing or running an AI model.

> **Project status:** Prototype / MVP. Review dates and AI-extracted details before relying on a schedule. See [Deployment](#vercel-deployment) for the hosted-version limits and setup requirements.

## Contents

- [The problem](#the-problem)
- [Who it is for](#who-it-is-for)
- [Features](#features)
- [How Gemma and Ollama help](#how-gemma-and-ollama-help)
- [How it works](#how-it-works)
- [Technology](#technology)
- [Run locally](#run-locally)
- [Vercel deployment](#vercel-deployment)
- [Upload this project to GitHub with Git Bash](#upload-this-project-to-github-with-git-bash)
- [Privacy and limitations](#privacy-and-limitations)

## The problem

Deadlines are often scattered across course portals, PDFs, emails, meeting notes, and quick reminders. A person has to identify each task, work out what comes first, estimate how long it will take, and keep track of progress. That overhead can make a busy week feel harder to start.

Assignment Deadline Sloth gives that list a first, editable structure: what needs doing, when it is due, what to work on next, and what has already been completed.

## Who it is for

- **Students** managing homework, papers, reading, projects, and exam preparation.
- **Personal and professional planners** tracking meeting follow-ups, team check-ins, project work, and everyday commitments.
- **People juggling several kinds of work** who want one list and a clear next action.

### Example scenario

Imagine a student has a chemistry exam on Tuesday, a history paper due Thursday, and a biology worksheet due tomorrow. The details are in a course announcement, a PDF, and a note on their phone. They paste the announcement or upload the files, set the date and hours they can work, and generate a plan. The app extracts tasks, arranges them into “Do Today,” “This Week,” “Later,” or “Needs clarification,” and suggests a next action for each one. As the student checks off work, the plan’s progress bar, activity history, and streak update. If a date was unclear in the source, the app flags it for review instead of quietly treating a guess as fact.

## Features

- Paste task text or upload text, Markdown, and text-based PDF files.
- Generate a task plan with due dates, priority, estimated effort, dependencies, and a suggested next step.
- Switch between **Student**, **Personal / professional**, and **A bit of everything** modes. The selected mode changes the interface color theme.
- Try built-in demo plans for homework, assignments, test schedules, reading, group projects, meeting notes, employee check-ins, project work, follow-ups, and mixed weekly priorities.
- Review saved plans in **Recent plans**. Search the list, see each plan’s completion state, and click a card for a short task preview.
- Mark tasks complete and track progress for the tasks belonging to that plan. Completion updates the activity list, seven-day streak view, and progress indicator.
- Celebrate completion of a plan with a full-window confetti animation.
- Export plan details and progress to Markdown, CSV, JSON, or iCalendar (`.ics`).
- See a daily motivational quote.
- Keep uploaded source files in memory for extraction; original upload files are not saved.

## How Gemma and Ollama help

**Gemma** is the language model that reads the user’s pasted or uploaded text and identifies actionable tasks. The backend asks it for structured task data such as title, type, due date, effort estimate, priority, dependencies, next action, and confidence. The app’s planning code then sorts and groups the extracted tasks into a usable schedule.

**Ollama** runs Gemma on a computer and exposes a local HTTP API (by default, `http://localhost:11434`). This lets the app use local inference instead of requiring a hosted model API for the local development workflow. The app defaults to `gemma3:4b`; the model tag can be changed through backend environment configuration.

The demo data path does not call Gemma or Ollama. When Ollama is unavailable, demos remain available; planning from custom text requires a reachable Ollama server. AI output can misread dates or infer details, so check the generated plan and clarification notes.

## How it works

1. The React interface collects pasted text or a file, planning mode, current date, and available work hours.
2. The browser sends those inputs to FastAPI. PDFs are parsed in memory; text and Markdown files are decoded in memory.
3. For custom input, FastAPI calls the configured Gemma model through Ollama and validates the structured result.
4. The planning layer assigns tasks to time buckets and returns the plan to the interface.
5. The backend saves generated plan records in SQLite. Per-task completion checkmarks are stored in the browser’s local storage.
6. The user can review tasks, check progress, and export a plan from the browser.

```text
React + Vite  ──HTTP──>  FastAPI  ──local HTTP──>  Ollama / Gemma
                              │
                              └── SQLite plan history
Browser local storage ─────────── task completion checkmarks
```

## Technology

| Area | Technology |
| --- | --- |
| Interface | React 19, Vite 6, CSS |
| API | FastAPI, Pydantic |
| AI inference | Gemma through Ollama (optional for demos) |
| Document extraction | `pypdf` for text-based PDFs |
| Plan history | SQLite |
| Task completion | Browser local storage |

## Run locally

### Requirements

- Python 3.11 or newer
- Node.js 20 or newer and npm
- [Ollama](https://ollama.com/download) and the Gemma model for custom AI planning (optional for demo data)
- Git Bash is optional and only needed for the GitHub upload steps below

### 1. Get the code and open the project folder

```bash
git clone https://github.com/<your-user>/<your-repository>.git
cd <your-repository>
```

If you already have the project files, open a terminal in the project root instead.

### 2. (Optional) Start Gemma with Ollama

Install Ollama, then run:

```bash
ollama pull gemma3:4b
ollama serve
```

Ollama may already run in the background after installation. Keep the service available while using custom text planning. You can check the model with `ollama list`.

### 3. Start the FastAPI backend

In a terminal at the project root:

**Windows PowerShell**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

**macOS / Linux / Git Bash**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

The backend API documentation is at <http://127.0.0.1:8000/docs>.

### 4. Start the React frontend

Open a second terminal at the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally <http://localhost:5173>.

### 5. Try the app

- Choose **Add demo data** to load a sample plan without Ollama.
- To plan from your own text, make sure Ollama is running and the selected model has been downloaded. Paste text or add a supported file, choose your planning mode, and generate a plan.
- Mark tasks complete to see the plan’s progress, recent activity, and streak update.

## Vercel deployment

Vercel supports Vite static frontends and FastAPI Python applications. The most straightforward setup for this repository is to create **two Vercel projects connected to the same GitHub repository**: one with the `frontend` root directory and one with the `backend` root directory. Vercel documents automatic FastAPI detection and the Python entrypoint rules in its [FastAPI deployment guide](https://vercel.com/kb/guide/ship-a-fastapi-app-on-vercel) and [Python runtime documentation](https://vercel.com/docs/functions/runtimes/python).

### Important hosted-app requirements

This repository is configured for local development by default. Before the hosted app can call its API:

1. **Set the frontend API address.** In the Vercel frontend project, configure `VITE_API_URL` to the deployed backend origin, for example `https://your-api-project.vercel.app` (no trailing slash). Vite embeds `VITE_` variables at build time, so redeploy after changing it.
2. **Allow the frontend origin in FastAPI CORS.** `backend/app/main.py` currently allows localhost development origins only. Add the exact deployed frontend origin (for example, `https://your-app.vercel.app`) to `allow_origins` before deploying the backend. Add any production custom domain there too.
3. **Decide how hosted inference will work.** `OLLAMA_BASE_URL` defaults to `http://localhost:11434`. On Vercel, that points to the function’s own environment, not the user’s computer. Hosted custom-text extraction therefore needs an Ollama server reachable from the deployed backend, or a separate hosted model integration. Never expose an unauthenticated Ollama endpoint publicly. Without a reachable model, demo plans can still work but custom AI planning cannot.
4. **Choose durable plan storage for real use.** The current backend writes to a local SQLite file. Serverless function filesystems should not be treated as durable, shared database storage; use a hosted persistent database before relying on plan history across deployments or function instances. See [Vercel’s storage options](https://vercel.com/docs/storage) and choose a database supported by the app’s storage layer.

### Deploy the frontend

1. Push the project to GitHub using the instructions in [Upload this project to GitHub with Git Bash](#upload-this-project-to-github-with-git-bash).
2. In Vercel, choose **Add New → Project** and import the repository.
3. Set **Root Directory** to `frontend`.
4. Set the framework to **Vite** if Vercel does not detect it automatically. Use build command `npm run build` and output directory `dist`.
5. Add `VITE_API_URL` with the backend’s deployed origin. If deploying the backend first, copy its Vercel URL here.
6. Deploy, then copy the frontend URL for the backend CORS allowlist.

### Deploy the backend

1. Import the same GitHub repository as another Vercel project.
2. Set **Root Directory** to `backend`. Vercel should detect the Python FastAPI application and its `app/main.py` entrypoint.
3. Add any required environment variables in the Vercel project settings:

   ```text
   OLLAMA_MODEL=gemma3:4b
   OLLAMA_BASE_URL=https://<reachable-and-secured-Ollama-service>
   ```

   `OLLAMA_BASE_URL` can be omitted only if you accept that custom text planning will not reach Ollama. Do not set it to `localhost` on Vercel. `APP_DB_PATH` only selects a filesystem path and does not make SQLite durable. For a public deployment, update the storage implementation to use a hosted database.

4. Update the backend CORS origins in `backend/app/main.py` to include the frontend deployment URL, then push the change and redeploy.
5. Deploy the backend and verify `https://<backend-domain>/api/health` and `https://<backend-domain>/docs`.
6. Set the frontend’s `VITE_API_URL` to that backend origin and redeploy the frontend.
7. In the deployed UI, try a demo plan first. Then verify custom text generation only after the backend can securely reach the configured model service.

> **Prototype limitation:** This is a deployment guide, not a claim that the current SQLite and local Ollama configuration is production-ready. Vercel’s Python runtime can host FastAPI, but this app’s data and inference settings need production-appropriate services for durable, shared plans and hosted AI.

## Upload this project to GitHub with Git Bash

These instructions assume you create a **new, empty GitHub repository** first. Do not add a README, license, or `.gitignore` on GitHub because this project already contains a README and `.gitignore`.

1. On GitHub, create a repository and copy its HTTPS address, such as `https://github.com/<your-user>/<your-repository>.git`.
2. Open **Git Bash** and change into this project folder (update the path if you saved it elsewhere):

   ```bash
   cd "/c/Users/<your-windows-user>/Documents/Codex/2026-10-21/he/outputs/assignment-deadline-sloth"
   ```

3. Initialize Git and commit the project:

   ```bash
   git init
   git add .
   git status --short
   git commit -m "Prepare Assignment Deadline Sloth MVP"
   git branch -M main
   ```

4. Add your GitHub remote and push:

   ```bash
   git remote add origin https://github.com/<your-user>/<your-repository>.git
   git push -u origin main
   ```

   Replace the example URL with the one GitHub gave you. If `origin` is already configured, check it with `git remote -v` and use `git remote set-url origin <repository-url>` instead of adding it again.

5. Refresh the GitHub repository page. The project files and README should appear. Keep `.env` files, database files, `node_modules`, `.venv`, and build output out of Git; the included `.gitignore` excludes these.

## Privacy and limitations

- The original uploaded file is read in memory for extraction and is not saved as an uploaded file.
- The generated plan is stored in the backend’s SQLite database; the source text itself is not part of the saved plan record.
- Task completion checkmarks are stored in browser local storage for each plan. They stay in that browser and are not synchronized to the backend.
- Local Gemma inference sends the input from the backend to the configured Ollama server. With the default local setup, that server runs on the same computer. A remote hosted Ollama service would receive the text over the network.
- Extracted dates and effort are suggestions. Review them, especially when the source is ambiguous or incomplete.

## License

No license file is currently included. Add a license before inviting reuse or redistribution.
