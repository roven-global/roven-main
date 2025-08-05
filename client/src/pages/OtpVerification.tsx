import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Axios from '@/utils/Axios';
import SummaryApi from '../common/summaryApi';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-luxury animate-fade-in py-12">
      <form onSubmit={handleSubmit} className="bg-card shadow-elegant rounded-2xl p-8 w-full max-w-md border border-border animate-fade-in">
        <h2 className="text-3xl font-playfair font-bold mb-6 text-center text-transparent bg-gradient-to-r from-primary to-primary-glow bg-clip-text drop-shadow-lg">
          OTP Verification
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Enter the code sent to <span className="font-semibold text-primary">{email}</span> to reset your password.
        </p>
        {error && <p className="text-destructive text-center mb-4 text-sm">{error}</p>}
        {success && (
          <div className="flex items-center justify-center mb-4">
            <span className="text-green-500 mr-2 text-lg">✔</span>
            <span className="text-green-500 text-sm">{success}</span>
          </div>
        )}
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
              className="w-12 h-12 text-2xl text-center rounded-lg border-2 border-primary bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
              disabled={loading}
              autoFocus={idx === 0}
            />
          ))}
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-primary-glow text-white font-bold py-2 rounded-full hover:opacity-90 transition-colors text-lg shadow-luxury"
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
        <div className="mt-6 text-center">
          <span className="text-muted-foreground text-sm">Already have account? </span>
          <Link to="/login" className="text-primary hover:underline text-sm font-medium">Login</Link>
        </div>
      </form>
    </div>
  );
};

export default OtpVerification;
