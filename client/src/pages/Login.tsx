import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Axios from '@/utils/Axios';
import SummaryApi from '../common/summaryApi';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { FcGoogle } from "react-icons/fc"; // A nice Google icon

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();
  const { fetchUserCart } = useCart();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setError('');
    setLoading(true);
    try {
      const response = await Axios({
        method: SummaryApi.login.method,
        url: SummaryApi.login.url,
        data: values,
      });
      
      if (response.data.data.accessToken) {
        localStorage.setItem('accesstoken', response.data.data.accessToken);
      }
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      localStorage.setItem('isLoggedIn', 'true');
      
      // Dispatch login event for CartContext
      window.dispatchEvent(new Event('loginStateChange'));
      
      const localCart = JSON.parse(localStorage.getItem('shimmer_cart') || '[]');
      if (localCart.length > 0) {
        await Axios.post(SummaryApi.mergeCart.url, { localCart });
        localStorage.removeItem('shimmer_cart');
      }
      
      await checkAuthStatus();
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${SummaryApi.googleLogin.url}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-luxury animate-fade-in py-12">
      <div className="bg-card shadow-elegant rounded-2xl p-8 w-full max-w-md border border-border animate-fade-in">
        <h2 className="text-3xl font-playfair font-bold mb-6 text-center text-transparent bg-gradient-to-r from-primary to-primary-glow bg-clip-text drop-shadow-lg">
          Login to Shimmer
        </h2>
        {error && <p className="text-destructive text-center mb-4 text-sm">{error}</p>}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                        tabIndex={-1}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mb-4 flex justify-between items-center text-sm">
              <a href="/forgot-password" className="text-primary hover:underline font-medium">Forgot password?</a>
            </div>
            <div className="mb-6 text-center text-sm text-muted-foreground">
              No account? <a href="/register" className="text-primary hover:underline font-medium">Register.</a>
            </div>
            <Button
              type="submit"
              variant="luxury"
              className="w-full text-lg font-semibold shadow-luxury"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
          <FcGoogle className="mr-2 h-5 w-5" />
          Google
        </Button>
      </div>
    </div>
  );
};

export default Login;