from pydantic import BaseModel, validator, Field
from typing import List, Optional
from datetime import datetime
from .models import UserRole, TaskStatus, TaskCriticality, ActivityType, HelpRequestStatus

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.MEMBER
    team_id: Optional[int] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    team_id: Optional[int] = None

    @validator('team_id', pre=True)
    def blank_string_to_none(cls, v):
        if v == "":
            return None
        return v

class User(UserBase):
    id: int
    role: UserRole
    team_id: Optional[int] = None
    email: Optional[str] = None
    mfa_secret: Optional[str] = None
    github_token: Optional[str] = None
    
    class Config:
        orm_mode = True

class TeamBase(BaseModel):
    name: str = Field(..., min_length=1)

    @validator('name')
    def name_must_not_be_blank(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty or whitespace only')
        return v.strip()

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: int
    members: List[User] = []

    class Config:
        orm_mode = True

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str


class Comment(CommentBase):
    id: int
    created_at: datetime
    author_id: int
    task_id: int
    author: User

    class Config:
        orm_mode = True

class TaskActivityBase(BaseModel):
    activity_type: ActivityType
    description: str

class TaskActivityCreate(TaskActivityBase):
    pass

class TaskActivity(TaskActivityBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    user: User

    class Config:
        orm_mode = True

class HelpRequestBase(BaseModel):
    reason: str

class HelpRequestCreate(HelpRequestBase):
    pass

class HelpRequest(HelpRequestBase):
    id: int
    task_id: int
    requester_id: int
    status: HelpRequestStatus
    created_at: datetime
    resolved_at: Optional[datetime] = None
    requester: User

    class Config:
        orm_mode = True

class UserDeletionRequestBase(BaseModel):
    user_id: int
    reason: Optional[str] = None

class UserDeletionRequestCreate(UserDeletionRequestBase):
    pass

class UserDeletionRequest(UserDeletionRequestBase):
    id: int
    requested_by_id: int
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by_id: Optional[int] = None
    user: User
    requested_by: User
    
    class Config:
        orm_mode = True

class PromotionRequestBase(BaseModel):
    user_id: int
    target_role: str  # Should be "backup_unit_head"
    reason: Optional[str] = None

class PromotionRequestCreate(PromotionRequestBase):
    pass

class PromotionRequest(PromotionRequestBase):
    id: int
    requested_by_id: int
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by_id: Optional[int] = None
    user: User
    requested_by: User
    
    class Config:
        orm_mode = True



class MemberAchievementBase(BaseModel):
    on_time_completion_rate: int
    total_completed_tasks: int
    critical_tasks_completed: int
    current_no_blocker_streak: int

class MemberAchievement(MemberAchievementBase):
    id: int
    user_id: int
    last_updated: datetime

    class Config:
        orm_mode = True

class TaskProgressUpdateBase(BaseModel):
    progress_percentage: int
    status: str
    summary_text: Optional[str] = None

    @validator('progress_percentage')
    def validate_progress(cls, v):
        if not (0 <= v <= 100):
             raise ValueError('Progress must be between 0 and 100')
        if v % 5 != 0:
             raise ValueError('Progress must be a multiple of 5')
        return v

class TaskProgressUpdateCreate(TaskProgressUpdateBase):
    pass

class TaskProgressUpdate(TaskProgressUpdateBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.ONGOING
    criticality: TaskCriticality = TaskCriticality.MEDIUM
    progress_percentage: Optional[int] = 0
    deadline: Optional[datetime] = None
    is_internal: Optional[bool] = False
    evidence_url: Optional[str] = None

class TaskCreate(TaskBase):
    assigned_to: Optional[List[int]] = None  # List of user IDs to assign task to

class TaskUpdate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    assignee_id: Optional[int]  # Legacy field, kept for backward compatibility
    assigner_id: int
    assignee: Optional[User]  # Legacy field
    assigner: User
    assignees: List[User] = []  # New multi-assignee field
    is_new: Optional[bool] = False  # Indicates if task is new for current user
    comments: List[Comment] = []
    activities: List[TaskActivity] = []
    help_requests: List[HelpRequest] = []
    updates: List[TaskProgressUpdate] = []

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
