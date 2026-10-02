from typing import Any


def generate_rule_based_plan(params: dict[str, Any]) -> dict:
    """Deterministic fallback used when Bedrock is unavailable or returns an
    invalid plan. Keeps the same shape as bedrock_service.generate_study_plan
    so callers can treat both interchangeably.
    """
    available_minutes = params["available_minutes"]
    subject = params["subject"]
    student_topic = params["student_topic"]

    if available_minutes <= 5:
        tasks = [
            {
                "order": 1,
                "title": f"{student_topic}の基本を確認",
                "minutes": available_minutes,
                "description": "今日は短く、要点だけ振り返りましょう。",
            }
        ]
    elif available_minutes <= 15:
        first_half = available_minutes // 2
        tasks = [
            {
                "order": 1,
                "title": f"{student_topic}の確認",
                "minutes": first_half,
                "description": "ポイントを振り返ります。",
            },
            {
                "order": 2,
                "title": "確認問題",
                "minutes": available_minutes - first_half,
                "description": "短い問題で理解を確認します。",
            },
        ]
    else:
        third = available_minutes // 3
        tasks = [
            {
                "order": 1,
                "title": f"{student_topic}の確認",
                "minutes": third,
                "description": "ポイントを振り返ります。",
            },
            {
                "order": 2,
                "title": "例題",
                "minutes": third,
                "description": "例題を解いて理解を深めます。",
            },
            {
                "order": 3,
                "title": "確認問題",
                "minutes": available_minutes - 2 * third,
                "description": "問題を解いて理解度を確認します。",
            },
        ]

    return {
        "subject": subject,
        "title": f"{student_topic}の復習",
        "total_minutes": sum(task["minutes"] for task in tasks),
        "reason": "今日使える時間に合わせて、今取り組んでいる単元を確認するプランです。",
        "tasks": tasks,
    }
