import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { feeAPI, parentStudentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FeePayment = () => {
  const { user } = useAuth();
  const parentId = user?.id;

  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingChildData, setLoadingChildData] = useState(false);

  // Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (parentId) {
      fetchChildren();
    }
  }, [parentId]);

  useEffect(() => {
    if (selectedChildId) {
      fetchChildFeesAndPayments(selectedChildId);
    } else {
      setFees([]);
      setPayments([]);
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      const res = await parentStudentAPI.getChildren(parentId);
      const list = res.data || [];
      setChildren(list);
      if (list.length > 0) {
        setSelectedChildId(String(list[0].id));
      }
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildFeesAndPayments = async (childId) => {
    setLoadingChildData(true);
    try {
      const [feesRes, paymentsRes] = await Promise.allSettled([
        feeAPI.getStudentFees(childId),
        feeAPI.getPayments(childId),
      ]);

      if (feesRes.status === 'fulfilled') {
        setFees(feesRes.value.data || []);
      } else {
        setFees([]);
      }

      if (paymentsRes.status === 'fulfilled') {
        setPayments(paymentsRes.value.data || []);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Failed to load fee details:', error);
      toast.error('Failed to load fee information');
    } finally {
      setLoadingChildData(false);
    }
  };

  const handleOpenPaymentModal = (fee) => {
    setSelectedFee(fee);
    const due = fee.amount ? (fee.amount - (fee.paidAmount || 0)) : 0;
    setPaymentAmount(due > 0 ? due.toString() : '0');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setProcessing(true);
    try {
      await feeAPI.recordPayment(
        selectedFee.id,
        amt,
        parentId,
        paymentMethod
      );
      toast.success('🎉 Fee payment processed successfully!');
      setShowPaymentModal(false);
      setSelectedFee(null);
      await fetchChildFeesAndPayments(selectedChildId);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-800 rounded-full">✓ PAID</span>;
      case 'PARTIAL':
        return <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">⏳ PARTIAL</span>;
      case 'OVERDUE':
        return <span className="text-xs font-bold px-3 py-1 bg-red-100 text-red-800 rounded-full">⚠️ OVERDUE</span>;
      default:
        return <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">PENDING</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading fee portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-800 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-800">💳 Student Fee Payment</h1>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Child Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Select Child</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your child to view course fee statements and complete online payments.
            </p>
          </div>

          <div className="w-full md:w-72">
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {children.length === 0 ? (
                <option value="">No linked children</option>
              ) : (
                children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.firstName} {child.lastName} (ID: #{child.id})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Fees Statements */}
        {loadingChildData ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-3 text-slate-500 text-sm">Loading fee statements...</p>
          </div>
        ) : fees.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm mb-8">
            <div className="text-4xl mb-3">🧾</div>
            <h3 className="text-lg font-bold text-slate-800">No Fee Statements Found</h3>
            <p className="text-slate-500 text-sm mt-1">
              There are no fee statements issued for this student account.
            </p>
          </div>
        ) : (
          <div className="space-y-6 mb-8">
            <h3 className="text-lg font-bold text-slate-800">Course Fee Statements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fees.map((fee) => {
                const total = fee.amount || 0;
                const paid = fee.paidAmount || 0;
                const balance = Math.max(0, total - paid);

                return (
                  <div
                    key={fee.id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">
                          Fee #{fee.id}
                        </span>
                        {getStatusBadge(fee.status)}
                      </div>

                      <h4 className="text-base font-bold text-slate-800">
                        {fee.courseName || `Course Fee #${fee.courseId}`}
                      </h4>

                      <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Total Fee</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">${total.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Paid</p>
                          <p className="text-sm font-bold text-green-600 mt-0.5">${paid.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Balance</p>
                          <p className="text-sm font-bold text-red-600 mt-0.5">${balance.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      {balance > 0 ? (
                        <button
                          onClick={() => handleOpenPaymentModal(fee)}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          💳 Pay Now (${balance.toFixed(2)})
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-green-50 text-green-700 text-xs font-bold text-center rounded-xl">
                          ✓ Fully Settled
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Payment History Receipts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Receipt ID</th>
                    <th className="px-4 py-3">Fee ID</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">#{p.id}</td>
                      <td className="px-4 py-3 text-slate-600">Fee #{p.feeId}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">${p.amount?.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{p.paymentMethod || 'CARD'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">💳 Process Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs text-emerald-700 font-medium">
                  Settling Fee statement for <strong>{selectedFee.courseName || `Fee #${selectedFee.id}`}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="CARD">Credit / Debit Card 💳</option>
                  <option value="ONLINE">Online Banking 🌐</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer 🏛️</option>
                  <option value="CASH">Cash Deposit 💵</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeePayment;
