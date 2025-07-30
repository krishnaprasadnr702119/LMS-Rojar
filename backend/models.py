from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(32), nullable=False, default='employee')
    email = db.Column(db.String(120), unique=True, nullable=False)
    designation = db.Column(db.String(120), nullable=True)
    org_id = db.Column(db.Integer, db.ForeignKey('organization.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    # Many-to-many relationship with courses
    courses = db.relationship('Course', secondary='user_courses', backref=db.backref('users', lazy='dynamic'))
    # Progress tracking
    progress_records = db.relationship('CourseProgress', backref='user', lazy=True, cascade="all, delete-orphan")

class Organization(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    portal_admin = db.Column(db.String(80), nullable=False)
    org_domain = db.Column(db.String(120), nullable=False)
    created = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(32), nullable=False, default='active')
    # Association table for many-to-many Organization <-> Course
    courses = db.relationship('Course', secondary='organization_courses', backref=db.backref('organizations', lazy='dynamic'))

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    status = db.Column(db.String(32), nullable=False, default='draft')
    modules = db.relationship('Module', backref='course', lazy=True, cascade="all, delete-orphan")

class Module(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, nullable=False, default=0)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    contents = db.relationship('ModuleContent', backref='module', lazy=True, cascade="all, delete-orphan")

class ModuleContent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    content_type = db.Column(db.String(32), nullable=False)
    file_path = db.Column(db.String(255), nullable=True)
    content = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, nullable=False, default=0)
    module_id = db.Column(db.Integer, db.ForeignKey('module.id'), nullable=False)
    questions = db.relationship('QuizQuestion', backref='content', lazy=True, cascade="all, delete-orphan")

class QuizQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(32), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)
    content_id = db.Column(db.Integer, db.ForeignKey('module_content.id'), nullable=False)
    options = db.relationship('QuizOption', backref='question', lazy=True, cascade="all, delete-orphan")

class QuizOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    option_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False, default=False)
    question_id = db.Column(db.Integer, db.ForeignKey('quiz_question.id'), nullable=False)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    status = db.Column(db.String(32), nullable=False, default='assigned')
    course = db.relationship('Course', backref='tasks')
    employee = db.relationship('User', foreign_keys=[employee_id])
    admin = db.relationship('User', foreign_keys=[assigned_by])

class CourseRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organization.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    requested_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    requested_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    status = db.Column(db.String(32), nullable=False, default='pending')  # pending, approved, rejected
    payment_amount = db.Column(db.Float, nullable=False, default=0.0)
    admin_notes = db.Column(db.Text, nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    organization = db.relationship('Organization', backref='course_requests')
    course = db.relationship('Course', backref='purchase_requests')
    requester = db.relationship('User', foreign_keys=[requested_by], backref='course_requests')
    approver = db.relationship('User', foreign_keys=[approved_by])

# Association table for many-to-many Organization <-> Course
from sqlalchemy import Table, Column, Integer, ForeignKey
organization_courses = Table('organization_courses', db.metadata,
    Column('organization_id', Integer, ForeignKey('organization.id'), primary_key=True),
    Column('course_id', Integer, ForeignKey('course.id'), primary_key=True)
)

# Association table for many-to-many User <-> Course (for individual assignments)
user_courses = Table('user_courses', db.metadata,
    Column('user_id', Integer, ForeignKey('user.id'), primary_key=True),
    Column('course_id', Integer, ForeignKey('course.id'), primary_key=True)
)

# Course progress tracking model
class CourseProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    completed_modules = db.Column(db.Integer, default=0)
    total_modules = db.Column(db.Integer, default=0)
    progress_percentage = db.Column(db.Float, default=0.0)
    last_activity = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    completion_date = db.Column(db.DateTime, nullable=True)
    risk_score = db.Column(db.Integer, default=0)  # 0-100, higher means more at risk of not completing
    
    # Relationship to course
    course = db.relationship('Course')
    
    # Module progress (JSON field to store module completion status)
    module_progress = db.Column(db.Text, default='{}')  # JSON string: {module_id: {completed: true/false, completion_date: date}}

class SystemSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)  # email, security, organization, etc.
    setting_key = db.Column(db.String(100), nullable=False)
    setting_value = db.Column(db.Text, nullable=True)
    data_type = db.Column(db.String(20), nullable=False, default='string')  # string, integer, boolean, json
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('category', 'setting_key', name='_category_key_uc'),)

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False)  # user, course, organization, etc.
    resource_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)  # JSON string with additional details
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationship to user
    user = db.relationship('User', backref='audit_logs')

