import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  XCircle,
  Eye,
  Search,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  Plus,
  Download,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleFormData, setRoleFormData] = useState({ userId: null, role: 'user', permissions: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    doctorName: '',
    designation: '',
    highestQualification: '',
    specialty: '',
    hospitalName: '',
    pmdcNumber: '',
    city: '',
    phoneNumber: '',
    email: '',
    password: '',
    role: 'user',
    permissions: []
  });

  const availableFeatures = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users' },
    { id: 'categories', label: 'Categories' },
    { id: 'questions', label: 'Questions' },
    { id: 'pins', label: 'PINs' },
    { id: 'banners', label: 'Banners' },
    { id: 'broadcast', label: 'Broadcast' },
    { id: 'winners', label: 'Winners' },
    { id: 'analytics', label: 'Analytics' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditInputChange = (e) => {
    setSelectedUser({
      ...selectedUser,
      [e.target.name]: e.target.value
    });
  };

  const handlePermissionToggle = (featureId, isRoleModal = false) => {
    if (isRoleModal) {
      setRoleFormData(prev => {
        const current = prev.permissions || [];
        const updated = current.includes(featureId)
          ? current.filter(id => id !== featureId)
          : [...current, featureId];
        return { ...prev, permissions: updated };
      });
    } else {
      setFormData(prev => {
        const current = prev.permissions || [];
        const updated = current.includes(featureId)
          ? current.filter(id => id !== featureId)
          : [...current, featureId];
        return { ...prev, permissions: updated };
      });
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/users', formData);
      toast.success('User created successfully');
      setShowAddUserModal(false);
      setFormData({
        doctorName: '', designation: '', specialty: '', hospitalName: '',
        pmdcNumber: '', city: '', phoneNumber: '', email: '', password: '', role: 'user', permissions: []
      });
      loadUsers();
    } catch (error) {
      const errMsg = error.response?.data?.errors 
        ? error.response.data.errors[0].msg 
        : (error.response?.data?.message || 'Failed to create user');
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...selectedUser };
      if (!payload.password) {
        delete payload.password;
      }
      await axios.put(`/api/users/${selectedUser.id}`, payload);
      toast.success('User updated successfully');
      setShowEditUserModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        toast.success('User deleted successfully');
        loadUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.put(`/api/users/${userId}/approve`);
      toast.success('User approved successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleActivate = async (userId) => {
    try {
      await axios.put(`/api/users/${userId}/activate`);
      toast.success('User activated successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await axios.put(`/api/users/${userId}/deactivate`);
      toast.success('User deactivated successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (newRole === 'subadmin') {
      const user = users.find(u => u.id === userId);
      setRoleFormData({ userId, role: 'subadmin', permissions: user?.permissions || [] });
      setShowRoleModal(true);
      return;
    }
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const submitRoleChange = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.put(`/api/users/${roleFormData.userId}/role`, { 
        role: roleFormData.role,
        permissions: roleFormData.permissions
      });
      toast.success(`User role updated to ${roleFormData.role}`);
      setShowRoleModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'pending' && !user.isApproved) ||
                         (filterStatus === 'approved' && user.isApproved) ||
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const exportToExcel = () => {
    const dataToExport = filteredUsers.map(user => ({
      'Doctor Name': user.doctorName,
      'Designation': user.designation,
      'Specialty': user.specialty,
      'Hospital': user.hospitalName,
      'PMDC Number': user.pmdcNumber,
      'City': user.city,
      'Phone': user.phoneNumber,
      'Email': user.email,
      'Role': user.role,
      'Status': user.isActive ? (user.isApproved ? 'Active' : 'Pending') : 'Inactive',
      'Total Points': user.totalPoints,
      'Games Played': user.gamesPlayed
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users_export.xlsx");
    toast.success('Excel exported successfully');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Users Report", 14, 15);
    
    const tableColumn = ["Name", "Specialty", "Hospital", "PMDC", "Role", "Points"];
    const tableRows = [];

    filteredUsers.forEach(user => {
      const userData = [
        user.doctorName,
        user.specialty,
        user.hospitalName,
        user.pmdcNumber,
        user.role,
        user.totalPoints
      ];
      tableRows.push(userData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save("users_export.pdf");
    toast.success('PDF exported successfully');
  };

  const getStatusBadge = (user) => {
    if (!user.isApproved) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
    }
    if (!user.isActive) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>;
    }
    if (role === 'subadmin') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Sub-Admin</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">User</span>;
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
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Manage user accounts and approvals</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="h-5 w-5" />
            Excel
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
          >
            <FileText className="h-5 w-5" />
            PDF
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add User
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
                placeholder="Search users..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Doctor Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Specialty</th>
                <th className="table-header">Hospital</th>
                <th className="table-header">PMDC #</th>
                <th className="table-header">Role & Status</th>
                <th className="table-header">Points</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">{user.doctorName}</div>
                      <div className="text-sm text-gray-500">{user.designation}</div>
                    </div>
                  </td>
                  <td className="table-cell">{user.email}</td>
                  <td className="table-cell">{user.specialty}</td>
                  <td className="table-cell">{user.hospitalName}</td>
                  <td className="table-cell">{user.pmdcNumber}</td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1 items-start">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user)}
                    </div>
                  </td>
                  <td className="table-cell font-semibold text-primary-600">{user.totalPoints}</td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      {!user.isApproved && (
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Approve User"
                        >
                          <UserCheck className="h-5 w-5" />
                        </button>
                      )}
                      {user.isActive ? (
                        <button
                          onClick={() => handleDeactivate(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Deactivate User"
                        >
                          <UserX className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Activate User"
                        >
                          <UserCheck className="h-5 w-5" />
                        </button>
                      )}
                      
                      {user.role !== 'admin' && (
                        user.role === 'subadmin' ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setRoleFormData({ userId: user.id, role: 'subadmin', permissions: user.permissions || [] });
                                setShowRoleModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Permissions"
                            >
                              <Shield className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleRoleChange(user.id, 'user')}
                              className="text-orange-600 hover:text-orange-900"
                              title="Remove Sub-Admin"
                            >
                              <ShieldOff className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(user.id, 'subadmin')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Make Sub-Admin"
                          >
                            <Shield className="h-5 w-5" />
                          </button>
                        )
                      )}

                        <button
                          onClick={() => {
                            setSelectedUser({ ...user, password: '' });
                            setShowEditUserModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit User"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Doctor Name</label>
                  <p className="text-sm text-gray-900">{selectedUser.doctorName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <p className="text-sm text-gray-900">{selectedUser.designation}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialty</label>
                  <p className="text-sm text-gray-900">{selectedUser.specialty}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital</label>
                  <p className="text-sm text-gray-900">{selectedUser.hospitalName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PMDC Number</label>
                  <p className="text-sm text-gray-900">{selectedUser.pmdcNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <p className="text-sm text-gray-900">{selectedUser.city}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{selectedUser.phoneNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statistics</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div>
                      <p className="text-xs text-gray-500">Total Points</p>
                      <p className="text-sm font-semibold text-primary-600">{selectedUser.totalPoints}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Games Played</p>
                      <p className="text-sm font-semibold">{selectedUser.gamesPlayed}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Doctor Name</label>
                    <input type="text" name="doctorName" required value={formData.doctorName} onChange={handleInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="text" name="password" required minLength="6" value={formData.password} onChange={handleInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="mt-1 input-field">
                      <option value="user">User / Doctor</option>
                      <option value="subadmin">Sub-Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <input type="text" name="designation" required value={formData.designation} onChange={handleInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Specialty</label>
                    <select name="specialty" required value={formData.specialty} onChange={handleInputChange} className="mt-1 input-field">
                      <option value="">Select Specialty</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Endocrinology & Diabetes">Endocrinology & Diabetes</option>
                      <option value="ER">ER</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                      <option value="Gynaecology">Gynaecology</option>
                      <option value="Internal Medicine">Internal Medicine</option>
                      <option value="Nephrology">Nephrology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopaedic">Orthopaedic</option>
                      <option value="Paediatrics">Paediatrics</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Pulmonology">Pulmonology</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                    <input type="text" name="hospitalName" required value={formData.hospitalName} onChange={handleInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">PMDC Number</label>
                    <input type="text" name="pmdcNumber" required value={formData.pmdcNumber} onChange={handleInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <select name="city" required value={formData.city} onChange={handleInputChange} className="mt-1 input-field">
                      <option value="">Select City</option>
                      {['Abbottabad', 'Bahawalpur', 'Chiniot', 'Dera Ghazi Khan', 'Dera Ismail Khan',
                        'Faisalabad', 'Gilgit', 'Gujranwala', 'Gujrat', 'Hyderabad',
                        'Islamabad', 'Jacobabad', 'Jhang', 'Jhelum', 'Karachi',
                        'Kasur', 'Khairpur', 'Lahore', 'Larkana', 'Mardan',
                        'Mingora', 'Mirpur Khas', 'Multan', 'Muzaffarabad', 'Nawabshah',
                        'Okara', 'Peshawar', 'Quetta', 'Rahim Yar Khan', 'Rawalpindi',
                        'Sadiqabad', 'Sahiwal', 'Sargodha', 'Sheikhupura', 'Shikarpur',
                        'Sialkot', 'Sukkur', 'Vehari'].map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="text" name="phoneNumber" required value={formData.phoneNumber} onChange={handleInputChange} className="mt-1 input-field" />
                  </div>
                </div>

                {formData.role === 'subadmin' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Admin Permissions</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableFeatures.map(feature => (
                        <label key={feature.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions?.includes(feature.id)}
                            onChange={() => handlePermissionToggle(feature.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{feature.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Doctor Name</label>
                    <input type="text" name="doctorName" required value={selectedUser.doctorName || ''} onChange={handleEditInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" required value={selectedUser.email || ''} onChange={handleEditInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password (Optional)</label>
                    <input type="text" name="password" minLength="6" value={selectedUser.password || ''} onChange={handleEditInputChange} placeholder="Leave blank to keep current" className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <input type="text" name="designation" required value={selectedUser.designation || ''} onChange={handleEditInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Specialty</label>
                    <select name="specialty" required value={selectedUser.specialty || ''} onChange={handleEditInputChange} className="mt-1 input-field">
                      <option value="">Select Specialty</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Endocrinology & Diabetes">Endocrinology & Diabetes</option>
                      <option value="ER">ER</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                      <option value="Gynaecology">Gynaecology</option>
                      <option value="Internal Medicine">Internal Medicine</option>
                      <option value="Nephrology">Nephrology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopaedic">Orthopaedic</option>
                      <option value="Paediatrics">Paediatrics</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Pulmonology">Pulmonology</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                    <input type="text" name="hospitalName" required value={selectedUser.hospitalName || ''} onChange={handleEditInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">PMDC Number</label>
                    <input type="text" name="pmdcNumber" required value={selectedUser.pmdcNumber || ''} onChange={handleEditInputChange} className="mt-1 input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <select name="city" required value={selectedUser.city || ''} onChange={handleEditInputChange} className="mt-1 input-field">
                      <option value="">Select City</option>
                      {['Abbottabad', 'Bahawalpur', 'Chiniot', 'Dera Ghazi Khan', 'Dera Ismail Khan',
                        'Faisalabad', 'Gilgit', 'Gujranwala', 'Gujrat', 'Hyderabad',
                        'Islamabad', 'Jacobabad', 'Jhang', 'Jhelum', 'Karachi',
                        'Kasur', 'Khairpur', 'Lahore', 'Larkana', 'Mardan',
                        'Mingora', 'Mirpur Khas', 'Multan', 'Muzaffarabad', 'Nawabshah',
                        'Okara', 'Peshawar', 'Quetta', 'Rahim Yar Khan', 'Rawalpindi',
                        'Sadiqabad', 'Sahiwal', 'Sargodha', 'Sheikhupura', 'Shikarpur',
                        'Sialkot', 'Sukkur', 'Vehari'].map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="text" name="phoneNumber" required value={selectedUser.phoneNumber || ''} onChange={handleEditInputChange} className="mt-1 input-field" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Sub-Admin Permissions</h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={submitRoleChange} className="space-y-4">
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Accessible Features</label>
                  <div className="grid grid-cols-2 gap-4">
                    {availableFeatures.map(feature => (
                      <label key={feature.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleFormData.permissions?.includes(feature.id)}
                          onChange={() => handlePermissionToggle(feature.id, true)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 font-medium">{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Permissions'}
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

export default Users;


