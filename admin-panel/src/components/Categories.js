import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  CheckCircle,
  XCircle,
  Search,
  Download,
  FileText
} from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/categories/admin');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.url;
  };

  const onSubmit = async (data) => {
    try {
      setIsUploading(true);
      let imageUrl = imagePreview;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      const payload = { ...data, imageUrl };
      
      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory.id}`, payload);
        toast.success('Category updated successfully');
      } else {
        await axios.post('/api/categories', payload);
        toast.success('Category created successfully');
      }
      loadCategories();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setImagePreview(category.imageUrl || '');
    setImageFile(null);
    reset({
      name: category.name,
      description: category.description,
      isActive: category.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`/api/categories/${categoryId}`);
        toast.success('Category deleted successfully');
        loadCategories();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview('');
    reset();
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = () => {
    const headers = ['Category Name', 'Description', 'Questions', 'Status'];
    const data = filteredCategories.map(cat => [
      cat.name,
      cat.description || 'N/A',
      cat._count?.questions || 0,
      cat.isActive ? 'Active' : 'Inactive'
    ]);
    exportToPDF('Categories List', headers, data);
  };

  const handleExportExcel = () => {
    const headers = ['Category Name', 'Description', 'Questions', 'Status'];
    const data = filteredCategories.map(cat => [
      cat.name,
      cat.description || 'N/A',
      cat._count?.questions || 0,
      cat.isActive ? 'Active' : 'Inactive'
    ]);
    exportToExcel('Categories List', headers, data);
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
          <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-gray-600">Manage quiz categories</p>
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
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Category
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <FolderOpen className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {category.isActive ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {category.questionCount} questions
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Edit Category"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete Category"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    {...register('name', { required: 'Category name is required' })}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    {...register('description')}
                  />
                </div>
                
                {editingCategory && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      {...register('isActive')}
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        setImagePreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : (editingCategory ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;


