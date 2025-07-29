from models import db, User, Organization, Course, Module, CourseProgress
from sqlalchemy import func, extract, and_
from datetime import datetime, timedelta
import json

def get_system_statistics(user_id=None, role=None):
    """
    Get comprehensive system statistics for admin dashboard
    
    Args:
        user_id: The ID of the user requesting statistics (for permission checks)
        role: The role of the user (admin or portal_admin)
        
    Returns:
        A dictionary containing various system statistics
    """
    # Find the user and their role
    if user_id:
        user = User.query.get(user_id)
        if user:
            role = user.role

    # Base statistics - shared between all admin types
    stats = {
        'total_courses': Course.query.count(),
    }

    # Recent user statistics (past 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    stats['recent_users'] = User.query.filter(User.created_at >= thirty_days_ago).count()
    # Recent course statistics
    stats['recent_courses'] = Course.query.filter(Course.created >= thirty_days_ago).count()

    if role == 'admin':
        # Superadmin gets system-wide statistics
        stats.update({
            'total_users': User.query.count(),
            'total_organizations': Organization.query.count(),
            'active_organizations': Organization.query.filter_by(status='active').count(),
            'total_portal_admins': User.query.filter_by(role='portal_admin').count(),
            'total_employees': User.query.filter_by(role='employee').count(),
        })

        # Recent organizations (up to 5)
        recent_orgs = Organization.query.order_by(Organization.created.desc()).limit(5).all()
        stats['recent_organizations'] = [
            {
                'id': org.id,
                'name': org.name,
                'status': org.status if hasattr(org, 'status') else 'unknown',
                'created': org.created.isoformat() if org.created else None
            }
            for org in recent_orgs
        ]

        # Monthly user growth (past 6 months)
        current_month = datetime.now().month
        current_year = datetime.now().year

        monthly_users = []
        for i in range(6):
            month = (current_month - i) % 12 or 12  # Handle December (0 case)
            year = current_year if month <= current_month else current_year - 1

            month_count = User.query.filter(
                extract('month', User.created_at) == month,
                extract('year', User.created_at) == year
            ).count()

            month_name = datetime(year, month, 1).strftime('%b')
            monthly_users.append({'month': month_name, 'count': month_count})

        stats['monthly_user_growth'] = list(reversed(monthly_users))

    elif role == 'portal_admin':
        # Portal admin only gets organization-specific statistics
        if user_id:
            user = User.query.get(user_id)
            if user and user.organization_id:
                org_id = user.organization_id

                # Employee count for this organization
                stats['employee_count'] = User.query.filter_by(
                    organization_id=org_id,
                    role='employee'
                ).count()

                # Course statistics for this organization
                org_courses = Course.query.filter_by(organization_id=org_id).all()
                stats['total_courses'] = len(org_courses)

                # Active courses (has at least one enrollment)
                active_course_count = db.session.query(Course).join(
                    CourseProgress, Course.id == CourseProgress.course_id
                ).filter(
                    Course.organization_id == org_id
                ).distinct().count()

                stats['active_courses'] = active_course_count

                # Calculate completion rate
                total_enrollments = CourseProgress.query.join(
                    Course, CourseProgress.course_id == Course.id
                ).filter(
                    Course.organization_id == org_id
                ).count()

                if total_enrollments > 0:
                    completed_enrollments = CourseProgress.query.join(
                        Course, CourseProgress.course_id == Course.id
                    ).filter(
                        Course.organization_id == org_id,
                        CourseProgress.completion_percentage == 100
                    ).count()

                    completion_rate = int((completed_enrollments / total_enrollments) * 100)
                    stats['completion_rate'] = completion_rate
                else:
                    stats['completion_rate'] = 0

    # Top courses by enrollment - useful for both admin types
    top_courses_query = db.session.query(
        Course.id, Course.title, func.count(CourseProgress.id).label('enrollment_count')
    ).join(
        CourseProgress, Course.id == CourseProgress.course_id
    )

    if role == 'portal_admin' and user_id and user and user.organization_id:
        org_id = user.organization_id
        top_courses_query = top_courses_query.filter(Course.organization_id == org_id)

    top_courses = top_courses_query.group_by(
        Course.id
    ).order_by(
        func.count(CourseProgress.id).desc()
    ).limit(5).all()

    stats['top_courses'] = [
        {'id': course.id, 'title': course.title, 'enrollments': course.enrollment_count}
        for course in top_courses
    ]

    return stats
