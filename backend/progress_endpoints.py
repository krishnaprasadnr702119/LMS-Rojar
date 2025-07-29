@app.route('/api/employee/update_progress', methods=['POST'])
def update_course_progress():
    """Update progress for a specific course for an employee"""
    try:
        data = request.get_json()
        username = data.get('username')
        course_id = data.get('course_id')
        module_id = data.get('module_id')
        completed = data.get('completed', False)
        
        if not all([username, course_id, module_id]):
            return jsonify({'error': 'Username, course_id, and module_id are required'}), 400
            
        # Find the employee
        user = User.query.filter_by(username=username, role='employee').first()
        if not user:
            return jsonify({'error': 'Employee not found'}), 404
        
        # Check if the course exists and is assigned to the employee
        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
            
        if course not in user.courses:
            return jsonify({'error': 'Course not assigned to this employee'}), 403
        
        # Get or create progress record
        progress_record = CourseProgress.query.filter_by(
            user_id=user.id, 
            course_id=course_id
        ).first()
        
        if not progress_record:
            total_modules = len(course.modules)
            progress_record = CourseProgress(
                user_id=user.id,
                course_id=course_id,
                total_modules=total_modules,
                completed_modules=0,
                progress_percentage=0,
                module_progress=json.dumps({})
            )
            db.session.add(progress_record)
        
        # Update module progress
        module_progress = json.loads(progress_record.module_progress)
        module_id_str = str(module_id)
        
        if completed and module_id_str not in module_progress:
            module_progress[module_id_str] = {
                'completed': True,
                'completion_date': datetime.datetime.utcnow().isoformat()
            }
            progress_record.completed_modules += 1
        elif not completed and module_id_str in module_progress:
            del module_progress[module_id_str]
            progress_record.completed_modules -= 1
            
        # Update progress percentage
        if progress_record.total_modules > 0:
            progress_record.progress_percentage = (progress_record.completed_modules / progress_record.total_modules) * 100
        
        # Update last activity
        progress_record.last_activity = datetime.datetime.utcnow()
        
        # Check if course is completed
        if progress_record.completed_modules == progress_record.total_modules:
            progress_record.completion_date = datetime.datetime.utcnow()
            # Reset risk score when completed
            progress_record.risk_score = 0
        else:
            # Calculate risk score based on progress and activity
            days_since_activity = (datetime.datetime.utcnow() - progress_record.last_activity).days
            expected_progress = min(100, days_since_activity * 5)  # Rough estimate: should complete ~5% per day
            actual_progress = progress_record.progress_percentage
            
            if expected_progress > actual_progress:
                progress_record.risk_score = min(100, int((expected_progress - actual_progress) * 1.5))
            else:
                progress_record.risk_score = max(0, progress_record.risk_score - 10)  # Reduce risk if ahead of schedule
        
        # Save changes
        progress_record.module_progress = json.dumps(module_progress)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'progress': {
                'course_id': course_id,
                'completed_modules': progress_record.completed_modules,
                'total_modules': progress_record.total_modules,
                'progress_percentage': progress_record.progress_percentage,
                'is_completed': progress_record.completed_modules == progress_record.total_modules,
                'risk_score': progress_record.risk_score
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update progress: {str(e)}'}), 500
