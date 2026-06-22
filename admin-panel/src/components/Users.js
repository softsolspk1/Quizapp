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
  ShieldOff
} from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

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
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600">Manage user accounts and approvals</p>
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
                          <button
                            onClick={() => handleRoleChange(user.id, 'user')}
                            className="text-orange-600 hover:text-orange-900"
                            title="Remove Sub-Admin"
                          >
                            <ShieldOff className="h-5 w-5" />
                          </button>
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
    </div>
  );
};

export default Users;


