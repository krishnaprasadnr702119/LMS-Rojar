from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mail import Mail, Message
from dotenv import load_dotenv
import os
import string
import secrets
import subprocess
import json
import bcrypt
from datetime import datetime
from sqlalchemy import extract
from models import db, User, Organization, Course, Module, ModuleContent, QuizQuestion, QuizOption, Task, organization_courses, CourseRequest, CourseProgress

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

def verify_password(stored_password, provided_password):
    """Verify a stored password against provided password."""
    return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))

def hash_password(password):
    """Hash a password for storing."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Assign a course to all employees in an organization
@app.route('/api/portal_admin/assign_course_to_all', methods=['POST'])
def assign_course_to_all_employees():
    """Assign a course to all employees in the portal admin's organization."""
    try:
        data = request.json
        username = data.get('username')
        course_id = data.get('course_id')
        if not username or not course_id:
            return jsonify({'error': 'Username and course_id are required'}), 400

        # Find the portal admin user
        user = User.query.filter_by(username=username, role='portal_admin').first()
        if not user:
            return jsonify({'error': 'Portal admin not found'}), 404
        if not user.org_id:
            return jsonify({'error': 'User not associated with an organization'}), 404

        # Get the organization
        organization = db.session.get(Organization, user.org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404

        # Get the course
        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404

        # Get all employees in this organization
        employees = User.query.filter_by(org_id=organization.id, role='employee').all()
        assigned_count = 0
        for employee in employees:
            if course not in employee.courses:
                employee.courses.append(course)
                assigned_count += 1

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Course "{course.title}" assigned to {assigned_count} employees in {organization.name}',
            'assigned_count': assigned_count
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to assign course to all: {str(e)}'}), 500

# --- Portal Admin: Unassign Course from Employee ---
@app.route('/api/portal_admin/unassign_course_from_employee', methods=['POST'])
def unassign_course_from_employee():
    """Unassign a course from an employee (portal admin action)"""
    try:
        data = request.json
        employee_id = data.get('employee_id')
        course_id = data.get('course_id')
        if not employee_id or not course_id:
            return jsonify({'error': 'employee_id and course_id are required'}), 400

        # Find the employee
        employee = User.query.filter_by(id=employee_id, role='employee').first()
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404

        # Find the course
        course = Course.query.get(course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404

        # Remove the course from the employee's assigned courses
        if course in employee.courses:
            employee.courses.remove(course)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Course unassigned from employee'}), 200
        else:
            return jsonify({'error': 'Course not assigned to employee'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to unassign course: {str(e)}'}), 500
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql://lmsuser:lmspassword@localhost:5432/lmsdb'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@lms.com')

# Initialize extensions
db.init_app(app)
mail = Mail(app)


# Health check endpoint for frontend and testing
@app.route('/api/hello')
def hello():
    return jsonify({'message': 'Hello from the Python backend!', 'status': 'success'})

@app.route('/api/portal_admin/course_assignments/<int:course_id>', methods=['GET'])
def get_course_assignments(course_id):
    """Return all employees for the organization assigned to the course, with assignment flag."""
    try:
        # Get organization_id from query param or fail
        org_id = request.args.get('organization_id', type=int)
        if not org_id:
            return jsonify({'success': False, 'error': 'organization_id is required'}), 400

        # Get organization
        organization = db.session.get(Organization, org_id)
        if not organization:
            return jsonify({'success': False, 'error': 'Organization not found'}), 404

        # Get course
        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'success': False, 'error': 'Course not found'}), 404

        # Get all employees in org
        employees = User.query.filter_by(org_id=org_id, role='employee').all()

        # For each employee, check if course is in their courses
        employee_assignments = []
        for emp in employees:
            is_assigned = course in emp.courses
            employee_assignments.append({
                'id': emp.id,
                'username': emp.username,
                'email': emp.email,
                'designation': emp.designation,
                'is_assigned': is_assigned
            })

        return jsonify({
            'success': True,
            'employees': employee_assignments,
            'course': {
                'id': course.id,
                'title': course.title
            },
            'organization': {
                'id': organization.id,
                'name': organization.name
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/create_test_user', methods=['POST'])
def create_test_user():
    data = request.get_json() or {}
    username = data.get('username', 'admin')
    password = data.get('password', 'admin123')
    role = data.get('role', 'admin')
    email = data.get('email', f'{username}@example.com')  # Generate default email if not provided
    designation = data.get('designation')
    org_id = data.get('org_id')
    
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'User already exists'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
    user = User(username=username, password=hash_password(password), role=role, email=email, designation=designation, org_id=org_id)
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': True, 'message': f'User {username} created', 'role': role})


import jwt
import datetime
import secrets
import string
@app.route('/api/organizations', methods=['POST'])
def create_organization():
    data = request.get_json()
    from datetime import date
    
    # Extract organization data
    name = data.get('name')
    portal_admin = data.get('portal_admin')
    org_domain = data.get('org_domain')
    assigned_course = data.get('assigned_course')
    status = data.get('status', 'active')
    created_str = data.get('created')
    course_ids = data.get('course_ids')
    
    # Extract portal admin user data
    admin_password = data.get('admin_password', 'portaladmin123')
    admin_email = data.get('admin_email', f'{portal_admin}@{org_domain}')
    admin_designation = data.get('admin_designation', 'Portal Administrator')
    
    # Validation
    if not all([name, portal_admin, org_domain]):
        return jsonify({'success': False, 'message': 'Missing required fields: name, portal_admin, org_domain'}), 400
    
    if status not in ['active', 'inactive', 'suspended']:
        return jsonify({'success': False, 'message': 'Invalid status'}), 400
    
    if Organization.query.filter_by(name=name).first():
        return jsonify({'success': False, 'message': 'Organization already exists'}), 400
        
    if Organization.query.filter_by(org_domain=org_domain).first():
        return jsonify({'success': False, 'message': 'Organization domain already exists'}), 400
    
    if User.query.filter_by(username=portal_admin).first():
        return jsonify({'success': False, 'message': 'Portal admin username already exists'}), 400
        
    if User.query.filter_by(email=admin_email).first():
        return jsonify({'success': False, 'message': 'Portal admin email already exists'}), 400
    
    try:
        # Parse creation date
        if created_str:
            created = date.fromisoformat(created_str)
        else:
            created = date.today()
        
        # Create organization
        org = Organization(

            name=name,
            portal_admin=portal_admin,
            org_domain=org_domain,
            created=created,
            status=status
        )
        
        # Handle course assignments
        if course_ids and isinstance(course_ids, list):
            org.courses = Course.query.filter(Course.id.in_(course_ids)).all()
        elif assigned_course:
            course = Course.query.filter_by(id=assigned_course).first()
            if course:
                org.courses = [course]
        
        # Add organization first to get the org ID
        db.session.add(org)
        db.session.flush()  # Get the org.id without committing
        
        # Create portal admin user and link to organization
        portal_admin_user = User(
            username=portal_admin,
            password=hash_password(admin_password),
            role='portal_admin',
            email=admin_email,
            designation=admin_designation,
            org_id=org.id
        )
        
        db.session.add(portal_admin_user)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Organization and portal admin created successfully',
            'organization_id': org.id,
            'admin_username': portal_admin,
            'admin_email': admin_email
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to create organization: {str(e)}'}), 500

@app.route('/api/organizations', methods=['GET'])
def get_organizations():
    orgs = Organization.query.order_by(Organization.created.desc()).all()
    organizations = [
        {
            "id": org.id,
            "name": org.name,
            "portal_admin": org.portal_admin,
            "org_domain": org.org_domain,
            "created": org.created.strftime('%Y-%m-%d'),
            "status": org.status,
            "courses": [
                {"id": c.id, "title": c.title}
                for c in org.courses
            ]
        }
        for org in orgs
    ]
    return jsonify({"organizations": organizations})
# Assign multiple courses to an organization
@app.route('/api/organizations/<int:org_id>/assign_courses', methods=['POST'])
def assign_courses_to_organization(org_id):
    data = request.get_json()
    course_ids = data.get('course_ids', [])
    org = Organization.query.get_or_404(org_id)
    if not isinstance(course_ids, list):
        return jsonify({"success": False, "message": "course_ids must be a list"}), 400
    
    # Get the new courses to assign
    courses = Course.query.filter(Course.id.in_(course_ids)).all() if course_ids else []
    
    # Update organization courses
    org.courses = courses
    
    # Sync courses to all employees in this organization
    employees = User.query.filter_by(org_id=org_id, role='employee').all()
    
    for employee in employees:
        # Clear existing courses for this employee
        employee.courses.clear()
        
        # Assign new courses to employee
        for course in courses:
            employee.courses.append(course)
    
    db.session.commit()
    return jsonify({
        "success": True, 
        "message": f"Courses assigned to organization and {len(employees)} employees", 
        "assigned_course_ids": [c.id for c in org.courses],
        "employees_updated": len(employees)
    })

@app.route('/api/organizations/<int:org_id>', methods=['DELETE'])
def delete_organization(org_id):
    try:
        org = Organization.query.get_or_404(org_id)
        
        # First, remove all course assignments from employees in this organization
        employees = User.query.filter_by(org_id=org_id, role='employee').all()
        for employee in employees:
            employee.courses.clear()
        db.session.flush()
        
        # Delete all course requests associated with this organization
        course_requests_to_delete = CourseRequest.query.filter_by(organization_id=org_id).all()
        for request in course_requests_to_delete:
            db.session.delete(request)
        db.session.flush()
        
        # Remove all course assignments from the organization
        org.courses.clear()
        db.session.flush()
        
        # Delete all users associated with this organization
        users_to_delete = User.query.filter_by(org_id=org_id).all()
        for user in users_to_delete:
            db.session.delete(user)
        db.session.flush()  # Ensure users are deleted before deleting org
        
        # Finally, delete the organization
        db.session.delete(org)
        db.session.commit()
        
        return jsonify({
            "success": True, 
            "message": f"Organization, {len(users_to_delete)} user(s), and {len(course_requests_to_delete)} course request(s) deleted successfully"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to delete organization: {str(e)}"}), 500

@app.route('/api/organizations/<int:org_id>/status', methods=['PATCH'])
def update_organization_status(org_id):
    data = request.get_json()
    new_status = data.get('status')
    
    if not new_status or new_status not in ['active', 'inactive', 'suspended']:
        return jsonify({"success": False, "message": "Invalid status"}), 400
        
    org = Organization.query.get_or_404(org_id)
    org.status = new_status
    db.session.commit()
    
    return jsonify({"success": True, "message": f"Organization status updated to {new_status}", "status": new_status})

# Course API endpoints
@app.route('/api/courses', methods=['GET'])
def get_courses():
    courses = Course.query.order_by(Course.created.desc()).all()
    course_list = [
        {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "created": course.created.strftime('%Y-%m-%d %H:%M:%S'),
            "status": course.status,
            "module_count": len(course.modules)
        }
        for course in courses
    ]
    return jsonify({"success": True, "courses": course_list})

@app.route('/api/courses', methods=['POST'])
def create_course():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    status = data.get('status', 'draft')
    
    if not title:
        return jsonify({"success": False, "message": "Title is required"}), 400
    
    if status not in ['draft', 'published', 'archived']:
        return jsonify({"success": False, "message": "Invalid status"}), 400
    
    course = Course(
        title=title,
        description=description,
        status=status
    )
    
    db.session.add(course)
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": "Course created successfully",
        "course": {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "created": course.created.strftime('%Y-%m-%d %H:%M:%S'),
            "status": course.status
        }
    })

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    
    modules = [
        {
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "order": module.order,
            "contents": [
                {
                    "id": content.id,
                    "title": content.title,
                    "content_type": content.content_type,
                    "order": content.order
                }
                for content in sorted(module.contents, key=lambda x: x.order)
            ]
        }
        for module in sorted(course.modules, key=lambda x: x.order)
    ]
    
    course_data = {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "created": course.created.strftime('%Y-%m-%d %H:%M:%S'),
        "status": course.status,
        "modules": modules
    }
    
    return jsonify({"success": True, "course": course_data})

@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({"success": True, "message": "Course deleted successfully"})

# Module API endpoints
@app.route('/api/courses/<int:course_id>/modules', methods=['POST'])
def create_module(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.get_json()
    
    title = data.get('title')
    description = data.get('description', '')
    order = data.get('order')
    
    if not title:
        return jsonify({"success": False, "message": "Title is required"}), 400
    
    # If order is not provided, add it at the end
    if order is None:
        max_order = db.session.query(db.func.max(Module.order)).filter(Module.course_id == course_id).scalar() or 0
        order = max_order + 1
    
    module = Module(
        title=title,
        description=description,
        order=order,
        course_id=course_id
    )
    
    db.session.add(module)
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": "Module created successfully",
        "module": {
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "order": module.order,
            "course_id": module.course_id
        }
    })

# Module Content API endpoints
@app.route('/api/modules/<int:module_id>/contents', methods=['POST'])
def create_module_content(module_id):
    module = Module.query.get_or_404(module_id)
    content_type = request.form.get('content_type')
    title = request.form.get('title')
    order = request.form.get('order')
    
    if not title or not content_type:
        return jsonify({"success": False, "message": "Title and content type are required"}), 400
    
    if content_type not in ['video', 'pdf', 'quiz']:
        return jsonify({"success": False, "message": "Invalid content type"}), 400
    
    # If order is not provided, add it at the end
    if order is None:
        max_order = db.session.query(db.func.max(ModuleContent.order)).filter(ModuleContent.module_id == module_id).scalar() or 0
        order = max_order + 1
    else:
        order = int(order)
    
    content = ModuleContent(
        title=title,
        content_type=content_type,
        order=order,
        module_id=module_id
    )
    
    # Handle file upload for video or PDF
    if content_type in ['video', 'pdf']:
        file = request.files.get('file')
        if not file:
            return jsonify({"success": False, "message": f"File is required for {content_type} content"}), 400
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join('uploads', 'courses', str(module.course_id), 'modules', str(module_id))
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file with a secure filename
        from werkzeug.utils import secure_filename
        filename = secure_filename(file.filename)
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # Store relative path in database
        content.file_path = os.path.join('uploads', 'courses', str(module.course_id), 'modules', str(module_id), filename)
    
    # Handle quiz content
    elif content_type == 'quiz':
        # For quiz, we don't need a file - questions will be added separately
        content.file_path = None
    
    db.session.add(content)
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": f"{content_type.capitalize()} content created successfully",
        "content": {
            "id": content.id,
            "title": content.title,
            "content_type": content.content_type,
            "file_path": content.file_path,
            "order": content.order,
            "module_id": content.module_id
        }
    })

# Quiz API endpoints for Superadmin
@app.route('/api/contents/<int:content_id>/questions', methods=['POST'])
def create_quiz_question(content_id):
    """Create a quiz question for a specific quiz content (Superadmin only)"""
    try:
        # Get the content and verify it's a quiz
        content = ModuleContent.query.get_or_404(content_id)
        
        if content.content_type != 'quiz':
            return jsonify({"success": False, "message": "This content is not a quiz"}), 400
        
        data = request.get_json()
        question_text = data.get('question_text')
        question_type = data.get('question_type', 'multiple-choice')
        options = data.get('options', [])
        order = data.get('order')
        
        # Validation
        if not question_text:
            return jsonify({"success": False, "message": "Question text is required"}), 400
        
        if question_type not in ['multiple-choice', 'single-choice', 'true-false']:
            return jsonify({"success": False, "message": "Invalid question type"}), 400
        
        if not options or len(options) < 2:
            return jsonify({"success": False, "message": "At least 2 options are required"}), 400
        
        # Check if at least one option is marked as correct
        correct_options = [opt for opt in options if opt.get('is_correct', False)]
        if not correct_options:
            return jsonify({"success": False, "message": "At least one option must be marked as correct"}), 400
        
        # For single-choice and multiple-choice, ensure proper validation
        if question_type in ['single-choice', 'multiple-choice'] and question_type == 'single-choice' and len(correct_options) > 1:
            return jsonify({"success": False, "message": "Single-choice questions can have only one correct answer"}), 400
        
        # If order is not provided, add it at the end
        if order is None:
            max_order = db.session.query(db.func.max(QuizQuestion.order)).filter(QuizQuestion.content_id == content_id).scalar() or 0
            order = max_order + 1
        
        # Create the question
        question = QuizQuestion(
            question_text=question_text,
            question_type=question_type,
            order=order,
            content_id=content_id
        )
        
        db.session.add(question)
        db.session.flush()  # To get the question ID for options
        
        # Add options
        for i, option_data in enumerate(options):
            option_text = option_data.get('option_text', '').strip()
            is_correct = option_data.get('is_correct', False)
            
            if not option_text:
                return jsonify({"success": False, "message": f"Option {i+1} text cannot be empty"}), 400
            
            option = QuizOption(
                option_text=option_text,
                is_correct=is_correct,
                question_id=question.id
            )
            
            db.session.add(option)
        
        db.session.commit()
        
        return jsonify({
            "success": True, 
            "message": "Quiz question created successfully",
            "question": {
                "id": question.id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "order": question.order,
                "content_id": question.content_id,
                "options": [
                    {
                        "id": option.id,
                        "option_text": option.option_text,
                        "is_correct": option.is_correct
                    }
                    for option in question.options
                ]
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error creating question: {str(e)}"}), 500

@app.route('/api/contents/<int:content_id>/questions', methods=['GET'])
def get_quiz_questions(content_id):
    """Get all questions for a quiz content"""
    try:
        content = ModuleContent.query.get_or_404(content_id)
        
        if content.content_type != 'quiz':
            return jsonify({"success": False, "message": "This content is not a quiz"}), 400
        
        questions = QuizQuestion.query.filter_by(content_id=content_id).order_by(QuizQuestion.order).all()
        
        questions_data = []
        for question in questions:
            options_data = []
            for option in question.options:
                options_data.append({
                    "id": option.id,
                    "option_text": option.option_text,
                    "is_correct": option.is_correct
                })
            
            questions_data.append({
                "id": question.id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "order": question.order,
                "options": options_data
            })
        
        return jsonify({
            "success": True,
            "quiz": {
                "id": content.id,
                "title": content.title,
                "content_type": content.content_type,
                "questions": questions_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error fetching questions: {str(e)}"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # Find user by username only
    user = User.query.filter_by(username=username).first()
    
    # Verify password using bcrypt
    if user and verify_password(user.password, password):
        # Generate JWT token with role
        payload = {
            'user_id': user.id,
            'username': user.username,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }
        token = jwt.encode(payload, 'your_secret_key', algorithm='HS256')
        return jsonify({'success': True, 'message': 'Login successful', 'token': token, 'role': user.role})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

# Portal Admin API endpoints
def generate_temp_password(length=12):
    """Generate a secure temporary password"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for _ in range(length))

def send_invite_email(user_email, user_name, org_name, temp_password, login_url="http://localhost:5174/login"):
    """Send invitation email to new employee"""
    try:
        msg = Message(
            subject=f'Welcome to {org_name} - Learning Management Portal',
            recipients=[user_email],
            html=f"""
            <!DOCTYPE html>
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
            </html>
            """,
            body=f"""Welcome to {org_name}

Dear {user_name},

You have been invited to join {org_name} on our Learning Management System.

Email: {user_email}
Temporary Password: {temp_password}
Login URL: {login_url}

Please change your password after your first login.

Best regards,
The {org_name} Team"""
        )
        
        mail.send(msg)
        return True, "Email sent successfully"
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False, f"Failed to send email: {str(e)}"

def send_password_reset_email(user_email, user_name, org_name, new_password, reset_type="Password Reset"):
    """Send password reset email"""
    try:
        msg = Message(
            subject=f'{reset_type} - {org_name} Learning Portal',
            recipients=[user_email],
            html=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>{reset_type} - {org_name}</title>
            </head>
            <body>
                <h1>{reset_type} - {org_name}</h1>
                <p>Dear {user_name},</p>
                <p>Your password has been reset for the {org_name} Learning Management System.</p>
                <p><strong>Email:</strong> {user_email}</p>
                <p><strong>New Password:</strong> {new_password}</p>
                <p><a href="http://localhost:5173/login">Login to Portal</a></p>
                <p><strong>Important:</strong> Please change your password after logging in for security.</p>
                <p>If you did not request this password reset, please contact your administrator immediately.</p>
                <p>Best regards,<br>The {org_name} Team</p>
            </body>
            </html>
            """,
            body=f"""{reset_type} - {org_name}

Dear {user_name},

Your password has been reset for the {org_name} Learning Management System.

Email: {user_email}
New Password: {new_password}
Login URL: http://localhost:5173/login

Important: Please change your password after logging in for security.

If you did not request this password reset, please contact your administrator immediately.

Best regards,
The {org_name} Team"""
        )
        
        mail.send(msg)
        return True, "Password reset email sent successfully"
        
    except Exception as e:
        print(f"Failed to send password reset email: {str(e)}")
        return False, f"Failed to send email: {str(e)}"

# Password Reset Endpoints

@app.route('/api/admin/reset_portal_admin_password', methods=['POST'])
def admin_reset_portal_admin_password():
    """Admin endpoint to reset portal admin password"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('portal_admin_username'):
            return jsonify({'success': False, 'error': 'Portal admin username is required'}), 400
            
        portal_admin_username = data['portal_admin_username'].strip()
        
        # Find the portal admin user
        portal_admin = User.query.filter_by(username=portal_admin_username, role='portal_admin').first()
        if not portal_admin:
            return jsonify({'success': False, 'error': 'Portal admin not found'}), 404
            
        # Get organization info
        organization = None
        if portal_admin.org_id:
            organization = db.session.get(Organization, portal_admin.org_id)
            
        org_name = organization.name if organization else "LMS Portal"
        
        # Generate new password
        new_password = generate_temp_password()
        
        # Update password in database with proper hashing
        portal_admin.password = hash_password(new_password)
        db.session.commit()
        
        # Send email notification
        email_sent, email_message = send_password_reset_email(
            portal_admin.email,
            portal_admin.username,
            org_name,
            new_password,
            "Portal Admin Password Reset"
        )
        
        return jsonify({
            'success': True,
            'message': f'Portal admin password reset successfully',
            'email_sent': email_sent,
            'email_message': email_message,
            'new_password': new_password  # For testing - remove in production
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/portal_admin/reset_employee_password', methods=['POST'])
def portal_admin_reset_employee_password():
    """Portal admin endpoint to reset employee password"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('employee_username') or not data.get('portal_admin_username'):
            return jsonify({'success': False, 'error': 'Employee username and portal admin username are required'}), 400
            
        employee_username = data['employee_username'].strip()
        portal_admin_username = data['portal_admin_username'].strip()
        
        # Verify portal admin exists and get their organization
        portal_admin = User.query.filter_by(username=portal_admin_username, role='portal_admin').first()
        if not portal_admin or not portal_admin.org_id:
            return jsonify({'success': False, 'error': 'Portal admin not found or not associated with organization'}), 404
            
        # Find the employee in the same organization
        employee = User.query.filter_by(username=employee_username, role='employee', org_id=portal_admin.org_id).first()
        if not employee:
            return jsonify({'success': False, 'error': 'Employee not found in your organization'}), 404
            
        # Get organization info
        organization = db.session.get(Organization, portal_admin.org_id)
        org_name = organization.name if organization else "LMS Portal"
        
        # Generate new password
        new_password = generate_temp_password()
        
        # Update password in database with proper hashing
        employee.password = hash_password(new_password)
        db.session.commit()
        
        # Send email notification
        email_sent, email_message = send_password_reset_email(
            employee.email,
            employee.username,
            org_name,
            new_password,
            "Employee Password Reset"
        )
        
        return jsonify({
            'success': True,
            'message': f'Employee password reset successfully',
            'email_sent': email_sent,
            'email_message': email_message,
            'employee_email': employee.email
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/change_password', methods=['POST'])
def change_password():
    """Self-service password change for any user"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['username', 'current_password', 'new_password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
                
        username = data['username'].strip()
        current_password = data['current_password']
        new_password = data['new_password']
        
        # Validate new password strength
        if len(new_password) < 6:
            return jsonify({'success': False, 'error': 'New password must be at least 6 characters long'}), 400
            
        # Find user and verify current password
        user = User.query.filter_by(username=username).first()
        if not user or not verify_password(user.password, current_password):
            return jsonify({'success': False, 'error': 'Invalid username or current password'}), 401
            
        # Update password with proper hashing
        user.password = hash_password(new_password)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/portal_admin/reset_my_password', methods=['POST'])
def portal_admin_reset_my_password():
    """Portal admin self-service password reset"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('username'):
            return jsonify({'success': False, 'error': 'Username is required'}), 400
            
        username = data['username'].strip()
        
        # Find the portal admin user
        portal_admin = User.query.filter_by(username=username, role='portal_admin').first()
        if not portal_admin:
            return jsonify({'success': False, 'error': 'Portal admin not found'}), 404
            
        # Get organization info
        organization = None
        if portal_admin.org_id:
            organization = db.session.get(Organization, portal_admin.org_id)
            
        org_name = organization.name if organization else "LMS Portal"
        
        # Generate new password
        new_password = generate_temp_password()
        
        # Update password in database with proper hashing
        portal_admin.password = hash_password(new_password)
        db.session.commit()
        
        # Send email notification
        email_sent, email_message = send_password_reset_email(
            portal_admin.email,
            portal_admin.username,
            org_name,
            new_password,
            "Portal Admin Password Reset"
        )
        
        return jsonify({
            'success': True,
            'message': f'Your password has been reset successfully. Check your email for the new password.',
            'email_sent': email_sent,
            'email_message': email_message
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/portal_admin/invite_employee', methods=['POST'])
def invite_employee():
    """Invite a new employee to an organization"""
    try:
        data = request.json
        required_fields = ['email', 'designation']
        
        # Validate required fields
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].strip().lower()
        designation = data['designation'].strip()
        
        # Extract username from email (before @)
        username = email.split('@')[0]
        # Extract name for display purposes
        name = username.replace('.', ' ').replace('_', ' ').title()
        
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Get organization from a portal admin with an org_id (in a real app, get from JWT token)
        portal_admin = User.query.filter_by(role='portal_admin').filter(User.org_id.isnot(None)).first()
        if not portal_admin or not portal_admin.org_id:
            return jsonify({'error': 'No organization found'}), 404
            
        organization = db.session.get(Organization, portal_admin.org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 409
            
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Generate temporary password
        temp_password = generate_temp_password()
        
        try:
            # Create new user
            new_user = User(
                username=username,
                password=hash_password(temp_password),  # Hash the password properly
                email=email,
                designation=designation,
                org_id=organization.id,
                role='employee'
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            # Send invitation email
            email_sent, email_message = send_invite_email(
                user_email=email,
                user_name=name,
                org_name=organization.name,
                temp_password=temp_password
            )
            
            response_data = {
                'message': 'Employee invited successfully',
                'user_id': new_user.id,
                'email_sent': email_sent,
                'email_message': email_message,
                'temp_password': temp_password,
                'username': email  # Use email as username for frontend display
            }
            
            return jsonify(response_data), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to create user: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/portal_admin/organizations/<int:org_id>/employees', methods=['GET'])
def get_organization_employees(org_id):
    """Get all employees for a specific organization"""
    try:
        # Check if organization exists
        organization = db.session.get(Organization, org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404
        
        # Get all employees for this organization
        employees = User.query.filter_by(org_id=org_id, role='employee').all()
        
        employee_list = []
        for employee in employees:
            employee_list.append({
                'id': employee.id,
                'name': employee.username,
                'email': employee.email,
                'designation': employee.designation
            })
        
        return jsonify({
            'organization': {'id': organization.id, 'name': organization.name},
            'employees': employee_list,
            'total_employees': len(employee_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/portal_admin/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    """Delete an employee"""
    try:
        employee = db.session.get(User, employee_id)
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        if employee.role != 'employee':
            return jsonify({'error': 'Can only delete employees'}), 400
        
        db.session.delete(employee)
        db.session.commit()
        
        return jsonify({'message': 'Employee deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete employee: {str(e)}'}), 500

@app.route('/api/portal_admin/org_domain', methods=['GET'])
def get_org_domain():
    """Get organization domain for a portal admin user"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400

        # FIX: Correct filter_by usage (should be filter_by(username=username, role='portal_admin'))
        user = User.query.filter_by(username=username, role='portal_admin').first()
        if not user:
            return jsonify({'error': 'Portal admin not found'}), 404

        if not user.org_id:
            return jsonify({'error': 'User not associated with an organization'}), 404

        # FIX: Use db.session.get for SQLAlchemy 2.x compatibility
        organization = db.session.get(Organization, user.org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404

        return jsonify({
            'success': True,
            'org_domain': organization.org_domain,
            'organization_name': organization.name,
            'organization_id': organization.id
        }), 200

    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/portal_admin/create_employee', methods=['POST'])
def create_employee():
    """Create a new employee with username and password"""
    try:
        data = request.json
        required_fields = ['username', 'password', 'email', 'designation']
        
        # Validate required fields
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        username = data['username'].strip()
        password = data['password'].strip()
        email = data['email'].strip().lower()
        designation = data['designation'].strip()
        
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 409
            
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        # For now, we'll assume the creating user is a portal admin
        # In a real app, you'd get this from JWT token
        # For demo purposes, we'll find their org_id from a portal admin with an org_id
        portal_admin = User.query.filter_by(role='portal_admin').filter(User.org_id.isnot(None)).first()
        if not portal_admin or not portal_admin.org_id:
            return jsonify({'error': 'No organization found for portal admin'}), 404
            
        try:
            # Get organization info for email
            organization = db.session.get(Organization, portal_admin.org_id)
            if not organization:
                return jsonify({'error': 'Organization not found'}), 404
            
            # Create new user
            new_user = User(
                username=username,
                password=hash_password(password),  # Hash the password properly
                email=email,
                designation=designation,
                org_id=portal_admin.org_id,
                role='employee'
            )
            
            db.session.add(new_user)
            db.session.flush()  # Flush to get the user ID
            
            # Automatically assign organization's courses to the new employee
            if organization.courses:
                for course in organization.courses:
                    new_user.courses.append(course)
            
            db.session.commit()
            
            # Extract name for display purposes
            name = username.replace('.', ' ').replace('_', ' ').title()
            
            # Send welcome email with credentials
            email_sent, email_message = send_invite_email(
                user_email=email,
                user_name=name,
                org_name=organization.name,
                temp_password=password
            )
            
            response_data = {
                'message': 'Employee created successfully',
                'user_id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'email_sent': email_sent,
                'email_message': email_message
            }
            
            return jsonify(response_data), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to create user: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/portal_admin/all_courses', methods=['GET'])
def get_portal_admin_courses():
    """Get all courses and assigned courses for a portal admin's organization"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400
            
        # Find the portal admin user
        user = User.query.filter_by(username=username, role='portal_admin').first()
        if not user:
            return jsonify({'error': 'Portal admin not found'}), 404
            
        if not user.org_id:
            return jsonify({'error': 'User not associated with an organization'}), 404
            
        # Get the organization
        organization = db.session.get(Organization, user.org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404
        
        # Get all courses
        all_courses = Course.query.filter_by(status='published').all()
        
        # Get assigned courses for this organization
        assigned_course_ids = [course.id for course in organization.courses]
        
        # Get pending requests for this organization
        pending_requests = CourseRequest.query.filter_by(
            organization_id=organization.id,
            status='pending'
        ).all()
        pending_course_ids = [req.course_id for req in pending_requests]
        
        # Format all courses with purchase/assignment status
        all_courses_list = []
        for course in all_courses:
            course_status = 'available'
            if course.id in assigned_course_ids:
                course_status = 'assigned'
            elif course.id in pending_course_ids:
                course_status = 'pending'
                
            # Calculate course price (based on number of modules for demo)
            base_price = 99.99
            price_per_module = 49.99
            course_price = base_price + (len(course.modules) * price_per_module)
            
            all_courses_list.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'status': course.status,
                'module_count': len(course.modules),
                'is_assigned': course.id in assigned_course_ids,
                'is_pending_request': course.id in pending_course_ids,
                'course_status': course_status,
                'price': round(course_price, 2)
            })
        
        # Format assigned courses
        assigned_courses_list = []
        for course in organization.courses:
            assigned_courses_list.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'status': course.status,
                'module_count': len(course.modules)
            })
        
        return jsonify({
            'success': True,
            'all_courses': all_courses_list,
            'assigned_courses': assigned_courses_list,
            'organization': {
                'id': organization.id,
                'name': organization.name
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/portal_admin/assign_course', methods=['POST'])
def assign_course_to_organization():
    """Assign a course to the portal admin's organization"""
    try:
        data = request.json
        username = data.get('username')
        course_id = data.get('course_id')
        
        if not username or not course_id:
            return jsonify({'error': 'Username and course_id are required'}), 400
            
        # Find the portal admin user
        user = User.query.filter_by(username=username, role='portal_admin').first()
        if not user:
            return jsonify({'error': 'Portal admin not found'}), 404
            
        if not user.org_id:
            return jsonify({'error': 'User not associated with an organization'}), 404
            
        # Get the organization
        organization = db.session.get(Organization, user.org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404
        
        # Get the course
        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Check if course is already assigned
        if course in organization.courses:
            return jsonify({'error': 'Course already assigned to organization'}), 409
        
        # Assign the course
        organization.courses.append(course)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Course "{course.title}" successfully assigned to {organization.name}',
            'course': {
                'id': course.id,
                'title': course.title,
                'description': course.description
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to assign course: {str(e)}'}), 500

@app.route('/api/portal_admin/unassign_course', methods=['DELETE'])
def unassign_course_from_organization():
    """Remove a course assignment from the portal admin's organization and all its employees"""
    try:
        data = request.json
        username = data.get('username')
        course_id = data.get('course_id')
        
        if not username or not course_id:
            return jsonify({'error': 'Username and course_id are required'}), 400
            
        # Find the portal admin user
        user = User.query.filter_by(username=username, role='portal_admin').first()
        if not user:
            return jsonify({'error': 'Portal admin not found'}), 404
            
        if not user.org_id:
            return jsonify({'error': 'User not associated with an organization'}), 404
            
        # Get the organization
        organization = db.session.get(Organization, user.org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404
        
        # Get the course
        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Check if course is assigned
        if course not in organization.courses:
            return jsonify({'error': 'Course not assigned to organization'}), 404
        
        # Get all employees in this organization
        employees = User.query.filter_by(org_id=organization.id, role='employee').all()
        
        # Remove the course from all employees in this organization
        employees_updated = 0
        for employee in employees:
            if course in employee.courses:
                employee.courses.remove(course)
                employees_updated += 1
        
        # Remove the course assignment from the organization
        organization.courses.remove(course)
        
        # Commit all changes
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Course "{course.title}" removed from {organization.name} and {employees_updated} employees',
            'course': {
                'id': course.id,
                'title': course.title,
                'description': course.description
            },
            'employees_updated': employees_updated
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to unassign course: {str(e)}'}), 500

# Course Purchase Request System

@app.route('/api/portal_admin/request_course_purchase', methods=['POST'])
def request_course_purchase():
    """Portal admin requests to purchase a course"""
    try:
        data = request.json
        username = data.get('username')
        course_id = data.get('course_id')
        payment_amount = data.get('payment_amount', 0.0)
        
        if not username or not course_id:
            return jsonify({'error': 'Username and course_id are required'}), 400
            
        # Find the portal admin user
        user = User.query.filter_by(username=username, role='portal_admin').first()
        if not user:
            return jsonify({'error': 'Portal admin not found'}), 404
            
        if not user.org_id:
            return jsonify({'error': 'User not associated with an organization'}), 404
            
        # Get the organization
        organization = db.session.get(Organization, user.org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404
        
        # Get the course
        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Check if course is already assigned or requested
        if course in organization.courses:
            return jsonify({'error': 'Course already assigned to organization'}), 409
            
        existing_request = CourseRequest.query.filter_by(
            organization_id=organization.id,
            course_id=course_id,
            status='pending'
        ).first()
        
        if existing_request:
            return jsonify({'error': 'Purchase request already pending for this course'}), 409
        
        # Create the purchase request
        course_request = CourseRequest(
            organization_id=organization.id,
            course_id=course_id,
            requested_by=user.id,
            payment_amount=payment_amount,
            status='pending'
        )
        
        db.session.add(course_request)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Purchase request submitted for "{course.title}"',
            'request': {
                'id': course_request.id,
                'course_title': course.title,
                'payment_amount': payment_amount,
                'status': 'pending',
                'requested_at': course_request.requested_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create purchase request: {str(e)}'}), 500


@app.route('/api/portal_admin/my_course_requests', methods=['GET'])
def get_my_course_requests():
    """Get course purchase requests made by the current portal admin"""
    try:
        # Accept username as query param for consistency with other endpoints
        username = request.args.get('username')
        if username:
            user = User.query.filter_by(username=username, role='portal_admin').first()
        else:
            # Fallback: Try to get from Authorization header (JWT)
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    import jwt
                    payload = jwt.decode(token, options={"verify_signature": False})
                    username = payload.get('username')
                    user = User.query.filter_by(username=username, role='portal_admin').first()
                except Exception:
                    return jsonify({'error': 'Invalid token'}), 401
            else:
                # FIX: Return 200 with empty requests for compatibility with frontend
                return jsonify({'success': True, 'requests': []}), 200

        if not user:
            return jsonify({'success': True, 'requests': []}), 200

        # Get the user's organization
        organization = db.session.get(Organization, user.org_id)
        if not organization:
            return jsonify({'success': True, 'requests': []}), 200

        # Get all course requests made by this user for their organization
        requests = CourseRequest.query.filter_by(
            organization_id=organization.id,
            requested_by=user.id
        ).order_by(CourseRequest.requested_at.desc()).all()

        # Prepare response data
        request_data = []
        for req in requests:
            request_data.append({
                'id': req.id,
                'course': {
                    'id': req.course.id,
                    'title': req.course.title
                },
                'payment_amount': req.payment_amount,
                'status': req.status,
                'requested_at': req.requested_at.strftime('%Y-%m-%d %H:%M:%S'),
                'approved_at': req.approved_at.strftime('%Y-%m-%d %H:%M:%S') if req.approved_at else None,
                'approved_by': req.approved_by,
                'admin_notes': req.admin_notes
            })

        return jsonify({
            'success': True,
            'requests': request_data
        }), 200

    except Exception as e:
        return jsonify({'success': True, 'requests': []}), 200

@app.route('/api/admin/course_requests', methods=['GET'])
def get_course_requests():
    """Admin endpoint to get all course purchase requests"""
    try:
        # Get all course requests with related data
        requests = CourseRequest.query.order_by(CourseRequest.requested_at.desc()).all()
        
        requests_list = []
        for req in requests:
            requests_list.append({
                'id': req.id,
                'organization': {
                    'id': req.organization.id,
                    'name': req.organization.name
                },
                'course': {
                    'id': req.course.id,
                    'title': req.course.title,
                    'description': req.course.description
                },
                'requester': {
                    'id': req.requester.id,
                    'username': req.requester.username,
                    'email': req.requester.email
                },
                'payment_amount': req.payment_amount,
                'status': req.status,
                'requested_at': req.requested_at.strftime('%Y-%m-%d %H:%M:%S'),
                'admin_notes': req.admin_notes,
                'approved_by': req.approver.username if req.approver else None,
                'approved_at': req.approved_at.strftime('%Y-%m-%d %H:%M:%S') if req.approved_at else None
            })
        
        return jsonify({
            'success': True,
            'requests': requests_list,
            'total_requests': len(requests_list),
            'pending_requests': len([r for r in requests_list if r['status'] == 'pending'])
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch course requests: {str(e)}'}), 500

@app.route('/api/admin/approve_course_request', methods=['POST'])
def approve_course_request():
    """Admin endpoint to approve/reject course purchase requests"""
    try:
        data = request.json
        request_id = data.get('request_id')
        action = data.get('action')  # 'approve' or 'reject'
        admin_username = data.get('admin_username')
        admin_notes = data.get('admin_notes', '')
        
        if not request_id or not action or not admin_username:
            return jsonify({'error': 'request_id, action, and admin_username are required'}), 400
            
        if action not in ['approve', 'reject']:
            return jsonify({'error': 'Action must be approve or reject'}), 400
            
        # Find the admin user
        admin_user = User.query.filter_by(username=admin_username, role='admin').first()
        if not admin_user:
            return jsonify({'error': 'Admin user not found'}), 404
            
        # Find the request
        course_request = db.session.get(CourseRequest, request_id)
        if not course_request:
            return jsonify({'error': 'Course request not found'}), 404
            
        if course_request.status != 'pending':
            return jsonify({'error': f'Request is already {course_request.status}'}), 409
        
        # Update request status
        course_request.status = 'approved' if action == 'approve' else 'rejected'
        course_request.approved_by = admin_user.id
        course_request.approved_at = datetime.datetime.utcnow()
        course_request.admin_notes = admin_notes
        
        # If approved, assign the course to the organization
        if action == 'approve':
            organization = course_request.organization
            course = course_request.course
            
            # Check if course is not already assigned
            if course not in organization.courses:
                organization.courses.append(course)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Course request {action}d successfully',
            'request': {
                'id': course_request.id,
                'status': course_request.status,
                'admin_notes': admin_notes,
                'approved_by': admin_user.username,
                'approved_at': course_request.approved_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to {action} request: {str(e)}'}), 500

@app.route('/api/admin/system_stats', methods=['GET'])
def get_admin_system_stats():
    """Get comprehensive system statistics for admin dashboard"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400
            
        # Verify admin role (either superadmin or portal_admin)
        user = User.query.filter_by(username=username).first()
        if not user or user.role not in ['admin', 'portal_admin']:
            return jsonify({'error': 'Unauthorized access'}), 403
            
        # Import and use the statistics module
        from admin_stats import get_system_statistics
        stats = get_system_statistics(user.id, user.role)
        
        return jsonify({
            'success': True,
            'data': stats
        })
            
    except Exception as e:
        print(f"Error getting system stats: {str(e)}")
        return jsonify({
            'error': f'Failed to get system statistics: {str(e)}'
        }), 500

@app.route('/api/admin/portal_admins', methods=['GET'])
def get_portal_admins():
    """Get list of all portal admins for admin dashboard"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400
            
        # Verify admin role
        user = User.query.filter_by(username=username, role='admin').first()
        if not user:
            return jsonify({'error': 'Unauthorized access - Admin role required'}), 403
            
        # Get all portal admins with their organization info
        portal_admins = db.session.query(User, Organization).outerjoin(
            Organization, User.org_id == Organization.id
        ).filter(User.role == 'portal_admin').all()
        
        portal_admin_list = []
        for admin, org in portal_admins:
            portal_admin_list.append({
                'id': admin.id,
                'username': admin.username,
                'email': admin.email,
                'designation': admin.designation,
                'created_at': admin.created_at.isoformat() if admin.created_at else None,
                'organization': {
                    'id': org.id if org else None,
                    'name': org.name if org else 'No Organization',
                    'domain': org.org_domain if org else None,
                    'status': org.status if org else None
                } if org else None
            })
        
        return jsonify({
            'success': True,
            'portal_admins': portal_admin_list,
            'total_count': len(portal_admin_list)
        })
            
    except Exception as e:
        print(f"Error getting portal admins: {str(e)}")
        return jsonify({
            'error': f'Failed to get portal admins: {str(e)}'
        }), 500

@app.route('/api/admin/all_users', methods=['GET'])
def get_all_users():
    """Get list of all users for admin dashboard"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400
            
        # Verify admin role
        user = User.query.filter_by(username=username, role='admin').first()
        if not user:
            return jsonify({'error': 'Unauthorized access - Admin role required'}), 403
            
        # Get all users with their organization info
        all_users = db.session.query(User, Organization).outerjoin(
            Organization, User.org_id == Organization.id
        ).all()
        
        user_list = []
        for user_obj, org in all_users:
            user_list.append({
                'id': user_obj.id,
                'username': user_obj.username,
                'email': user_obj.email,
                'role': user_obj.role,
                'designation': user_obj.designation,
                'created_at': user_obj.created_at.isoformat() if user_obj.created_at else None,
                'organization': {
                    'id': org.id if org else None,
                    'name': org.name if org else 'No Organization',
                    'domain': org.org_domain if org else None,
                    'status': org.status if org else None
                } if org else None
            })
        
        return jsonify({
            'success': True,
            'users': user_list,
            'total_count': len(user_list)
        })
            
    except Exception as e:
        print(f"Error getting all users: {str(e)}")
        return jsonify({
            'error': f'Failed to get all users: {str(e)}'
        }), 500

@app.route('/api/portal_admin/organization_statistics', methods=['GET'])
def portal_admin_organization_statistics():
    """
    Returns organization statistics for the portal admin dashboard.
    """
    username = request.args.get('username')
    if not username:
        return jsonify({'success': False, 'error': 'Username is required'}), 400

    user = User.query.filter_by(username=username, role='portal_admin').first()
    if not user:
        return jsonify({'success': False, 'error': 'Portal admin not found'}), 404

    if not user.org_id:
        return jsonify({'success': False, 'error': 'User not associated with an organization'}), 404

    organization = Organization.query.get(user.org_id)
    if not organization:
        return jsonify({'success': False, 'error': 'Organization not found'}), 404

    # Employees
    employees = User.query.filter_by(org_id=organization.id, role='employee').all()
    total_employees = len(employees)

    # Courses assigned to org
    assigned_courses = organization.courses
    total_courses = len(assigned_courses)

    # Course progress for employees
    employee_ids = [e.id for e in employees]
    progresses = CourseProgress.query.filter(CourseProgress.user_id.in_(employee_ids)).all()

    # Completion stats
    completed_courses = sum(1 for p in progresses if p.completion_date)
    in_progress_courses = sum(1 for p in progresses if p.progress_percentage > 0 and not p.completion_date)
    not_started_courses = sum(1 for p in progresses if p.progress_percentage == 0)
    avg_progress = round(sum(p.progress_percentage for p in progresses) / len(progresses), 2) if progresses else 0

    # Employees at risk (example: risk_score > 70)
    employees_at_risk = []
    for emp in employees:
        emp_progress = CourseProgress.query.filter_by(user_id=emp.id).all()
        risk_courses = []
        for prog in emp_progress:
            if hasattr(prog, "risk_score") and prog.risk_score and prog.risk_score > 70:
                course = Course.query.get(prog.course_id)
                risk_courses.append({
                    "course_id": prog.course_id,
                    "title": course.title if course else "",
                    "progress": prog.progress_percentage,
                    "risk_score": prog.risk_score
                })
        if risk_courses:
            employees_at_risk.append({
                "id": emp.id,
                "username": emp.username,
                "email": emp.email,
                "risk_courses": risk_courses
            })

    # Course statistics
    course_statistics = []
    for course in assigned_courses:
        course_progresses = [p for p in progresses if p.course_id == course.id]
        enrolled_count = len(course_progresses)
        completed_count = sum(1 for p in course_progresses if p.completion_date)
        avg_course_progress = round(sum(p.progress_percentage for p in course_progresses) / enrolled_count, 2) if enrolled_count else 0
        at_risk_count = sum(1 for p in course_progresses if hasattr(p, "risk_score") and p.risk_score and p.risk_score > 70)
        completion_rate = round((completed_count / enrolled_count) * 100, 2) if enrolled_count else 0
        course_statistics.append({
            "id": course.id,
            "title": course.title,
            "enrolled_count": enrolled_count,
            "completed_count": completed_count,
            "avg_progress": avg_course_progress,
            "at_risk_count": at_risk_count,
            "completion_rate": completion_rate
        })

    # Employee statistics
    employee_statistics = []
    for emp in employees:
        emp_progresses = [p for p in progresses if p.user_id == emp.id]
        assigned_count = len(emp_progresses)
        completed_count = sum(1 for p in emp_progresses if p.completion_date)
        avg_emp_progress = round(sum(p.progress_percentage for p in emp_progresses) / assigned_count, 2) if assigned_count else 0
        high_risk_count = sum(1 for p in emp_progresses if hasattr(p, "risk_score") and p.risk_score and p.risk_score > 70)
        employee_statistics.append({
            "id": emp.id,
            "username": emp.username,
            "email": emp.email,
            "designation": emp.designation,
            "assigned_count": assigned_count,
            "completed_count": completed_count,
            "avg_progress": avg_emp_progress,
            "high_risk_count": high_risk_count
        })

    # Completion by course for analytics
    completion_by_course = []
    for course in assigned_courses:
        course_progresses = [p for p in progresses if p.course_id == course.id]
        enrolled_count = len(course_progresses)
        completion_rate = round(
            (sum(1 for p in course_progresses if p.completion_date) / enrolled_count) * 100, 2
        ) if enrolled_count else 0
        completion_by_course.append({
            "course_id": course.id,
            "title": course.title,
            "completion_rate": completion_rate
        })

    # Overall completion rate
    overall_completion_rate = round(
        (sum(1 for p in progresses if p.completion_date) / len(progresses)) * 100, 2
    ) if progresses else 0

    # Employees at risk count for analytics
    employees_at_risk_count = len(employees_at_risk)

    return jsonify({
        "success": True,
        "organization": {
            "id": organization.id,
            "name": organization.name,
            "total_employees": total_employees,
            "total_courses": total_courses,
            "overall_completion_rate": overall_completion_rate,
            "employees_at_risk": employees_at_risk_count
        },
        "course_statistics": course_statistics,
        "employee_statistics": employee_statistics,
        "completion_by_course": completion_by_course,
        "employees_at_risk": employees_at_risk
    }), 200

@app.route('/api/portal_admin/assign_course_to_employee', methods=['POST'])
def assign_course_to_employee():
    """
    Assign a course to a specific employee in the portal admin's organization.
    Expects: { "employee_id": ..., "course_id": ... }
    """
    try:
        data = request.json
        employee_id = data.get('employee_id')
        course_id = data.get('course_id')

        if not employee_id or not course_id:
            return jsonify({'success': False, 'error': 'employee_id and course_id are required'}), 400

        employee = User.query.filter_by(id=employee_id, role='employee').first()
        if not employee:
            return jsonify({'success': False, 'error': 'Employee not found'}), 404

        # Use db.session.get for SQLAlchemy 2.x compatibility
        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'success': False, 'error': 'Course not found'}), 404

        # Check if course is already assigned to employee
        if course in employee.courses:
            return jsonify({'success': False, 'error': 'Course already assigned to employee'}), 409

        # Check if course is assigned to the employee's organization
        organization = db.session.get(Organization, employee.org_id)
        if not organization or course not in organization.courses:
            return jsonify({'success': False, 'error': 'Course is not assigned to the employee\'s organization'}), 400

        # Assign course to employee
        employee.courses.append(course)
        db.session.commit()

        return jsonify({'success': True, 'message': f'Course "{course.title}" assigned to employee "{employee.username}"'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f'Failed to assign course: {str(e)}'}), 500

# --- Employee: Get My Assigned Courses ---
@app.route('/api/employee/content/<int:content_id>', methods=['GET'])
def get_employee_content_detail(content_id):
    """Return content details for the logged-in employee (minimal for now)."""
    username = request.args.get('username')
    if not username:
        return jsonify({'success': False, 'error': 'username is required'}), 400
    user = User.query.filter_by(username=username, role='employee').first()
    if not user:
        return jsonify({'success': False, 'error': 'Employee not found'}), 404
    # Find the content
    content = ModuleContent.query.get(content_id)
    if not content:
        return jsonify({'success': False, 'error': 'Content not found'}), 404
    # Optionally, check if the user is assigned to the course containing this content
    module = content.module
    course = module.course if module else None
    if course and course not in user.courses:
        return jsonify({'success': False, 'error': 'Content not assigned to employee'}), 403
    
    # Prepare the content response
    content_data = {
        'id': content.id,
        'title': content.title,
        'content_type': content.content_type,
        'file_path': content.file_path,
        'order': content.order,
        'module_id': content.module_id
    }
    
    # If content is a quiz, include basic quiz info (questions fetched separately)
    if content.content_type == 'quiz':
        question_count = QuizQuestion.query.filter_by(content_id=content_id).count()
        content_data['question_count'] = question_count
    
    return jsonify({
        'success': True,
        'content': content_data
    }), 200
@app.route('/api/employee/course/<int:course_id>', methods=['GET'])
def get_employee_course_detail(course_id):
    """Return course details (modules, contents, progress) for the logged-in employee."""
    username = request.args.get('username')
    if not username:
        return jsonify({'success': False, 'error': 'username is required'}), 400
    user = User.query.filter_by(username=username, role='employee').first()
    if not user:
        return jsonify({'success': False, 'error': 'Employee not found'}), 404
    # Check if course is assigned to this user
    course = Course.query.get(course_id)
    if not course or course not in user.courses:
        return jsonify({'success': False, 'error': 'Course not assigned to employee'}), 404
    # Build modules and contents
    modules = []
    for module in course.modules:
        contents = []
        for content in module.contents:
            contents.append({
                'id': content.id,
                'title': content.title,
                'content_type': content.content_type,
                'file_path': content.file_path,
                'order': content.order
            })
        modules.append({
            'id': module.id,
            'title': module.title,
            'description': module.description,
            'order': module.order,
            'contents': contents
        })
    # Progress info
    progress_record = None
    for pr in user.progress_records:
        if pr.course_id == course.id:
            progress_record = pr
            break
    progress = None
    completed_modules = 0
    module_progress = {}
    if progress_record:
        progress = progress_record.progress_percentage
        completed_modules = progress_record.completed_modules
        try:
            module_progress = json.loads(progress_record.module_progress)
        except Exception:
            module_progress = {}
    result = {
        'id': course.id,
        'title': course.title,
        'description': course.description,
        'module_count': len(course.modules),
        'modules': modules,
        'progress': progress,
        'completed_modules': completed_modules,
        'module_progress': module_progress
    }
    return jsonify({'success': True, 'course': result}), 200
@app.route('/api/employee/my_courses', methods=['GET'])
def get_employee_my_courses():
    """Return all courses assigned to the employee, with modules and content info."""
    username = request.args.get('username')
    if not username:
        return jsonify({'success': False, 'error': 'username is required'}), 400
    user = User.query.filter_by(username=username, role='employee').first()
    if not user:
        return jsonify({'success': False, 'error': 'Employee not found'}), 404
    
    # Get user's organization to ensure we only show courses assigned to the organization
    organization = None
    if user.org_id:
        organization = Organization.query.get(user.org_id)
    
    # Filter courses to only include those currently assigned to the user's organization
    if organization:
        org_course_ids = [course.id for course in organization.courses]
        courses = [course for course in user.courses if course.id in org_course_ids]
    else:
        # If no organization, show all user courses (fallback)
        courses = user.courses
    
    result = []
    for course in courses:
        modules = []
        for module in course.modules:
            contents = []
            for content in module.contents:
                content_dict = {
                    'id': content.id,
                    'title': content.title,
                    'content_type': content.content_type,
                }
                contents.append(content_dict)
            modules.append({
                'id': module.id,
                'title': module.title,
                'description': module.description,
                'contents': contents
            })
        # Progress info (optional, if available)
        progress_record = None
        for pr in user.progress_records:
            if pr.course_id == course.id:
                progress_record = pr
                break
        progress = None
        completed_modules = 0
        if progress_record:
            progress = progress_record.progress_percentage
            completed_modules = progress_record.completed_modules
        result.append({
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'module_count': len(course.modules),
            'modules': modules,
            'progress': progress,
            'completed_modules': completed_modules
        })
    return jsonify({'success': True, 'courses': result}), 200


# --- Serve uploaded content files (videos, PDFs, etc.) ---
from flask import send_from_directory
import os

@app.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):

    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    return send_from_directory(uploads_dir, filename)

# Employee Quiz Endpoints
@app.route('/api/employee/quiz/<int:quiz_id>', methods=['GET'])
def get_employee_quiz(quiz_id):
    """Get quiz questions for employee (without showing correct answers)"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'success': False, 'error': 'Username is required'}), 400
        
        # Verify employee exists
        user = User.query.filter_by(username=username, role='employee').first()
        if not user:
            return jsonify({'success': False, 'error': 'Employee not found'}), 404
        
        # Get the quiz content
        content = ModuleContent.query.get(quiz_id)
        if not content or content.content_type != 'quiz':
            return jsonify({'success': False, 'error': 'Quiz content not found'}), 404
        
        # Check if employee has access to this content through course assignment
        module = content.module
        course = module.course if module else None
        if course and course not in user.courses:
            return jsonify({'success': False, 'error': 'Quiz not assigned to employee'}), 403
        
        # Get questions
        questions = QuizQuestion.query.filter_by(content_id=quiz_id).order_by(QuizQuestion.order).all()
        
        questions_data = []
        for question in questions:
            options_data = []
            for option in question.options:
                # Don't include is_correct for employees
                options_data.append({
                    "id": option.id,
                    "option_text": option.option_text
                })
            
            questions_data.append({
                "id": question.id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "order": question.order,
                "options": options_data
            })
        
        return jsonify({
            "success": True,
            "quiz": {
                "id": content.id,
                "title": content.title,
                "module_id": content.module_id,
                "questions": questions_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error fetching quiz: {str(e)}'}), 500

@app.route('/api/employee/submit_quiz', methods=['POST'])
def submit_employee_quiz():
    """Submit quiz answers and get results"""
    try:
        data = request.json
        username = data.get('username')
        content_id = data.get('content_id')
        answers = data.get('answers', [])
        
        if not username or not content_id:
            return jsonify({'success': False, 'error': 'Username and content_id are required'}), 400
        
        # Find the user
        user = User.query.filter_by(username=username, role='employee').first()
        if not user:
            return jsonify({'success': False, 'error': 'Employee not found'}), 404
        
        # Get the quiz content
        content = ModuleContent.query.get(content_id)
        if not content or content.content_type != 'quiz':
            return jsonify({'success': False, 'error': 'Quiz content not found'}), 404
        
        # Check if employee has access
        module = content.module
        course = module.course if module else None
        if course and course not in user.courses:
            return jsonify({'success': False, 'error': 'Quiz not assigned to employee'}), 403
        
        # Get all questions for this quiz
        questions = QuizQuestion.query.filter_by(content_id=content_id).order_by(QuizQuestion.order).all()
        if not questions:
            return jsonify({'success': False, 'error': 'No questions found for this quiz'}), 404
        
        # Calculate score
        total_questions = len(questions)
        correct_answers = 0
        question_results = []
        
        # Create a map of answers for easy lookup
        answer_map = {}
        for answer in answers:
            question_id = answer.get('question_id')
            selected_options = answer.get('selected_options', [])
            answer_map[question_id] = selected_options
        
        for question in questions:
            user_answer = answer_map.get(question.id, [])
            
            # Get correct options for this question
            correct_options = QuizOption.query.filter_by(
                question_id=question.id,
                is_correct=True
            ).all()
            correct_option_ids = [opt.id for opt in correct_options]
            
            # Check if answer is correct
            is_correct = False
            if question.question_type in ['single-choice', 'multiple-choice']:
                if question.question_type == 'single-choice':
                    # For single choice, user should select exactly one correct option
                    is_correct = (len(user_answer) == 1 and 
                                user_answer[0] in correct_option_ids)
                else:
                    # For multiple choice, user should select all correct options and no incorrect ones
                    is_correct = (set(user_answer) == set(correct_option_ids))
            elif question.question_type == 'true-false':
                # For true/false, should select exactly one correct option
                is_correct = (len(user_answer) == 1 and 
                            user_answer[0] in correct_option_ids)
            
            if is_correct:
                correct_answers += 1
            
            question_results.append({
                'question_id': question.id,
                'question_text': question.question_text,
                'user_answer': user_answer,
                'correct_options': correct_option_ids,
                'is_correct': is_correct
            })
        
        # Calculate percentage and determine if passed (70% threshold)
        percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        passed = percentage >= 70
        
        results = {
            'score': correct_answers,
            'total_questions': total_questions,
            'percentage': round(percentage, 2),
            'passed': passed,
            'question_results': question_results
        }
        
        return jsonify({
            'success': True,
            'results': results,
            'message': f'Quiz submitted successfully! Score: {correct_answers}/{total_questions} ({percentage:.1f}%)'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to submit quiz: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
