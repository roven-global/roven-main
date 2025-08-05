import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Axios from '@/utils/Axios';
import SummaryApi from '../common/summaryApi';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    try {
      await Axios({
        method: SummaryApi.forgot_password.method,
        url: SummaryApi.forgot_password.url,
        data: { email },
      });
      // Redirect to OTP verification page with email
      navigate('/otp-verification', { state: { email } });
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to send reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-luxury animate-fade-in py-12">
      <form
        onSubmit={handleSubmit}
        className="bg-card shadow-elegant rounded-2xl p-8 w-full max-w-md border border-border animate-fade-in"
      >
        <h2 className="text-3xl font-playfair font-bold mb-6 text-center text-transparent bg-gradient-to-r from-primary to-primary-glow bg-clip-text drop-shadow-lg">
          Forgot Password
        </h2>
        {error && <p className="text-destructive text-center mb-4 text-sm">{error}</p>}
        <div className="mb-6">
          <label className="block text-muted-foreground mb-1 font-medium" htmlFor="email">Email</label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="bg-background border-input focus:ring-primary"
          />
        </div>
        <Button
          type="submit"
          variant="luxury"
          className="w-full text-lg font-semibold shadow-luxury"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
    </div>
  );
};

export default ForgotPassword;
