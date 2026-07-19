import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MessageSquare, Check, X, MessageCircle } from 'lucide-react';

const CommentsFeedback = () => {
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' or 'feedback'
  const [comments, setComments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [commentsRes, feedbacksRes] = await Promise.all([
        axios.get('/api/comments/admin'),
        axios.get('/api/feedbacks/admin')
      ]);
      setComments(commentsRes.data);
      setFeedbacks(feedbacksRes.data);
    } catch (error) {
      toast.error('Failed to load comments or feedback data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommentStatus = async (id, newStatus) => {
    try {
      await axios.put(`/api/comments/${id}/status`, { status: newStatus });
      toast.success(`Comment ${newStatus.toLowerCase()} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update comment status');
    }
  };

  const handleUpdateFeedbackStatus = async (id, newStatus) => {
    try {
      await axios.put(`/api/feedbacks/${id}/status`, { status: newStatus });
      toast.success(`Feedback ${newStatus.toLowerCase()} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update feedback status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'Declined':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Declined</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Pending</span>;
    }
  };

  const filteredComments = comments.filter(c => statusFilter === 'all' || c.status === statusFilter);
  const filteredFeedbacks = feedbacks.filter(f => statusFilter === 'all' || f.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comments & Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">Review and moderate comments and app feedback submitted by doctors</p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-gray-200 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'comments'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'feedback'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Feedback ({feedbacks.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field max-w-[150px] !py-1 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="card p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : activeTab === 'comments' ? (
        /* Comments list view */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Doctor Name</th>
                  <th className="table-header">Target Type</th>
                  <th className="table-header">Target Name</th>
                  <th className="table-header">Comment</th>
                  <th className="table-header">Submitted At</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-semibold text-gray-900">
                      Dr. {comment.user?.doctorName || 'Unknown'}
                    </td>
                    <td className="table-cell text-sm text-gray-500 capitalize">
                      {comment.targetType === 'quiz' ? 'Quiz / Category' : 'Course Material'}
                    </td>
                    <td className="table-cell text-sm text-gray-700 font-medium">
                      {comment.targetName}
                    </td>
                    <td className="table-cell max-w-xs truncate text-sm text-gray-600" title={comment.content}>
                      {comment.content}
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </td>
                    <td className="table-cell">
                      {getStatusBadge(comment.status)}
                    </td>
                    <td className="table-cell text-right">
                      {comment.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateCommentStatus(comment.id, 'Approved')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Comment"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateCommentStatus(comment.id, 'Declined')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Decline Comment"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredComments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No comments found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Feedback list view */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Doctor Name</th>
                  <th className="table-header">City & Specialty</th>
                  <th className="table-header">App Feedback</th>
                  <th className="table-header">Submitted At</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeedbacks.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-semibold text-gray-900">
                      Dr. {feedback.user?.doctorName || 'Unknown'}
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {feedback.user?.city} • {feedback.user?.specialty}
                    </td>
                    <td className="table-cell max-w-md truncate text-sm text-gray-600" title={feedback.content}>
                      {feedback.content}
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {new Date(feedback.createdAt).toLocaleString()}
                    </td>
                    <td className="table-cell">
                      {getStatusBadge(feedback.status)}
                    </td>
                    <td className="table-cell text-right">
                      {feedback.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateFeedbackStatus(feedback.id, 'Approved')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Feedback"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateFeedbackStatus(feedback.id, 'Declined')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Decline Feedback"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredFeedbacks.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No feedback found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsFeedback;
