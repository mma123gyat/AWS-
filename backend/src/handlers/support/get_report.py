from src.repositories.student_progresses_repository import list_progresses_by_student
from src.repositories.subjects_repository import get_subject_by_id
from src.models.sharing_settings import read_settings
from src.services.sharing_settings_service import resolve_student
from src.services.weekly_learning_service import load_learning_week
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success

# 1〜5スケールでこれ未満は「理解度が低い教科」として要支援候補にする(診断ではなく教育上の事実のみ)。
LOW_UNDERSTANDING_THRESHOLD = 3


@lambda_handler("support.get_report")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "SUPPORT")

    _, student = resolve_student(user, "SUPPORT")
    student_id = student["user_id"]
    settings = read_settings(student)
    support = settings["support"]
    progresses = list_progresses_by_student(student_id) if support["subjectProgress"] else []
    week = load_learning_week(student_id) if support["studySummary"] else None
    total_minutes = week.total_minutes() if week is not None else None
    recent = week.records if week is not None else []
    recent_subject_ids = {r.get("subject_id") for r in recent if r.get("subject_id")}

    # 教科名はsubject_idごとに1回だけ取得する。
    subject_names: dict[str, str] = {}
    for progress in progresses:
        subject_id = progress["subject_id"]
        if subject_id in subject_names:
            continue
        subject = get_subject_by_id(subject_id)
        subject_names[subject_id] = subject.get("name") if subject else subject_id

    support_needed = []
    for progress in progresses:
        subject_id = progress["subject_id"]
        reasons = []
        # 診断・医学的判断ではなく、既存データから確認できる教育上の事実のみを理由とする。
        if int(progress.get("understanding") or 0) < LOW_UNDERSTANDING_THRESHOLD:
            reasons.append("理解度が低い教科")
        if support["studySummary"] and subject_id not in recent_subject_ids:
            reasons.append("最近学習記録が少ない教科")
        if reasons:
            support_needed.append(
                {
                    "subjectId": subject_id,
                    "subjectName": subject_names.get(subject_id, subject_id),
                    "reasons": reasons,
                }
            )

    return success(
        {
            "studentId": student_id,
            "studentName": student.get("name") if student else None,
            "recentStudyMinutes": total_minutes,
            "recentRecordCount": len(recent) if support["studySummary"] else None,
            "subjectProgresses": [
                {
                    "subjectId": progress["subject_id"],
                    "subjectName": subject_names.get(progress["subject_id"], progress["subject_id"]),
                    "understanding": progress.get("understanding"),
                    "status": progress.get("status"),
                }
                for progress in progresses
            ] if support["subjectProgress"] else None,
            "supportNeededSubjects": support_needed if support["subjectProgress"] else None,
            "canSendMessage": support["messages"] and settings["parent"]["messages"],
            "attendance": None,
            "attendanceNote": "出席情報はまだ連携されていません。",
        }
    )
