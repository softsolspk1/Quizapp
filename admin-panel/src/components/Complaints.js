import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/support/complaints', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8">
      <div className="py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-gray-800">Support Complaints</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Doctor Name
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Complaint
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-10 text-center text-gray-500">
                        No complaints found.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-5 py-5 border-b border-gray-200 text-sm">
                          <p className="text-gray-900 whitespace-no-wrap">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 text-sm">
                          <p className="text-gray-900 font-semibold">Dr. {item.doctorName}</p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 text-sm">
                          <p className="text-gray-900">{item.email}</p>
                          <p className="text-gray-500 text-xs">{item.phoneNumber}</p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 text-sm">
                          <p className="text-gray-900">{item.specialty || 'N/A'}</p>
                          <p className="text-gray-500 text-xs">{item.hospitalName || 'N/A'}</p>
                          <p className="text-gray-500 text-xs">{item.city}</p>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 text-sm max-w-xs">
                          <p className="text-gray-900 truncate" title={item.complaint}>
                            {item.complaint}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Complaints;
