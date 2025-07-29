from flask import Blueprint, jsonify, request
from models import db, User, Organization, Course, CourseRequest, CourseProgress, Module, ModuleContent, QuizQuestion, QuizOption
import json
from datetime import datetime

portal_admin_dashboard_bp = Blueprint('portal_admin_dashboard', __name__)

@portal_admin_dashboard_bp.route('/api/portal_admin/organization_statistics', methods=['GET'])
def get_portal_admin_organization_statistics():
    """Get organization statistics for portal admin dashboard"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400

        user = User.query.filter_by(username=username, role='portal_admin').first()
        if not user:
            return jsonify({'error': 'Portal admin not found'}), 404

        if not user.org_id:
            return jsonify({'error': 'User not associated with an organization'}), 404

        organization = db.session.get(Organization, user.org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404

        # Get all employees in this organization
        employees = User.query.filter_by(org_id=organization.id, role='employee').all()
        total_employees = len(employees)

        # Count by status if status field exists, else skip
        active_employees = len([e for e in employees if getattr(e, 'status', None) == 'active'])
        inactive_employees = len([e for e in employees if getattr(e, 'status', None) == 'inactive'])
        suspended_employees = len([e for e in employees if getattr(e, 'status', None) == 'suspended'])

        # Get all course progresses for employees in this org
        employee_ids = [e.id for e in employees]
        progresses = CourseProgress.query.filter(CourseProgress.user_id.in_(employee_ids)).all()

        # Calculate average progress
        avg_progress = round(sum(p.progress_percentage for p in progresses) / len(progresses), 2) if progresses else 0

        # Count completed courses (where completion_date is not None)
        completed_courses = sum(1 for p in progresses if p.completion_date)
        in_progress_courses = sum(1 for p in progresses if p.progress_percentage > 0 and not p.completion_date)
        not_started_courses = sum(1 for p in progresses if p.progress_percentage == 0)

        # Get all courses offered to this organization
        offered_courses = organization.courses

        stats = {
            'total_employees': total_employees,
            'active_employees': active_employees,
            'inactive_employees': inactive_employees,
            'suspended_employees': suspended_employees,
            'completed_courses': completed_courses,
            'in_progress_courses': in_progress_courses,
            'not_started_courses': not_started_courses,
            'avg_progress': avg_progress,
            'offered_courses': [
                {
                    'id': course.id,
                    'title': course.title,
                    'description': course.description,
                    'status': course.status,
                    'module_count': len(course.modules)
                }
                for course in offered_courses
            ]
        }

        return jsonify({
            'success': True,
            'data': stats
        }), 200

    except Exception as e:
        print(f"Error getting organization statistics: {str(e)}")
        return jsonify({
            'error': f'Failed to get organization statistics: {str(e)}'
        }), 500

@portal_admin_dashboard_bp.route('/api/portal_admin/invite_employee', methods=['POST'])
def invite_employee():
    """Invite a new employee to the organization"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid input'}), 400

        username = data.get('username')
        email = data.get('email')
        org_id = data.get('org_id')

        if not username or not email or not org_id:
            return jsonify({'error': 'Username, email, and organization ID are required'}), 400

        # Check if the user already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400

        # Create a new user
        new_user = User(
            username=username,
            email=email,
            org_id=org_id,
            role='employee',
            status='inactive'  # Default status is inactive
        )
        db.session.add(new_user)
        db.session.commit()

        # TODO: Send invitation email with a link to set password

        return jsonify({
            'success': True,
            'message': 'Employee invited successfully'
        }), 201

    except Exception as e:
        print(f"Error inviting employee: {str(e)}")
        return jsonify({
            'error': f'Failed to invite employee: {str(e)}'
        }), 500

