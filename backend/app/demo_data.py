from .schemas import ExtractionResult


DEMOS = {
    "homework": {
        "mode": "student",
        "category": "Homework",
        "title": "Biology homework",
        "text": "Biology worksheet: answer questions 1–12 on cell division. Due October 24, 2026. About 90 minutes. Review chapter 6 first.",
        "tasks": [{"title": "Biology worksheet: cell division", "type": "assignment", "due_date": "2026-10-24", "estimated_hours": 1.5, "priority": "high", "next_action": "Review chapter 6, then answer questions 1–12", "confidence": 0.98}],
    },
    "assignment": {
        "mode": "student",
        "category": "Assignment",
        "title": "History research paper",
        "text": "History research paper on the Industrial Revolution. Due October 29, 2026. Write 1,500 words with four sources. Estimate: 6 hours.",
        "tasks": [{"title": "Write the Industrial Revolution research paper", "type": "assignment", "due_date": "2026-10-29", "estimated_hours": 6, "priority": "high", "next_action": "Choose a focused question and collect four credible sources", "confidence": 0.98}],
    },
    "test": {
        "mode": "student",
        "category": "Test schedule",
        "title": "Chemistry midterm",
        "text": "Chemistry midterm on October 27, 2026. Topics: bonding, reactions, stoichiometry. Study in four 45-minute sessions.",
        "tasks": [{"title": "Prepare for chemistry midterm", "type": "exam", "due_date": "2026-10-27", "estimated_hours": 3, "priority": "high", "next_action": "Start with stoichiometry practice problems", "confidence": 0.99}],
    },
    "reading": {
        "mode": "student",
        "category": "Reading list",
        "title": "Literature reading",
        "text": "Read chapters 4–7 of The Great Gatsby and bring three discussion questions to seminar on October 26, 2026. About 2.5 hours.",
        "tasks": [{"title": "Read The Great Gatsby, chapters 4–7", "type": "reading", "due_date": "2026-10-26", "estimated_hours": 2.5, "priority": "medium", "next_action": "Read chapter 4 and note recurring symbols", "confidence": 0.97}],
    },
    "project": {
        "mode": "student",
        "category": "Group project",
        "title": "Science fair prototype",
        "text": "Science fair prototype demo due November 3, 2026. Team needs a working sensor, 5-slide explanation, and a 10-minute practice run. 8 hours total.",
        "tasks": [{"title": "Prepare the science fair prototype demo", "type": "assignment", "due_date": "2026-11-03", "estimated_hours": 8, "priority": "medium", "dependencies": ["Working sensor prototype"], "next_action": "Check the sensor prototype and list remaining parts", "confidence": 0.96}],
    },
    "meeting": {
        "mode": "professional",
        "category": "Meeting notes",
        "title": "Product sync follow-ups",
        "text": "Product sync: send the roadmap recap to the team by October 22, 2026; ask design to confirm onboarding copy; schedule a customer feedback review for October 28.",
        "tasks": [
            {"title": "Send product roadmap recap", "type": "follow-up", "due_date": "2026-10-22", "estimated_hours": 0.5, "priority": "high", "next_action": "Share decisions and owners from the product sync", "confidence": 0.98},
            {"title": "Confirm onboarding copy with design", "type": "follow-up", "due_date": None, "estimated_hours": 0.5, "priority": "medium", "next_action": "Message design with the copy review request", "confidence": 0.9},
            {"title": "Schedule customer feedback review", "type": "meeting", "due_date": "2026-10-28", "estimated_hours": 0.5, "priority": "medium", "next_action": "Find a 30-minute slot and invite the product team", "confidence": 0.96},
        ],
    },
    "employee": {
        "mode": "professional",
        "category": "Employee tracker",
        "title": "Team check-in tracker",
        "text": "Team check-in tracker: Maya to finish QA checklist by October 23; Jordan to review analytics events by October 26; book 1:1s with both this week.",
        "tasks": [
            {"title": "Follow up on Maya’s QA checklist", "type": "task", "due_date": "2026-10-23", "estimated_hours": 0.5, "priority": "high", "next_action": "Check the QA checklist status with Maya", "confidence": 0.95},
            {"title": "Review analytics events with Jordan", "type": "task", "due_date": "2026-10-26", "estimated_hours": 1, "priority": "medium", "next_action": "Open the analytics event review and note gaps", "confidence": 0.95},
            {"title": "Book team 1:1s", "type": "meeting", "due_date": None, "estimated_hours": 0.5, "priority": "medium", "next_action": "Offer two time slots to Maya and Jordan", "confidence": 0.9},
        ],
    },
    "project-work": {
        "mode": "professional",
        "category": "Project work",
        "title": "Website launch checklist",
        "text": "Website launch: finish accessibility review by October 24, 2026; publish final copy October 27; launch November 2. QA depends on approved copy.",
        "tasks": [
            {"title": "Complete website accessibility review", "type": "deliverable", "due_date": "2026-10-24", "estimated_hours": 3, "priority": "high", "next_action": "Run through keyboard navigation and heading order", "confidence": 0.97},
            {"title": "Publish final website copy", "type": "deliverable", "due_date": "2026-10-27", "estimated_hours": 1, "priority": "high", "dependencies": ["Approved copy"], "next_action": "Confirm copy approval and prepare the CMS update", "confidence": 0.96},
            {"title": "Launch the new website", "type": "deliverable", "due_date": "2026-11-02", "estimated_hours": 2, "priority": "medium", "next_action": "Confirm the launch checklist owner", "confidence": 0.94},
        ],
    },
    "follow-up": {
        "mode": "professional",
        "category": "Follow-ups",
        "title": "Client follow-up list",
        "text": "Client follow-ups: share the revised estimate by October 22, 2026; send the security questionnaire by October 25; ask legal to approve the updated terms.",
        "tasks": [
            {"title": "Share revised project estimate", "type": "follow-up", "due_date": "2026-10-22", "estimated_hours": 1, "priority": "high", "next_action": "Update the estimate with the latest scope", "confidence": 0.98},
            {"title": "Send security questionnaire", "type": "follow-up", "due_date": "2026-10-25", "estimated_hours": 1, "priority": "medium", "next_action": "Complete the questionnaire and attach policy links", "confidence": 0.97},
            {"title": "Get approval for updated terms", "type": "follow-up", "due_date": None, "estimated_hours": 0.5, "priority": "medium", "next_action": "Send the latest terms to legal for review", "confidence": 0.92},
        ],
    },
    "weekly": {
        "mode": "universal",
        "category": "Weekly priorities",
        "title": "A bit of everything",
        "text": "This week: book a dentist appointment; finish the statistics assignment by October 27, 2026; prepare the Monday team update; go for two evening walks.",
        "tasks": [
            {"title": "Book a dentist appointment", "type": "task", "due_date": None, "estimated_hours": 0.25, "priority": "low", "next_action": "Choose a clinic and call to check availability", "confidence": 0.91},
            {"title": "Finish statistics assignment", "type": "assignment", "due_date": "2026-10-27", "estimated_hours": 3, "priority": "high", "next_action": "Review the rubric and solve the first problem", "confidence": 0.96},
            {"title": "Prepare Monday team update", "type": "deliverable", "due_date": "2026-10-26", "estimated_hours": 1, "priority": "medium", "next_action": "Collect progress and blockers from the team", "confidence": 0.96},
            {"title": "Plan two evening walks", "type": "task", "due_date": None, "estimated_hours": 1, "priority": "low", "next_action": "Pick two evenings and block the time", "confidence": 0.9},
        ],
    },
}


def demo_catalog() -> list[dict[str, str]]:
    return [
        {"id": demo_id, "mode": demo["mode"], "category": demo["category"], "title": demo["title"]}
        for demo_id, demo in DEMOS.items()
    ]


def demo_mode(demo_type: str) -> str:
    return DEMOS.get(demo_type, DEMOS["homework"])["mode"]


def get_demo(demo_type: str) -> tuple[str, ExtractionResult]:
    demo = DEMOS.get(demo_type, DEMOS["homework"])
    return demo["text"], ExtractionResult.model_validate({"tasks": demo["tasks"], "notes": [f"Sample {demo['category'].lower()} plan. Edit the input to make it yours."]})
