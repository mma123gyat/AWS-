from typing import Any

from src.models.ai_parameters import plan_guidance


def generate_rule_based_plan(params: dict[str, Any]) -> dict:
    """Deterministic fallback honoring the same teacher settings and time cap."""
    if params["available_minutes"] <= 0:
        raise ValueError("a rest day must not generate a plan")
    guidance = plan_guidance(params)
    subject = params["subject"]
    topic = params["student_topic"]
    count = guidance["task_count"]
    minutes = guidance["target_minutes"]
    settings = guidance["settings"]
    task_titles = [f"{topic}の確認", "例題", "確認問題", "ふりかえり"]
    if settings["difficulty"] <= 2:
        task_titles = [f"{topic}の基本を確認", "やさしい例題", "基本の確認問題", "要点のふりかえり"]
    elif settings["difficulty"] >= 4:
        task_titles = [f"{topic}の基本を振り返る", "少し考える例題", "応用問題に挑戦", "考え方のふりかえり"]
    description = f"{guidance['difficulty']}。{guidance['practice']}。{guidance['support']}。"
    if settings["supportLevel"] >= 4:
        description += "まず教科書の例を一つ読み、同じ手順で一問試しましょう。困ったら例と自分の取り組みを見比べ、分からない所に印をつけるだけでも大丈夫です。"
    tasks = [
        {
            "order": index + 1,
            "title": task_titles[index],
            "minutes": minutes // count + (minutes % count if index == count - 1 else 0),
            "description": description,
        }
        for index in range(count)
    ]
    return {
        "subject": subject,
        "title": f"{topic}の復習",
        "total_minutes": sum(task["minutes"] for task in tasks),
        "reason": "今日使える時間と先生の設定に合わせて、今取り組んでいる単元を確認するプランです。",
        "tasks": tasks,
    }
