import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken, parseJwt } from '../utils/auth';
import { FaArrowLeft, FaBook, FaVideo, FaFilePdf, FaQuestionCircle, FaCheckCircle, FaEdit, FaPlusCircle, FaTrash } from 'react-icons/fa';
import ReactPlayer from 'react-player';
import { EnhancedVideoPlayer, EnhancedPdfViewer, MediaDebugger } from '../components/MediaHelpers';
import EnhancedVideoTracker from '../components/EnhancedVideoTracker';
import EnhancedPDFViewer from '../components/EnhancedPDFViewer';
import EnhancedProgressDisplay from '../components/EnhancedProgressDisplay';
import QuizTaker from '../components/QuizTaker';
import '../components/Quiz.css';

function CourseViewer() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentDetails, setContentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileStatus, setFileStatus] = useState(null);
  const [convertingVideo, setConvertingVideo] = useState(false);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [moduleProgress, setModuleProgress] = useState({});
  const [progressUpdateLoading, setProgressUpdateLoading] = useState(false);
  const [progressUpdateError, setProgressUpdateError] = useState(null);
  
  const [showQuizTaker, setShowQuizTaker] = useState(false);
  
  // Quiz states for taking quizzes
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  
  // Quiz management states
  const [showQuizManager, setShowQuizManager] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'single-choice',
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });
  
  // Progress refresh trigger
  const [progressRefreshTrigger, setProgressRefreshTrigger] = useState(0);

  // Handle automatic content completion
  const handleAutoComplete = (completionData) => {
    console.log('Content auto-completed:', completionData);
    
    // Refresh module progress to reflect the automatic completion
    if (selectedModule) {
      fetchModuleProgress(selectedModule.id);
      setProgressRefreshTrigger(prev => prev + 1);
    }
    
    // Show general success message
    showAutoCompletionMessage(completionData);
  };

  const showAutoCompletionMessage = (data) => {
    const typeMessages = {
      video: '🎥 Video completed automatically!',
      pdf: '📄 PDF completed automatically!',
      quiz: '🎯 Quiz completed automatically!'
    };
    
    console.log(`${typeMessages[data.type]} Progress updated for content ID: ${data.contentId}`);
  };

  // Fetch module progress for automatic tracking refresh
  const fetchModuleProgress = async (moduleId) => {
    if (!userInfo?.username || !moduleId) return;
    
    try {
      const response = await fetch(`/api/employee/module_progress?username=${userInfo.username}&module_id=${moduleId}`);
      const data = await response.json();
      
      if (data.success) {
        setModuleProgress(prev => ({
          ...prev,
          [moduleId]: {
            completed: data.progress.completed,
            progress_percentage: data.progress.progress_percentage
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching module progress:', error);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = parseJwt(token);
      setUserInfo(payload);
    }
  }, []);

  useEffect(() => {
    fetchCourse();
  }, [courseId, userInfo]);
  
  // Load quiz questions when in admin mode
  useEffect(() => {
    if (showQuizManager && selectedContent && userInfo?.role === 'superadmin') {
      loadQuizQuestions();
    }
  }, [showQuizManager, selectedContent]);
  
  // Quiz management functions
  const loadQuizQuestions = async () => {
    if (!selectedContent) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/contents/${selectedContent.id}/questions`);
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.quiz.questions || []);
      } else {
        console.error('Failed to load questions:', data.message);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, { option_text: '', is_correct: false }]
    }));
  };

  const removeOption = (index) => {
    if (newQuestion.options.length > 2) {
      setNewQuestion(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index, field, value) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    if (newQuestion.question_type === 'single-choice') {
      // For single choice, only one option can be correct
      setNewQuestion(prev => ({
        ...prev,
        options: prev.options.map((option, i) => ({
          ...option,
          is_correct: i === index
        }))
      }));
    } else {
      // For multiple choice, toggle the option
      updateOption(index, 'is_correct', !newQuestion.options[index].is_correct);
    }
  };

  const validateQuestion = () => {
    if (!newQuestion.question_text.trim()) {
      alert('Question text is required');
      return false;
    }

    const validOptions = newQuestion.options.filter(opt => opt.option_text.trim());
    if (validOptions.length < 2) {
      alert('At least 2 options are required');
      return false;
    }

    const correctOptions = validOptions.filter(opt => opt.is_correct);
    if (correctOptions.length === 0) {
      alert('At least one option must be marked as correct');
      return false;
    }

    if (newQuestion.question_type === 'single-choice' && correctOptions.length > 1) {
      alert('Single-choice questions can have only one correct answer');
      return false;
    }

    return true;
  };

  const saveQuestion = async () => {
    if (!validateQuestion() || !selectedContent) return;

    try {
      setLoading(true);
      const validOptions = newQuestion.options.filter(opt => opt.option_text.trim());
      
      const response = await fetch(`http://localhost:5000/api/contents/${selectedContent.id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newQuestion,
          options: validOptions
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Question added successfully!');
        setNewQuestion({
          question_text: '',
          question_type: 'single-choice',
          options: [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false }
          ]
        });
        loadQuizQuestions(); // Reload questions
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch the course data
  const fetchCourse = async () => {
    if (!userInfo?.username) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/my_courses?username=${userInfo.username}`);
      const data = await response.json();
      
      if (data.success) {
        const foundCourse = data.courses.find(c => c.id === parseInt(courseId));
        if (foundCourse) {
          setCourse(foundCourse);
          
          // Initialize progress tracking
          const progress = {};
          if (foundCourse.modules) {
            foundCourse.modules.forEach(module => {
              progress[module.id] = {
                completed: module.completed || false
              };
            });
          }
          setModuleProgress(progress);
          
          // Set the first module and content as selected by default
          if (foundCourse.modules.length > 0) {
            setSelectedModule(foundCourse.modules[0]);
            if (foundCourse.modules[0].contents.length > 0) {
              setSelectedContent(foundCourse.modules[0].contents[0]);
            }
          }
        } else {
          setError('Course not found or you do not have access');
        }
      } else {
        setError(data.error || 'Failed to fetch course');
      }
    } catch (err) {
      setError('Network error while fetching course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch the latest content details from the API when selectedContent or userInfo changes
    const fetchContentDetails = async () => {
      if (!selectedContent || !userInfo?.username) return;
      setLoading(true);
      setError(null);
      try {
        let data;
        if (selectedContent.content_type === 'quiz') {
          // Check if id is defined before fetching
          if (!selectedContent.id) {
            setError('Quiz content ID is missing');
            setLoading(false);
            return;
          }
          
          // Use the dedicated quiz API endpoint
          const response = await fetch(`/api/employee/quiz/${selectedContent.id}?username=${userInfo.username}`);
          data = await response.json();
          if (data.success) {
            setContentDetails({
              ...data.quiz,
              content_type: 'quiz',
            });
            setQuizAnswers({});
            setQuizSubmitted(false);
            setQuizResults(null);
          } else {
            setError(`Failed to load quiz: ${data.error}`);
          }
        } else {
          // Check if id is defined before fetching
          if (!selectedContent.id) {
            setError('Content ID is missing');
            setLoading(false);
            return;
          }
          
          // Use the normal content API for other types
          const response = await fetch(`/api/employee/content/${selectedContent.id}?username=${userInfo.username}`);
          data = await response.json();
          if (data.success) {
            setContentDetails(data.content);
            if ((data.content.content_type === 'video' || data.content.content_type === 'pdf') && data.content.file_path) {
              checkFileExists(data.content.file_path);
            }
          } else {
            setError(`Failed to load content: ${data.error}`);
          }
        }
      } catch (err) {
        console.error('Error fetching content details:', err);
        console.error('Selected content that caused error:', JSON.stringify(selectedContent));
        setError(`Could not fetch content: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchContentDetails();
  }, [selectedContent, userInfo]);
  
  const checkFileExists = async (filePath) => {
    try {
      console.log('Checking file existence for:', filePath);
      const response = await fetch(`/api/check_file_exists?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      console.log('File check result:', data);
      setFileStatus(data);
      
      if (!data.exists) {
        console.warn(`Warning: File ${filePath} does not exist on the server!`);
      } else {
        // If file exists, try to validate it directly
        try {
          const headResponse = await fetch(filePath, { method: 'HEAD' });
          console.log('Direct file HEAD check:', {
            status: headResponse.status,
            ok: headResponse.ok,
            contentType: headResponse.headers.get('content-type'),
            contentLength: headResponse.headers.get('content-length')
          });
        } catch (headErr) {
          console.error('Error checking file headers directly:', headErr);
        }
      }
    } catch (err) {
      console.error('Error checking file existence:', err);
    }
  };
  
  const convertVideoToWebFormat = async () => {
    if (!contentDetails || !contentDetails.id) return;
    
    try {
      setConvertingVideo(true);
      const response = await fetch('/api/convert_video_to_web_compatible', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: contentDetails.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh the content to show the updated video
        const refreshResponse = await fetch(`/api/employee/content/${contentDetails.id}?username=${userInfo.username}`);
        const refreshData = await refreshResponse.json();
        
        if (refreshData.success) {
          setContentDetails(refreshData.content);
          checkFileExists(refreshData.content.file_path);
        }
      } else {
        console.error('Error converting video:', data.error);
      }
    } catch (err) {
      console.error('Error in convert video request:', err);
    } finally {
      setConvertingVideo(false);
    }
  };

  const selectModule = (module) => {
    setSelectedModule(module);
    if (module.contents.length > 0) {
      setSelectedContent(module.contents[0]);
    } else {
      setSelectedContent(null);
      setContentDetails(null);
    }
  };

  const selectContent = (content) => {
    // Always force a re-fetch by clearing contentDetails first
    setContentDetails(null);
    setSelectedContent(null);
    setTimeout(() => {
      setSelectedContent(content);
    }, 0);
    // Reset quiz state when switching content
    setShowQuizTaker(false);
  };

  const goBack = () => {
    navigate('/employee/dashboard');
  };
  
  // Function to mark a module as completed or not completed
  const markModuleAsCompleted = async (moduleId, completed = true) => {
    if (!userInfo?.username || !courseId) return;
    
    try {
      setProgressUpdateLoading(true);
      setProgressUpdateError(null);
      
      const response = await fetch('/api/employee/update_progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userInfo.username,
          course_id: parseInt(courseId),
          module_id: moduleId,
          completed: completed
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setModuleProgress(prev => ({
          ...prev,
          [moduleId]: {
            ...prev[moduleId],
            completed: completed
          }
        }));
        
        // Update the course progress
        setCourse(prev => {
          if (!prev) return null;
          
          // Find the module and update its completion status
          const updatedModules = prev.modules.map(m => 
            m.id === moduleId ? { ...m, completed } : m
          );
          
          return {
            ...prev,
            modules: updatedModules,
            progress: data.progress.progress_percentage,
            completed_modules: data.progress.completed_modules
          };
        });
        
        // Show success message
        const messageEl = document.getElementById('progressMessage');
        if (messageEl) {
          messageEl.textContent = `Module ${completed ? 'marked as completed' : 'marked as not completed'}`;
          messageEl.style.opacity = 1;
          setTimeout(() => {
            messageEl.style.opacity = 0;
          }, 3000);
        }
      } else {
        setProgressUpdateError(data.error || 'Failed to update progress');
      }
    } catch (err) {
      setProgressUpdateError('Network error while updating progress');
    } finally {
      setProgressUpdateLoading(false);
    }
  };

  const renderContentTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <FaVideo />;
      case 'pdf':
        return <FaFilePdf />;
      case 'quiz':
        return <FaQuestionCircle />;
      default:
        return <FaBook />;
    }
  };

  const renderContent = () => {
    if (!contentDetails) return <div>Select content to view</div>;

    switch (contentDetails.content_type) {
      case 'video':
        console.log('Rendering video with path:', contentDetails.file_path);
        return (
          <div className="content-viewer video-viewer">
            <h2 style={{ 
              marginBottom: '16px',
              fontSize: '1.8rem',
              fontWeight: '600'
            }}>{contentDetails.title}</h2>
            <div className="video-container" style={{ 
              maxWidth: '100%', 
              margin: '0 auto',
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              {fileStatus && !fileStatus.exists ? (
                <div style={{
                  padding: '20px',
                  background: '#fff3cd',
                  border: '1px solid #ffeeba',
                  borderRadius: '8px',
                  color: '#856404',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>⚠️ Video File Not Found</h3>
                  <p>The video file could not be found on the server. Please contact your administrator.</p>
                  <p><strong>File path:</strong> {contentDetails.file_path}</p>
                  
                  {fileStatus.available_files && fileStatus.available_files.length > 0 && (
                    <div>
                      <p><strong>Available files:</strong></p>
                      <ul style={{ maxHeight: '150px', overflowY: 'auto', background: '#fff', padding: '10px', borderRadius: '4px' }}>
                        {fileStatus.available_files.map((file, index) => (
                          <li key={index} style={{ marginBottom: '5px', fontFamily: 'monospace', fontSize: '12px' }}>{file}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <button 
                    onClick={convertVideoToWebFormat}
                    disabled={convertingVideo}
                    style={{
                      padding: '8px 16px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: convertingVideo ? 'not-allowed' : 'pointer',
                      opacity: convertingVideo ? 0.7 : 1,
                      marginTop: '10px'
                    }}
                  >
                    {convertingVideo ? 'Converting...' : 'Convert to Web Format'}
                  </button>
                </div>
              ) : fileStatus && fileStatus.exists && fileStatus.is_valid_video === false ? (
                <div style={{
                  padding: '20px',
                  background: '#fff3cd',
                  border: '1px solid #ffeeba',
                  borderRadius: '8px',
                  color: '#856404',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>⚠️ Invalid Video Format</h3>
                  <p>This video file may not be in a web-compatible format. Convert it to play in your browser.</p>
                  <p><strong>File type:</strong> {fileStatus.mime_type || 'Unknown'}</p>
                  <p><strong>File path:</strong> {contentDetails.file_path}</p>
                  
                  <button 
                    onClick={convertVideoToWebFormat}
                    disabled={convertingVideo}
                    style={{
                      padding: '8px 16px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: convertingVideo ? 'not-allowed' : 'pointer',
                      opacity: convertingVideo ? 0.7 : 1,
                      marginTop: '10px'
                    }}
                  >
                    {convertingVideo ? 'Converting...' : 'Convert to Web Format'}
                  </button>
                  
                  {fileStatus.available_files && fileStatus.available_files.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <p><strong>Available files:</strong></p>
                      <ul style={{ maxHeight: '150px', overflowY: 'auto', background: '#fff', padding: '10px', borderRadius: '4px' }}>
                        {fileStatus.available_files.map((file, index) => (
                          <li key={index} style={{ marginBottom: '5px', fontFamily: 'monospace', fontSize: '12px' }}>{file}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="responsive-video-container" style={{ 
                  maxWidth: '100%', 
                  margin: '0 auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <EnhancedVideoTracker
                    url={`http://localhost:5000/${contentDetails.file_path}`}
                    contentId={contentDetails.id}
                    username={userInfo?.username}
                    onAutoComplete={handleAutoComplete}
                    width="100%"
                    height="400px"
                  />
                </div>
              )}
              <div style={{ 
                marginTop: '16px', 
                color: '#666', 
                fontSize: '14px',
                background: '#f1f3f5',
                padding: '12px',
                borderRadius: '8px'
              }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>Video path:</strong> {contentDetails.file_path}</p>
                {fileStatus && (
                  <div style={{ 
                    background: '#fff', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    marginTop: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <p style={{ margin: '0 0 5px 0' }}><strong>File status:</strong> {fileStatus.exists ? '✅ File exists' : '❌ File missing'}</p>
                    {fileStatus.exists && (
                      <>
                        <p style={{ margin: '0 0 5px 0' }}><strong>File size:</strong> {Math.round(fileStatus.file_size / 1024)} KB</p>
                        {fileStatus.mime_type && (
                          <p style={{ margin: '0 0 5px 0' }}><strong>File type:</strong> {fileStatus.mime_type}</p>
                        )}
                        {fileStatus.is_valid_video !== undefined && (
                          <p style={{ margin: '0 0 5px 0' }}>
                            <strong>Valid video format:</strong> 
                            {fileStatus.is_valid_video ? 
                              <span style={{ color: 'green' }}>✅ Yes ({fileStatus.video_type})</span> : 
                              <span style={{ color: 'red' }}>❌ No (not a recognized video format)</span>}
                          </p>
                        )}
                      </>
                    )}
                    {fileStatus.alternative_paths && fileStatus.alternative_paths.length > 0 && (
                      <div>
                        <p style={{ margin: '5px 0' }}><strong>Alternative paths checked:</strong></p>
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                          {fileStatus.alternative_paths.map((path, index) => (
                            <li key={index} style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                              {path.path} - {path.exists ? '✅ Exists' : '❌ Missing'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'pdf':
        console.log('Rendering PDF with path:', contentDetails.file_path);
        return (
          <div className="content-viewer pdf-viewer">
            <h2 style={{ 
              marginBottom: '16px',
              fontSize: '1.8rem',
              fontWeight: '600'
            }}>{contentDetails.title}</h2>
            <div className="pdf-container" style={{ 
              maxWidth: '100%', 
              margin: '0 auto',
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              {fileStatus && !fileStatus.exists ? (
                <div style={{
                  padding: '20px',
                  background: '#fff3cd',
                  border: '1px solid #ffeeba',
                  borderRadius: '8px',
                  color: '#856404'
                }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>⚠️ PDF File Not Found</h3>
                  <p>The PDF file could not be found on the server. Please contact your administrator.</p>
                  <p><strong>File path:</strong> {contentDetails.file_path}</p>
                  
                  {fileStatus.available_files && fileStatus.available_files.length > 0 && (
                    <div>
                      <p><strong>Available files:</strong></p>
                      <ul style={{ maxHeight: '150px', overflowY: 'auto', background: '#fff', padding: '10px', borderRadius: '4px' }}>
                        {fileStatus.available_files.map((file, index) => (
                          <li key={index} style={{ marginBottom: '5px', fontFamily: 'monospace', fontSize: '12px' }}>{file}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="responsive-pdf-container" style={{ 
                  maxWidth: '100%', 
                  margin: '0 auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <EnhancedPDFViewer
                    url={`http://localhost:5000/${contentDetails.file_path}`}
                    contentId={contentDetails.id}
                    username={userInfo?.username}
                    onAutoComplete={handleAutoComplete}
                    width="100%"
                    height="600px"
                  />
                </div>
              )}
            </div>
            <div style={{ 
              marginTop: '16px', 
              color: '#666', 
              fontSize: '14px',
              background: '#f1f3f5',
              padding: '12px',
              borderRadius: '8px'
            }}>
              <p style={{ margin: '0 0 8px 0' }}><strong>PDF path:</strong> {contentDetails.file_path}</p>
              {fileStatus && (
                <div style={{ 
                  background: '#fff', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginTop: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <p style={{ margin: '0 0 5px 0' }}><strong>File status:</strong> {fileStatus.exists ? '✅ File exists' : '❌ File missing'}</p>
                  {fileStatus.exists && (
                    <p style={{ margin: '0' }}><strong>File size:</strong> {Math.round(fileStatus.file_size / 1024)} KB</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'quiz':
        return (
          <div className="content-viewer quiz-viewer">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e9ecef'
            }}>
              <div>
                <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                  {contentDetails.title}
                </h2>
                <p style={{ margin: 0, color: '#6c757d' }}>
                  {contentDetails.questions ? `${contentDetails.questions.length} questions` : 'Quiz available'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {userInfo?.role === 'superadmin' && (
                  <button 
                    onClick={() => setShowQuizManager(true)}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #38b2ac 0%, #3182ce 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 24px rgba(56, 178, 172, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <FaEdit />
                    Manage Quiz
                  </button>
                )}
                <button 
                  onClick={() => setShowQuizTaker(true)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <FaQuestionCircle />
                  Start Quiz
                </button>
              </div>
            </div>
            
            <div style={{
              padding: '20px',
              background: '#e3f2fd',
              borderRadius: '8px',
              border: '1px solid #bbdefb',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1976d2' }}>
                📝 Ready to test your knowledge? Click "Start Quiz" to begin.
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Make sure you have enough time to complete the quiz before starting.
              </p>
            </div>
          </div>
        );
      
      default:
        return <div>Unsupported content type: {contentDetails.content_type}</div>;
    }
  };

  if (loading && !course) {
    return <div className="loading">Loading course details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="course-viewer-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Progress update status message */}
      <div 
        id="progressMessage" 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          background: '#10b981',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          opacity: 0,
          transition: 'opacity 0.3s ease-in-out',
          zIndex: 1000
        }}
      ></div>
      
      {progressUpdateError && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 16px',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {progressUpdateError}
        </div>
      )}
      
      <div className="course-header" style={{
        padding: '15px 20px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button 
          className="back-button" 
          onClick={goBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#f1f3f5',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#333'
        }}>{course?.title}</h1>
        <div style={{ width: '100px' }}></div> {/* Empty div for flex spacing */}
      </div>
      
      <div className="course-content" style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        padding: '20px'
      }}>
        <div className="modules-sidebar" style={{
          width: '300px',
          minWidth: '300px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          overflow: 'auto',
          marginRight: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            padding: '15px 20px',
            margin: 0,
            borderBottom: '1px solid #e9ecef',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>Modules</h2>
          <ul className="module-list" style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            flex: 1,
            overflowY: 'auto'
          }}>
            {course?.modules.map((module, index) => (
              <li 
                key={module.id} 
                className={`module-item ${selectedModule?.id === module.id ? 'active' : ''}`}
                onClick={() => selectModule(module)}
                style={{
                  borderBottom: '1px solid #e9ecef',
                  cursor: 'pointer',
                  backgroundColor: selectedModule?.id === module.id ? '#f1f8ff' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
              >
                <div className="module-title" style={{
                  padding: '12px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: selectedModule?.id === module.id ? '600' : 'normal',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="module-index" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: selectedModule?.id === module.id ? '#007bff' : '#e9ecef',
                      color: selectedModule?.id === module.id ? '#fff' : '#666',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginRight: '5px'
                    }}>{index + 1}</span>
                    {module.title}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markModuleAsCompleted(module.id, !moduleProgress[module.id]?.completed);
                    }}
                    title={moduleProgress[module.id]?.completed ? "Mark as incomplete" : "Mark as completed"}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: moduleProgress[module.id]?.completed ? '#10b981' : '#e9ecef',
                      color: moduleProgress[module.id]?.completed ? 'white' : '#666',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      padding: 0
                    }}
                  >
                    {moduleProgress[module.id]?.completed ? 
                      <FaCheckCircle size={12} /> : 
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                    }
                  </button>
                </div>
                
                {selectedModule?.id === module.id && (
                  <ul className="content-list" style={{
                    listStyle: 'none',
                    padding: '5px 0',
                    margin: 0,
                    backgroundColor: '#f8f9fb'
                  }}>
                    {module.contents.map((content) => (
                      <li 
                        key={content.id} 
                        className={`content-item ${selectedContent?.id === content.id ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectContent(content);
                        }}
                        style={{
                          padding: '10px 15px 10px 42px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          backgroundColor: selectedContent?.id === content.id ? '#e6f2ff' : 'transparent',
                          borderLeft: selectedContent?.id === content.id ? '3px solid #007bff' : '3px solid transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span className="content-type-icon" style={{
                          color: content.content_type === 'video' ? '#ff5722' : 
                                 content.content_type === 'pdf' ? '#2196f3' : 
                                 content.content_type === 'quiz' ? '#4caf50' : '#607d8b',
                          fontSize: '16px',
                          marginRight: '8px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {renderContentTypeIcon(content.content_type)}
                        </span>
                        <span className="content-title" style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{content.title}</span>
                        {content.completed && (
                          <span className="completed-icon" style={{
                            marginLeft: 'auto',
                            color: '#28a745'
                          }}>
                            <FaCheckCircle />
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="content-area" style={{
          flex: '1',
          padding: '20px',
          overflowY: 'auto',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          margin: '0 10px'
        }}>
          {loading && selectedContent ? (
            <div className="loading" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              fontSize: '18px',
              color: '#666'
            }}>
              <div>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <div className="spinner" style={{
                    width: '40px',
                    height: '40px',
                    margin: '0 auto',
                    border: '4px solid rgba(0, 123, 255, 0.2)',
                    borderTop: '4px solid #007bff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </div>
                Loading content...
              </div>
            </div>
          ) : selectedContent ? (
            <div>
              {renderContent()}
              
              {/* Enhanced Progress Display */}
              {selectedModule && userInfo?.username && (
                <EnhancedProgressDisplay
                  moduleId={selectedModule.id}
                  username={userInfo.username}
                  refreshTrigger={progressRefreshTrigger}
                  showDetailed={true}
                />
              )}
            </div>
          ) : (
            <div className="select-content-message" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '40px',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#e9ecef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                fontSize: '32px',
                color: '#adb5bd'
              }}>
                <FaBook />
              </div>
              <h2 style={{ margin: '0 0 10px 0', color: '#495057' }}>Select a module content to view</h2>
              <p style={{ margin: 0, fontSize: '16px' }}>Click on a module and then select a content item to view it here.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quiz Taker Overlay */}
      {showQuizTaker && selectedContent && (
        <QuizTaker 
          quizIds={selectedModule?.contents
            ?.filter(content => content.content_type === 'quiz')
            .map(content => content.id) || [selectedContent.id]}
          currentQuizId={selectedContent.id} // Pass the current quiz ID to start with
          onClose={() => setShowQuizTaker(false)}
          username={userInfo?.username}
        />
      )}
      
      {/* Quiz Manager Overlay (for admins) */}
      {showQuizManager && selectedContent && userInfo?.role === 'superadmin' && (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fef3c7 100%)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '48px 0',
          zIndex: 1000,
          position: 'fixed',
          top: 0,
          left: 0
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
            width: '95%',
            maxWidth: 900,
            padding: 0,
            overflow: 'hidden',
            border: '1px solid #e0e7ff',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 600
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              padding: '32px 40px 24px 40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e0e7ff',
              position: 'relative'
            }}>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: 28, letterSpacing: -0.5 }}>
                📝 Quiz Management: {contentDetails.title}
              </h2>
              <button
                onClick={() => setShowQuizManager(false)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f87171, #ef4444)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                }}
                onMouseOver={e => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.boxShadow = '0 6px 16px rgba(239,68,68,0.4)';
                }}
                onMouseOut={e => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 0,
              width: '100%',
              flex: 1,
              background: '#f8fafc'
            }}>
              {/* Existing Questions */}
              <div style={{
                flex: 1.2,
                padding: '32px 32px 32px 40px',
                borderRight: '1px solid #e0e7ff',
                minWidth: 0
              }}>
                <h3 style={{ fontWeight: 800, fontSize: 20, color: '#6366f1', marginBottom: 24 }}>
                  Existing Questions ({questions.length})
                </h3>
                {loading && <div className="loading">Loading questions...</div>}
                {questions.length === 0 && !loading && (
                  <p style={{ color: '#64748b', fontStyle: 'italic', marginTop: 16 }}>No questions added yet.</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {questions.map((question, index) => (
                    <div key={question.id} style={{
                      background: '#fff',
                      border: '1px solid #e0e7ff',
                      borderRadius: 16,
                      boxShadow: '0 2px 8px rgba(99,102,241,0.06)',
                      padding: '20px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                        <span style={{
                          background: '#6366f1',
                          color: '#fff',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 15,
                          padding: '2px 12px',
                          marginRight: 8
                        }}>Q{index + 1}</span>
                        <span style={{
                          background: '#e0e7ff',
                          color: '#6366f1',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 13,
                          padding: '2px 10px',
                          textTransform: 'capitalize'
                        }}>{question.question_type.replace('-', ' ')}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 17, color: '#1e293b', marginBottom: 6 }}>
                        {question.question_text}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {question.options.map((option, optIndex) => (
                          <div key={option.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: option.is_correct ? '#dbeafe' : 'transparent',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontWeight: option.is_correct ? 700 : 500,
                            color: option.is_correct ? '#2563eb' : '#374151',
                            fontSize: 15
                          }}>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{String.fromCharCode(65 + optIndex)}.</span>
                            <span style={{ flex: 1 }}>{option.option_text}</span>
                            {option.is_correct && <span style={{ color: '#22c55e', fontWeight: 900, fontSize: 18 }}>✓</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Add New Question */}
              <div style={{
                flex: 1,
                padding: '32px 40px',
                background: '#f3f4f6',
                minWidth: 0
              }}>
                <h3 style={{ fontWeight: 800, fontSize: 20, color: '#6366f1', marginBottom: 24 }}>Add New Question</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>Question Type:</label>
                      <select
                        value={newQuestion.question_type}
                        onChange={e => setNewQuestion(prev => ({ ...prev, question_type: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #c7d2fe',
                          fontSize: 15,
                          marginBottom: 0
                        }}
                      >
                        <option value="single-choice">Single Choice</option>
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>Question Text:</label>
                    <textarea
                      value={newQuestion.question_text}
                      onChange={e => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                      placeholder="Enter your question here..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #c7d2fe',
                        fontSize: 15,
                        minHeight: 60,
                        resize: 'vertical'
                      }}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>Options:</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {newQuestion.options.map((option, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="text"
                            value={option.option_text}
                            onChange={e => updateOption(index, 'option_text', e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              borderRadius: 8,
                              border: '1px solid #c7d2fe',
                              fontSize: 15
                            }}
                          />
                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500, color: '#6366f1' }}>
                            <input
                              type={newQuestion.question_type === 'single-choice' ? 'radio' : 'checkbox'}
                              name="correct-answer"
                              checked={option.is_correct}
                              onChange={() => handleCorrectAnswerChange(index)}
                            />
                            <span>Correct</span>
                          </label>
                          {newQuestion.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              style={{
                                background: '#f87171',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 18,
                                width: 32,
                                height: 32,
                                cursor: 'pointer',
                                fontWeight: 700,
                                marginLeft: 4,
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={e => e.target.style.background = '#ef4444'}
                              onMouseOut={e => e.target.style.background = '#f87171'}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addOption}
                        style={{
                          marginTop: 6,
                          background: 'linear-gradient(135deg, #10b981, #22d3ee)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 15,
                          padding: '8px 18px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(16,185,129,0.08)',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.target.style.background = 'linear-gradient(135deg, #059669, #0ea5e9)'}
                        onMouseOut={e => e.target.style.background = 'linear-gradient(135deg, #10b981, #22d3ee)'}
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 18 }}>
                    <button
                      onClick={saveQuestion}
                      disabled={loading}
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 16,
                        padding: '12px 28px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
                        opacity: loading ? 0.7 : 1,
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={e => e.target.style.background = 'linear-gradient(135deg, #4338ca, #7c3aed)'}
                      onMouseOut={e => e.target.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)'}
                    >
                      {loading ? 'Saving...' : 'Save Question'}
                    </button>
                    <button
                      onClick={() => setShowQuizManager(false)}
                      style={{
                        background: '#e0e7ff',
                        color: '#6366f1',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 16,
                        padding: '12px 28px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.04)',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={e => e.target.style.background = '#c7d2fe'}
                      onMouseOut={e => e.target.style.background = '#e0e7ff'}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseViewer;
