from datetime import date, datetime, timedelta

from src.repositories.student_progresses_repository import list_progresses_by_student
from src.repositories.study_records_repository import list_records_by_student
from src.repositories.subjects_repository import get_subject_by_id
from src.repositories.users_repository import get_user_by_id
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.dates import today_jst
from src.utils.errors import ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success

WINDOW_DAYS = 7
# 1〜5スケールでこれ未満は「理解度が低い教科」として要支援候補にする(診断ではなく教育上の事実のみ)。
LOW_UNDERSTANDING_THRESHOLD = 3


def _recent_records(records: list[dict], today_str: str) -> list[dict]:
    today = date.fromisoformat(today_str)
    window_start = today - timedelta(days=WINDOW_DAYS - 1)
    recent = []
    for record in records:
        completed_at = record.get("completed_at")
        if not completed_at:
            continue
        try:
            study_date = datetime.fromisoformat(completed_at).date()
        except ValueError:
            continue
        if window_start <= study_date <= today:
            recent.append(record)
    return recent


@lambda_handler("support.get_report")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "SUPPORT")

    if not user.linked_student_id:
        raise ValidationError("対象の生徒が設定されていません。")

    student_id = user.linked_student_id
    student = get_user_by_id(student_id)
    today = today_jst()

    progresses = list_progresses_by_student(student_id)
    records = list_records_by_student(student_id, limit=50)
    recent = _recent_records(records, today)
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
        if subject_id not in recent_subject_ids:
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
            "recentStudyMinutes": sum(int(r.get("actual_minutes") or 0) for r in recent),
            "recentRecordCount": len(recent),
            "subjectProgresses": [
                {
                    "subjectId": progress["subject_id"],
                    "subjectName": subject_names.get(progress["subject_id"], progress["subject_id"]),
                    "understanding": progress.get("understanding"),
                    "status": progress.get("status"),
                }
                for progress in progresses
            ],
            "supportNeededSubjects": support_needed,
            "attendance": None,
            "attendanceNote": "出席情報はまだ連携されていません。",
        }
    )
