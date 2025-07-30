import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState({
        overview: null,
        users: null,
        courses: null,
        organizations: null,
        learning: null,
        system: null,
        financial: null,
        compliance: null
    });
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshInterval, setRefreshInterval] = useState(null);

    const fetchAnalytics = async (type = 'overview') => {
        try {
            const response = await fetch(`/api/analytics/${type}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${type} analytics`);
            }
            
            const data = await response.json();
            if (data.success) {
                setAnalytics(prev => ({
                    ...prev,
                    [type]: data[`${type}_analytics`] || data.overview
                }));
            }
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await fetchAnalytics('overview');
            setLoading(false);
        };
        loadInitialData();

        // Set up auto-refresh for real-time updates
        const interval = setInterval(() => {
            fetchAnalytics(activeTab);
        }, 30000); // Refresh every 30 seconds

        setRefreshInterval(interval);

        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, []);

    useEffect(() => {
        if (activeTab !== 'overview' && !analytics[activeTab]) {
            fetchAnalytics(activeTab);
        }
    }, [activeTab]);

    const exportData = async (format = 'csv') => {
        try {
            const response = await fetch('/api/analytics/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    type: activeTab,
                    format: format
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(`Export prepared: ${data.message}`);
            }
        } catch (err) {
            alert('Export failed: ' + err.message);
        }
    };

    const renderOverview = () => {
        if (!analytics.overview) return <div>Loading overview...</div>;

        return (
            <div className="analytics-overview">
                <div className="metrics-grid">
                    <div className="metric-card">
                        <h3>Total Users</h3>
                        <div className="metric-value">{analytics.overview.users?.total || 0}</div>
                        <div className="metric-sub">
                            Active (7d): {analytics.overview.users?.active_7d || 0}
                        </div>
                    </div>
                    
                    <div className="metric-card">
                        <h3>Organizations</h3>
                        <div className="metric-value">{analytics.overview.organizations?.total || 0}</div>
                    </div>
                    
                    <div className="metric-card">
                        <h3>Courses</h3>
                        <div className="metric-value">{analytics.overview.courses?.total || 0}</div>
                        <div className="metric-sub">
                            Completion Rate: {analytics.overview.courses?.completion_rate || 0}%
                        </div>
                    </div>
                    
                    <div className="metric-card">
                        <h3>Quiz Performance</h3>
                        <div className="metric-value">{analytics.overview.quizzes?.average_score || 0}%</div>
                        <div className="metric-sub">
                            Total Attempts: {analytics.overview.quizzes?.total_attempts || 0}
                        </div>
                    </div>
                </div>

                <div className="charts-section">
                    <div className="chart-card">
                        <h3>Recent Activity</h3>
                        <div className="activity-stats">
                            <p>Recent Logins (24h): {analytics.overview.users?.recent_logins_24h || 0}</p>
                            <p>Course Enrollments: {analytics.overview.courses?.enrollments || 0}</p>
                            <p>Completed Courses: {analytics.overview.courses?.completed || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderUsers = () => {
        if (!analytics.users) return <div>Loading user analytics...</div>;

        return (
            <div className="analytics-users">
                <div className="section">
                    <h3>User Registration Trends</h3>
                    <div className="trends-list">
                        {analytics.users.registration_trends?.map((trend, index) => (
                            <div key={index} className="trend-item">
                                <span className="date">{trend.date}</span>
                                <span className="count">{trend.count} registrations</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>User Roles Distribution</h3>
                    <div className="role-stats">
                        {analytics.users.role_distribution?.map((role, index) => (
                            <div key={index} className="role-item">
                                <span className="role-name">{role.role}</span>
                                <span className="role-count">{role.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>Top Active Users</h3>
                    <div className="top-users">
                        {analytics.users.top_active_users?.map((user, index) => (
                            <div key={index} className="user-item">
                                <span className="username">{user.username}</span>
                                <span className="sessions">{user.session_count} sessions</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>Login Patterns by Hour</h3>
                    <div className="login-patterns">
                        {analytics.users.login_patterns?.map((pattern, index) => (
                            <div key={index} className="pattern-item">
                                <span className="hour">{pattern.hour}:00</span>
                                <span className="count">{pattern.count} logins</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderCourses = () => {
        if (!analytics.courses) return <div>Loading course analytics...</div>;

        return (
            <div className="analytics-courses">
                <div className="section">
                    <h3>Popular Courses</h3>
                    <div className="popular-courses">
                        {analytics.courses.popular_courses?.map((course, index) => (
                            <div key={index} className="course-item">
                                <span className="course-title">{course.course_title}</span>
                                <span className="enrollment-count">{course.enrollment_count} enrollments</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>Course Completion Rates</h3>
                    <div className="completion-rates">
                        {analytics.courses.completion_rates?.map((course, index) => (
                            <div key={index} className="completion-item">
                                <div className="course-name">{course.course_title}</div>
                                <div className="completion-stats">
                                    <span>Enrolled: {course.total_enrollments}</span>
                                    <span>Completed: {course.completed_count}</span>
                                    <span className="rate">{course.completion_rate}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>Average Time Spent</h3>
                    <div className="time-spent">
                        {analytics.courses.time_spent?.map((course, index) => (
                            <div key={index} className="time-item">
                                <span className="course-title">{course.course_title}</span>
                                <span className="avg-time">{course.avg_time_minutes} minutes</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderLearning = () => {
        if (!analytics.learning) return <div>Loading learning analytics...</div>;

        return (
            <div className="analytics-learning">
                <div className="section">
                    <h3>Quiz Performance Trends</h3>
                    <div className="quiz-trends">
                        {analytics.learning.quiz_trends?.map((trend, index) => (
                            <div key={index} className="quiz-trend-item">
                                <span className="date">{trend.date}</span>
                                <span className="score">Avg Score: {trend.avg_score}%</span>
                                <span className="attempts">{trend.attempt_count} attempts</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>Content Interactions</h3>
                    <div className="content-interactions">
                        {analytics.learning.content_interactions?.map((interaction, index) => (
                            <div key={index} className="interaction-item">
                                <span className="type">{interaction.type}</span>
                                <span className="count">{interaction.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>Top Learners</h3>
                    <div className="top-learners">
                        {analytics.learning.top_learners?.map((learner, index) => (
                            <div key={index} className="learner-item">
                                <span className="username">{learner.username}</span>
                                <span className="progress">{learner.avg_progress}% avg progress</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderSystem = () => {
        if (!analytics.system) return <div>Loading system analytics...</div>;

        return (
            <div className="analytics-system">
                <div className="section">
                    <h3>Page Views (Last 7 Days)</h3>
                    <div className="page-views">
                        {analytics.system.page_views?.map((view, index) => (
                            <div key={index} className="view-item">
                                <span className="date">{view.date}</span>
                                <span className="views">{view.views} views</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>Most Visited Pages</h3>
                    <div className="popular-pages">
                        {analytics.system.popular_pages?.map((page, index) => (
                            <div key={index} className="page-item">
                                <span className="page-url">{page.page}</span>
                                <span className="visits">{page.visits} visits</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>API Usage Statistics</h3>
                    <div className="api-usage">
                        {analytics.system.api_usage?.map((api, index) => (
                            <div key={index} className="api-item">
                                <span className="endpoint">{api.endpoint}</span>
                                <span className="requests">{api.request_count} requests</span>
                                <span className="response-time">{api.avg_response_time}ms avg</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>System Metrics</h3>
                    <div className="system-metrics">
                        {analytics.system.system_metrics?.slice(0, 10).map((metric, index) => (
                            <div key={index} className="metric-item">
                                <span className="metric-name">{metric.name}</span>
                                <span className="metric-value">{metric.value} {metric.unit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderOrganizations = () => {
        if (!analytics.organizations) return <div>Loading organization analytics...</div>;

        return (
            <div className="analytics-organizations">
                <div className="section">
                    <h3>Organization Sizes</h3>
                    <div className="org-sizes">
                        {analytics.organizations.organization_sizes?.map((org, index) => (
                            <div key={index} className="org-item">
                                <span className="org-name">{org.organization}</span>
                                <span className="employee-count">{org.employee_count} employees</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3>Course Assignments by Organization</h3>
                    <div className="course-assignments">
                        {analytics.organizations.course_assignments?.map((org, index) => (
                            <div key={index} className="assignment-item">
                                <span className="org-name">{org.organization}</span>
                                <span className="course-count">{org.course_count} courses assigned</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="analytics-loading">Loading analytics dashboard...</div>;
    }

    if (error) {
        return <div className="analytics-error">Error: {error}</div>;
    }

    return (
        <div className="analytics-dashboard">
            <div className="analytics-header">
                <h1>Analytics Dashboard</h1>
                <div className="analytics-controls">
                    <button onClick={() => fetchAnalytics(activeTab)} className="refresh-btn">
                        🔄 Refresh
                    </button>
                    <button onClick={() => exportData('csv')} className="export-btn">
                        📊 Export CSV
                    </button>
                    <button onClick={() => exportData('excel')} className="export-btn">
                        📈 Export Excel
                    </button>
                </div>
            </div>

            <div className="analytics-tabs">
                {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'users', label: 'User Analytics' },
                    { key: 'courses', label: 'Course Analytics' },
                    { key: 'organizations', label: 'Organizations' },
                    { key: 'learning', label: 'Learning Analytics' },
                    { key: 'system', label: 'System Analytics' },
                    { key: 'financial', label: 'Financial' },
                    { key: 'compliance', label: 'Compliance' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="analytics-content">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'courses' && renderCourses()}
                {activeTab === 'organizations' && renderOrganizations()}
                {activeTab === 'learning' && renderLearning()}
                {activeTab === 'system' && renderSystem()}
                {activeTab === 'financial' && (
                    <div className="coming-soon">
                        <h3>Financial Analytics</h3>
                        <p>Financial analytics features coming soon...</p>
                    </div>
                )}
                {activeTab === 'compliance' && (
                    <div className="compliance-analytics">
                        <h3>Compliance Analytics</h3>
                        <p>Certification and compliance tracking features coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
