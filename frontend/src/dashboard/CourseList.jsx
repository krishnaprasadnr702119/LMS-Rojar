import React, { useEffect, useState, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaVideo, FaFilePdf, FaQuestionCircle, FaChevronRight, FaRegCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import QuizManager from '../components/QuizManager';

function CourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'draft',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [courseLoading, setCourseLoading] = useState(false);
  
  // Module management
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    order: null
  });
  const [moduleSubmitting, setModuleSubmitting] = useState(false);
  const [moduleFormError, setModuleFormError] = useState('');
  
  // Content management
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [contentForm, setContentForm] = useState({
    title: '',
    content_type: 'video',
    order: null
  });
  const [contentFile, setContentFile] = useState(null);
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [contentFormError, setContentFormError] = useState('');
  
  // Quiz management
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizData, setQuizData] = useState('');
  const [showQuizQuestionModal, setShowQuizQuestionModal] = useState(false);
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
  
  // Content viewing
  const [viewingContent, setViewingContent] = useState(null);
  const [showContentViewer, setShowContentViewer] = useState(false);
  const [showQuizViewer, setShowQuizViewer] = useState(false);
  
  // Quiz Manager
  const [selectedContent, setSelectedContent] = useState(null);
  const [showQuizManager, setShowQuizManager] = useState(false);
  
  // Course editing
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'draft'
  });
  const [editFormError, setEditFormError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);

  const fetchCourses = () => {
    setLoading(true);
    setError(null);
    fetch('/api/courses')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setCourses(data.courses || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Unknown error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleCreate = async e => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    // Validate required fields
    if (!form.title) {
      setFormError('Please fill all required fields.');
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        // Not valid JSON
        if (!res.ok) {
          setFormError('Server error: ' + res.status);
          setSubmitting(false);
          return;
        }
      }
      if (!res.ok) throw new Error((data && data.message) || 'Failed to create course');
      setShowModal(false);
      setForm({ title: '', description: '', status: 'draft' });
      fetchCourses();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModuleInputChange = e => {
    const { name, value } = e.target;
    setModuleForm(f => ({ ...f, [name]: value }));
  };

  const handleCreateModule = async e => {
    e.preventDefault();
    setModuleFormError('');
    setModuleSubmitting(true);
    
    // Validate required fields
    if (!moduleForm.title) {
      setModuleFormError('Module title is required.');
      setModuleSubmitting(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/courses/${selectedCourse}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleForm),
      });
      
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        if (!res.ok) {
          setModuleFormError('Server error: ' + res.status);
          setModuleSubmitting(false);
          return;
        }
      }
      
      if (!res.ok) throw new Error((data && data.message) || 'Failed to create module');
      
      setShowModuleModal(false);
      setModuleForm({ title: '', description: '', order: null });
      
      // Refresh the course details
      fetchCourseDetails(selectedCourse);
    } catch (err) {
      setModuleFormError(err.message);
    } finally {
      setModuleSubmitting(false);
    }
  };

  const handleContentInputChange = e => {
    const { name, value } = e.target;
    setContentForm(f => ({ ...f, [name]: value }));
  };

  const handleFileChange = e => {
    setContentFile(e.target.files[0]);
  };

  const handleCreateContent = async e => {
    e.preventDefault();
    setContentFormError('');
    setContentSubmitting(true);
    
    // Validate required fields
    if (!contentForm.title) {
      setContentFormError('Content title is required.');
      setContentSubmitting(false);
      return;
    }
    
    if (contentForm.content_type !== 'quiz' && !contentFile) {
      setContentFormError(`Please select a ${contentForm.content_type} file to upload.`);
      setContentSubmitting(false);
      return;
    }
    
    try {
      // For quiz content, create it directly and then open the question editor
      if (contentForm.content_type === 'quiz') {
        const formData = new FormData();
        formData.append('title', contentForm.title);
        formData.append('content_type', 'quiz');
        if (contentForm.order !== null) {
          formData.append('order', contentForm.order);
        }
        
        const res = await fetch(`/api/modules/${selectedModule.id}/contents`, {
          method: 'POST',
          body: formData,
        });
        
        const data = await res.json();
        
        if (data.success) {
          setShowContentModal(false);
          setContentForm({ title: '', content_type: 'video', order: null });
          
          // Select the newly created quiz for editing
          if (data.content && data.content.id) {
            setSelectedContent(data.content);
            // Open quiz editing directly
            setShowQuizManager(true);
          }
          
          // Refresh the course details
          fetchCourseDetails(selectedCourse);
          return;
        } else {
          setContentFormError(data.error || 'Failed to create quiz');
          setContentSubmitting(false);
          return;
        }
      }
      
      // For file content (video, pdf)
      const formData = new FormData();
      formData.append('title', contentForm.title);
      formData.append('content_type', contentForm.content_type);
      if (contentForm.order !== null) {
        formData.append('order', contentForm.order);
      }
      formData.append('file', contentFile);
      
      const res = await fetch(`/api/modules/${selectedModule.id}/contents`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upload content');
      }
      
      setShowContentModal(false);
      setContentForm({ title: '', content_type: 'video', order: null });
      setContentFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh the course details
      fetchCourseDetails(selectedCourse);
    } catch (err) {
      setContentFormError(err.message);
    } finally {
      setContentSubmitting(false);
    }
  };

  // Removed handleQuizSubmit as we now create quizzes directly

  const handleAddQuizQuestion = async () => {
    // Quiz modal has been removed, just show the question modal directly
    setShowQuizQuestionModal(true);
  };

  const handleQuestionInputChange = e => {
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

  const handleCreateQuestion = async e => {
    e.preventDefault();
    setQuestionFormError('');
    setQuestionSubmitting(true);
    
    // Validate required fields
    if (!questionForm.question_text) {
      setQuestionFormError('Question text is required.');
      setQuestionSubmitting(false);
      return;
    }
    
    // Ensure at least one option is entered
    const validOptions = questionForm.options.filter(o => o.option_text.trim() !== '');
    if (validOptions.length < 2) {
      setQuestionFormError('Please provide at least two answer options.');
      setQuestionSubmitting(false);
      return;
    }
    
    // For multiple choice, ensure at least one option is marked as correct
    if (questionForm.question_type === 'multiple-choice' && !questionForm.options.some(o => o.is_correct)) {
      setQuestionFormError('Please mark at least one option as correct.');
      setQuestionSubmitting(false);
      return;
    }
    
    try {
      setQuizData(prev => {
        const newQuizData = prev ? JSON.parse(prev) : [];
        newQuizData.push({
          question_text: questionForm.question_text,
          question_type: questionForm.question_type,
          options: questionForm.options.filter(o => o.option_text.trim() !== '')
        });
        return JSON.stringify(newQuizData);
      });
      
      setShowQuizQuestionModal(false);
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
      setShowQuizModal(true);
    } catch (err) {
      setQuestionFormError(err.message);
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course? All modules and content will be permanently removed.')) {
      return;
    }
    
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete course');
      }
      
      // Refresh the list after successful deletion
      fetchCourses();
    } catch (err) {
      alert('Error deleting course: ' + err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const fetchCourseDetails = async (id) => {
    setCourseLoading(true);
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error('Failed to fetch course details');
      const data = await res.json();
      setCourseDetails(data.course);
    } catch (err) {
      alert('Error fetching course details: ' + err.message);
    } finally {
      setCourseLoading(false);
    }
  };

  const handleCourseClick = (course) => {
    // Regular course selection behavior
    if (selectedCourse === course.id) {
      setSelectedCourse(null);
      setCourseDetails(null);
    } else {
      setSelectedCourse(course.id);
      fetchCourseDetails(course.id);
    }
  };
  
  const handleViewContent = (content) => {
    setViewingContent(content);
    if (content.content_type === 'quiz') {
      setShowQuizViewer(true);
    } else {
      setShowContentViewer(true);
    }
  };

  const handleEditQuiz = (content) => {
    setSelectedContent(content);
    setShowQuizManager(true);
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contents/${contentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the course details
        fetchCourseDetails(selectedCourse);
      } else {
        alert(data.message || 'Failed to delete content');
      }
    } catch (err) {
      alert('Failed to delete content');
      console.error('Error deleting content:', err);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setEditForm({
      title: course.title,
      description: course.description || '',
      status: course.status
    });
    setEditFormError('');
    setShowEditCourseModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setEditFormError('');
    setEditSubmitting(true);

    // Validate required fields
    if (!editForm.title.trim()) {
      setEditFormError('Course title is required.');
      setEditSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditCourseModal(false);
        setEditingCourse(null);
        setEditForm({ title: '', description: '', status: 'draft' });
        fetchCourses(); // Refresh the courses list
      } else {
        setEditFormError(data.message || 'Failed to update course');
      }
    } catch (err) {
      setEditFormError('Failed to update course');
      console.error('Error updating course:', err);
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        minHeight: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fef3c7 100%)',
        padding: '24px',
      }}
    >
      {/* Add enhanced style tag for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      
      {/* Enhanced Header */}
      <div
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 20,
          boxShadow: '0 8px 48px rgba(0,0,0,0.08)',
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 32,
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
          borderRadius: '50%',
          opacity: 0.6
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '-20px',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
          borderRadius: '50%',
          opacity: 0.4
        }}></div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 20,
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            border: '2px solid rgba(59,130,246,0.2)'
          }}>
            📚
          </div>
          <div>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: '0 0 8px 0',
                lineHeight: 1.2
              }}
            >
              Course Management
            </h1>
            <p style={{
              fontSize: 18,
              color: '#64748b',
              margin: 0,
              fontWeight: 500
            }}>
              Create, manage, and organize your educational content
            </p>
          </div>
        </div>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 28px',
            fontWeight: 700,
            fontSize: 'clamp(15px, 2vw, 16px)',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            outline: 'none',
          }}
          onClick={() => setShowModal(true)}
          onMouseOver={e => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.35)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onFocus={e => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.35)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <FaPlus size={16} />
          New Course
        </button>
      </div>
      
      {/* Modal for creating course */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <form
            onSubmit={handleCreate}
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: 36,
              minWidth: 360,
              maxWidth: '90vw',
              width: 420,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              position: 'relative',
              animation: 'slideUp 0.3s ease-out',
              border: '1px solid rgba(226,232,240,0.8)',
            }}
          >
            <h3 style={{ 
              margin: 0, 
              color: '#1e40af', 
              fontWeight: 800, 
              fontSize: 24, 
              position: 'relative',
              paddingBottom: 14,
              marginBottom: 5
            }}>
              Create Course
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 40,
                height: 4,
                background: 'linear-gradient(90deg, #3b82f6, #1e40af)',
                borderRadius: 2
              }}></div>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Course Title*
              </label>
              <input 
                name="title" 
                value={form.title} 
                onChange={handleInputChange} 
                required 
                placeholder="Enter course title"
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Description
              </label>
              <textarea
                name="description" 
                value={form.description} 
                onChange={handleInputChange}
                placeholder="Enter course description"
                rows={4}
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  resize: 'vertical'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Status*
              </label>
              <select 
                name="status" 
                value={form.status} 
                onChange={handleInputChange} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  cursor: 'pointer'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {formError && (
              <div style={{ 
                color: '#ef4444', 
                fontWeight: 600, 
                background: '#fee2e2', 
                padding: '10px 14px', 
                borderRadius: 8,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                style={{ 
                  padding: '10px 18px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  background: 'white', 
                  color: '#475569', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: 10, 
                  border: 'none', 
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff', 
                  fontWeight: 700, 
                  cursor: submitting ? 'not-allowed' : 'pointer', 
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  if (!submitting) {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {submitting ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditCourseModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <form
            onSubmit={handleUpdateCourse}
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: 36,
              minWidth: 360,
              maxWidth: '90vw',
              width: 420,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              position: 'relative',
              animation: 'slideUp 0.3s ease-out',
              border: '1px solid rgba(226,232,240,0.8)',
            }}
          >
            <h3 style={{ 
              margin: 0, 
              color: '#1e40af', 
              fontWeight: 800, 
              fontSize: 24, 
              position: 'relative',
              paddingBottom: 14,
              marginBottom: 5
            }}>
              Edit Course
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 40,
                height: 4,
                background: 'linear-gradient(90deg, #3b82f6, #1e40af)',
                borderRadius: 2
              }}></div>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Course Title*
              </label>
              <input 
                name="title" 
                value={editForm.title} 
                onChange={handleEditFormChange} 
                required 
                placeholder="Enter course title"
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Description
              </label>
              <textarea
                name="description" 
                value={editForm.description} 
                onChange={handleEditFormChange}
                placeholder="Enter course description"
                rows={4}
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  resize: 'vertical'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Status*
              </label>
              <select 
                name="status" 
                value={editForm.status} 
                onChange={handleEditFormChange} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  cursor: 'pointer'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {editFormError && (
              <div style={{ 
                color: '#ef4444', 
                fontWeight: 600, 
                background: '#fee2e2', 
                padding: '10px 14px', 
                borderRadius: 8,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {editFormError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowEditCourseModal(false);
                  setEditingCourse(null);
                  setEditForm({ title: '', description: '', status: 'draft' });
                  setEditFormError('');
                }} 
                style={{ 
                  padding: '10px 18px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  background: 'white', 
                  color: '#475569', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={editSubmitting} 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: 10, 
                  border: 'none', 
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff', 
                  fontWeight: 700, 
                  cursor: editSubmitting ? 'not-allowed' : 'pointer', 
                  opacity: editSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  if (!editSubmitting) {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {editSubmitting ? 'Updating...' : 'Update Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Module Creation Modal */}
      {showModuleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <form
            onSubmit={handleCreateModule}
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: 36,
              minWidth: 360,
              maxWidth: '90vw',
              width: 420,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              position: 'relative',
              animation: 'slideUp 0.3s ease-out',
              border: '1px solid rgba(226,232,240,0.8)',
            }}
          >
            <h3 style={{ 
              margin: 0, 
              color: '#1e40af', 
              fontWeight: 800, 
              fontSize: 24, 
              position: 'relative',
              paddingBottom: 14,
              marginBottom: 5
            }}>
              Add Module to Course
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 40,
                height: 4,
                background: 'linear-gradient(90deg, #3b82f6, #1e40af)',
                borderRadius: 2
              }}></div>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Module Title*
              </label>
              <input 
                name="title" 
                value={moduleForm.title} 
                onChange={handleModuleInputChange} 
                required 
                placeholder="Enter module title"
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Description
              </label>
              <textarea
                name="description" 
                value={moduleForm.description} 
                onChange={handleModuleInputChange}
                placeholder="Enter module description"
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  resize: 'vertical'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            {moduleFormError && (
              <div style={{ 
                color: '#ef4444', 
                fontWeight: 600, 
                background: '#fee2e2', 
                padding: '10px 14px', 
                borderRadius: 8,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {moduleFormError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowModuleModal(false)} 
                style={{ 
                  padding: '10px 18px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  background: 'white', 
                  color: '#475569', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={moduleSubmitting} 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: 10, 
                  border: 'none', 
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff', 
                  fontWeight: 700, 
                  cursor: moduleSubmitting ? 'not-allowed' : 'pointer', 
                  opacity: moduleSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  if (!moduleSubmitting) {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {moduleSubmitting ? 'Adding...' : 'Add Module'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Course List and Details */}
      <div
        style={{
          width: '100%',
          height: '100%',
          margin: 0,
          display: 'flex',
          gap: 24,
        }}
      >
        {/* Course List */}
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 2px 16px rgba(102,126,234,0.08)',
            overflow: 'auto',
            width: '40%',
            minWidth: 300,
            height: '100%',
          }}
        >
          {loading ? (
            <Loader />
          ) : error ? (
            <div style={{ color: '#ef4444', fontWeight: 600, fontSize: 18, padding: 32 }}>Failed to load courses: {error}</div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>No courses yet</div>
              <div>Click "Create Course" to add your first course</div>
            </div>
          ) : (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {courses.map((course, idx) => (
                <div 
                  key={course.id}
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: selectedCourse === course.id 
                      ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' 
                      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: selectedCourse === course.id 
                      ? '2px solid #3b82f6' 
                      : '1px solid rgba(226,232,240,0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: selectedCourse === course.id 
                      ? '0 20px 25px -5px rgba(59,130,246,0.1), 0 10px 10px -5px rgba(59,130,246,0.04)' 
                      : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onClick={() => handleCourseClick(course)}
                  onMouseEnter={(e) => {
                    if (selectedCourse !== course.id) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCourse !== course.id) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)';
                    }
                  }}
                >
                  {/* Decorative corner element */}
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    width: '40px',
                    height: '40px',
                    background: selectedCourse === course.id 
                      ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                      : 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
                    borderRadius: '50%',
                    opacity: 0.7,
                  }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ 
                      fontWeight: 700, 
                      color: selectedCourse === course.id ? '#1d4ed8' : '#1e40af', 
                      fontSize: '20px',
                      lineHeight: '1.3',
                      maxWidth: '70%'
                    }}>
                      {course.title}
                    </div>
                    <div style={{ 
                      padding: '6px 14px',
                      borderRadius: '50px',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: getStatusBgColor(course.status),
                      color: getStatusColor(course.status),
                      border: `1px solid ${getStatusColor(course.status)}20`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ 
                      color: '#64748b', 
                      fontSize: '16px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ 
                        fontSize: '18px',
                        filter: 'grayscale(0.3)'
                      }}>📚</span>
                      {course.module_count} module{course.module_count !== 1 ? 's' : ''}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCourse(course);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                          color: '#475569',
                          border: '1px solid rgba(71,85,105,0.2)',
                          borderRadius: '10px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <FaEdit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(course.id);
                        }}
                        disabled={deleteLoading === course.id}
                        style={{
                          background: deleteLoading === course.id 
                            ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' 
                            : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                          color: deleteLoading === course.id ? '#94a3b8' : '#dc2626',
                          border: deleteLoading === course.id 
                            ? '1px solid rgba(148,163,184,0.3)' 
                            : '1px solid rgba(220,38,38,0.2)',
                          borderRadius: '10px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: deleteLoading === course.id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!deleteLoading) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!deleteLoading) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <FaTrash size={14} />
                        {deleteLoading === course.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {selectedCourse === course.id && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginTop: '20px',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      borderRadius: '12px',
                      color: '#1d4ed8',
                      fontWeight: 700,
                      fontSize: '16px',
                      border: '1px solid rgba(29,78,216,0.2)',
                      animation: 'pulse 2s infinite',
                    }}>
                      <FaChevronRight size={16} style={{ marginRight: '8px' }} />
                      Click to View Course Details
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Details */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            width: '60%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {!selectedCourse ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#64748b',
              fontSize: '18px',
              fontWeight: 500,
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '8px'
              }}>
                👆
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Select a Course</div>
                <div style={{ fontSize: '16px', opacity: 0.8 }}>Choose a course from the list to view details</div>
              </div>
            </div>
          ) : courseLoading ? (
            <div style={{ padding: '40px' }}>
              <Loader />
            </div>
          ) : !courseDetails ? (
            <div style={{ 
              color: '#ef4444', 
              fontWeight: 600, 
              fontSize: '18px', 
              padding: '40px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                Failed to load course details
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px', height: '100%', overflow: 'auto' }}>
              {/* Course Header */}
              <div style={{ 
                marginBottom: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(59,130,246,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative elements */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  borderRadius: '50%',
                  opacity: 0.1
                }}></div>
                
                <h3 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '28px',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2
                }}>
                  {courseDetails.title}
                </h3>
                <div style={{ 
                  color: '#64748b', 
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: 1.5
                }}>
                  {courseDetails.description || 'No description provided'}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 20,
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 10,
                alignItems: 'center'
              }}>
                <div style={{ fontWeight: 600, color: '#334155' }}>Course Modules</div>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    // Open module creation modal
                    setShowModuleModal(true);
                  }}
                >
                  <FaPlus size={12} />
                  Add Module
                </button>
              </div>

              {courseDetails.modules.length === 0 ? (
                <div style={{ 
                  padding: 30, 
                  background: '#f8fafc', 
                  borderRadius: 10,
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>No modules yet</div>
                  <div>Add your first module to this course</div>
                </div>
              ) : (
                <div>
                  {courseDetails.modules.map((module, index) => (
                    <div 
                      key={module.id}
                      style={{
                        marginBottom: 16,
                        background: '#f8fafc',
                        borderRadius: 10,
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{
                        padding: '14px 18px',
                        background: '#f1f5f9',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#334155', fontSize: 16 }}>
                            {module.title}
                          </div>
                          {module.description && (
                            <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
                              {module.description}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#4ade80',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 10px',
                              fontWeight: 600,
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              // Open content creation modal
                              setSelectedModule(module);
                              setShowContentModal(true);
                            }}
                          >
                            <FaPlus size={10} />
                            Add Content
                          </button>
                          <button
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#e2e8f0',
                              color: '#475569',
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 10px',
                              fontWeight: 600,
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              // Handle edit module
                              alert(`Edit module: ${module.title}`);
                            }}
                          >
                            <FaEdit size={10} />
                            Edit
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ padding: 16 }}>
                        {module.contents.length === 0 ? (
                          <div style={{ color: '#94a3b8', padding: 12, textAlign: 'center', fontSize: 14 }}>
                            No content yet. Add videos, documents, or quizzes.
                          </div>
                        ) : (
                          <div>
                            {module.contents.map((content, idx) => (
                              <div
                                key={content.id}
                                style={{
                                  padding: 12,
                                  marginBottom: 10,
                                  background: '#fff',
                                  borderRadius: 8,
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12
                                }}
                              >
                                {content.content_type === 'video' && (
                                  <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: '#fee2e2', borderRadius: 8 }}>
                                    <FaVideo />
                                  </div>
                                )}
                                {content.content_type === 'pdf' && (
                                  <div style={{ color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: '#dbeafe', borderRadius: 8 }}>
                                    <FaFilePdf />
                                  </div>
                                )}
                                {content.content_type === 'quiz' && (
                                  <div style={{ color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: '#ede9fe', borderRadius: 8 }}>
                                    <FaQuestionCircle />
                                  </div>
                                )}
                                <div style={{ flexGrow: 1 }}>
                                  <div style={{ fontWeight: 600, color: '#334155' }}>{content.title}</div>
                                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                                    {content.content_type.charAt(0).toUpperCase() + content.content_type.slice(1)}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  {/* View Button */}
                                  <button
                                    style={{
                                      background: '#e0f2fe',
                                      color: '#0891b2',
                                      border: 'none',
                                      borderRadius: 6,
                                      padding: '6px 10px',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                    }}
                                    onClick={() => handleViewContent(content)}
                                    onMouseOver={e => {
                                      e.currentTarget.style.background = '#0891b2';
                                      e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseOut={e => {
                                      e.currentTarget.style.background = '#e0f2fe';
                                      e.currentTarget.style.color = '#0891b2';
                                    }}
                                  >
                                    View
                                  </button>
                                  
                                  {/* Edit Quiz Button - Only for quizzes */}
                                  {content.content_type === 'quiz' && (
                                    <button
                                      style={{
                                        background: '#fef3c7',
                                        color: '#d97706',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '6px 10px',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                      }}
                                      onClick={() => handleEditQuiz(content)}
                                      onMouseOver={e => {
                                        e.currentTarget.style.background = '#d97706';
                                        e.currentTarget.style.color = 'white';
                                      }}
                                      onMouseOut={e => {
                                        e.currentTarget.style.background = '#fef3c7';
                                        e.currentTarget.style.color = '#d97706';
                                      }}
                                    >
                                      <FaEdit style={{ marginRight: '4px' }} />
                                      Edit Quiz
                                    </button>
                                  )}
                                  
                                  {/* Delete Button */}
                                  <button
                                    style={{
                                      background: '#fee2e2',
                                      color: '#dc2626',
                                      border: 'none',
                                      borderRadius: 6,
                                      padding: '6px 10px',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                    }}
                                    onClick={() => handleDeleteContent(content.id)}
                                    onMouseOver={e => {
                                      e.currentTarget.style.background = '#dc2626';
                                      e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseOut={e => {
                                      e.currentTarget.style.background = '#fee2e2';
                                      e.currentTarget.style.color = '#dc2626';
                                    }}
                                  >
                                    <FaTrash style={{ marginRight: '4px' }} />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Creation Modal */}
      {showContentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <form
            onSubmit={handleCreateContent}
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: 36,
              minWidth: 360,
              maxWidth: '90vw',
              width: 460,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              position: 'relative',
              animation: 'slideUp 0.3s ease-out',
              border: '1px solid rgba(226,232,240,0.8)',
            }}
          >
            <h3 style={{ 
              margin: 0, 
              color: '#1e40af', 
              fontWeight: 800, 
              fontSize: 24, 
              position: 'relative',
              paddingBottom: 14,
              marginBottom: 5
            }}>
              Add Content to {selectedModule?.title}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 40,
                height: 4,
                background: 'linear-gradient(90deg, #3b82f6, #1e40af)',
                borderRadius: 2
              }}></div>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Content Title*
              </label>
              <input 
                name="title" 
                value={contentForm.title} 
                onChange={handleContentInputChange} 
                required 
                placeholder="Enter content title"
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Content Type*
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { id: 'video', label: 'Video', icon: FaVideo, color: '#ef4444', bgColor: '#fee2e2' },
                  { id: 'pdf', label: 'PDF Document', icon: FaFilePdf, color: '#2563eb', bgColor: '#dbeafe' },
                  { id: 'quiz', label: 'Quiz', icon: FaQuestionCircle, color: '#7c3aed', bgColor: '#ede9fe' }
                ].map(type => (
                  <label
                    key={type.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      flex: 1,
                      padding: '12px 8px',
                      border: `2px solid ${contentForm.content_type === type.id ? type.color : '#e2e8f0'}`,
                      borderRadius: 10,
                      background: contentForm.content_type === type.id ? type.bgColor : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="radio"
                      name="content_type"
                      value={type.id}
                      checked={contentForm.content_type === type.id}
                      onChange={handleContentInputChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      background: type.bgColor,
                      borderRadius: 10,
                      color: type.color
                    }}>
                      <type.icon size={18} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', textAlign: 'center' }}>{type.label}</div>
                  </label>
                ))}
              </div>
            </div>

            {contentForm.content_type !== 'quiz' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                  {contentForm.content_type === 'video' ? 'Video File*' : 'PDF File*'}
                </label>
                <input
                  type="file"
                  accept={contentForm.content_type === 'video' ? 'video/*' : 'application/pdf'}
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                  required
                />
                <div style={{ fontSize: 13, color: '#64748b', marginTop: -4 }}>
                  {contentForm.content_type === 'video'
                    ? 'Supported formats: MP4, WebM, etc. Max size: 500MB'
                    : 'Supported format: PDF. Max size: 50MB'}
                </div>
              </div>
            )}

            {contentFormError && (
              <div style={{ 
                color: '#ef4444', 
                fontWeight: 600, 
                background: '#fee2e2', 
                padding: '10px 14px', 
                borderRadius: 8,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {contentFormError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowContentModal(false)} 
                style={{ 
                  padding: '10px 18px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  background: 'white', 
                  color: '#475569', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={contentSubmitting} 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: 10, 
                  border: 'none', 
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff', 
                  fontWeight: 700, 
                  cursor: contentSubmitting ? 'not-allowed' : 'pointer', 
                  opacity: contentSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  if (!contentSubmitting) {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {contentSubmitting ? 'Adding...' : contentForm.content_type === 'quiz' ? 'Continue to Quiz' : 'Add Content'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: 36,
              minWidth: 400,
              maxWidth: '90vw',
              width: 500,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              position: 'relative',
              animation: 'slideUp 0.3s ease-out',
              border: '1px solid rgba(226,232,240,0.8)',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <h3 style={{ 
              margin: 0, 
              color: '#1e40af', 
              fontWeight: 800, 
              fontSize: 24, 
              position: 'relative',
              paddingBottom: 14,
              marginBottom: 5
            }}>
              Create Quiz: {contentForm.title}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 40,
                height: 4,
                background: 'linear-gradient(90deg, #3b82f6, #1e40af)',
                borderRadius: 2
              }}></div>
            </h3>

            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
                Add questions to your quiz. You need at least one question to create a quiz.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddQuizQuestion}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: '#ede9fe',
                color: '#7c3aed',
                border: '1px dashed #a78bfa',
                borderRadius: 10,
                padding: '14px 20px',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                width: '100%',
                marginBottom: 20
              }}
            >
              <FaPlus size={14} />
              Add Question
            </button>

            {quizData && JSON.parse(quizData).length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: 10 }}>Questions ({JSON.parse(quizData).length})</div>
                {JSON.parse(quizData).map((question, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: 16,
                      background: '#f8fafc',
                      borderRadius: 10,
                      marginBottom: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      {index + 1}. {question.question_text}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
                      Type: {question.question_type === 'multiple-choice' ? 'Multiple Choice' : 
                            question.question_type === 'single-choice' ? 'Single Choice' : 
                            'True/False'}
                    </div>
                    <div style={{ paddingLeft: 16 }}>
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6,
                            color: option.is_correct ? '#16a34a' : '#64748b',
                            fontWeight: option.is_correct ? 600 : 400
                          }}
                        >
                          {option.is_correct ? (
                            <FaRegCheckCircle color="#16a34a" />
                          ) : (
                            <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #cbd5e1', marginLeft: 1 }}></span>
                          )}
                          {option.option_text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', background: '#f1f5f9', borderRadius: 10 }}>
                No questions added yet. Click "Add Question" to get started.
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowQuizModal(false);
                  setContentForm({ title: '', content_type: 'video', order: null });
                  setQuizData('');
                }} 
                style={{ 
                  padding: '10px 18px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  background: 'white', 
                  color: '#475569', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleQuizSubmit}
                disabled={!quizData || JSON.parse(quizData).length === 0 || contentSubmitting} 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: 10, 
                  border: 'none', 
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff', 
                  fontWeight: 700, 
                  cursor: (!quizData || JSON.parse(quizData).length === 0 || contentSubmitting) ? 'not-allowed' : 'pointer', 
                  opacity: (!quizData || JSON.parse(quizData).length === 0 || contentSubmitting) ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  if (quizData && JSON.parse(quizData).length > 0 && !contentSubmitting) {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {contentSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Question Modal */}
      {showQuizQuestionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <form
            onSubmit={handleCreateQuestion}
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: 36,
              minWidth: 400,
              maxWidth: '90vw',
              width: 500,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              position: 'relative',
              animation: 'slideUp 0.3s ease-out',
              border: '1px solid rgba(226,232,240,0.8)',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <h3 style={{ 
              margin: 0, 
              color: '#1e40af', 
              fontWeight: 800, 
              fontSize: 24, 
              position: 'relative',
              paddingBottom: 14,
              marginBottom: 5
            }}>
              Add Question
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 40,
                height: 4,
                background: 'linear-gradient(90deg, #3b82f6, #1e40af)',
                borderRadius: 2
              }}></div>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Question Text*
              </label>
              <input 
                name="question_text" 
                value={questionForm.question_text} 
                onChange={handleQuestionInputChange} 
                required 
                placeholder="Enter your question"
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Question Type*
              </label>
              <select 
                name="question_type" 
                value={questionForm.question_type} 
                onChange={handleQuestionInputChange} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  cursor: 'pointer'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              >
                <option value="multiple-choice">Multiple Choice (Multiple answers)</option>
                <option value="single-choice">Single Choice (One answer)</option>
                <option value="true-false">True/False</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Answer Options*
              </label>
              
              {questionForm.question_type === 'true-false' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: questionForm.options[0].is_correct ? '#f0fdf4' : '#fff',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      checked={questionForm.options[0].is_correct}
                      onChange={() => {
                        handleOptionChange(0, 'is_correct', true);
                        handleOptionChange(1, 'is_correct', false);
                        handleOptionChange(0, 'option_text', 'True');
                        handleOptionChange(1, 'option_text', 'False');
                      }}
                    />
                    <span>True</span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: questionForm.options[1].is_correct ? '#f0fdf4' : '#fff',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      checked={questionForm.options[1].is_correct}
                      onChange={() => {
                        handleOptionChange(1, 'is_correct', true);
                        handleOptionChange(0, 'is_correct', false);
                        handleOptionChange(0, 'option_text', 'True');
                        handleOptionChange(1, 'option_text', 'False');
                      }}
                    />
                    <span>False</span>
                  </label>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {questionForm.options.map((option, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        background: option.is_correct ? '#f0fdf4' : '#fff'
                      }}
                    >
                      <input 
                        type={questionForm.question_type === 'multiple-choice' ? 'checkbox' : 'radio'} 
                        checked={option.is_correct}
                        onChange={e => {
                          if (questionForm.question_type === 'single-choice') {
                            // For single choice, uncheck all other options
                            questionForm.options.forEach((_, i) => {
                              if (i !== index) {
                                handleOptionChange(i, 'is_correct', false);
                              }
                            });
                          }
                          handleOptionChange(index, 'is_correct', e.target.checked);
                        }}
                      />
                      <input 
                        type="text" 
                        value={option.option_text} 
                        onChange={e => handleOptionChange(index, 'option_text', e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        style={{ 
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          fontSize: 14
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {questionForm.question_type === 'multiple-choice' 
                  ? 'Check all correct answers. Students must select all correct options.'
                  : questionForm.question_type === 'single-choice'
                  ? 'Select the one correct answer. Students must select the correct option.'
                  : 'Select whether "True" or "False" is the correct answer.'}
              </div>
            </div>

            {questionFormError && (
              <div style={{ 
                color: '#ef4444', 
                fontWeight: 600, 
                background: '#fee2e2', 
                padding: '10px 14px', 
                borderRadius: 8,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {questionFormError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowQuizQuestionModal(false);
                  setShowQuizModal(true);
                }} 
                style={{ 
                  padding: '10px 18px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  background: 'white', 
                  color: '#475569', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={questionSubmitting} 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: 10, 
                  border: 'none', 
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff', 
                  fontWeight: 700, 
                  cursor: questionSubmitting ? 'not-allowed' : 'pointer', 
                  opacity: questionSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  if (!questionSubmitting) {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {questionSubmitting ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quiz Manager Modal */}
      {showQuizManager && selectedContent && (
        <QuizManager
          contentId={selectedContent.id}
          onClose={() => {
            setShowQuizManager(false);
            setSelectedContent(null);
          }}
        />
      )}
    </div>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'published': return '#16a34a';
    case 'draft': return '#b45309';
    case 'archived': return '#64748b';
    default: return '#64748b';
  }
}

function getStatusBgColor(status) {
  switch (status) {
    case 'published': return '#dcfce7';
    case 'draft': return '#fef3c7';
    case 'archived': return '#f1f5f9';
    default: return '#f1f5f9';
  }
}

export default CourseList;
