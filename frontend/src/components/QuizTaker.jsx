import React, { useState, useEffect } from 'react';
import './Quiz.css';
import './EnhancedQuiz.css';

const QuizTaker = ({ quizIds, currentQuizId, onClose, username }) => {
  // State for handling multiple quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState({}); // Store answers for all quizzes
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [allCompleted, setAllCompleted] = useState(false); // All quizzes completed

  useEffect(() => {
    // Handle both single quizId (backward compatibility) and array of quizIds
    if (username && ((Array.isArray(quizIds) && quizIds.length > 0) || quizIds)) {
      loadQuizzes();
    }
  }, [quizIds, username]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmit(); // Auto-submit when time runs out
    }
  }, [timeLeft, submitted]);

  // Effect to load current quiz when quiz index changes
  useEffect(() => {
    if (quizzes.length > 0) {
      setQuiz(quizzes[currentQuizIndex]);
      // Set answers for the current quiz
      setAnswers(allAnswers[quizzes[currentQuizIndex].id] || {});
      setCurrentQuestionIndex(0);
    }
  }, [currentQuizIndex, quizzes]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      
      // Handle both single quizId and array of quizIds
      const idsToFetch = Array.isArray(quizIds) ? quizIds : [quizIds];
      
      // Fetch all quizzes in parallel
      const promises = idsToFetch.map(id => 
        fetch(`http://localhost:5000/api/employee/quiz/${id}?username=${username}`)
          .then(response => response.json())
      );
      
      const results = await Promise.all(promises);
      
      // Process all quiz results
      const loadedQuizzes = [];
      const initialAllAnswers = {};
      
      results.forEach(data => {
        if (data.success) {
          loadedQuizzes.push(data.quiz);
          
          // Initialize answers for each quiz
          const quizAnswers = {};
          data.quiz.questions.forEach(q => {
            quizAnswers[q.id] = [];
          });
          
          initialAllAnswers[data.quiz.id] = quizAnswers;
        }
      });
      
      if (loadedQuizzes.length > 0) {
        setQuizzes(loadedQuizzes);
        setAllAnswers(initialAllAnswers);
        
        // Find the index of the current quiz if specified, or default to first quiz
        let startIndex = 0;
        if (currentQuizId) {
          const currentIndex = loadedQuizzes.findIndex(q => q.id === currentQuizId);
          if (currentIndex !== -1) {
            startIndex = currentIndex;
          }
        }
        
        setCurrentQuizIndex(startIndex);
        setQuiz(loadedQuizzes[startIndex]);
        setAnswers(initialAllAnswers[loadedQuizzes[startIndex].id] || {});
        
        // Set timer for all quizzes (3 minutes per quiz)
        setTimeLeft(180 * loadedQuizzes.length);
      } else {
        alert(`Error: ${data.error}`);
        onClose();
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      alert('Failed to load quizzes');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, optionId, isMultiple = false) => {
    // Update answers for current quiz
    const updatedAnswers = { ...answers };
    
    if (isMultiple) {
      // For multiple choice questions
      const currentAnswers = updatedAnswers[questionId] || [];
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
      updatedAnswers[questionId] = newAnswers;
    } else {
      // For single choice questions
      updatedAnswers[questionId] = [optionId];
    }
    
    setAnswers(updatedAnswers);
    
    // Update allAnswers state
    setAllAnswers(prev => ({
      ...prev,
      [quiz.id]: updatedAnswers
    }));
  };

  // Submit current quiz and move to next, or show results if all quizzes are completed
  const handleSubmit = async () => {
    if (!quiz || submitted) return;

    // Confirm submission
    if (timeLeft > 0) {
      const confirmSubmit = window.confirm('Are you sure you want to submit your current quiz?');
      if (!confirmSubmit) return;
    }

    try {
      setLoading(true);
      
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptions]) => ({
        question_id: parseInt(questionId),
        selected_options: selectedOptions
      }));

      const response = await fetch('http://localhost:5000/api/employee/submit_quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          content_id: quiz.id,
          answers: formattedAnswers
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Process the results to add user-friendly text for answers
        const processedResults = {
          ...data.results,
          question_results: data.results.question_results.map(result => {
            // Find the question in our quiz data
            const question = quiz.questions.find(q => q.id === result.question_id);
            
            if (question) {
              // Map option IDs to their text for user answers
              const userAnswerText = result.user_answer.map(optionId => {
                const option = question.options.find(opt => opt.id === optionId);
                return option ? option.option_text : `Option ${optionId}`;
              }).join(', ');
              
              // Map option IDs to their text for correct answers
              const correctOptionsText = result.correct_options.map(optionId => {
                const option = question.options.find(opt => opt.id === optionId);
                return option ? option.option_text : `Option ${optionId}`;
              }).join(', ');
              
              return {
                ...result,
                user_answer_text: userAnswerText,
                correct_options_text: correctOptionsText
              };
            }
            return result;
          })
        };
        
        // Show auto-completion notification if module was completed
        if (data.module_auto_completed) {
          showAutoCompletionNotification(processedResults.percentage_score);
        }
        
        // Check if this was the last quiz
        if (currentQuizIndex < quizzes.length - 1) {
          // Move to next quiz
          setCurrentQuizIndex(currentQuizIndex + 1);
        } else {
          // All quizzes completed
          setResults(processedResults);
          setSubmitted(true);
          setAllCompleted(true);
          setTimeLeft(0);
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle retaking all quizzes
  const handleRetakeQuizzes = () => {
    // Reset all state to initial values
    setCurrentQuizIndex(0);
    setCurrentQuestionIndex(0);
    
    // Clear all answers
    const resetAnswers = {};
    quizzes.forEach(quiz => {
      const quizAnswers = {};
      quiz.questions.forEach(q => {
        quizAnswers[q.id] = [];
      });
      resetAnswers[quiz.id] = quizAnswers;
    });
    
    setAllAnswers(resetAnswers);
    setAnswers(resetAnswers[quizzes[0].id] || {});
    
    // Reset submission state
    setSubmitted(false);
    setAllCompleted(false);
    setResults(null);
    
    // Reset timer
    setTimeLeft(180 * quizzes.length);
  };

  // Show auto-completion notification when quiz passes and module completes
  const showAutoCompletionNotification = (score) => {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
      ">
        🎉 Quiz passed! Module completed!
        <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">
          Score: ${score}% - Progress updated automatically
        </div>
      </div>
      <style>
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }
    }, 5000);
  };
  
  // Handle moving to previous quiz
  const handlePrevQuiz = () => {
    if (currentQuizIndex > 0) {
      // Save current answers before switching
      const updatedAllAnswers = {
        ...allAnswers,
        [quiz.id]: answers
      };
      setAllAnswers(updatedAllAnswers);
      
      // Move to previous quiz
      const newIndex = currentQuizIndex - 1;
      setCurrentQuizIndex(newIndex);
      console.log(`Moving to previous quiz at index ${newIndex}`);
    }
  };
  
  // Handle moving to next quiz
  const handleNextQuiz = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      // Save current answers before switching
      const updatedAllAnswers = {
        ...allAnswers,
        [quiz.id]: answers
      };
      setAllAnswers(updatedAllAnswers);
      
      // Move to next quiz
      const newIndex = currentQuizIndex + 1;
      setCurrentQuizIndex(newIndex);
      console.log(`Moving to next quiz at index ${newIndex}`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isAnswerSelected = (questionId, optionId) => {
    return answers[questionId]?.includes(optionId) || false;
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(answerArray => answerArray.length > 0).length;
  };

  if (loading) {
    return (
      <div className="quiz-overlay">
        <div className="quiz-container">
          <div className="loading">Loading quiz...</div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    // Show a welcome screen with a start button
    return (
      <div className="quiz-overlay">
        <div className="quiz-container">
          <div className="quiz-welcome">
            <h2>Ready to Start the Quiz</h2>
            <p>You're about to start {quizzes.length > 1 ? `${quizzes.length} quizzes` : 'a quiz'}.</p>
            <p>Click the button below when you're ready to begin.</p>
            <button onClick={() => setQuiz(quizzes[0])} className="start-quiz-btn">
              Start Quiz
            </button>
            <button onClick={onClose} className="cancel-quiz-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results view
  if (allCompleted && results) {
    return (
      <div className="quiz-overlay">
        <div className="quiz-container">
          <div className="quiz-results">
            <h2>Quiz Results</h2>
            <div className="results-summary">
              <div className={`score-display ${results.passed ? 'passed' : 'failed'}`}>
                <div className="score-number">{results.percentage}%</div>
                <div className="score-fraction">{results.score}/{results.total_questions}</div>
                <div className={`pass-status ${results.passed ? 'passed' : 'failed'}`}>
                  {results.passed ? 'PASSED' : 'FAILED'}
                </div>
              </div>
              <div className="results-details">
                <p>Correct Answers: {results.score}</p>
                <p>Total Questions: {results.total_questions}</p>
                <p>Passing Score: 70%</p>
              </div>
            </div>

            <div className="question-review">
              <h3>Question Review</h3>
              {results.question_results.map((result, index) => (
                <div key={result.question_id} className={`question-result ${result.is_correct ? 'correct' : 'incorrect'}`}>
                  <div className="question-header">
                    <span className="question-number">Q{index + 1}</span>
                    <span className={`result-indicator ${result.is_correct ? 'correct' : 'incorrect'}`}>
                      {result.is_correct ? '✓' : '✗'}
                    </span>
                  </div>
                  <p className="question-text">{result.question_text}</p>
                  <div className="answer-explanation">
                    <p><strong>Your Answer:</strong> {result.user_answer_text || 'No answer'}</p>
                    <p><strong>Correct Answer:</strong> {result.correct_options_text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="quiz-action-buttons">
              <button onClick={handleRetakeQuizzes} className="retake-quiz-btn">
                Retake Quizzes
              </button>
              <button onClick={onClose} className="close-results-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <div className="quiz-overlay">
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="quiz-info">
            <h2>{quiz.title}</h2>
            <div className="quiz-meta-info">
              <div className="quiz-progress">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </div>
              <div className="quiz-progress">
                Quiz {currentQuizIndex + 1} of {quizzes.length}
              </div>
            </div>
          </div>
          <div className="quiz-stats">
            <div className="timer">
              <span className={timeLeft < 300 ? 'timer-warning' : ''}>
                ⏰ {formatTime(timeLeft)}
              </span>
            </div>
            <div className="answered-count">
              Answered: {getAnsweredCount()}/{quiz.questions.length}
            </div>
          </div>
        </div>

        <div className="quiz-content">
          <div className="question-section">
            <div className="question-header">
              <span className="question-number">Question {currentQuestionIndex + 1}</span>
              <span className="question-type">{currentQuestion.question_type}</span>
            </div>
            <p className="question-text">{currentQuestion.question_text}</p>

            <div className="options-section">
              {currentQuestion.options.map((option) => (
                <label 
                  key={option.id} 
                  className={`option-label ${isAnswerSelected(currentQuestion.id, option.id) ? 'selected' : ''}`}
                >
                  <input
                    type={currentQuestion.question_type === 'multiple-choice' ? 'checkbox' : 'radio'}
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={isAnswerSelected(currentQuestion.id, option.id)}
                    onChange={() => handleAnswerChange(
                      currentQuestion.id, 
                      option.id, 
                      currentQuestion.question_type === 'multiple-choice'
                    )}
                  />
                  <span className="option-text">{option.option_text}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="quiz-navigation">
            {/* Question navigation */}
            <div className="nav-buttons">
              {/* <button 
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                disabled={isFirstQuestion}
                className="nav-btn prev-btn"
              >
                Previous Question
              </button> */}
              
              {!isLastQuestion ? (
                <button 
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="nav-btn next-btn"
                >
                  Next Question
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="submit-btn"
                >
                  {loading ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>

            {/* Question indicators */}
            <div className="question-indicators">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`question-indicator ${
                    index === currentQuestionIndex ? 'current' : ''
                  } ${
                    getAnsweredCount() > index ? 'answered' : ''
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            {/* Quiz navigation */}
            <div className="quiz-nav-buttons">
              <button 
                onClick={handlePrevQuiz}
                disabled={currentQuizIndex === 0 || loading}
                className="quiz-nav-btn prev-quiz-btn"
              >
                ← Previous Quiz
              </button>
              
              <button 
                onClick={handleNextQuiz}
                disabled={currentQuizIndex === quizzes.length - 1 || loading}
                className="quiz-nav-btn next-quiz-btn"
              >
                Next Quiz →
              </button>
            </div>
            
            {/* Quiz counter */}
            <div className="quiz-counter">
              Quiz {currentQuizIndex + 1} of {quizzes.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;
