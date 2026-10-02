import pytest

from src.utils.errors import ValidationError
from src.validators.condition_validator import validate_condition_input
from src.validators.progress_validator import (
    validate_curriculum_input,
    validate_student_progress_input,
)
from src.validators.study_record_validator import validate_study_record_input
from src.validators.understanding_validator import validate_understanding


class TestConditionValidator:
    @pytest.mark.parametrize("minutes", [0, 5, 15, 30])
    def test_accepts_allowed_values(self, minutes):
        assert validate_condition_input({"availableMinutes": minutes}) == minutes

    @pytest.mark.parametrize("minutes", [1, 10, 60, -5, "15", None])
    def test_rejects_disallowed_values(self, minutes):
        with pytest.raises(ValidationError):
            validate_condition_input({"availableMinutes": minutes})


class TestUnderstandingValidator:
    @pytest.mark.parametrize("value", [1, 2, 3, 4, 5])
    def test_accepts_1_to_5(self, value):
        assert validate_understanding(value) == value

    @pytest.mark.parametrize("value", [0, 6, -1, "3", None, 3.5])
    def test_rejects_out_of_range(self, value):
        with pytest.raises(ValidationError):
            validate_understanding(value)


class TestProgressValidator:
    def test_curriculum_input_requires_subject_and_unit(self):
        with pytest.raises(ValidationError):
            validate_curriculum_input({"unitName": "一次関数", "status": "IN_PROGRESS"})
        with pytest.raises(ValidationError):
            validate_curriculum_input({"subjectId": "math", "status": "IN_PROGRESS"})

    def test_curriculum_input_rejects_invalid_status(self):
        with pytest.raises(ValidationError):
            validate_curriculum_input(
                {"subjectId": "math", "unitName": "一次関数", "status": "DONE"}
            )

    def test_curriculum_input_accepts_valid_payload(self):
        result = validate_curriculum_input(
            {
                "subjectId": "math",
                "unitName": "一次関数",
                "textbookPage": "p.42",
                "status": "IN_PROGRESS",
            }
        )
        assert result == {
            "subject_id": "math",
            "unit_name": "一次関数",
            "textbook_page": "p.42",
            "status": "IN_PROGRESS",
        }

    def test_student_progress_input_validates_understanding(self):
        with pytest.raises(ValidationError):
            validate_student_progress_input(
                {
                    "subjectId": "math",
                    "unitName": "比例・反比例",
                    "status": "IN_PROGRESS",
                    "understanding": 9,
                }
            )


class TestStudyRecordValidator:
    def test_requires_task_id(self):
        with pytest.raises(ValidationError):
            validate_study_record_input({"actualMinutes": 10, "understanding": 3})

    def test_requires_positive_minutes(self):
        with pytest.raises(ValidationError):
            validate_study_record_input(
                {"taskId": "plan1#1", "actualMinutes": 0, "understanding": 3}
            )

    def test_accepts_valid_payload(self):
        result = validate_study_record_input(
            {"taskId": "plan1#1", "actualMinutes": 10, "understanding": 4}
        )
        assert result == {"task_id": "plan1#1", "actual_minutes": 10, "understanding": 4}
