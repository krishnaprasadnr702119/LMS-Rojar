from app import app, db
from models import User, Organization, Course, Module, ModuleContent, QuizQuestion, QuizOption
from models import Task, CourseRequest, CourseProgress
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
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
DB_NAME = os.getenv('DB_NAME', 'lms')

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
    
    # Commit all changes
    print("Committing changes to database...")
    db.session.commit()
    
    print("Database tables have been reset and recreated successfully with sample data!")
    print("Default login credentials:")
    print("Admin: username='admin', password='admin123'")
    print("Portal Admin: username='portaladmin', password='portal123'")
    print("Employee: username='employee1', password='employee123'")
