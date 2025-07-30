from app import app, db
from models import User, Organization, Course, Module, ModuleContent, QuizQuestion, QuizOption
from models import Task, CourseRequest, CourseProgress, SystemSettings, AuditLog, EmailTemplate, SystemAnnouncement
from models import UserSession, PageView, QuizAttempt, ContentInteraction, CourseEnrollment, SystemMetrics, EmailMetrics, FeatureUsage, APIUsage
import datetime
import bcrypt
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def hash_password(password):
    """Hash a password for storing."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Docker database connection settings
# These values can be overridden by environment variables
DB_HOST = os.getenv('DB_HOST', 'db')  # 'db' is the common service name in docker-compose
DB_PORT = os.getenv('DB_PORT', '5432')
DB_USER = os.getenv('DB_USER', 'lmsuser')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'lmspassword')
DB_NAME = os.getenv('DB_NAME', 'lmsdb')

# Update database URI if needed
if 'DATABASE_URL' not in os.environ:
    app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    print(f"Using database: {app.config['SQLALCHEMY_DATABASE_URI']}")

# Create a Flask application context
with app.app_context():
    try:
        print("Starting database initialization...")
        
        # Check if we can connect to the database
        try:
            db.engine.connect()
            print("Successfully connected to the database")
        except Exception as e:
            print(f"Error connecting to the database: {e}")
            print("Please check your Docker database service is running and properly configured")
            exit(1)
            
        # Drop all existing tables and recreate them
        print("Dropping all existing tables...")
        db.drop_all()
        
        print("Creating all tables...")
        db.create_all()
    except Exception as e:
        print(f"Error during database setup: {e}")
        exit(1)
    
    # Create admin user
    print("Creating default admin user...")
    admin_user = User(
        username='admin',
        password=hash_password('admin123'),
        role='admin',
        email='admin@example.com',
        designation='System Administrator'
    )
    db.session.add(admin_user)
    
    # Create portal admin user
    portal_admin = User(
        username='portaladmin',
        password=hash_password('portal123'),
        role='portal_admin',
        email='portal@example.com',
        designation='Portal Administrator'
    )
    db.session.add(portal_admin)
    
    # Create sample organization
    print("Creating sample organization...")
    organization = Organization(
        name='Sample Organization',
        portal_admin=portal_admin.username,
        org_domain='example.com',
        created=datetime.datetime.now().date(),
        status='active'
    )
    db.session.add(organization)
    
    # Link portal admin to organization
    portal_admin.org_id = 1
    
    # Create sample employee user
    print("Creating sample employee user...")
    employee = User(
        username='employee1',
        password=hash_password('employee123'),
        role='employee',
        email='employee@example.com',
        designation='Software Engineer',
        org_id=1
    )
    db.session.add(employee)
    
    # Create sample courses
    print("Creating sample courses...")
    course1 = Course(
        title='Introduction to Programming',
        description='Learn the basics of programming with this introductory course',
        status='published'
    )
    
    course2 = Course(
        title='Advanced Data Science',
        description='Explore advanced concepts in data science and machine learning',
        status='published'
    )
    
    db.session.add_all([course1, course2])
    db.session.flush()  # Flush to get IDs
    
    # Assign courses to organization
    organization.courses.extend([course1, course2])
    
    # Create modules for courses
    print("Creating course modules and content...")
    # Modules for Course 1
    module1 = Module(
        title='Getting Started',
        description='Introduction to programming concepts',
        order=1,
        course_id=course1.id
    )
    
    module2 = Module(
        title='Basic Syntax',
        description='Learn about variables, data types, and operators',
        order=2,
        course_id=course1.id
    )
    
    # Modules for Course 2
    module3 = Module(
        title='Machine Learning Basics',
        description='Introduction to machine learning algorithms',
        order=1,
        course_id=course2.id
    )
    
    db.session.add_all([module1, module2, module3])
    db.session.flush()
    
    # Create content for modules
    # Content for Module 1
    content1 = ModuleContent(
        title='What is Programming?',
        content_type='pdf',
        file_path='uploads/courses/sample.pdf',
        content='Introduction to programming concepts',
        order=1,
        module_id=module1.id
    )
    
    content2 = ModuleContent(
        title='Setting Up Your Environment',
        content_type='video',
        file_path='uploads/courses/sample_video.mp4',
        order=2,
        module_id=module1.id
    )
    
    # Quiz for Module 1
    quiz1 = ModuleContent(
        title='Programming Basics Quiz',
        content_type='quiz',
        order=3,
        module_id=module1.id
    )
    
    db.session.add_all([content1, content2, quiz1])
    db.session.flush()
    
    # Create quiz questions
    question1 = QuizQuestion(
        question_text='What does CPU stand for?',
        question_type='single-choice',
        order=1,
        content_id=quiz1.id
    )
    
    db.session.add(question1)
    db.session.flush()
    
    # Create quiz options
    options = [
        QuizOption(option_text='Central Processing Unit', is_correct=True, question_id=question1.id),
        QuizOption(option_text='Central Program Unit', is_correct=False, question_id=question1.id),
        QuizOption(option_text='Computer Processing Unit', is_correct=False, question_id=question1.id),
        QuizOption(option_text='Control Processing Unit', is_correct=False, question_id=question1.id)
    ]
    db.session.add_all(options)
    
    # Assign course to employee
    employee.courses.append(course1)
    
    # Create course progress
    progress = CourseProgress(
        user_id=employee.id,
        course_id=course1.id,
        completed_modules=1,
        total_modules=2,
        progress_percentage=50.0,
        module_progress=json.dumps({
            str(module1.id): {"completed": True, "completion_date": datetime.datetime.now().isoformat()},
            str(module2.id): {"completed": False, "completion_date": None}
        })
    )
    db.session.add(progress)
    
    # Create course request
    request = CourseRequest(
        organization_id=organization.id,
        course_id=course2.id,
        requested_by=employee.id,
        status='pending',
        payment_amount=99.99,
        admin_notes='Employee has requested access to this advanced course'
    )
    db.session.add(request)
    
    # Initialize system settings
    print("Creating default system settings...")
    default_settings = [
        # Email Settings
        ('email', 'smtp_server', 'smtp.gmail.com', 'string', 'SMTP Server'),
        ('email', 'smtp_port', '587', 'integer', 'SMTP Port'),
        ('email', 'smtp_use_tls', 'true', 'boolean', 'Use TLS'),
        ('email', 'smtp_username', '', 'string', 'SMTP Username'),
        ('email', 'smtp_password', '', 'string', 'SMTP Password'),
        ('email', 'default_sender', 'noreply@lms.com', 'string', 'Default Sender Email'),
        ('email', 'notification_enabled', 'true', 'boolean', 'Email Notifications Enabled'),
        
        # Security Settings
        ('security', 'password_min_length', '8', 'integer', 'Minimum Password Length'),
        ('security', 'password_require_uppercase', 'true', 'boolean', 'Require Uppercase'),
        ('security', 'password_require_lowercase', 'true', 'boolean', 'Require Lowercase'),
        ('security', 'password_require_numbers', 'true', 'boolean', 'Require Numbers'),
        ('security', 'password_require_special', 'false', 'boolean', 'Require Special Characters'),
        ('security', 'session_timeout', '480', 'integer', 'Session Timeout (minutes)'),
        ('security', 'max_login_attempts', '5', 'integer', 'Max Login Attempts'),
        ('security', 'lockout_duration', '30', 'integer', 'Lockout Duration (minutes)'),
        ('security', 'two_factor_enabled', 'false', 'boolean', 'Two-Factor Authentication'),
        ('security', 'audit_logging', 'true', 'boolean', 'Audit Logging Enabled'),
        
        # Organization Settings
        ('organization', 'default_employee_limit', '100', 'integer', 'Default Employee Limit'),
        ('organization', 'auto_assign_courses', 'true', 'boolean', 'Auto-assign Organization Courses'),
        ('organization', 'allow_self_registration', 'false', 'boolean', 'Allow Self Registration'),
        ('organization', 'require_domain_verification', 'true', 'boolean', 'Require Domain Verification'),
        ('organization', 'default_subscription_plan', 'basic', 'string', 'Default Subscription Plan'),
        
        # Course Settings
        ('course', 'auto_publish', 'false', 'boolean', 'Auto-publish Courses'),
        ('course', 'require_approval', 'true', 'boolean', 'Require Course Approval'),
        ('course', 'default_quiz_time_limit', '30', 'integer', 'Default Quiz Time Limit (minutes)'),
        ('course', 'default_passing_score', '70', 'integer', 'Default Passing Score (%)'),
        ('course', 'max_quiz_attempts', '3', 'integer', 'Maximum Quiz Attempts'),
        ('course', 'allow_content_download', 'false', 'boolean', 'Allow Content Downloads'),
        
        # File Upload Settings
        ('file_upload', 'max_file_size_mb', '100', 'integer', 'Max File Size (MB)'),
        ('file_upload', 'max_video_size_mb', '500', 'integer', 'Max Video Size (MB)'),
        ('file_upload', 'allowed_image_types', '["jpg", "jpeg", "png", "gif"]', 'json', 'Allowed Image Types'),
        ('file_upload', 'allowed_video_types', '["mp4", "avi", "mov", "wmv"]', 'json', 'Allowed Video Types'),
        ('file_upload', 'allowed_document_types', '["pdf", "doc", "docx", "ppt", "pptx"]', 'json', 'Allowed Document Types'),
        ('file_upload', 'storage_quota_gb', '10', 'integer', 'Storage Quota per Organization (GB)'),
        
        # System Settings
        ('system', 'maintenance_mode', 'false', 'boolean', 'Maintenance Mode'),
        ('system', 'system_name', 'Learning Management System', 'string', 'System Name'),
        ('system', 'support_email', 'support@lms.com', 'string', 'Support Email'),
        ('system', 'backup_enabled', 'true', 'boolean', 'Automated Backups Enabled'),
        ('system', 'backup_frequency_hours', '24', 'integer', 'Backup Frequency (hours)'),
        ('system', 'log_retention_days', '90', 'integer', 'Log Retention (days)'),
    ]
    
    for category, key, value, data_type, description in default_settings:
        setting = SystemSettings(
            category=category,
            setting_key=key,
            setting_value=value,
            data_type=data_type,
            description=description
        )
        db.session.add(setting)
    
    # Initialize default email templates
    print("Creating default email templates...")
    default_templates = [
        {
            'template_name': 'welcome_employee',
            'subject': 'Welcome to {org_name} - Learning Management Portal',
            'html_content': '''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to {org_name}</title>
</head>
<body>
    <h1>Welcome to {org_name}</h1>
    <p>Dear {user_name},</p>
    <p>You have been invited to join {org_name} on our Learning Management System.</p>
    <p><strong>Email:</strong> {user_email}</p>
    <p><strong>Temporary Password:</strong> {temp_password}</p>
    <p><a href="{login_url}">Login to Portal</a></p>
    <p>Please change your password after your first login.</p>
    <p>Best regards,<br>The {org_name} Team</p>
</body>
</html>''',
            'text_content': '''Welcome to {org_name}

Dear {user_name},

You have been invited to join {org_name} on our Learning Management System.

Email: {user_email}
Temporary Password: {temp_password}
Login URL: {login_url}

Please change your password after your first login.

Best regards,
The {org_name} Team''',
            'variables': json.dumps(["org_name", "user_name", "user_email", "temp_password", "login_url"])
        },
        {
            'template_name': 'password_reset',
            'subject': 'Password Reset - {org_name} Learning Portal',
            'html_content': '''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset - {org_name}</title>
</head>
<body>
    <h1>Password Reset - {org_name}</h1>
    <p>Dear {user_name},</p>
    <p>Your password has been reset for the {org_name} Learning Management System.</p>
    <p><strong>Email:</strong> {user_email}</p>
    <p><strong>New Password:</strong> {new_password}</p>
    <p><a href="{login_url}">Login to Portal</a></p>
    <p><strong>Important:</strong> Please change your password after logging in for security.</p>
    <p>Best regards,<br>The {org_name} Team</p>
</body>
</html>''',
            'text_content': '''Password Reset - {org_name}

Dear {user_name},

Your password has been reset for the {org_name} Learning Management System.

Email: {user_email}
New Password: {new_password}
Login URL: {login_url}

Important: Please change your password after logging in for security.

Best regards,
The {org_name} Team''',
            'variables': json.dumps(["org_name", "user_name", "user_email", "new_password", "login_url"])
        }
    ]
    
    for template_data in default_templates:
        template = EmailTemplate(**template_data)
        db.session.add(template)
    
    # Create a sample system announcement
    print("Creating sample system announcement...")
    announcement = SystemAnnouncement(
        title='Welcome to the New LMS System',
        content='We are excited to announce the launch of our new Learning Management System with enhanced features including system settings, email templates, and audit logging. Please explore the new Settings section in the admin dashboard.',
        announcement_type='info',
        target_roles=json.dumps(['admin', 'portal_admin']),
        target_organizations=json.dumps([]),
        created_by=admin_user.id,
        show_until=datetime.datetime.now() + datetime.timedelta(days=30)
    )
    db.session.add(announcement)
    
    # Create an audit log entry
    print("Creating sample audit log entry...")
    audit_entry = AuditLog(
        user_id=admin_user.id,
        action='database_initialized',
        resource_type='system',
        details=json.dumps({
            'message': 'Database initialized with sample data',
            'timestamp': datetime.datetime.now().isoformat(),
            'settings_count': len(default_settings),
            'templates_count': len(default_templates)
        })
    )
    db.session.add(audit_entry)
    
    # Create sample analytics data
    print("Creating sample analytics data...")
    
    # Create sample user sessions
    for i in range(10):
        session = UserSession(
            user_id=1,  # admin user
            session_id=f'session_{i}',
            login_time=datetime.datetime.utcnow() - datetime.timedelta(days=i, hours=i),
            logout_time=datetime.datetime.utcnow() - datetime.timedelta(days=i, hours=i-1) if i < 5 else None,
            ip_address=f'192.168.1.{100+i}',
            user_agent='Mozilla/5.0 (Test Browser)',
            location='Test City, Test Country',
            session_duration_minutes=60 if i < 5 else None,
            pages_visited=i * 5
        )
        db.session.add(session)
    
    # Create sample page views
    pages = ['/dashboard', '/courses', '/profile', '/settings', '/admin']
    for i in range(20):
        page_view = PageView(
            user_id=1,
            session_id=f'session_{i % 10}',
            page_url=pages[i % len(pages)],
            page_title=f'Test Page {i}',
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=i),
            time_spent_seconds=60 + (i * 10),
            referrer='/' if i > 0 else None
        )
        db.session.add(page_view)
    
    # Create sample quiz attempts
    quiz_attempt = QuizAttempt(
        user_id=3,  # employee user
        quiz_content_id=3,  # quiz1 will have ID 3
        attempt_number=1,
        score=85.0,
        total_questions=10,
        correct_answers=8,
        time_taken_minutes=15,
        started_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
        completed_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1, minutes=45),
        answers='{"1": "A", "2": "B", "3": "C"}'
    )
    db.session.add(quiz_attempt)
    
    # Create sample content interactions
    for i in range(3):  # Only 3 content items exist
        interaction = ContentInteraction(
            user_id=3,
            content_id=i + 1,
            interaction_type=['view', 'download', 'complete'][i % 3],
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=i),
            duration_seconds=300 + (i * 60),
            completion_percentage=20.0 * (i + 1)
        )
        db.session.add(interaction)
    
    # Create sample course enrollments
    enrollment = CourseEnrollment(
        user_id=3,
        course_id=1,
        enrolled_at=datetime.datetime.utcnow() - datetime.timedelta(days=7),
        progress_percentage=75.0,
        time_spent_minutes=120,
        last_accessed=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    )
    db.session.add(enrollment)
    
    # Create sample system metrics
    metrics = [
        ('cpu_usage', 45.5, '%'),
        ('memory_usage', 62.3, '%'),
        ('disk_usage', 78.1, '%'),
        ('active_sessions', 15, 'count'),
        ('response_time', 250, 'ms')
    ]
    
    for name, value, unit in metrics:
        metric = SystemMetrics(
            metric_name=name,
            metric_value=value,
            metric_unit=unit,
            timestamp=datetime.datetime.utcnow(),
            meta_data='{"server": "app-01"}'
        )
        db.session.add(metric)
    
    # Create sample feature usage
    features = ['course_viewer', 'quiz_taker', 'dashboard', 'profile_edit', 'settings']
    for feature in features:
        usage = FeatureUsage(
            feature_name=feature,
            user_id=1,
            usage_count=1,
            timestamp=datetime.datetime.utcnow()
        )
        db.session.add(usage)
    
    # Create sample API usage
    endpoints = ['/api/courses', '/api/users', '/api/dashboard', '/api/progress']
    for endpoint in endpoints:
        api_usage = APIUsage(
            endpoint=endpoint,
            method='GET',
            user_id=1,
            response_time_ms=150,
            status_code=200,
            timestamp=datetime.datetime.utcnow(),
            ip_address='192.168.1.100'
        )
        db.session.add(api_usage)
    
    # Commit all changes
    print("Committing changes to database...")
    db.session.commit()
    
    print("Database tables have been reset and recreated successfully with sample data!")
    print(f"✅ Initialized {len(default_settings)} system settings")
    print(f"✅ Initialized {len(default_templates)} email templates")
    print("✅ Created sample system announcement")
    print("✅ Created audit log entry")
    print("✅ Created sample analytics data")
    print()
    print("Default login credentials:")
    print("Admin: username='admin', password='admin123'")
    print("Portal Admin: username='portaladmin', password='portal123'")
    print("Employee: username='employee1', password='employee123'")
    print()
    print("Admin Settings:")
    print("- Access the Settings page in admin dashboard to configure system preferences")
    print("- Email templates can be customized for user invitations and password resets")
    print("- System announcements can be created for user notifications")
    print("- Analytics dashboard provides comprehensive insights into system usage")
