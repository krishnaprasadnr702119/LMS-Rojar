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
