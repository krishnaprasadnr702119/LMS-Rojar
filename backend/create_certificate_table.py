#!/usr/bin/env python3
"""
Script to create the Certificate table in the existing SQLite database
"""
import os
import sys
sys.path.append('/home/kp/Desktop/lms/backend')

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import Certificate

app = Flask(__name__)

# Use SQLite database from instance folder
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////home/kp/Desktop/lms/backend/instance/lms.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

def create_certificate_table():
    """Create the Certificate table in the existing database"""
    with app.app_context():
        # Import all models to ensure they're registered
        from models import User, Organization, Course, Module, ModuleContent, QuizQuestion, QuizOption, Task, CourseRequest, CourseProgress, Certificate, SystemSettings, AuditLog, EmailTemplate, SystemAnnouncement, UserSession, PageView, QuizAttempt, ContentInteraction, CourseEnrollment, SystemMetrics, EmailMetrics, FeatureUsage, APIUsage
        
        # Create only the Certificate table
        db.create_all()
        print("Certificate table created successfully!")

if __name__ == '__main__':
    create_certificate_table()
