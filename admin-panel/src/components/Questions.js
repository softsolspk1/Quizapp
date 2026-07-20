import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Edit,
  Trash2,
  HelpCircle,
  CheckCircle,
  XCircle,
  Search,
  Download,
  FileText
} from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadCategories();
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedCategory, selectedDifficulty]);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20
      });
      
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      
      const response = await axios.get(`/api/questions/admin?${params}`);
      setQuestions(response.data.questions);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load questions');
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

      const questionData = {
        ...data,
        correctAnswer: parseInt(data.correctAnswer),
        options: [data.option1, data.option2, data.option3, data.option4],
        imageUrl
      };
      
      delete questionData.option1;
      delete questionData.option2;
      delete questionData.option3;
      delete questionData.option4;

      if (editingQuestion) {
        await axios.put(`/api/questions/${editingQuestion.id}`, questionData);
        toast.success('Question updated successfully');
      } else {
        await axios.post('/api/questions', questionData);
        toast.success('Question created successfully');
      }
      loadQuestions();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save question');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setImagePreview(question.imageUrl || '');
    setImageFile(null);
    reset({
      question: question.question,
      option1: question.options[0],
      option2: question.options[1],
      option3: question.options[2],
      option4: question.options[3],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      category: question.category.id,
      difficulty: question.difficulty,
      isActive: question.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await axios.delete(`/api/questions/${questionId}`);
        toast.success('Question deleted successfully');
        loadQuestions();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete question');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
    setImageFile(null);
    setImagePreview('');
    reset();
  };

  const filteredQuestions = questions.filter(question =>
    question.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = () => {
    const headers = ['Question', 'Category', 'Difficulty', 'Points', 'Status'];
    const data = filteredQuestions.map(q => [
      q.question,
      q.category?.name || 'N/A',
      q.difficulty,
      q.points,
      q.isActive ? 'Active' : 'Inactive'
    ]);
    exportToPDF('Questions List', headers, data);
  };

  const handleExportExcel = () => {
    const headers = ['Question', 'Category', 'Difficulty', 'Points', 'Status', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Explanation'];
    const data = filteredQuestions.map(q => [
      q.question,
      q.category?.name || 'N/A',
      q.difficulty,
      q.points,
      q.isActive ? 'Active' : 'Inactive',
      q.options[0],
      q.options[1],
      q.options[2],
      q.options[3],
      q.correctAnswer,
      q.explanation || 'N/A'
    ]);
    exportToExcel('Questions List', headers, data);
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
          <h1 className="text-2xl font-bold text-gray-900">Questions Management</h1>
          <p className="text-gray-600">Manage quiz questions</p>
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
            Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="input-field"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="input-field"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advance">Advance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <div key={question.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-500">
                    {question.category.name}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    question.difficulty === 'basic' ? 'bg-green-100 text-green-800' :
                    question.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {question.difficulty}
                  </span>
                  {question.isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {question.question}
                </h3>
                {question.imageUrl && (
                  <div className="mb-3">
                    <img src={question.imageUrl} alt="Question Attachment" className="max-h-32 object-contain rounded border" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        index === question.correctAnswer
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </div>
                  ))}
                </div>
                {question.explanation && (
                  <p className="text-sm text-gray-600 italic">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Answered {question.timesAnswered} times • 
                  Success rate: {question.successRate}%
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(question)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Edit Question"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(question.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete Question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
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
                    Category
                  </label>
                  <select
                    className="input-field"
                    {...register('category', { required: 'Category is required' })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    {...register('question', { required: 'Question is required' })}
                  />
                  {errors.question && (
                    <p className="text-red-500 text-sm mt-1">{errors.question.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Image (Optional)
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option A
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      {...register('option1', { required: 'Option A is required' })}
                    />
                    {errors.option1 && (
                      <p className="text-red-500 text-sm mt-1">{errors.option1.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option B
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      {...register('option2', { required: 'Option B is required' })}
                    />
                    {errors.option2 && (
                      <p className="text-red-500 text-sm mt-1">{errors.option2.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option C
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      {...register('option3', { required: 'Option C is required' })}
                    />
                    {errors.option3 && (
                      <p className="text-red-500 text-sm mt-1">{errors.option3.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option D
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      {...register('option4', { required: 'Option D is required' })}
                    />
                    {errors.option4 && (
                      <p className="text-red-500 text-sm mt-1">{errors.option4.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Answer
                  </label>
                  <select
                    className="input-field"
                    {...register('correctAnswer', { required: 'Correct answer is required' })}
                  >
                    <option value="">Select Correct Answer</option>
                    <option value="0">A</option>
                    <option value="1">B</option>
                    <option value="2">C</option>
                    <option value="3">D</option>
                  </select>
                  {errors.correctAnswer && (
                    <p className="text-red-500 text-sm mt-1">{errors.correctAnswer.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation (Optional)
                  </label>
                  <textarea
                    className="input-field"
                    rows="2"
                    {...register('explanation')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    className="input-field"
                    {...register('difficulty', { required: 'Difficulty is required' })}
                  >
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advance">Advance</option>
                  </select>
                </div>
                
                {editingQuestion && (
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
                    {isUploading ? 'Uploading...' : (editingQuestion ? 'Update' : 'Create')}
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

export default Questions;


