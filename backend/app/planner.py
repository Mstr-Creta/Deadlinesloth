from datetime import date

from .schemas import ExtractionResult, PlanResult, PlannedTask, Priority, WorkBlock


PRIORITY_ORDER = {Priority.high: 0, Priority.medium: 1, Priority.low: 2}


def build_plan(extraction: ExtractionResult, current_date: date, available_hours: float, mode: str) -> PlanResult:
    planned: list[PlannedTask] = []
    for task in extraction.tasks:
        days_until = (task.due_date - current_date).days if task.due_date else None
        missing = []
        if task.due_date is None:
            missing.append("Add a confirmed due date")
        if task.confidence < 0.55:
            missing.append("Review the extracted details")
        bucket = "Needs clarification" if missing else (
            "Do Today" if days_until is not None and days_until <= 2 else
            "This Week" if days_until is not None and days_until <= 7 else
            "Later"
        )
        planned.append(
            PlannedTask(
                **task.model_dump(),
                bucket=bucket,
                overdue=days_until is not None and days_until < 0,
                urgent=days_until is not None and 0 <= days_until <= 2,
                clarification=" · ".join(missing) or None,
            )
        )

    planned.sort(key=lambda t: (t.bucket == "Needs clarification", t.due_date or date.max, PRIORITY_ORDER[t.priority]))
    remaining = max(0, round(available_hours * 60))
    schedule: list[WorkBlock] = []
    candidates = sorted(
        (t for t in planned if t.bucket in {"Do Today", "This Week"}),
        key=lambda t: (t.bucket != "Do Today", t.due_date or date.max, PRIORITY_ORDER[t.priority]),
    )
    for task in candidates:
        if remaining <= 0:
            break
        task_minutes = max(30, round((task.estimated_hours or 1) * 60))
        while task_minutes > 0 and remaining > 0:
            block_minutes = min(task_minutes, 90, remaining)
            schedule.append(WorkBlock(task_title=task.title, minutes=block_minutes, label=task.next_action))
            task_minutes -= block_minutes
            remaining -= block_minutes

    return PlanResult(
        id="",
        created_at="",
        current_date=current_date,
        available_hours=available_hours,
        mode=mode,
        tasks=planned,
        notes=extraction.notes,
        schedule=schedule,
        scheduled_minutes=sum(block.minutes for block in schedule),
    )
