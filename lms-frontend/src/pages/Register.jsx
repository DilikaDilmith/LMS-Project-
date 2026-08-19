import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { instituteAPI } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'ROLE_STUDENT',
    instituteId: ''
  });

  const [institutes, setInstitutes] = useState([]);
  const [loadingInstitutes, setLoadingInstitutes] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

const DEFAULT_INSTITUTES = [
  { id: 1, name: 'Greenwood Academy' },
  { id: 2, name: 'Sunrise College' }
];

  useEffect(() => {
    const loadInstitutes = async () => {
      try {
        let list = [];
        try {
          const res = await instituteAPI.getPublic();
          list = Array.isArray(res.data) ? res.data : [];
        } catch {
          list = DEFAULT_INSTITUTES;
        }

        const available = list.length > 0
          ? list.filter((inst) => inst.status !== 'SUSPENDED' && inst.status !== 'EXPIRED')
          : DEFAULT_INSTITUTES;

        const finalInstitutes = available.length > 0 ? available : DEFAULT_INSTITUTES;
        setInstitutes(finalInstitutes);
        setFormData((prev) => ({
          ...prev,
          instituteId: prev.instituteId ? prev.instituteId : String(finalInstitutes[0].id)
        }));
      } catch (error) {
        console.error('Failed to load institutes:', error);
        setInstitutes(DEFAULT_INSTITUTES);
        setFormData((prev) => ({
          ...prev,
          instituteId: String(DEFAULT_INSTITUTES[0].id)
        }));
      } finally {
        setLoadingInstitutes(false);
      }
    };

    loadInstitutes();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.instituteId) {
      setError('Please select an institute from the list.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        instituteId: Number(formData.instituteId)
      };
      const success = await register(payload);

      if (success) {
        setRegistered(true); // Show pending approval screen instead of redirect
      } else {
        setError('Registration failed. Please check your details.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show pending approval success screen
  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-green-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>
        <div className="relative w-full max-w-lg">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20 text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</h2>
            <p className="text-slate-500 text-sm mb-6">Your account has been created successfully.</p>

            {/* Pending Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Awaiting Institute Admin Approval</p>
                  <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                    Your registration request has been sent to your Institute Admin for review.
                    <strong> You cannot log in until your Institute Admin approves your account.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">What Happens Next?</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">1</span>
                  Your Institute Admin reviews your registration
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">2</span>
                  Admin approves or rejects your account
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">3</span>
                  Once approved, you can log in with your username &amp; password
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                Go to Login Page
              </Link>
              <p className="text-xs text-slate-400">
                Registered as: <span className="font-semibold text-slate-600">@{formData.username}</span> ·
                Role: <span className="font-semibold text-slate-600">{formData.role.replace('ROLE_', '')}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Background Decorations */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>

      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl"></div>

      {/* Main Container */}
      <div className="relative w-full max-w-2xl">

        {/* Brand */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">

            <svg
              className="w-9 h-9 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M12 14l9-5-9-5-9 5 9 5z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M12 14l6.16-3.42A12.08 12.08 0 0118 16.5c0 1.66-2.69 3-6 3s-6-1.34-6-3c0-2.3.71-4.47 2-6.28"
              />
            </svg>

          </div>

          <h1 className="text-3xl font-bold text-white">
            LMS Portal
          </h1>

          <p className="text-slate-400 mt-2 text-sm">
            Create your learning account
          </p>

        </div>

        {/* Register Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-10 border border-white/20">

          {/* Header */}
          <div className="mb-8">

            <h2 className="text-2xl font-bold text-slate-900">
              Create an account
            </h2>

            <p className="text-slate-500 text-sm mt-1">
              Fill in your details — your Institute Admin must approve before you can log in
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">

              <svg
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              <p className="text-sm font-medium">
                {error}
              </p>

            </div>
          )}

          {/* Approval Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
            After registration, your account stays <strong>pending</strong> until your Institute Admin approves it.
            You will not be able to log in until then.
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Personal Information */}
            <div>

              <div className="flex items-center gap-3 mb-4">

                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>

                <h3 className="font-semibold text-slate-800">
                  Personal Information
                </h3>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* First Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    First Name
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    required
                  />
                </div>

              </div>

            </div>

            {/* Account Information */}
            <div>

              <div className="flex items-center gap-3 mb-4">

                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">

                  <svg
                    className="w-4 h-4 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 20a7 7 0 0114 0"
                    />
                  </svg>

                </div>

                <h3 className="font-semibold text-slate-800">
                  Account Information
                </h3>

              </div>

              <div className="space-y-5">

                {/* Username */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Username
                  </label>

                  <div className="relative">

                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">

                      <svg
                        className="w-5 h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>

                    </div>

                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      required
                    />

                  </div>

                </div>

                {/* Email */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>

                  <div className="relative">

                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">

                      <svg
                        className="w-5 h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>

                    </div>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      required
                    />

                  </div>

                </div>

                {/* Password */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>

                  <div className="relative">

                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">

                      <svg
                        className="w-5 h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>

                    </div>

                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-7-9-7a16.3 16.3 0 013.08-3.72M9.88 9.88a3 3 0 104.24 4.24M6.1 6.1A10.45 10.45 0 0112 5c5 0 9 7 9 7a16.2 16.2 0 01-3.17 3.82M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />

                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            strokeWidth="1.8"
                          />
                        </svg>
                      )}
                    </button>

                  </div>

                </div>

              </div>

            </div>

            {/* Contact & Role */}
            <div>

              <div className="flex items-center gap-3 mb-4">

                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">

                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-5a4 4 0 100-8 4 4 0 000 8zm6 3a3 3 0 10-6 0"
                    />
                  </svg>

                </div>

                <h3 className="font-semibold text-slate-800">
                  Contact & Role
                </h3>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Phone */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="07X XXXXXXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                </div>

                {/* Role */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Account Role
                  </label>

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
                  >
                    <option value="ROLE_STUDENT">
                      Student
                    </option>

                    <option value="ROLE_LECTURER">
                      Lecturer
                    </option>

                    <option value="ROLE_PARENT">
                      Parent
                    </option>
                  </select>

                </div>

              </div>

            </div>

            {/* Institute */}
            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Institute
              </label>

              <select
                name="instituteId"
                value={formData.instituteId}
                onChange={handleChange}
                required
                disabled={loadingInstitutes || institutes.length === 0}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer disabled:opacity-60"
              >
                <option value="">
                  {loadingInstitutes ? 'Loading institutes...' : 'Select your institute'}
                </option>
                {institutes.map((institute) => (
                  <option key={institute.id} value={institute.id}>
                    {institute.name}
                  </option>
                ))}
              </select>

              {!loadingInstitutes && institutes.length === 0 && (
                <p className="text-xs text-red-500 mt-2">
                  No institutes are available for registration right now. Please contact support.
                </p>
              )}

              <p className="text-xs text-slate-400 mt-2">
                Choose the institute you belong to. Your registration will be sent to that institute&apos;s admin for approval.
              </p>

            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">

              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <p className="text-sm text-slate-500">
                I agree to the LMS terms and conditions and confirm that
                the information provided is correct.
              </p>

            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading || loadingInstitutes || institutes.length === 0 || !formData.instituteId}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-600/35 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >

              {loading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>

                  Creating Account...
                </>
              ) : (
                <>
                  Create Account

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}

            </button>

          </form>

          {/* Login Link */}
          <div className="mt-7 pt-6 border-t border-slate-100 text-center">

            <p className="text-sm text-slate-500">

              Already have an account?

              <Link
                to="/login"
                className="ml-1 font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Sign in
              </Link>

            </p>

          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 LMS Portal. All rights reserved.
        </p>

      </div>

    </div>
  );
};

export default Register;