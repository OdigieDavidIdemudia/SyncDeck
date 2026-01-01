from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    GROUP_HEAD = "group_head"
    UNIT_HEAD = "unit_head"
    BACKUP_UNIT_HEAD = "backup_unit_head"
    MEMBER = "member"

class TaskCriticality(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskStatus(str, enum.Enum):
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CONTINUOUS = "continuous"
    BLOCKED = "blocked"
    WAITING_ON_EXTERNAL = "waiting_on_external"
    NEEDS_REVIEW = "needs_review"
    NOT_STARTED = "not_started"
    PENDING_APPROVAL = "pending_approval"
    PENDING_GROUP_HEAD_APPROVAL = "pending_group_head_approval"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, nullable=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.MEMBER)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    mfa_secret = Column(String, nullable=True)
    github_token = Column(String, nullable=True)

    # Relationships
    team = relationship("Team", back_populates="members")
    assigned_tasks = relationship("Task", foreign_keys="[Task.assignee_id]", back_populates="assignee")
    created_tasks = relationship("Task", foreign_keys="[Task.assigner_id]", back_populates="assigner")
    comments = relationship("Comment", back_populates="author")

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    members = relationship("User", back_populates="team")

class TaskAssignee(Base):
    """Junction table for many-to-many relationship between tasks and assignees"""
    __tablename__ = "task_assignees"
    
    task_id = Column(Integer, ForeignKey("tasks.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    viewed_at = Column(DateTime, nullable=True)  # For "new task" indicator
    
    # Relationships
    task = relationship("Task", back_populates="task_assignees")
    user = relationship("User")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    status = Column(Enum(TaskStatus, values_callable=lambda obj: [e.value for e in obj]), default=TaskStatus.ONGOING)
    criticality = Column(Enum(TaskCriticality, values_callable=lambda obj: [e.value for e in obj]), default=TaskCriticality.MEDIUM)
    progress_percentage = Column(Integer, default=0)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_internal = Column(Boolean, default=False)
    evidence_url = Column(String, nullable=True)

    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tasks")
    assigner = relationship("User", foreign_keys=[assigner_id], back_populates="created_tasks")
    comments = relationship("Comment", back_populates="task")
    activities = relationship("TaskActivity", back_populates="task")
    help_requests = relationship("HelpRequest", back_populates="task")
    updates = relationship("TaskUpdate", back_populates="task")
    task_assignees = relationship("TaskAssignee", back_populates="task", cascade="all, delete-orphan")


class TaskUpdate(Base):
    __tablename__ = "task_updates"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    summary_text = Column(Text, nullable=True)
    progress_percentage = Column(Integer)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="updates")
    user = relationship("User")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    task_id = Column(Integer, ForeignKey("tasks.id"))
    author_id = Column(Integer, ForeignKey("users.id"))

    task = relationship("Task", back_populates="comments")
    author = relationship("User", back_populates="comments")

class ActivityType(str, enum.Enum):
    STATUS_CHANGE = "status_change"
    PROGRESS_UPDATE = "progress_update"
    COMMENT_ADDED = "comment_added"
    HELP_REQUESTED = "help_requested"
    EVIDENCE_UPLOADED = "evidence_uploaded"

class TaskActivity(Base):
    __tablename__ = "task_activities"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_type = Column(Enum(ActivityType))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="activities")
    user = relationship("User")

class HelpRequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"

class HelpRequest(Base):
    __tablename__ = "help_requests"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    requester_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(Text)
    status = Column(Enum(HelpRequestStatus), default=HelpRequestStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    task = relationship("Task", back_populates="help_requests")
    requester = relationship("User")

class DeletionRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class UserDeletionRequest(Base):
    __tablename__ = "user_deletion_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # User to be deleted
    requested_by_id = Column(Integer, ForeignKey("users.id"))  # UNIT_HEAD who requested
    status = Column(Enum(DeletionRequestStatus), default=DeletionRequestStatus.PENDING)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # GROUP_HEAD who approved/rejected
    
    user = relationship("User", foreign_keys=[user_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])

class PromotionRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class PromotionRequest(Base):
    __tablename__ = "promotion_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # MEMBER to be promoted to BACKUP_UNIT_HEAD
    requested_by_id = Column(Integer, ForeignKey("users.id"))  # UNIT_HEAD who requested
    target_role = Column(Enum(UserRole))  # Should be BACKUP_UNIT_HEAD
    status = Column(Enum(PromotionRequestStatus), default=PromotionRequestStatus.PENDING)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # GROUP_HEAD who approved/rejected
    
    user = relationship("User", foreign_keys=[user_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])



class MemberAchievement(Base):
    __tablename__ = "member_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    on_time_completion_rate = Column(Integer, default=0) # Stored as percentage 0-100
    total_completed_tasks = Column(Integer, default=0)
    critical_tasks_completed = Column(Integer, default=0)
    current_no_blocker_streak = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
