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
git clone https://github.com/Mstr-Creta/Deadlinsloth
cd Deadlinesloth
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


## License

No license file is currently included. Add a license before inviting reuse or redistribution.
