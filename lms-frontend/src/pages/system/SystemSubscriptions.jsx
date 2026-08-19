import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instituteAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SystemSubscriptions = () => {
  const { user } = useAuth();
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterPlan, setFilterPlan] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await instituteAPI.getAllSubscriptions();
      setInstitutes(res.data || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (instituteId, newPlan) => {
    if (!window.confirm(`Are you sure you want to change this institute's plan to ${newPlan}?`)) return;
    
    setActionLoading(instituteId);
    try {
      await instituteAPI.updateSubscription(instituteId, newPlan);
      toast.success(`✅ Subscription updated to ${newPlan}!`);
      await fetchSubscriptions();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data || 'Failed to update subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'BASIC': return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">BASIC</span>;
      case 'STANDARD': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">STANDARD</span>;
      case 'PREMIUM': return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">PREMIUM</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">{plan}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">🟢 ACTIVE</span>;
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">🟡 PENDING</span>;
      case 'SUSPENDED': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">🔴 SUSPENDED</span>;
      case 'EXPIRED': return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">⚪ EXPIRED</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const isExpiringSoon = (endDate) => {
    if (!endDate) return false;
    const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft >= 0;
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return 'N/A';
    const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'Expired';
    return `${daysLeft} days`;
  };

  const filteredInstitutes = filterPlan 
    ? institutes.filter(i => i.subscriptionPlan === filterPlan)
    : institutes;

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
          <h1 className="text-xl font-bold text-blue-600">💳 Subscriptions</h1>
        </div>
        <span className="text-sm text-gray-500">{filteredInstitutes.length} institutes</span>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{institutes.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">BASIC</p>
            <p className="text-2xl font-bold text-gray-600">{institutes.filter(i => i.subscriptionPlan === 'BASIC').length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">STANDARD</p>
            <p className="text-2xl font-bold text-blue-600">{institutes.filter(i => i.subscriptionPlan === 'STANDARD').length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">PREMIUM</p>
            <p className="text-2xl font-bold text-purple-600">{institutes.filter(i => i.subscriptionPlan === 'PREMIUM').length}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by Plan:</span>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Plans</option>
              <option value="BASIC">BASIC</option>
              <option value="STANDARD">STANDARD</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>
            {filterPlan && (
              <button
                onClick={() => setFilterPlan('')}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institute</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInstitutes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">No institutes found</td>
                  </tr>
                ) : (
                  filteredInstitutes.map((inst) => {
                    const expiring = isExpiringSoon(inst.subscriptionEndDate);
                    return (
                      <tr key={inst.id} className={`hover:bg-gray-50 transition ${expiring ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 text-gray-500">#{inst.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{inst.name}</td>
                        <td className="px-4 py-3">{getPlanBadge(inst.subscriptionPlan)}</td>
                        <td className="px-4 py-3">{getStatusBadge(inst.status)}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {inst.subscriptionStartDate ? new Date(inst.subscriptionStartDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {inst.subscriptionEndDate ? new Date(inst.subscriptionEndDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${expiring ? 'text-red-600' : 'text-gray-600'}`}>
                            {getDaysLeft(inst.subscriptionEndDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={inst.subscriptionPlan}
                            onChange={(e) => handlePlanChange(inst.id, e.target.value)}
                            disabled={actionLoading === inst.id}
                            className={`px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              actionLoading === inst.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="BASIC">BASIC</option>
                            <option value="STANDARD">STANDARD</option>
                            <option value="PREMIUM">PREMIUM</option>
                          </select>
                          {actionLoading === inst.id && (
                            <span className="text-xs text-gray-400 ml-1">Updating...</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSubscriptions;