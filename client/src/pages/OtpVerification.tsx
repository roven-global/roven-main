import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Axios from '@/utils/Axios';
import SummaryApi from '../common/summaryApi';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const OTP_LENGTH = 6;

const OtpVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';
  const [email] = useState(emailFromState);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!emailFromState) {
      toast({
        title: "No email provided.",
        description: "Redirecting to forgot password page.",
        variant: "destructive",
      });
      navigate('/forgot-password');
    }
  }, [emailFromState, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value)) {
      const newOtp = [...otp];
      newOtp[idx] = value;
      setOtp(newOtp);
      if (idx < OTP_LENGTH - 1) {
        inputsRef.current[idx + 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const numbers = pastedData.replace(/\D/g, '').split('').slice(0, OTP_LENGTH);

    if (numbers.length > 0) {
      const newOtp = [...otp];
      numbers.forEach((num, idx) => {
        if (idx < OTP_LENGTH) {
          newOtp[idx] = num;
        }
      });
      setOtp(newOtp);

      // Focus on the next empty field or the last field
      const nextEmptyIndex = newOtp.findIndex(val => val === '');
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : OTP_LENGTH - 1;
      inputsRef.current[focusIndex]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== OTP_LENGTH) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await Axios.post(SummaryApi.verify_forgot_password_otp.url, { email, otp: otpValue });
      toast({
        title: "Success",
        description: "OTP verified successfully. You can now reset your password.",
      });
      navigate('/reset-password', { state: { email } });
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err.response?.data?.message || 'Please try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "No email available",
        description: "Please go back to forgot password page.",
        variant: "destructive",
      });
      return;
    }

    setResending(true);
    try {
      await Axios.post(SummaryApi.forgot_password.url, { email });
      toast({
        title: "OTP Resent",
        description: "A new 6-digit code has been sent to your email.",
      });
      // Clear the OTP input fields
      setOtp(Array(OTP_LENGTH).fill(''));
      // Focus on the first input
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      toast({
        title: "Resend Failed",
        description: err.response?.data?.message || 'Failed to resend OTP. Please try again.',
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-cream">
      <Navigation />
      <div className="container mx-auto flex items-center justify-center py-24">
        <div className="bg-white rounded-2xl shadow-lg border border-warm-taupe p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-sans text-3xl font-bold text-deep-forest">Check Your Email</h1>
            <p className="text-forest mt-2">We've sent a 6-digit code to <span className="font-semibold text-sage">{email}</span>.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, idx) => (
                <Input
                  key={idx}
                  ref={el => (inputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(e, idx)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-2xl text-center rounded-lg border-2 border-warm-taupe bg-white text-deep-forest focus:ring-2 focus:ring-sage focus:border-sage"
                  disabled={loading}
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            <Button type="submit" size="lg" className="w-full bg-sage text-white hover:bg-forest rounded-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>
          <p className="text-center text-sm text-forest mt-6">
            Didn't receive a code?             <button
              type="button"
              onClick={handleResend}
              className="font-semibold text-sage hover:underline bg-transparent border-none cursor-pointer"
              disabled={resending}
            >
              {resending ? 'Sending...' : 'Resend'}
            </button>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OtpVerification;
