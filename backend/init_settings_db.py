#!/usr/bin/env python3
"""
Database initialization script for LMS system settings
"""

import os
import sys
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from models import db, SystemSettings, EmailTemplate, SystemAnnouncement, AuditLog
from app import app

def init_database():
    """Initialize database with settings tables"""
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Check if system settings already exist
            existing_settings = SystemSettings.query.first()
            if existing_settings:
                print("⚠️  System settings already exist, skipping initialization")
                return
            
            # Initialize default settings
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
            default_templates = [
                {
                    'template_name': 'welcome_employee',
                    'subject': 'Welcome to {org_name} - Learning Management Portal',
                    'html_content': '''
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
                    ''',
                    'variables': '["org_name", "user_name", "user_email", "temp_password", "login_url"]'
                },
                {
                    'template_name': 'password_reset',
                    'subject': 'Password Reset - {org_name} Learning Portal',
                    'html_content': '''
                    <!DOCTYPE html>
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
                    </html>
                    ''',
                    'variables': '["org_name", "user_name", "user_email", "new_password", "login_url"]'
                }
            ]
            
            for template_data in default_templates:
                template = EmailTemplate(**template_data)
                db.session.add(template)
            
            db.session.commit()
            print(f"✅ Initialized {len(default_settings)} system settings")
            print(f"✅ Initialized {len(default_templates)} email templates")
            
        except Exception as e:
            print(f"❌ Error initializing database: {e}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    init_database()
