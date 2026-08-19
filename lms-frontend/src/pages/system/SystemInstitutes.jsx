import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instituteAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SystemInstitutes = () => {
  const { user } = useAuth();
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    email: '',
    phone: '',
    address: '',
    logoUrl: '',
    subscriptionPlan: 'BASIC'
  });

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const res = await instituteAPI.getAll();
      setInstitutes(res.data || []);
    } catch (error) {
      console.error('Failed to fetch institutes:', error);
      toast.error('Failed to load institutes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and Email are required');
      return;
    }
    setSubmitting(true);
    try {
      await instituteAPI.create(formData);
      toast.success('✅ Institute created successfully!');
      setShowModal(false);
      setFormData({
        name: '',
        registrationNumber: '',
        email: '',
        phone: '',
        address: '',
        logoUrl: '',
        subscriptionPlan: 'BASIC'
      });
      await fetchInstitutes();
    } catch (error) {
      console.error('Create error:', error);
      toast.error(error.response?.data || 'Failed to create institute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to ${newStatus} this institute?`)) return;
    
    setActionLoading(id);
    try {
      await instituteAPI.updateStatus(id, newStatus);
      toast.success(`Institute ${newStatus} successfully!`);
      await fetchInstitutes();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">🟢 ACTIVE</span>;
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">🟡 PENDING</span>;
      case 'SUSPENDED': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">🔴 SUSPENDED</span>;
      case 'EXPIRED': return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">⚪ EXPIRED</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b p-4 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</Link>
          <h1 className="text-xl font-bold text-blue-600">🏢 Institute Management</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
        >
          + Create Institute
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{institutes.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{institutes.filter(i => i.status === 'ACTIVE').length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{institutes.filter(i => i.status === 'PENDING').length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Suspended</p>
            <p className="text-2xl font-bold text-red-600">{institutes.filter(i => i.status === 'SUSPENDED').length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {institutes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No institutes found</td>
                  </tr>
                ) : (
                  institutes.map((inst) => (
                    <tr key={inst.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-600">#{inst.id}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{inst.name}</td>
                      <td className="px-6 py-3 text-gray-600">{inst.email}</td>
                      <td className="px-6 py-3">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          {inst.subscriptionPlan}
                        </span>
                      </td>
                      <td className="px-6 py-3">{getStatusBadge(inst.status)}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleStatusChange(inst.id, inst.status)}
                          disabled={actionLoading === inst.id}
                          className={`px-3 py-1 rounded-lg text-white text-xs font-medium transition ${
                            actionLoading === inst.id ? 'bg-gray-400' :
                            inst.status === 'ACTIVE' ? 'bg-red-600 hover:bg-red-700' :
                            'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {actionLoading === inst.id ? '...' : inst.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Institute</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input name="logoUrl" value={formData.logoUrl} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="https://example.com/logo.png" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                <select name="subscriptionPlan" value={formData.subscriptionPlan} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="BASIC">BASIC</option>
                  <option value="STANDARD">STANDARD</option>
                  <option value="PREMIUM">PREMIUM</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                  {submitting ? 'Creating...' : 'Create Institute'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemInstitutes;