# Devpost Submission — Assignment Deadline Sloth

> Copy this template into the Devpost project form. Replace every bracketed placeholder with the final project, team, event, and demo details. Remove sections the event does not ask for. Do not claim a feature, integration, or result that is not present in the submitted build.

## Project name

**Assignment Deadline Sloth**

## Tagline

**Turn deadline overload into a calmer, doable plan.**

## One-line description

Assignment Deadline Sloth turns assignments, notes, and task lists into an organized plan with clear next steps, progress tracking, and optional local AI extraction.

## Project links

- **Live demo:** [Add deployed URL]
- **Source code:** [Add GitHub repository URL]
- **Demo video:** [Add video URL]
- **Team:** [Add names and roles]
- **Event / challenge track:** [Add event and track, if applicable]

## Inspiration

Important tasks tend to arrive in fragments: a due date in a course announcement, a project detail in a PDF, a follow-up in meeting notes, and a personal reminder somewhere else. Turning all those fragments into a sequence of manageable steps takes time and attention—the same resources a busy person is already short on.

We wanted to make the transition from “I have too much to remember” to “I know what to do next” feel smaller and more encouraging. The sloth represents a slower, steadier approach: make progress at a sustainable pace, one clear task at a time.

## What it does

Assignment Deadline Sloth accepts pasted text or a text-based PDF, Markdown, or text file. It identifies tasks and organizes them into a plan with due dates, priority, estimated effort, dependencies, and a suggested next action. Tasks are grouped into **Do Today**, **This Week**, **Later**, or **Needs clarification** so uncertain information can be reviewed.

The app supports three planning contexts—**Student**, **Personal / professional**, and **A bit of everything**—and changes its color theme with the selected context. Built-in demos make the product usable without an AI model. Saved plans can be searched and previewed in Recent plans. Users can check tasks off, see plan completion and recent activity, build a streak, and celebrate a fully completed plan. Plans can be exported as Markdown, CSV, JSON, or iCalendar files.

## Who it helps

- Students tracking homework, assignments, reading, group projects, and tests.
- Professionals managing meeting notes, employee check-ins, project tasks, and follow-ups.
- Anyone combining study, work, and personal tasks in one week.

## Example use case

A student has an exam next Tuesday, a paper due Thursday, and a worksheet due tomorrow. The exam topics are in a course announcement, paper requirements are in a PDF, and the worksheet is in a personal note. They add the text or files, select **Student**, enter their available hours, and build a plan. The app organizes the resulting tasks by timeframe and gives each one a next action. The student reviews uncertain dates, checks tasks off as they finish, and uses the progress bar and streak view to keep momentum. When every task in that plan is completed, the app celebrates the achievement.

The same workflow fits a project manager converting meeting notes into follow-ups, or someone making one weekly list across work and home.

## How Gemma and Ollama are used

Gemma extracts structured task information from the user’s pasted text or uploaded document. The model is asked to identify task titles, categories, dates, effort estimates, priorities, dependencies, next actions, and confidence. The FastAPI backend validates the structured output, and the app’s planning logic arranges it into a timeline.

Ollama runs the Gemma model and exposes a local HTTP endpoint. In the local setup, input text is sent from the backend to Ollama on the same computer rather than to a hosted model API. The app defaults to `gemma3:4b`; users can configure the model tag. Ollama is optional for the built-in demos. If Ollama is unavailable, sample plans still work, but creating an AI plan from custom text requires Ollama to be running and the model to be installed.

AI extraction can be uncertain. The interface includes clarification notes and users should review dates and estimates before relying on a generated schedule.

## How we built it

- **Frontend:** React 19 and Vite, with responsive CSS and dynamically selected planning themes.
- **Backend:** FastAPI and Pydantic for request handling, document text extraction, and structured response validation.
- **AI:** Gemma through Ollama for local task extraction; demo plans use built-in sample data and do not call the model.
- **Document handling:** `pypdf` reads text from PDFs in memory; `.txt` and `.md` files are also supported.
- **Plan history:** SQLite stores generated plan records in the local prototype.
- **Progress:** Browser local storage tracks task checkoffs for each plan; the frontend uses those checkoffs for progress, activity, and streak displays.
- **Exports:** The browser creates Markdown, CSV, JSON, and `.ics` exports.

## Challenges we ran into

- Turning unstructured text into predictable task data required a strict schema and validation. Dates can be missing or ambiguous, so the app needs to make uncertainty visible instead of treating every extraction as certain.
- Local model inference depends on the computer and whether the model is already loaded. We added a built-in demo path so people can explore the product without waiting for a model or installing one.
- Progress needed to belong to the plan a user is working through. Checkoffs, activity, completion celebrations, and streaks are tied to the current plan’s tasks rather than to unrelated sample tasks.
- The app has both a local Ollama workflow and potential hosted deployment needs. A hosted version needs an inference service reachable by its backend and durable storage rather than assuming a developer’s local Ollama or SQLite file is available.

## Accomplishments

- Made demos usable immediately without a model setup.
- Connected task extraction to a concrete planning and follow-through workflow, rather than stopping at a generated task list.
- Added plan-specific progress, activity history, streak visualization, full-window completion confetti, and file exports.
- Added distinct visual themes for student, professional/personal, and mixed planning contexts.

## What we learned

An AI-generated list is only useful if a person can understand what to do next and see their progress afterward. We also learned to treat a model’s dates and estimates as suggestions that need clear review, and to keep a non-AI demo path available when local inference is not ready.

## What is next

- Replace local SQLite storage with a managed database for reliable hosted plan history.
- Add a secure hosted inference option, or a documented private Ollama deployment, for cloud access to custom-text planning.
- Add edit and delete actions for saved plans and improve plan synchronization across devices.
- Add reminders and calendar integrations after the date and persistence workflows are ready.
- Improve task extraction evaluation with representative assignment briefs, meeting notes, and ambiguous date examples.

## Try it

1. Open the live demo: [Add URL].
2. Select **Add demo data** to explore without installing AI dependencies.
3. To try custom-text extraction in a local setup, install Ollama, run `ollama pull gemma3:4b`, start the backend and frontend, then use the planner input.
4. Check off the tasks in a plan to see progress, activity, streak, and completion animation.

## Demo video outline (optional)

Use this as a short walkthrough script:

1. **Problem (10–15 seconds):** Show how deadlines and follow-ups are scattered across different kinds of notes.
2. **Create a plan (20–30 seconds):** Choose a planning context, paste a short brief or select demo data, and show the plan groups and next actions.
3. **AI explanation (10–15 seconds):** Explain that Gemma extracts structured task details through Ollama, which can run locally; demos work without AI.
4. **Progress (15–20 seconds):** Mark a task complete and show the progress bar, activity trail, and streak. Finish by completing the plan to show the celebration.
5. **Close (5 seconds):** Show the live demo and GitHub links.

## Screenshots to add

- `[Screenshot: planner hero and planning mode selector]`
- `[Screenshot: generated plan task board]`
- `[Screenshot: Recent plans with expanded brief preview]`
- `[Screenshot: progress and streak view]`
- `[Screenshot: plan completion celebration]`

## Credits and disclosure

- **Built by:** [Names / team]
- **Tools, models, and services:** React, Vite, FastAPI, Gemma, Ollama, SQLite, and [add any others actually used].
- **AI disclosure:** [Follow the specific event’s required AI-use disclosure. Describe which model or AI tools were used and what they contributed.]
- **Third-party assets:** [Credit any icons, illustrations, fonts, or other assets used; remove if none.] 
- **License:** No license is currently included in the repository. [Add selected license or state that the code is not yet licensed for reuse.]
