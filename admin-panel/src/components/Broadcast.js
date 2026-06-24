import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Trash2, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Broadcast = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetType: 'all',
    targetValue: ''
  });

  const targetTypes = [
    { value: 'all', label: 'All Users' },
    { value: 'specialty', label: 'Specific Specialty' },
    { value: 'city', label: 'Specific City' },
    { value: 'hospital', label: 'Specific Hospital' },
    { value: 'role', label: 'Specific Role' }
  ];

  const specialties = ['Cardiology', 'Dermatology', 'Endocrinology & Diabetes', 'ER', 'Gastroenterology', 'Gynaecology', 'Internal Medicine', 'Nephrology', 'Neurology', 'Orthopaedic', 'Paediatrics', 'Psychiatry', 'Pulmonology'];
  
  const cities = ['Abbottabad', 'Bahawalpur', 'Chiniot', 'Dera Ghazi Khan', 'Dera Ismail Khan', 'Faisalabad', 'Gilgit', 'Gujranwala', 'Gujrat', 'Hyderabad', 'Islamabad', 'Jacobabad', 'Jhang', 'Jhelum', 'Karachi', 'Kasur', 'Khairpur', 'Lahore', 'Larkana', 'Mardan', 'Mingora', 'Mirpur Khas', 'Multan', 'Muzaffarabad', 'Nawabshah', 'Okara', 'Peshawar', 'Quetta', 'Rahim Yar Khan', 'Rawalpindi', 'Sadiqabad', 'Sahiwal', 'Sargodha', 'Sheikhupura', 'Shikarpur', 'Sialkot', 'Sukkur', 'Vehari'];
  
  const roles = ['user', 'subadmin'];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications/all');
      setNotifications(response.data);
    } catch (error) {
      toast.error('Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'targetType' ? { targetValue: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      return toast.error('Please enter title and message');
    }
    if (formData.targetType !== 'all' && !formData.targetValue) {
      return toast.error('Please specify the target filter value');
    }

    try {
      await axios.post('/api/notifications', formData);
      toast.success('Broadcast sent successfully');
      setFormData({
        title: '',
        message: '',
        targetType: 'all',
        targetValue: ''
      });
      fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send broadcast');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this broadcast?')) {
      try {
        await axios.delete(`/api/notifications/${id}`);
        toast.success('Broadcast deleted');
        fetchNotifications();
      } catch (error) {
        toast.error('Failed to delete broadcast');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Broadcast Messages</h1>
        <p className="text-gray-600">Send in-app notifications to filtered users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Broadcast Form */}
        <div className="card lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-4 border-b pb-4">
            <Send className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold">New Message</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Filter By</label>
              <select
                name="targetType"
                value={formData.targetType}
                onChange={handleInputChange}
                className="mt-1 input-field"
              >
                {targetTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {formData.targetType === 'specialty' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Specialty</label>
                <select name="targetValue" value={formData.targetValue} onChange={handleInputChange} className="mt-1 input-field">
                  <option value="">Choose...</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {formData.targetType === 'city' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select City</label>
                <select name="targetValue" value={formData.targetValue} onChange={handleInputChange} className="mt-1 input-field">
                  <option value="">Choose...</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {formData.targetType === 'hospital' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Enter Hospital Name</label>
                <input type="text" name="targetValue" value={formData.targetValue} onChange={handleInputChange} className="mt-1 input-field" placeholder="e.g. Aga Khan" />
              </div>
            )}

            {formData.targetType === 'role' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Role</label>
                <select name="targetValue" value={formData.targetValue} onChange={handleInputChange} className="mt-1 input-field">
                  <option value="">Choose...</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Message Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 input-field"
                placeholder="e.g. System Maintenance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Message Body</label>
              <textarea
                name="message"
                required
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 input-field"
                placeholder="Type your message here..."
              ></textarea>
            </div>

            <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
              <Send className="h-4 w-4" />
              Send Broadcast
            </button>
          </form>
        </div>

        {/* History */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 border-b pb-4">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Broadcast History</h2>
          </div>

          <div className="space-y-4">
            {notifications.map((notif) => (
              <div key={notif.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900">{notif.title}</h3>
                    <span className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded font-medium">
                      {notif.targetType === 'all' ? 'All Users' : `${notif.targetType}: ${notif.targetValue}`}
                    </span>
                    <span className="text-gray-500">Read by: {notif.isReadBy.length}</span>
                    <span className="text-gray-500">Sent by: {notif.creator?.doctorName}</span>
                  </div>
                </div>
                <div>
                  <button onClick={() => handleDelete(notif.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No broadcast history found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Broadcast;
