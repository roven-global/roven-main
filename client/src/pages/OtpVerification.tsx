import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Axios from '@/utils/Axios';
import SummaryApi from '../common/summaryApi';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const OTP_LENGTH = 6;

const OtpVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';
  const [email] = useState(emailFromState);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;
    const newOtp = [...otp];
    newOtp[idx] = val[val.length - 1];
    setOtp(newOtp);
    if (idx < OTP_LENGTH - 1 && val) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (otp[idx]) {
        const newOtp = [...otp];
        newOtp[idx] = '';
        setOtp(newOtp);
      } else if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    if (paste.length === OTP_LENGTH) {
      setOtp(paste.split(''));
      inputsRef.current[OTP_LENGTH - 1]?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const otpValue = otp.join('');
    if (!email || otpValue.length !== OTP_LENGTH) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await Axios({
        method: SummaryApi.verify_forgot_password_otp.method,
        url: SummaryApi.verify_forgot_password_otp.url,
        data: { email, otp: otpValue },
      });
      setSuccess('Code verified');
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 1200);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'OTP verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Header Banner - Consistent with Login/Forgot Password */}
      <div className="relative bg-gradient-to-r from-orange-500 to-pink-500 py-24">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            OTP Verification
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 h-[450px] flex flex-col w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">ENTER OTP</h2>
            <p className="text-gray-600 text-sm mb-6 text-center">
              Enter the 6-digit code sent to <span className="font-semibold text-orange-600">{email}</span> to reset your password.
            </p>
            {error && <p className="text-red-600 text-center mb-4 text-sm">{error}</p>}
            {success && (
              <div className="flex items-center justify-center mb-4">
                <span className="text-green-500 mr-2 text-lg">✔</span>
                <span className="text-green-500 text-sm">{success}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="flex justify-center mb-6 gap-2" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (inputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(e, idx)}
                    onKeyDown={e => handleKeyDown(e, idx)}
                    className="w-12 h-12 text-2xl text-center rounded-lg border-2 border-orange-500 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    disabled={loading}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 mt-auto"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <span className="text-gray-600 text-sm">Already have an account? </span>
              <Link to="/login" className="text-orange-600 hover:text-orange-700 text-sm font-medium">Login</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default OtpVerification;
