import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, Search, CheckCircle, XCircle, Download, FileText } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Pins = () => {
  const [pins, setPins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchPinsAndCategories = async () => {
    try {
      const [pinsRes, categoriesRes] = await Promise.all([
        axios.get('/api/pins'),
        axios.get('/api/categories')
      ]);
      setPins(pinsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPinsAndCategories();
  }, []);

  const onSubmit = async (data) => {
    try {
      await axios.post('/api/pins', data);
      toast.success('PIN created successfully');
      setIsModalOpen(false);
      reset();
      fetchPinsAndCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create PIN');
    }
  };

  const handleRevoke = async (id) => {
    if (window.confirm('Are you sure you want to revoke this PIN?')) {
      try {
        await axios.put(`/api/pins/${id}/revoke`);
        toast.success('PIN revoked successfully');
        fetchPinsAndCategories();
      } catch (error) {
        toast.error('Failed to revoke PIN');
      }
    }
  };

  const filteredPins = pins.filter(pin => 
    pin.wardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pin.code.includes(searchTerm)
  );

  const handleExportPDF = () => {
    const headers = ['Activity PIN', 'Ward Name', 'City', 'Creator', 'Status', 'Expires At'];
    const data = filteredPins.map(pin => [
      pin.code,
      pin.wardName,
      pin.city,
      pin.creator ? pin.creator.doctorName : 'Unknown',
      pin.isActive ? 'Active' : 'Revoked',
      pin.expiresAt ? new Date(pin.expiresAt).toLocaleString() : 'Never'
    ]);
    exportToPDF('Ward Activities List', headers, data);
  };

  const handleExportExcel = () => {
    const headers = ['Activity PIN', 'Ward Name', 'City', 'Creator', 'Status', 'Expires At'];
    const data = filteredPins.map(pin => [
      pin.code,
      pin.wardName,
      pin.city,
      pin.creator ? pin.creator.doctorName : 'Unknown',
      pin.isActive ? 'Active' : 'Revoked',
      pin.expiresAt ? new Date(pin.expiresAt).toLocaleString() : 'Never'
    ]);
    exportToExcel('Ward Activities List', headers, data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Ward Activity Management</h1>
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
              reset();
              setIsModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Ward Activity
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by Ward Name or PIN Code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Activity PIN</th>
                  <th className="table-header">Ward Name</th>
                  <th className="table-header">City</th>
                  <th className="table-header">Creator</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Expires At</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPins.map((pin) => (
                  <tr key={pin.id}>
                    <td className="table-cell font-mono font-bold text-lg text-primary-600">
                      {pin.code}
                    </td>
                    <td className="table-cell">
                      {pin.wardName}
                    </td>
                    <td className="table-cell">
                      {pin.city}
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {pin.creator ? pin.creator.doctorName : 'Unknown'}
                    </td>
                    <td className="table-cell">
                      {pin.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-4 h-4 mr-1" /> Revoked
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {pin.expiresAt ? new Date(pin.expiresAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="table-cell text-right">
                      {pin.isActive && (
                        <button
                          onClick={() => handleRevoke(pin.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPins.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No Ward Activities found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Create Ward Activity</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="label">Ward / Activity Name</label>
                <input
                  type="text"
                  {...register('wardName', { required: 'Ward name is required' })}
                  className="input-field"
                  placeholder="e.g., General Ward Morning Shift"
                />
                {errors.wardName && (
                  <p className="mt-1 text-sm text-red-600">{errors.wardName.message}</p>
                )}
              </div>

              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  {...register('city', { required: 'City is required' })}
                  className="input-field"
                  placeholder="e.g., Karachi"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  {...register('categoryId', { required: 'Category is required' })}
                  className="input-field"
                >
                  <option value="">Select a Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <label className="label">Number of Questions</label>
                <input
                  type="number"
                  {...register('totalQuestions', { 
                    required: 'Number of questions is required',
                    min: { value: 1, message: 'Minimum 1 question' },
                    max: { value: 50, message: 'Maximum 50 questions' }
                  })}
                  className="input-field"
                  defaultValue={10}
                />
                {errors.totalQuestions && (
                  <p className="mt-1 text-sm text-red-600">{errors.totalQuestions.message}</p>
                )}
              </div>

              <div>
                <label className="label">Expiration Date (Optional)</label>
                <input
                  type="datetime-local"
                  {...register('expiresAt')}
                  className="input-field"
                />
                <p className="mt-1 text-xs text-gray-500">Leave blank if the PIN never expires</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pins;
