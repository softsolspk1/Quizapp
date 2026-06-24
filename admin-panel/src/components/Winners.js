import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Image, Upload, Plus, X, Star } from 'lucide-react';

const Winners = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    isActive: true
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadWinners();
  }, []);

  const loadWinners = async () => {
    try {
      const response = await axios.get('/api/winners');
      setWinners(response.data);
    } catch (error) {
      toast.error('Failed to load winners');
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
      setFormData({ ...formData, imageUrl: response.data.imageUrl });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/winners', formData);
      toast.success('Winner added successfully');
      setShowModal(false);
      loadWinners();
      setFormData({
        title: '',
        imageUrl: '',
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear().toString(),
        isActive: true
      });
    } catch (error) {
      toast.error('Failed to add winner');
    }
  };

  const toggleStatus = async (winner) => {
    try {
      await axios.put(`/api/winners/${winner.id}`, {
        ...winner,
        isActive: !winner.isActive
      });
      loadWinners();
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteWinner = async (id) => {
    if (window.confirm('Are you sure you want to delete this winner?')) {
      try {
        await axios.delete(`/api/winners/${id}`);
        toast.success('Winner deleted successfully');
        loadWinners();
      } catch (error) {
        toast.error('Failed to delete winner');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Winner of the Month</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add Winner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {winners.map((winner) => (
          <div key={winner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
            {winner.isActive && (
               <div className="absolute top-2 left-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-md z-10">
                 <Star className="w-3 h-3 mr-1" /> Active
               </div>
            )}
            <div className="h-48 relative bg-gray-100">
              {winner.imageUrl ? (
                <img
                  src={winner.imageUrl}
                  alt={winner.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Image className="w-12 h-12" />
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-800 mb-1">{winner.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{winner.month} {winner.year}</p>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  onClick={() => toggleStatus(winner)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    winner.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {winner.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => deleteWinner(winner.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Winner</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (e.g. Dr. John Doe)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    {formData.imageUrl ? (
                      <div className="relative">
                        <img src={formData.imageUrl} alt="Preview" className="mx-auto h-32 object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
                {isUploading && <p className="text-sm text-blue-600 mt-2 text-center">Uploading image...</p>}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Set as active winner (This will deactivate other winners)
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !formData.imageUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Winner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Winners;