@portal_admin_dashboard_bp.route('/api/portal_admin/get_all_courses', methods=['GET'])
def get_all_courses():
    """Get all courses for the organization"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400

        user = User.query.filter_by(username=username, role='portal_admin').first()
        if not user:
            return jsonify({'error': 'Portal admin not found'}), 404

        if not user.org_id:
            return jsonify({'error': 'User not associated with an organization'}), 404

        organization = db.session.get(Organization, user.org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404

        # Get all courses offered to this organization
        offered_courses = organization.courses

        return jsonify({
            'success': True,
            'data': [
                {
                    'id': course.id,
                    'title': course.title,
                    'description': course.description,
                    'status': course.status,
                    'module_count': len(course.modules)
                }
                for course in offered_courses
            ]
        }), 200

    except Exception as e:
        print(f"Error getting courses: {str(e)}")
        return jsonify({
            'error': f'Failed to get courses: {str(e)}'
        }), 500

@portal_admin_dashboard_bp.route('/api/portal_admin/get_course_details/<int:course_id>', methods=['GET'])
def get_course_details(course_id):
    """Get details of a specific course"""
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404

        # Get modules and their content for this course
        modules = []
        for module in course.modules:
            module_content = [
                {
                    'id': content.id,
                    'title': content.title,
                    'type': content.type,
                    'quiz_questions': [
                        {
                            'id': question.id,
                            'question_text': question.question_text,
                            'options': [
                                {
                                    'id': option.id,
                                    'option_text': option.option_text,
                                    'is_correct': option.is_correct
                                }
                                for option in question.options
                            ]
                        }
                        for question in module.quiz_questions
                    ]
                }
                for content in module.contents
            ]
            modules.append({
                'id': module.id,
                'title': module.title,
                'order': module.order,
                'content': module_content
            })

        return jsonify({
            'success': True,
            'data': {
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'status': course.status,
                'modules': modules
            }
        }), 200

    except Exception as e:
        print(f"Error getting course details: {str(e)}")
        return jsonify({
            'error': f'Failed to get course details: {str(e)}'
        }), 500

@portal_admin_dashboard_bp.route('/api/portal_admin/update_course_status/<int:course_id>', methods=['PATCH'])
def update_course_status(course_id):
    """Update the status of a course"""
    try:
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400

        course = Course.query.get(course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404

        # Update course status
        course.status = data['status']
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Course status updated successfully'
        }), 200

    except Exception as e:
        print(f"Error updating course status: {str(e)}")
        return jsonify({
            'error': f'Failed to update course status: {str(e)}'
        }), 500

@portal_admin_dashboard_bp.route('/api/portal_admin/request_course', methods=['POST'])
def request_course():
    """Request a new course for the organization"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid input'}), 400

        title = data.get('title')
        description = data.get('description')
        org_id = data.get('org_id')

        if not title or not org_id:
            return jsonify({'error': 'Title and organization ID are required'}), 400

        # Create a new course request
        course_request = CourseRequest(
            title=title,
            description=description,
            org_id=org_id,
            status='pending'  # Default status is pending
        )
        db.session.add(course_request)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Course requested successfully'
        }), 201

    except Exception as e:
        print(f"Error requesting course: {str(e)}")
        return jsonify({
            'error': f'Failed to request course: {str(e)}'
        }), 500

@portal_admin_dashboard_bp.route('/api/portal_admin/get_course_requests', methods=['GET'])
def get_course_requests():
    """Get all course requests for the organization"""
    try:
        username = request.args.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400

        user = User.query.filter_by(username=username, role='portal_admin').first()
        if not user:
            return jsonify({'error': 'Portal admin not found'}), 404

        if not user.org_id:
            return jsonify({'error': 'User not associated with an organization'}), 404

        organization = db.session.get(Organization, user.org_id)
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404

        # Get all course requests for this organization
        course_requests = CourseRequest.query.filter_by(org_id=organization.id).all()

        return jsonify({
            'success': True,
            'data': [
                {
                    'id': request.id,
                    'title': request.title,
                    'description': request.description,
                    'status': request.status,
                    'requested_at': request.requested_at.strftime('%Y-%m-%d %H:%M:%S')
                }
                for request in course_requests
            ]
        }), 200

    except Exception as e:
        print(f"Error getting course requests: {str(e)}")
        return jsonify({
            'error': f'Failed to get course requests: {str(e)}'
        }), 500

@portal_admin_dashboard_bp.route('/api/portal_admin/update_request_status/<int:request_id>', methods=['PATCH'])
def update_request_status(request_id):
    """Update the status of a course request"""
    try:
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400

        request = CourseRequest.query.get(request_id)
        if not request:
            return jsonify({'error': 'Request not found'}), 404

        # Update request status
        request.status = data['status']
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Request status updated successfully'
        }), 200

    except Exception as e:
        print(f"Error updating request status: {str(e)}")
        return jsonify({
            'error': f'Failed to update request status: {str(e)}'
        }), 500
