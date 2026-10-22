import os

from ollama import AsyncClient
from pydantic import ValidationError

from .schemas import ExtractionResult


def model_name() -> str:
    return os.getenv("OLLAMA_MODEL", "gemma3:4b")


def ollama_client() -> AsyncClient:
    return AsyncClient(host=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))


async def extract_with_gemma(text: str, current_date: str, user_mode: str) -> ExtractionResult:
    client = ollama_client()
    instructions = (
        "Extract actionable tasks from the provided source. Return only the requested JSON object. "
        "Use ISO dates (YYYY-MM-DD). Resolve relative dates against the supplied current date only when clear; "
        "if the year or date is ambiguous, set due_date to null and explain in notes. Do not invent tasks or deadlines. "
        "Estimate effort conservatively when the source gives no estimate, and lower confidence when inferred. "
        "Each task needs title, type (assignment, exam, deliverable, meeting, follow-up, reading, task), due_date, "
        "estimated_hours, priority (high, medium, low), dependencies (list), next_action, confidence (0 to 1)."
    )
    prompt = f"Current date: {current_date}\nUser mode: {user_mode}\n\nSOURCE TEXT:\n{text}"
    last_error: Exception | None = None
    for retry in range(2):
        try:
            response = await client.chat(
                model=model_name(),
                messages=[
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": prompt if retry == 0 else "Return valid JSON matching the schema exactly. " + prompt},
                ],
                format=ExtractionResult.model_json_schema(),
                options={"temperature": 0.1, "num_predict": 1400},
                keep_alive="10m",
            )
            return ExtractionResult.model_validate_json(response.message.content)
        except (ValidationError, ValueError) as exc:
            last_error = exc
    raise ValueError(f"Gemma returned an invalid task list after retry: {last_error}")
