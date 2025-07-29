#!/usr/bin/env python3
"""
Script to sync employee courses with their organization's assigned courses.
This should be run after updating the course assignment logic to clean up any existing data.
"""

from app import app, db
from models import User, Organization

def sync_employee_courses():
    """Sync all employees' courses with their organization's courses."""
    with app.app_context():
        try:
            # Get all organizations
            organizations = Organization.query.all()
            total_employees_updated = 0
            
            print("Starting employee course synchronization...")
            print(f"Found {len(organizations)} organizations")
            
            for org in organizations:
                print(f"\nProcessing organization: {org.name}")
                print(f"Organization has {len(org.courses)} assigned courses:")
                for course in org.courses:
                    print(f"  - {course.title} (ID: {course.id})")
                
                # Get all employees in this organization
                employees = User.query.filter_by(org_id=org.id, role='employee').all()
                print(f"Found {len(employees)} employees in this organization")
                
                for employee in employees:
                    print(f"  Processing employee: {employee.username}")
                    
                    # Clear existing courses
                    old_course_count = len(employee.courses)
                    employee.courses.clear()
                    
                    # Assign organization's courses
                    for course in org.courses:
                        employee.courses.append(course)
                    
                    new_course_count = len(employee.courses)
                    print(f"    Updated courses: {old_course_count} -> {new_course_count}")
                    
                total_employees_updated += len(employees)
            
            # Commit all changes
            db.session.commit()
            print(f"\n✅ Successfully updated {total_employees_updated} employees")
            print("Employee courses are now synced with organization assignments!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during synchronization: {str(e)}")
            return False
    
    return True

if __name__ == "__main__":
    success = sync_employee_courses()
    if success:
        print("\n🎉 Synchronization completed successfully!")
    else:
        print("\n💥 Synchronization failed!")
