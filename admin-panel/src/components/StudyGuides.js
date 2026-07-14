import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, XCircle, FileText as FileIcon, Upload, Download, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const StudyGuides = () => {
  const [studyGuides, setStudyGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    pdfUrl: '',
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
    fetchStudyGuides();
  }, []);

  const fetchStudyGuides = async () => {
    try {
      const response = await axios.get('/api/study-guides/all');
      setStudyGuides(response.data);
    } catch (error) {
      toast.error('Failed to load study guides');
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

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file); // API expects 'image' form-data key even for pdf based on our upload.js

    setUploadingPdf(true);
    try {
      const response = await axios.post('/api/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, pdfUrl: response.data.url }));
      toast.success('PDF uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pdfUrl) {
      return toast.error('Please upload a PDF or provide a PDF URL');
    }

    try {
      if (formData.id) {
        await axios.put(`/api/study-guides/${formData.id}`, formData);
        toast.success('Study Guide updated successfully');
      } else {
        await axios.post('/api/study-guides', formData);
        toast.success('Study Guide created successfully');
      }
      setShowModal(false);
      fetchStudyGuides();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save study guide');
    }
  };

  const handleEdit = (guide) => {
    setFormData(guide);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this study guide?')) {
      try {
        await axios.delete(`/api/study-guides/${id}`);
        toast.success('Study Guide deleted');
        fetchStudyGuides();
      } catch (error) {
        toast.error('Failed to delete study guide');
      }
    }
  };

  const handleExportPDF = () => {
    const headers = ['Title', 'Specialty', 'Status', 'PDF URL'];
    const data = studyGuides.map(guide => [
      guide.title,
      guide.specialty,
      guide.isActive ? 'Active' : 'Inactive',
      guide.pdfUrl
    ]);
    exportToPDF('Study Guides List', headers, data);
  };

  const handleExportExcel = () => {
    const headers = ['Title', 'Specialty', 'Status', 'PDF URL'];
    const data = studyGuides.map(guide => [
      guide.title,
      guide.specialty,
      guide.isActive ? 'Active' : 'Inactive',
      guide.pdfUrl
    ]);
    exportToExcel('Study Guides List', headers, data);
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
          <h1 className="text-2xl font-bold text-gray-900">Study Guides</h1>
          <p className="text-gray-600">Manage course materials and PDFs</p>
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
              setFormData({ id: null, title: '', pdfUrl: '', specialty: 'All', isActive: true });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Guide
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studyGuides.map((guide) => (
          <div key={guide.id} className="card overflow-hidden">
            <div className="h-32 w-full relative bg-gray-100 flex flex-col items-center justify-center overflow-hidden border-b">
              <FileIcon className="h-12 w-12 text-blue-500 mb-2" />
              <a href={guide.pdfUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View PDF</a>
              {!guide.isActive && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-bold bg-red-600 px-3 py-1 rounded-full text-sm">Inactive</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 truncate">{guide.title}</h3>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs font-medium">
                  {guide.specialty}
                </span>
              </p>
              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  onClick={() => handleEdit(guide)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(guide.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {studyGuides.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            No study guides found. Create one to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {formData.id ? 'Edit Study Guide' : 'Add Study Guide'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Guide Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                  placeholder="e.g. Cardiology Basics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guide PDF File</label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-32 bg-gray-100 border rounded-lg overflow-hidden flex flex-col items-center justify-center">
                    {formData.pdfUrl ? (
                      <span className="text-xs text-blue-600 px-2 text-center break-words">PDF Attached</span>
                    ) : (
                      <FileIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <Upload className="h-5 w-5 mr-2" />
                    {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      disabled={uploadingPdf}
                    />
                  </label>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Or paste PDF URL directly</label>
                  <input
                    type="text"
                    name="pdfUrl"
                    value={formData.pdfUrl}
                    onChange={handleInputChange}
                    className="mt-1 input-field"
                    placeholder="https://..."
                  />
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
                  Active Guide
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
                  disabled={uploadingPdf}
                  className="btn-primary"
                >
                  {formData.id ? 'Update Guide' : 'Create Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGuides;
