import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/news/admin');
      setNews(response.data);
    } catch (error) {
      toast.error('Failed to load news items');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setTitle('');
    setContent('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    setTitle(item.title);
    setContent(item.content);
    setIsActive(item.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      if (modalMode === 'add') {
        await axios.post('/api/news', { title, content });
        toast.success('News item created successfully');
      } else {
        await axios.put(`/api/news/${selectedItem.id}`, { title, content, isActive });
        toast.success('News item updated successfully');
      }
      setIsModalOpen(false);
      fetchNews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save news item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this news item?')) return;
    try {
      await axios.delete(`/api/news/${id}`);
      toast.success('News item deleted successfully');
      fetchNews();
    } catch (error) {
      toast.error('Failed to delete news item');
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await axios.put(`/api/news/${item.id}`, { isActive: !item.isActive });
      toast.success(`News item is now ${!item.isActive ? 'active' : 'inactive'}`);
      fetchNews();
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News Ticker Management</h1>
          <p className="text-sm text-gray-500 mt-1">Publish news items that scroll horizontally on the mobile app home screen</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add News Item
        </button>
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Title</th>
                  <th className="table-header">Content</th>
                  <th className="table-header">Created At</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {news.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-semibold text-gray-900">{item.title}</td>
                    <td className="table-cell max-w-md truncate text-sm text-gray-600" title={item.content}>
                      {item.content}
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
                          item.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit News"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete News"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {news.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No news items found. Create one by clicking "Add News Item".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'add' ? 'Add News Item' : 'Edit News Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">News Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Daily Competition Winners Announced!"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="form-label">News Content / Details</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter details of the news..."
                  className="input-field min-h-[100px] py-2"
                  required
                />
              </div>

              {modalMode === 'edit' && (
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 select-none">
                    Publish / Display this news in the ticker
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  {modalMode === 'add' ? 'Publish News' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
