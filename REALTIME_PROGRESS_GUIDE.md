# Real-Time Progress Tracking System

## Overview
The new real-time progress tracking system automatically monitors user interactions with course content and updates progress dynamically, providing instant feedback and detailed analytics.

## Key Features

### 1. **Real-Time Session Management**
- **Learning Sessions**: Each study session is tracked with start/end times
- **Session Analytics**: Time spent, pages viewed, videos watched, quizzes attempted
- **Multi-session Support**: Users can have multiple sessions across different devices

### 2. **Content Interaction Tracking**
- **Video Progress**: Tracks play, pause, seek, completion with precise timestamps
- **Document Viewing**: Monitors reading progress, downloads, time spent
- **Quiz Interactions**: Records answers, attempts, completion times
- **Real-time Updates**: Progress updates every few seconds during content consumption

### 3. **Granular Progress Data**
- **Content Level**: Individual progress for each video, document, quiz
- **Module Level**: Aggregate progress for each course module
- **Course Level**: Overall course completion percentage
- **Time Tracking**: Precise time spent on each piece of content

## Database Models

### CourseProgress (Enhanced)
```python
- time_spent_minutes: Total time on course
- current_module_id: Currently active module
- session_start_time: Current session start
- total_sessions: Number of study sessions
- avg_session_duration: Average session length
- module_progress: Detailed JSON progress data
```

### LearningSession (New)
```python
- session_id: Unique session identifier
- start_time/end_time: Session duration
- pages_viewed: Content pieces accessed
- videos_watched: Video content consumed
- quizzes_attempted: Quiz interactions
- idle_time_minutes: Inactive time tracking
```

### ContentProgress (New)
```python
- completion_percentage: Precise completion %
- time_spent_seconds: Exact time spent
- last_position: Current position (video/document)
- view_count: Number of times accessed
- pause_count/seek_count: Interaction metrics
```

### ContentInteraction (Enhanced)
```python
- interaction_type: view, progress, pause, seek, download
- session_id: Links to learning session
- video_position: Current playback position
- reading_position: Document scroll position
- is_active: Real-time activity status
```

## API Endpoints

### Session Management
- `POST /api/employee/start_session` - Start new learning session
- `POST /api/employee/end_session` - End current session

### Progress Updates
- `POST /api/employee/update_progress` - Real-time progress updates
- `GET /api/employee/realtime_progress/{user_id}/{course_id}` - Get current progress
- `GET /api/employee/content_progress/{user_id}/{content_id}` - Detailed content progress

## How It Works

### 1. **Session Initialization**
```javascript
// Start a learning session
const session = await startSession(userId, courseId, moduleId);
```

### 2. **Real-Time Updates**
```javascript
// Update progress as user interacts with content
await updateProgress(contentId, 'progress', {
    completion_percentage: 75.5,
    position: 45.2,  // seconds in video
    duration_seconds: 30
});
```

### 3. **Automatic Progress Calculation**
- Course progress is calculated automatically from content progress
- Modules are marked complete when all content is >= 90% complete
- Certificates are auto-generated at 100% course completion

## Benefits

### For Students
- **Visual Feedback**: Real-time progress bars and completion indicators
- **Resume Capability**: Pick up exactly where they left off
- **Achievement Tracking**: See detailed time and effort statistics

### For Instructors/Admins
- **Detailed Analytics**: See exactly how students engage with content
- **Intervention Alerts**: Identify struggling students early
- **Content Optimization**: Understand which content is most/least engaging

### For Organizations
- **Compliance Tracking**: Precise completion records for audits
- **ROI Measurement**: Detailed time investment analytics
- **Risk Assessment**: Early warning for at-risk learners

## Real-Time Features

### 1. **Live Progress Updates**
- Progress bars update as users consume content
- No manual "mark as complete" required
- Automatic save/resume functionality

### 2. **Activity Monitoring**
- Tracks when users are actively engaged
- Measures idle time and distractions
- Identifies optimal learning patterns

### 3. **Predictive Analytics**
- Risk scoring for completion likelihood
- Personalized recommendations
- Adaptive learning paths

## Demo Usage

1. **Open Demo Page**: `realtime_progress_demo.html`
2. **Start Session**: Click "Start Learning Session"
3. **Simulate Content**: Use video/document simulation buttons
4. **Watch Progress**: See real-time updates in progress bars
5. **View Analytics**: Check activity log for detailed tracking

## Integration with Frontend

The frontend can integrate this system by:

1. **Starting sessions** when users begin studying
2. **Sending progress updates** at regular intervals (every 10-30 seconds)
3. **Tracking video events** (play, pause, seek, complete)
4. **Monitoring reading progress** for documents
5. **Auto-saving quiz progress** as users answer questions

This creates a seamless, automatic progress tracking experience that provides valuable insights while requiring minimal user interaction.
