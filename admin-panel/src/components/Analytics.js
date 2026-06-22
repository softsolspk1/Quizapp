import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Users,
  Trophy,
  Target,
  Award
} from 'lucide-react';

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [questionStats, setQuestionStats] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [gameModeStats, setGameModeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    loadAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      const [overviewRes, activityRes, categoryRes, questionRes, performersRes, gameModeRes] = await Promise.all([
        axios.get('/api/analytics/overview'),
        axios.get(`/api/analytics/user-activity?days=${selectedPeriod}`),
        axios.get('/api/analytics/category-performance'),
        axios.get('/api/analytics/question-performance?limit=10'),
        axios.get('/api/analytics/top-performers?limit=10'),
        axios.get('/api/analytics/game-mode-stats')
      ]);

      setOverview(overviewRes.data);
      setUserActivity(activityRes.data);
      setCategoryStats(categoryRes.data);
      setQuestionStats(questionRes.data);
      setTopPerformers(performersRes.data);
      setGameModeStats(gameModeRes.data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your quiz platform</p>
        </div>
        <select
          className="input-field w-40"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{overview?.totalUsers || 0}</p>
              <p className="text-sm text-gray-500">
                {overview?.approvedUsers || 0} approved
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Points</p>
              <p className="text-2xl font-semibold text-gray-900">{overview?.totalPointsEarned || 0}</p>
              <p className="text-sm text-gray-500">
                {overview?.completedSessions || 0} sessions
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">{userActivity?.activeUsers || 0}</p>
              <p className="text-sm text-gray-500">
                {userActivity?.newUsers || 0} new users
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Questions</p>
              <p className="text-2xl font-semibold text-gray-900">{overview?.totalQuestions || 0}</p>
              <p className="text-sm text-gray-500">
                {categoryStats.length} categories
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Over Time */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userActivity?.sessionsByDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Game Mode Distribution */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Game Mode Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gameModeStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, totalSessions }) => `${_id} (${totalSessions})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalSessions"
                >
                  {gameModeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sessionCount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Scores by Category */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Average Scores by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageScore" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Rank</th>
                <th className="table-header">Doctor Name</th>
                <th className="table-header">Specialty</th>
                <th className="table-header">Hospital</th>
                <th className="table-header">Total Points</th>
                <th className="table-header">Games Played</th>
                <th className="table-header">Accuracy</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topPerformers.map((performer, index) => {
                const accuracy = performer.correctAnswers + performer.wrongAnswers > 0 
                  ? ((performer.correctAnswers / (performer.correctAnswers + performer.wrongAnswers)) * 100).toFixed(1)
                  : 0;
                
                return (
                  <tr key={performer._id}>
                    <td className="table-cell">
                      <div className="flex items-center">
                        {index === 0 && <Award className="h-5 w-5 text-yellow-500 mr-2" />}
                        {index === 1 && <Award className="h-5 w-5 text-gray-400 mr-2" />}
                        {index === 2 && <Award className="h-5 w-5 text-orange-500 mr-2" />}
                        <span className="font-medium">{index + 1}</span>
                      </div>
                    </td>
                    <td className="table-cell font-medium">{performer.doctorName}</td>
                    <td className="table-cell">{performer.specialty}</td>
                    <td className="table-cell">{performer.hospitalName}</td>
                    <td className="table-cell font-semibold text-primary-600">{performer.totalPoints}</td>
                    <td className="table-cell">{performer.gamesPlayed}</td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        accuracy >= 80 ? 'bg-green-100 text-green-800' :
                        accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {accuracy}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question Performance */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Question Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Question</th>
                <th className="table-header">Category</th>
                <th className="table-header">Difficulty</th>
                <th className="table-header">Times Answered</th>
                <th className="table-header">Success Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questionStats.map((question) => (
                <tr key={question._id}>
                  <td className="table-cell">
                    <div className="max-w-xs truncate" title={question.question}>
                      {question.question}
                    </div>
                  </td>
                  <td className="table-cell">
                    {question.categoryInfo?.[0]?.name || 'N/A'}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="table-cell">{question.timesAnswered}</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      question.successRate >= 80 ? 'bg-green-100 text-green-800' :
                      question.successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;



