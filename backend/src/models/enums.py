from enum import StrEnum


class Role(StrEnum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    PARENT = "PARENT"
    SUPPORT = "SUPPORT"


class CurriculumStatus(StrEnum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class TaskStatus(StrEnum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class PlanGenerator(StrEnum):
    BEDROCK = "BEDROCK"
    RULE = "RULE"
