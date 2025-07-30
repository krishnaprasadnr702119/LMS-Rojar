from flask import request, jsonify
from models import db, User, Course, Module, ModuleContent, CourseProgress, ContentInteraction
import json
from datetime import datetime, timezone

def register_content_tracking_routes(app):
    
    @app.route('/api/employee/track_content_interaction', methods=['POST'])
    def track_content_interaction():
        """Track content interaction (video progress, PDF viewing, etc.)"""
        try:
            data = request.get_json()
            username = data.get('username')
            content_id = data.get('content_id')
            interaction_type = data.get('interaction_type')  # 'video_progress', 'pdf_view', 'content_complete'
            interaction_data = data.get('interaction_data', {})  # Progress percentage, time spent, etc.
            
            if not all([username, content_id, interaction_type]):
                return jsonify({'error': 'Username, content_id, and interaction_type are required'}), 400
            
            # Find the employee
            user = User.query.filter_by(username=username, role='employee').first()
            if not user:
                return jsonify({'error': 'Employee not found'}), 404
            
            # Get content details
            content = db.session.get(ModuleContent, content_id)
            if not content:
                return jsonify({'error': 'Content not found'}), 404
            
            # Record or update content interaction
            interaction = ContentInteraction.query.filter_by(
                user_id=user.id,
                content_id=content_id
            ).first()
            
            if not interaction:
                interaction = ContentInteraction(
                    user_id=user.id,
                    content_id=content_id,
                    interaction_type=interaction_type,
                    interaction_data=json.dumps(interaction_data),
                    created_at=datetime.now(timezone.utc)
                )
                db.session.add(interaction)
            else:
                # Update existing interaction
                interaction.interaction_type = interaction_type
                interaction.interaction_data = json.dumps(interaction_data)
                interaction.updated_at = datetime.now(timezone.utc)
            
            db.session.commit()
            
            # Check if content should be auto-completed
            should_complete = check_content_completion(interaction_type, interaction_data)
            
            response_data = {
                'success': True,
                'interaction_recorded': True,
                'should_complete': should_complete
            }
            
            # If content should be auto-completed, update module progress
            if should_complete:
                module_id = content.module_id
                course_id = content.module.course_id
                
                # Auto-update module progress
                progress_response = auto_update_module_progress(user.id, course_id, module_id, username)
                response_data.update(progress_response)
            
            return jsonify(response_data), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to track interaction: {str(e)}'}), 500

    @app.route('/api/employee/track_video_progress', methods=['POST'])
    def track_video_progress():
        """Specific endpoint for video progress tracking"""
        try:
            data = request.get_json()
            username = data.get('username')
            content_id = data.get('content_id')
            current_time = data.get('current_time', 0)
            duration = data.get('duration', 0)
            progress_percentage = data.get('progress_percentage', 0)
            
            if not all([username, content_id]):
                return jsonify({'error': 'Username and content_id are required'}), 400
            
            # Calculate progress if not provided
            if duration > 0 and progress_percentage == 0:
                progress_percentage = (current_time / duration) * 100
            
            interaction_data = {
                'current_time': current_time,
                'duration': duration,
                'progress_percentage': round(progress_percentage, 2),
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
            
            # Use the general content interaction endpoint
            return track_content_interaction_internal(
                username, content_id, 'video_progress', interaction_data
            )
            
        except Exception as e:
            return jsonify({'error': f'Failed to track video progress: {str(e)}'}), 500

    @app.route('/api/employee/track_pdf_progress', methods=['POST'])
    def track_pdf_progress():
        """Specific endpoint for PDF viewing tracking"""
        try:
            data = request.get_json()
            username = data.get('username')
            content_id = data.get('content_id')
            pages_viewed = data.get('pages_viewed', [])
            total_pages = data.get('total_pages', 0)
            time_spent = data.get('time_spent', 0)  # in seconds
            scroll_percentage = data.get('scroll_percentage', 0)
            
            if not all([username, content_id]):
                return jsonify({'error': 'Username and content_id are required'}), 400
            
            # Calculate completion based on pages viewed and time spent
            pages_completion = (len(pages_viewed) / total_pages * 100) if total_pages > 0 else 0
            time_threshold = max(30, total_pages * 10)  # Minimum 30 seconds, or 10 seconds per page
            time_completion = min(100, (time_spent / time_threshold) * 100)
            
            # Combined completion score
            overall_completion = (pages_completion * 0.6 + time_completion * 0.4)
            
            interaction_data = {
                'pages_viewed': pages_viewed,
                'total_pages': total_pages,
                'time_spent': time_spent,
                'scroll_percentage': scroll_percentage,
                'pages_completion': round(pages_completion, 2),
                'time_completion': round(time_completion, 2),
                'overall_completion': round(overall_completion, 2),
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
            
            return track_content_interaction_internal(
                username, content_id, 'pdf_progress', interaction_data
            )
            
        except Exception as e:
            return jsonify({'error': f'Failed to track PDF progress: {str(e)}'}), 500

    def track_content_interaction_internal(username, content_id, interaction_type, interaction_data):
        """Internal function to handle content interaction tracking"""
        try:
            user = User.query.filter_by(username=username, role='employee').first()
            if not user:
                return jsonify({'error': 'Employee not found'}), 404
            
            content = db.session.get(ModuleContent, content_id)
            if not content:
                return jsonify({'error': 'Content not found'}), 404
            
            # Record interaction
            interaction = ContentInteraction.query.filter_by(
                user_id=user.id,
                content_id=content_id
            ).first()
            
            if not interaction:
                interaction = ContentInteraction(
                    user_id=user.id,
                    content_id=content_id,
                    interaction_type=interaction_type,
                    interaction_data=json.dumps(interaction_data),
                    created_at=datetime.now(timezone.utc)
                )
                db.session.add(interaction)
            else:
                interaction.interaction_type = interaction_type
                interaction.interaction_data = json.dumps(interaction_data)
                interaction.updated_at = datetime.now(timezone.utc)
            
            db.session.commit()
            
            # Check for auto-completion
            should_complete = check_content_completion(interaction_type, interaction_data)
            
            response_data = {
                'success': True,
                'interaction_recorded': True,
                'should_complete': should_complete,
                'completion_data': interaction_data
            }
            
            if should_complete:
                module_id = content.module_id
                course_id = content.module.course_id
                progress_response = auto_update_module_progress(user.id, course_id, module_id, username)
                response_data.update(progress_response)
            
            return jsonify(response_data), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to track interaction: {str(e)}'}), 500

    def check_content_completion(interaction_type, interaction_data):
        """Determine if content should be marked as completed based on interaction data"""
        if interaction_type == 'video_progress':
            return interaction_data.get('progress_percentage', 0) >= 90
        elif interaction_type == 'pdf_progress':
            return interaction_data.get('overall_completion', 0) >= 80
        elif interaction_type == 'quiz_completed':
            return interaction_data.get('passed', False)
        elif interaction_type == 'content_complete':
            return True
        return False

    def auto_update_module_progress(user_id, course_id, module_id, username):
        """Automatically update module progress when content is completed"""
        try:
            # Get or create progress record
            progress_record = CourseProgress.query.filter_by(
                user_id=user_id,
                course_id=course_id
            ).first()
            
            if not progress_record:
                course = db.session.get(Course, course_id)
                total_modules = len(course.modules) if course else 0
                progress_record = CourseProgress(
                    user_id=user_id,
                    course_id=course_id,
                    total_modules=total_modules,
                    completed_modules=0,
                    progress_percentage=0,
                    module_progress=json.dumps({})
                )
                db.session.add(progress_record)
            
            # Update module progress
            module_progress = json.loads(progress_record.module_progress or '{}')
            module_id_str = str(module_id)
            
            if module_id_str not in module_progress:
                module_progress[module_id_str] = {
                    'completed': True,
                    'completion_date': datetime.now(timezone.utc).isoformat(),
                    'auto_completed': True
                }
                progress_record.completed_modules += 1
            
            # Update progress percentage
            if progress_record.total_modules > 0:
                progress_record.progress_percentage = (progress_record.completed_modules / progress_record.total_modules) * 100
            
            # Update last activity
            progress_record.last_activity = datetime.now(timezone.utc)
            
            # Check if course is completed
            if progress_record.completed_modules == progress_record.total_modules:
                progress_record.completion_date = datetime.now(timezone.utc)
                progress_record.risk_score = 0
            
            # Save changes
            progress_record.module_progress = json.dumps(module_progress)
            db.session.commit()
            
            return {
                'module_auto_completed': True,
                'progress': {
                    'course_id': course_id,
                    'completed_modules': progress_record.completed_modules,
                    'total_modules': progress_record.total_modules,
                    'progress_percentage': progress_record.progress_percentage,
                    'is_completed': progress_record.completed_modules == progress_record.total_modules
                }
            }
            
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to auto-update module progress: {str(e)}'}
