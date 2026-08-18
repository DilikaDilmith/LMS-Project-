import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { feeAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const FeePayment = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const role = user?.role;

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const res = await feeAPI.getStudentFees(userId);
      setFees(res.data || []);
    } catch (error) {
      console.error('Failed to fetch fees:', error);
      toast.error('Failed to load fee details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (feeId) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const fee = fees.find(f => f.id === feeId);
    if (!fee) return;

    const remaining = fee.totalAmount - fee.paidAmount;
    if (parseFloat(paymentAmount) > remaining) {
      toast.error(`Amount cannot exceed remaining balance: LKR ${remaining}`);
      return;
    }

    setProcessing(feeId);
    try {
      await feeAPI.recordPayment(
        feeId,
        parseFloat(paymentAmount),
        userId,
        'CASH'
      );
      toast.success('✅ Payment recorded successfully!');
      setPaymentAmount('');
      setSelectedFee(null);
      await fetchFees();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data || 'Payment failed!');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fee details...</p>
        </div>
      </div>
    );
  }

  const totalPending = fees.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b p-4 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</Link>
          <h1 className="text-xl font-bold text-green-600">💰 Fee Management</h1>
        </div>
        <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
          {role === 'ROLE_PARENT' ? 'Parent View' : 'Student View'}
        </span>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Fees</p>
            <p className="text-2xl font-bold text-gray-800">LKR {fees.reduce((sum, f) => sum + f.totalAmount, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">LKR {fees.reduce((sum, f) => sum + f.paidAmount, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending Balance</p>
            <p className={`text-2xl font-bold ${totalPending > 0 ? 'text-red-600' : 'text-green-600'}`}>
              LKR {totalPending.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Fee List */}
        {fees.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-lg font-semibold text-gray-700">No Fee Records</h3>
            <p className="text-gray-500 text-sm mt-1">You don't have any fees to pay.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fees.map((fee) => {
              const remaining = fee.totalAmount - fee.paidAmount;
              const isPaid = remaining <= 0;

              return (
                <div key={fee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">
                        Course #{fee.courseId}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Fee ID: #{fee.id}
                      </p>
                      <div className="flex flex-wrap gap-6 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <span className="font-semibold text-gray-800 ml-1">LKR {fee.totalAmount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Paid:</span>
                          <span className="font-semibold text-green-600 ml-1">LKR {fee.paidAmount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Remaining:</span>
                          <span className={`font-semibold ml-1 ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            LKR {remaining.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        fee.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        fee.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                        fee.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {fee.status}
                      </span>
                    </div>
                  </div>

                  {/* Payment Form (if not fully paid) */}
                  {!isPaid && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {selectedFee === fee.id ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Amount (LKR)</label>
                            <input
                              type="number"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder={`Max: ${remaining}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                              min="1"
                              max={remaining}
                            />
                          </div>
                          <div className="flex gap-2 mt-2 sm:mt-0">
                            <button
                              onClick={() => handlePayment(fee.id)}
                              disabled={processing === fee.id}
                              className={`px-5 py-2 rounded-lg text-white text-sm font-medium transition ${
                                processing === fee.id ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {processing === fee.id ? 'Processing...' : '✅ Pay Now'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFee(null);
                                setPaymentAmount('');
                              }}
                              className="px-4 py-2 rounded-lg text-gray-600 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedFee(fee.id)}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                        >
                          💳 Make Payment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeePayment;