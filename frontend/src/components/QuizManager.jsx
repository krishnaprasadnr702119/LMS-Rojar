import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCheck } from 'react-icons/fa';

function QuizManager({ contentId, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple-choice',
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionFormError, setQuestionFormError] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    if (contentId) {
      fetchQuizQuestions();
    }
  }, [contentId]);

  const fetchQuizQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contents/${contentId}/questions`);
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.quiz.questions || []);
      } else {
        setError(data.message || 'Failed to fetch questions');
      }
    } catch (err) {
      setError('Failed to fetch questions');
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    setQuestionForm(f => ({ ...f, [name]: value }));
  };

  const handleOptionChange = (index, field, value) => {
    setQuestionForm(f => {
      const newOptions = [...f.options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return { ...f, options: newOptions };
    });
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setQuestionFormError('');
    setQuestionSubmitting(true);

    // Validate required fields
    if (!questionForm.question_text.trim()) {
      setQuestionFormError('Question text is required.');
      setQuestionSubmitting(false);
      return;
    }

    // Ensure at least 2 options are entered
    const validOptions = questionForm.options.filter(o => o.option_text.trim() !== '');
    if (validOptions.length < 2) {
      setQuestionFormError('At least 2 options are required.');
      setQuestionSubmitting(false);
      return;
    }

    // Ensure at least one correct answer
    const correctOptions = validOptions.filter(o => o.is_correct);
    if (correctOptions.length === 0) {
      setQuestionFormError('At least one option must be marked as correct.');
      setQuestionSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/contents/${contentId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_text: questionForm.question_text,
          question_type: questionForm.question_type,
          options: validOptions
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowQuestionModal(false);
        setQuestionForm({
          question_text: '',
          question_type: 'multiple-choice',
          options: [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false }
          ]
        });
        fetchQuizQuestions(); // Refresh questions
      } else {
        setQuestionFormError(data.message || 'Failed to create question');
      }
    } catch (err) {
      setQuestionFormError('Failed to create question');
      console.error('Error creating question:', err);
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options.length >= 4 
        ? question.options.map(opt => ({ option_text: opt.option_text, is_correct: opt.is_correct }))
        : [
            ...question.options.map(opt => ({ option_text: opt.option_text, is_correct: opt.is_correct })),
            ...Array(4 - question.options.length).fill().map(() => ({ option_text: '', is_correct: false }))
          ]
    });
    setQuestionFormError('');
    setShowQuestionModal(true);
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    setQuestionFormError('');
    setQuestionSubmitting(true);

    // Validate required fields
    if (!questionForm.question_text.trim()) {
      setQuestionFormError('Question text is required.');
      setQuestionSubmitting(false);
      return;
    }

    // Ensure at least 2 options are entered
    const validOptions = questionForm.options.filter(o => o.option_text.trim() !== '');
    if (validOptions.length < 2) {
      setQuestionFormError('At least 2 options are required.');
      setQuestionSubmitting(false);
      return;
    }

    // Ensure at least one correct answer
    const correctOptions = validOptions.filter(o => o.is_correct);
    if (correctOptions.length === 0) {
      setQuestionFormError('At least one option must be marked as correct.');
      setQuestionSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_text: questionForm.question_text,
          question_type: questionForm.question_type,
          options: validOptions
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowQuestionModal(false);
        setEditingQuestion(null);
        setQuestionForm({
          question_text: '',
          question_type: 'multiple-choice',
          options: [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false }
          ]
        });
        fetchQuizQuestions(); // Refresh questions
      } else {
        setQuestionFormError(data.message || 'Failed to update question');
      }
    } catch (err) {
      setQuestionFormError('Failed to update question');
      console.error('Error updating question:', err);
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(questionId);
    
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchQuizQuestions(); // Refresh questions
      } else {
        alert(data.message || 'Failed to delete question');
      }
    } catch (err) {
      alert('Failed to delete question');
      console.error('Error deleting question:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      question_type: 'multiple-choice',
      options: [
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]
    });
    setQuestionFormError('');
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          Loading quiz questions...
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .quiz-manager-modal {
          animation: modalFadeIn 0.3s ease-out;
        }
        
        .quiz-manager-content {
          animation: slideInUp 0.4s ease-out;
        }
        
        .question-card {
          transition: all 0.3s ease;
          transform: translateY(0);
        }
        
        .question-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .add-question-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: all 0.3s ease;
          transform: translateY(0);
        }
        
        .add-question-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        .close-btn {
          transition: all 0.2s ease;
        }
        
        .close-btn:hover {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 50%;
        }
      `}</style>
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div className="quiz-manager-modal" style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          width: '95%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px 30px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                🎯 Quiz Questions Manager
              </h2>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                Create and manage quiz questions
              </p>
            </div>
            <button
              className="close-btn"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'white',
                padding: '8px',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <div className="quiz-manager-content" style={{ 
            padding: '30px', 
            maxHeight: 'calc(90vh - 120px)', 
            overflow: 'auto' 
          }}>
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                {error}
              </div>
            )}

            {/* Add Question Button */}
            <div style={{ marginBottom: '30px' }}>
              <button
                className="add-question-btn"
                onClick={() => {
                  resetForm();
                  setShowQuestionModal(true);
                }}
                style={{
                  color: 'white',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}
              >
                <FaPlus /> Add New Question
              </button>
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#6b7280',
                padding: '60px 20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '16px',
                border: '2px dashed #d1d5db'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No questions yet</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Click "Add New Question" to create your first quiz question
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {questions.map((question, index) => (
                  <div key={question.id} className="question-card" style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ 
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            backgroundColor: '#667eea',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            Q{index + 1}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            textTransform: 'capitalize'
                          }}>
                            {question.question_type.replace('-', ' ')}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '16px', 
                          color: '#111827',
                          lineHeight: '1.6',
                          fontWeight: '500'
                        }}>
                          {question.question_text}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditQuestion(question)}
                          style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#3b82f6',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                            e.target.style.transform = 'scale(1)';
                          }}
                          title="Edit question"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteQuestion(question.id)}
                          disabled={deleteLoading === question.id}
                          style={{
                            background: deleteLoading === question.id 
                              ? 'rgba(156, 163, 175, 0.1)' 
                              : 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '8px',
                            cursor: deleteLoading === question.id ? 'not-allowed' : 'pointer',
                            color: deleteLoading === question.id ? '#9ca3af' : '#ef4444',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (deleteLoading !== question.id) {
                              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                              e.target.style.transform = 'scale(1.1)';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (deleteLoading !== question.id) {
                              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                              e.target.style.transform = 'scale(1)';
                            }
                          }}
                          title="Delete question"
                        >
                          {deleteLoading === question.id ? '⏳' : <FaTrash />}
                        </button>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '12px',
                      marginTop: '16px'
                    }}>
                      {question.options.map((option, optIndex) => (
                        <div key={option.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 16px',
                          backgroundColor: option.is_correct ? '#ecfdf5' : '#f9fafb',
                          border: `2px solid ${option.is_correct ? '#10b981' : '#e5e7eb'}`,
                          borderRadius: '10px',
                          fontSize: '14px',
                          gap: '10px'
                        }}>
                          {option.is_correct ? (
                            <FaCheck style={{ color: '#10b981', fontSize: '16px' }} />
                          ) : (
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: '#d1d5db',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              {String.fromCharCode(65 + optIndex)}
                            </div>
                          )}
                          <span style={{ 
                            color: option.is_correct ? '#065f46' : '#374151',
                            fontWeight: option.is_correct ? '600' : '500'
                          }}>
                            {option.option_text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Question Modal */}
          {showQuestionModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1001
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                width: '95%',
                maxWidth: '650px',
                maxHeight: '85vh',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                animation: 'modalFadeIn 0.3s ease-out'
              }}>
                <div style={{
                  padding: '24px 30px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: 'white'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                      {editingQuestion ? '✏️ Edit Question' : '➕ Add New Question'}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                      {editingQuestion ? 'Update the quiz question and answers' : 'Create a new quiz question with multiple choice answers'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowQuestionModal(false);
                      resetForm();
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion} style={{ 
                  padding: '30px',
                  maxHeight: 'calc(85vh - 100px)',
                  overflow: 'auto'
                }}>
                  {questionFormError && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '24px',
                      border: '1px solid #fecaca',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '18px' }}>⚠️</span>
                      {questionFormError}
                    </div>
                  )}

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '16px'
                    }}>
                      📝 Question Text:
                    </label>
                    <textarea
                      name="question_text"
                      value={questionForm.question_text}
                      onChange={handleQuestionInputChange}
                      rows="4"
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        resize: 'vertical',
                        fontSize: '15px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        ':focus': {
                          borderColor: '#10b981'
                        }
                      }}
                      placeholder="Enter your question here... (e.g., What is the capital of France?)"
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '16px'
                    }}>
                      🎯 Question Type:
                    </label>
                    <select
                      name="question_type"
                      value={questionForm.question_type}
                      onChange={handleQuestionInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '15px',
                        backgroundColor: 'white',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="single-choice">Single Choice</option>
                      <option value="true-false">True/False</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '30px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '16px', 
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '16px'
                    }}>
                      ✅ Answer Options:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {questionForm.options.map((option, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '16px',
                          backgroundColor: option.is_correct ? '#ecfdf5' : '#f9fafb',
                          border: `2px solid ${option.is_correct ? '#10b981' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          transition: 'all 0.2s ease'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={option.is_correct}
                              onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)}
                              style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                accentColor: '#10b981'
                              }}
                              title="Mark as correct answer"
                            />
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: option.is_correct ? '#10b981' : '#d1d5db',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={option.option_text}
                            onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + index)} - Enter answer choice`}
                            style={{
                              flex: 1,
                              padding: '12px',
                              border: 'none',
                              borderRadius: '8px',
                              backgroundColor: 'white',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#3730a3',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>💡</span>
                      <span>Check the checkbox next to correct answers. You can select multiple correct answers.</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '30px',
                    paddingTop: '20px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuestionModal(false);
                        resetForm();
                      }}
                      style={{
                        padding: '12px 24px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#6b7280',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6';
                        e.target.style.borderColor = '#d1d5db';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.borderColor = '#e5e7eb';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={questionSubmitting}
                      style={{
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '10px',
                        background: questionSubmitting 
                          ? '#9ca3af' 
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        cursor: questionSubmitting ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        boxShadow: questionSubmitting ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      {questionSubmitting ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>⏳</span> {editingQuestion ? 'Updating Question...' : 'Adding Question...'}
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {editingQuestion ? <FaEdit /> : <FaPlus />} {editingQuestion ? 'Update Question' : 'Add Question'}
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default QuizManager;