class EmailTemplate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    template_name = db.Column(db.String(100), unique=True, nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    html_content = db.Column(db.Text, nullable=False)
    text_content = db.Column(db.Text, nullable=True)
    variables = db.Column(db.Text, nullable=True)  # JSON string of available variables
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class SystemAnnouncement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    announcement_type = db.Column(db.String(20), nullable=False, default='info')  # info, warning, critical
    target_roles = db.Column(db.Text, nullable=True)  # JSON array of target roles
    target_organizations = db.Column(db.Text, nullable=True)  # JSON array of organization IDs
    is_active = db.Column(db.Boolean, default=True)
    show_until = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationship to creator
    creator = db.relationship('User', backref='announcements')

# Analytics Models

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_id = db.Column(db.String(100), nullable=False)
    login_time = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    logout_time = db.Column(db.DateTime, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(100), nullable=True)  # City, Country
    session_duration_minutes = db.Column(db.Integer, nullable=True)
    pages_visited = db.Column(db.Integer, default=0)
    
    # Relationship
    user = db.relationship('User', backref='sessions')

class PageView(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    session_id = db.Column(db.String(100), nullable=True)
    page_url = db.Column(db.String(500), nullable=False)
    page_title = db.Column(db.String(200), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    time_spent_seconds = db.Column(db.Integer, nullable=True)
    referrer = db.Column(db.String(500), nullable=True)
    
    # Relationship
    user = db.relationship('User', backref='page_views')

class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    quiz_content_id = db.Column(db.Integer, db.ForeignKey('module_content.id'), nullable=False)
    attempt_number = db.Column(db.Integer, default=1)
    score = db.Column(db.Float, nullable=True)
    total_questions = db.Column(db.Integer, nullable=False)
    correct_answers = db.Column(db.Integer, nullable=False)
    time_taken_minutes = db.Column(db.Integer, nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    answers = db.Column(db.Text, nullable=True)  # JSON string of answers
    
    # Relationships
    user = db.relationship('User', backref='quiz_attempts')
    quiz_content = db.relationship('ModuleContent', backref='quiz_attempts')

class ContentInteraction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content_id = db.Column(db.Integer, db.ForeignKey('module_content.id'), nullable=False)
    interaction_type = db.Column(db.String(50), nullable=False)  # video_progress, pdf_progress, quiz_completed, content_complete
    interaction_data = db.Column(db.Text, nullable=True)  # JSON data with detailed interaction info
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    duration_seconds = db.Column(db.Integer, nullable=True)
    completion_percentage = db.Column(db.Float, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref='content_interactions')
    content = db.relationship('ModuleContent', backref='interactions')

class CourseEnrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    progress_percentage = db.Column(db.Float, default=0.0)
    time_spent_minutes = db.Column(db.Integer, default=0)
    last_accessed = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User')
    course = db.relationship('Course')

class SystemMetrics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(100), nullable=False)
    metric_value = db.Column(db.Float, nullable=False)
    metric_unit = db.Column(db.String(50), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    meta_data = db.Column(db.Text, nullable=True)  # JSON string for additional data

class EmailMetrics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    template_name = db.Column(db.String(100), nullable=False)
    recipient_email = db.Column(db.String(120), nullable=False)
    sent_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    delivered_at = db.Column(db.DateTime, nullable=True)
    opened_at = db.Column(db.DateTime, nullable=True)
    clicked_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='sent')  # sent, delivered, opened, clicked, failed
    error_message = db.Column(db.Text, nullable=True)

class FeatureUsage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    feature_name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    usage_count = db.Column(db.Integer, default=1)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='feature_usage')

class APIUsage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    endpoint = db.Column(db.String(200), nullable=False)
    method = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    response_time_ms = db.Column(db.Integer, nullable=True)
    status_code = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    ip_address = db.Column(db.String(45), nullable=True)
    
    # Relationship
    user = db.relationship('User', backref='api_usage')
