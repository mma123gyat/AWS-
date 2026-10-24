from decimal import Decimal
from typing import Any

DEFAULT_AI_PARAMETERS = {"difficulty": 3, "volume": 3, "supportLevel": 3}
DIFFICULTY_LABELS = {
    1: "基礎の確認を中心にする", 2: "やさしい例題から始める", 3: "現在の理解度に合う標準的な内容にする",
    4: "基本を確認してから少し考える問題に取り組む", 5: "無理のない範囲で応用問題に挑戦する",
}
SUPPORT_LABELS = {
    1: "課題と短い目標を簡潔に伝える", 2: "取り組み方のヒントを一つ添える", 3: "要点と取り組み方を説明する",
    4: "手順を小さく分け、例やヒントを添える", 5: "一つずつの手順と具体例、困ったときのヒントを丁寧に添える",
}


def read_ai_parameters(value: Any) -> dict[str, int]:
    """Unconfigured/legacy rows keep neutral defaults; DynamoDB uses Decimal."""
    source = value if isinstance(value, dict) else {}
    return {
        key: int(source[key]) if (
            isinstance(source.get(key), (int, Decimal)) and not isinstance(source[key], bool)
            and source[key] in range(1, 6)
        ) else default
        for key, default in DEFAULT_AI_PARAMETERS.items()
    }


def plan_guidance(params: dict[str, Any]) -> dict[str, Any]:
    settings = read_ai_parameters(params.get("ai_parameters"))
    minutes = params["available_minutes"]
    volume = settings["volume"]
    # Low volume leaves spare time; higher volume varies practice density,
    # never the student's selected time budget or recorded understanding.
    target_minutes = max(1, minutes * {1: 40, 2: 70}.get(volume, 100) // 100)
    base_count = 1 if minutes <= 5 else 2 if minutes <= 15 else 3
    cap = 1 if minutes <= 5 else 2 if minutes <= 15 else 4
    task_count = min(cap, max(1, base_count + {1: -2, 2: -1, 3: 0, 4: 1, 5: 1}[volume]))
    return {
        "settings": settings, "target_minutes": target_minutes, "task_count": min(task_count, target_minutes),
        "difficulty": DIFFICULTY_LABELS[settings["difficulty"]],
        "support": SUPPORT_LABELS[settings["supportLevel"]],
        "practice": "短い確認を中心にする" if volume <= 2 else "確認問題を少し多めにする" if volume == 4 else "時間内で複数の短い確認問題に取り組む" if volume == 5 else "標準的な量の確認に取り組む",
    }
