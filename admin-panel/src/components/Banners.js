import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, XCircle, Image as ImageIcon, Upload, Download, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    imageUrl: '',
    specialty: 'All',
    isActive: true
  });

  const specialties = [
    'All',
    'Cardiology',
    'Dermatology',
    'Endocrinology & Diabetes',
    'ER',
    'Gastroenterology',
    'Gynaecology',
    'Internal Medicine',
    'Nephrology',
    'Neurology',
    'Orthopaedic',
    'Paediatrics',
    'Psychiatry',
    'Pulmonology'
  ];

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await axios.get('/api/banners/all');
      setBanners(response.data);
    } catch (error) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    setUploadingImage(true);
    try {
      const response = await axios.post('/api/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      return toast.error('Please upload an image or provide an image URL');
    }

    try {
      if (formData.id) {
        await axios.put(`/api/banners/${formData.id}`, formData);
        toast.success('Banner updated successfully');
      } else {
        await axios.post('/api/banners', formData);
        toast.success('Banner created successfully');
      }
      setShowModal(false);
      fetchBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleEdit = (banner) => {
    setFormData(banner);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await axios.delete(`/api/banners/${id}`);
        toast.success('Banner deleted');
        fetchBanners();
      } catch (error) {
        toast.error('Failed to delete banner');
      }
    }
  };

  const handleExportPDF = () => {
    const headers = ['Title', 'Specialty', 'Status', 'Image URL'];
    const data = banners.map(banner => [
      banner.title,
      banner.specialty,
      banner.isActive ? 'Active' : 'Inactive',
      banner.imageUrl
    ]);
    exportToPDF('Banners List', headers, data);
  };

  const handleExportExcel = () => {
    const headers = ['Title', 'Specialty', 'Status', 'Image URL'];
    const data = banners.map(banner => [
      banner.title,
      banner.specialty,
      banner.isActive ? 'Active' : 'Inactive',
      banner.imageUrl
    ]);
    exportToExcel('Banners List', headers, data);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-600">Manage promotional and specialty banners</p>
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
          <button
            onClick={() => {
              setFormData({ id: null, title: '', imageUrl: '', specialty: 'All', isActive: true });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Banner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="card overflow-hidden">
            <div className="h-40 w-full relative bg-gray-100 flex items-center justify-center overflow-hidden">
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-12 w-12 text-gray-400" />
              )}
              {!banner.isActive && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-bold bg-red-600 px-3 py-1 rounded-full text-sm">Inactive</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 truncate">{banner.title}</h3>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs font-medium">
                  {banner.specialty}
                </span>
              </p>
              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  onClick={() => handleEdit(banner)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            No banners found. Create one to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {formData.id ? 'Edit Banner' : 'Add Banner'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Banner Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                  placeholder="e.g. Welcome to Cardiology Ward"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-32 bg-gray-100 border rounded-lg overflow-hidden flex items-center justify-center">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <Upload className="h-5 w-5 mr-2" />
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Target Specialty</label>
                <select
                  name="specialty"
                  required
                  value={formData.specialty}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                >
                  {specialties.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Select "All" to show to everyone, or restrict to a specific specialty.</p>
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active Banner
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="btn-primary"
                >
                  {formData.id ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banners;
