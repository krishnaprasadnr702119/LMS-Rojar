from flask import Flask
from models import db, ModuleContent, QuizQuestion, QuizOption
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql://lmsuser:lmspassword@localhost:5432/lmsdb'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def add_quiz_question(quiz_id):
    with app.app_context():
        # First check if the quiz content exists
        quiz_content = ModuleContent.query.get(quiz_id)
        
        if not quiz_content:
            print(f"Quiz content with ID {quiz_id} not found!")
            return False
        
        print(f"Found quiz: {quiz_content.title}")
        
        # Check if there are already questions
        existing_questions = list(quiz_content.questions)
        print(f"Current question count: {len(existing_questions)}")
        
        # Add a new question
        new_question = QuizQuestion(
            content_id=quiz_id,
            question_text="What is the primary benefit of completing quizzes in an LMS?",
            question_type="multiple_choice",
            order=1
        )
        db.session.add(new_question)
        db.session.flush()  # Get the ID for the new question
        
        # Add options for the question
        options = [
            QuizOption(question_id=new_question.id, option_text="Reinforcing learning through knowledge recall", is_correct=True),
            QuizOption(question_id=new_question.id, option_text="Earning points for leaderboards", is_correct=False),
            QuizOption(question_id=new_question.id, option_text="Making the course longer", is_correct=False),
            QuizOption(question_id=new_question.id, option_text="Avoiding practical exercises", is_correct=False)
        ]
        
        for option in options:
            db.session.add(option)
            
        db.session.commit()
        
        print(f"Added new question with ID {new_question.id} and {len(options)} options")
        print("Quiz updated successfully!")
        return True

if __name__ == "__main__":
    quiz_id = 20  # Change this to your quiz ID
    add_quiz_question(quiz_id)
