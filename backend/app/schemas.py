from datetime import date
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class TaskKind(str, Enum):
    assignment = "assignment"
    exam = "exam"
    deliverable = "deliverable"
    meeting = "meeting"
    follow_up = "follow-up"
    reading = "reading"
    task = "task"


class Priority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class ExtractedTask(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    type: TaskKind = TaskKind.task
    due_date: date | None = None
    estimated_hours: float | None = Field(default=None, ge=0, le=500)
    priority: Priority = Priority.medium
    dependencies: list[str] = Field(default_factory=list)
    next_action: str = "Review requirements and choose the first step"
    confidence: float = Field(default=0.7, ge=0, le=1)


class ExtractionResult(BaseModel):
    tasks: list[ExtractedTask] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class WorkBlock(BaseModel):
    task_title: str
    minutes: int
    label: str


class PlannedTask(BaseModel):
    title: str
    type: TaskKind
    due_date: date | None
    estimated_hours: float | None
    priority: Priority
    dependencies: list[str]
    next_action: str
    confidence: float
    bucket: str
    overdue: bool
    urgent: bool
    clarification: str | None = None


class PlanResult(BaseModel):
    id: str
    created_at: str
    current_date: date
    available_hours: float
    mode: str
    tasks: list[PlannedTask]
    notes: list[str]
    schedule: list[WorkBlock]
    scheduled_minutes: int


class SavedPlan(BaseModel):
    id: str
    created_at: str
    current_date: date
    task_count: int
    summary: str
    plan: dict[str, Any]
