import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Trash2, Bell, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Broadcast = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetType: 'all',
    targetValue: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const targetTypes = [
    { value: 'all', label: 'All Users' },
    { value: 'specialty', label: 'Specific Specialty' },
    { value: 'city', label: 'Specific City' },
    { value: 'hospital', label: 'Specific Hospital' },
    { value: 'role', label: 'Specific Role' }
  ];

  const specialties = ['Cardiology', 'Dermatology', 'Endocrinology & Diabetes', 'ER', 'Gastroenterology', 'Gynaecology', 'Internal Medicine', 'Nephrology', 'Neuro Surgery', 'Neurology', 'Orthopaedic', 'Paediatrics', 'Peads Neurology', 'Psychiatry', 'Pulmonology', 'Radiologist'];
  
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      return toast.error('Please enter title and message');
    }
    if (formData.targetType !== 'all' && !formData.targetValue) {
      return toast.error('Please specify the target filter value');
    }

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        const uploadRes = await axios.post('/api/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      const payload = { ...formData, imageUrl };
      await axios.post('/api/notifications', payload);
      toast.success('Broadcast sent successfully');
      setFormData({
        title: '',
        message: '',
        targetType: 'all',
        targetValue: ''
      });
      setImageFile(null);
      setImagePreview(null);
      fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSubmitting(false);
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

  const handleExportPDF = () => {
    const headers = ['Title', 'Message', 'Target Type', 'Target Value', 'Created At'];
    const data = notifications.map(notif => [
      notif.title,
      notif.message,
      notif.targetType,
      notif.targetValue || 'N/A',
      new Date(notif.createdAt).toLocaleString()
    ]);
    exportToPDF('Broadcast History', headers, data);
  };

  const handleExportExcel = () => {
    const headers = ['Title', 'Message', 'Target Type', 'Target Value', 'Created At'];
    const data = notifications.map(notif => [
      notif.title,
      notif.message,
      notif.targetType,
      notif.targetValue || 'N/A',
      new Date(notif.createdAt).toLocaleString()
    ]);
    exportToExcel('Broadcast History', headers, data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast Messages</h1>
          <p className="text-gray-600">Send in-app notifications to filtered users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-600" />
            PDF
          </button>
          <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            Excel
          </button>
        </div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Optional Image</label>
              {!imagePreview ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative cursor-pointer hover:border-primary-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                        <span>Upload a file</span>
                        <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative mt-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-md border" />
                  <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting} className="w-full btn-primary flex items-center justify-center gap-2 mt-4">
              <Send className="h-4 w-4" />
              {submitting ? 'Sending...' : 'Send Broadcast'}
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
                {notif.imageUrl && (
                   <img src={notif.imageUrl} alt="Broadcast" className="w-20 h-20 object-cover rounded shadow-sm border border-gray-200" />
                )}
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
