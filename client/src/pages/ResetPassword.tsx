import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Axios from '@/utils/Axios';
import SummaryApi from '../common/summaryApi';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';
  const [email] = useState(emailFromState);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await Axios({
        method: SummaryApi.reset_password.method,
        url: SummaryApi.reset_password.url,
        data: { email, password },
      });
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-cream">
      <Navigation />
      <div className="container mx-auto flex items-center justify-center py-24">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md border border-warm-taupe"
        >
          <h2 className="text-3xl font-playfair font-bold mb-6 text-center text-deep-forest">
            Reset Password
          </h2>
          <p className="text-deep-forest/80 text-center mb-6">
            Reset password for <span className="font-semibold text-forest">{email}</span>
          </p>
          {error && <p className="text-red-600 text-center mb-4 text-sm">{error}</p>}
          {success && <p className="text-sage-dark text-center mb-4 text-sm">{success}</p>}
          <div className="mb-5 relative">
            <label className="block text-deep-forest/90 mb-1 font-medium" htmlFor="password">New Password</label>
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="bg-white border-warm-taupe focus:ring-sage-light focus:border-sage pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-9 text-warm-taupe hover:text-soft-bronze"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="mb-6 relative">
            <label className="block text-deep-forest/90 mb-1 font-medium" htmlFor="confirmPassword">Confirm Password</label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="bg-white border-warm-taupe focus:ring-sage-light focus:border-sage pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3 top-9 text-warm-taupe hover:text-soft-bronze"
              tabIndex={-1}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <Button
            type="submit"
            className="w-full text-lg font-semibold bg-sage hover:bg-forest text-white rounded-lg transition-all duration-300"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
