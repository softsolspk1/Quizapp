import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Calendar, Plus, X, Upload, Users, Download, FileText } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Competitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetSpecialty: '',
    posterUrl: '',
    date: '',
    startTime: '',
    endTime: '',
    categoryId: '',
    isActive: true
  });

  const specialties = ['Cardiology', 'Dermatology', 'Endocrinology & Diabetes', 'ER', 'Gastroenterology', 'Gynaecology', 'Internal Medicine', 'Nephrology', 'Neurology', 'Orthopaedic', 'Paediatrics', 'Psychiatry', 'Pulmonology'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [compRes, catRes] = await Promise.all([
        axios.get('/api/competitions'),
        axios.get('/api/categories/admin')
      ]);
      setCompetitions(compRes.data);
      setCategories(catRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await axios.post('/api/upload', uploadData);
      setFormData({ ...formData, posterUrl: response.data.imageUrl });
      toast.success('Poster uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload poster');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCompetition) {
        await axios.put(`/api/competitions/${selectedCompetition.id}`, formData);
        toast.success('Competition updated');
      } else {
        await axios.post('/api/competitions', formData);
        toast.success('Competition created');
      }
      setShowModal(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this competition?')) {
      try {
        await axios.delete(`/api/competitions/${id}`);
        toast.success('Competition deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete competition');
      }
    }
  };

  const fetchEnrollments = async (comp) => {
    try {
      const response = await axios.get(`/api/competitions/${comp.id}/enrollments`);
      setEnrollments(response.data);
      setSelectedCompetition(comp);
      setShowEnrollmentsModal(true);
    } catch (error) {
      toast.error('Failed to load enrollments');
    }
  };

  const resetForm = () => {
    setSelectedCompetition(null);
    setFormData({
      name: '',
      targetSpecialty: '',
      posterUrl: '',
      date: '',
      startTime: '',
      endTime: '',
      categoryId: '',
      isActive: true
    });
  };

  const handleExportPDF = () => {
    const headers = ['Name', 'Specialty', 'Date', 'Time', 'Enrollments', 'Status'];
    const data = competitions.map(comp => [
      comp.name,
      comp.targetSpecialty,
      new Date(comp.date).toLocaleDateString(),
      `${comp.startTime} - ${comp.endTime}`,
      comp._count?.enrollments || 0,
      comp.isActive ? 'Active' : 'Inactive'
    ]);
    exportToPDF('Monthly Competitions', headers, data);
  };

  const handleExportExcel = () => {
    const headers = ['Name', 'Specialty', 'Date', 'Time', 'Enrollments', 'Status'];
    const data = competitions.map(comp => [
      comp.name,
      comp.targetSpecialty,
      new Date(comp.date).toLocaleDateString(),
      `${comp.startTime} - ${comp.endTime}`,
      comp._count?.enrollments || 0,
      comp.isActive ? 'Active' : 'Inactive'
    ]);
    exportToExcel('Monthly Competitions', headers, data);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Competitions</h1>
          <p className="text-gray-600">Manage live quizzes and enrollments</p>
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
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Competition
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Competition Name</th>
                <th className="table-header">Target Specialty</th>
                <th className="table-header">Schedule</th>
                <th className="table-header">Category</th>
                <th className="table-header">Enrollments</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {competitions.map((comp) => (
                <tr key={comp.id}>
                  <td className="table-cell font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      {comp.posterUrl && (
                        <img src={comp.posterUrl} alt="Poster" className="h-10 w-10 rounded-md object-cover" />
                      )}
                      <div>
                        {comp.name}
                        <div className="text-xs text-gray-500">{comp.isActive ? 'Active' : 'Inactive'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-blue-600">{comp.targetSpecialty}</td>
                  <td className="table-cell">
                    <div className="text-sm">{new Date(comp.date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{comp.startTime} to {comp.endTime}</div>
                  </td>
                  <td className="table-cell">{comp.category?.name}</td>
                  <td className="table-cell">
                    <button onClick={() => fetchEnrollments(comp)} className="flex items-center gap-1 text-primary-600 hover:text-primary-800">
                      <Users className="h-4 w-4" />
                      {comp._count?.enrollments || 0} Doctors
                    </button>
                  </td>
                  <td className="table-cell text-right">
                    <button onClick={() => handleDelete(comp.id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900">Create Monthly Competition</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Competition Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-field"
                    placeholder="e.g., Spring Cardiology Quiz"
                  />
                </div>
                <div>
                  <label className="label">Target Specialty</label>
                  <select
                    required
                    value={formData.targetSpecialty}
                    onChange={(e) => setFormData({...formData, targetSpecialty: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Specialty</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Category (Questions Bank)</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Poster Image (Announcement Banner)</label>
                {formData.posterUrl ? (
                  <div className="relative mt-2">
                    <img src={formData.posterUrl} alt="Poster" className="h-48 w-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, posterUrl: ''})}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                          <span>Upload a file</span>
                          <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {isUploading && <p className="text-sm text-primary-600 mt-2 text-center">Uploading...</p>}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active (Visible to users)</label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isUploading || !formData.posterUrl} className="btn-primary">Save Competition</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrollments Modal */}
      {showEnrollmentsModal && selectedCompetition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Enrolled Doctors - {selectedCompetition.name}</h3>
              <button onClick={() => setShowEnrollmentsModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {enrollments.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Doctor Name</th>
                      <th className="table-header">Hospital</th>
                      <th className="table-header">City</th>
                      <th className="table-header">Enrolled At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {enrollments.map(e => (
                      <tr key={e.id}>
                        <td className="table-cell font-medium">{e.user.doctorName}</td>
                        <td className="table-cell">{e.user.hospitalName}</td>
                        <td className="table-cell">{e.user.city}</td>
                        <td className="table-cell text-gray-500">{new Date(e.enrolledAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">No doctors have enrolled yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Competitions;
