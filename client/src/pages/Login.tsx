import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Gift } from 'lucide-react';
import Axios from '@/utils/Axios';
import SummaryApi from '../common/summaryApi';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { FcGoogle } from "react-icons/fc";
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Login = () => {
  const [activeTab, setActiveTab] = useState('login'); // Toggle between 'login' and 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); // 1 for name/email, 2 for password
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();
  const { fetchUserCart } = useCart();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoginError('');
    setLoginLoading(true);
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

      window.dispatchEvent(new Event('loginStateChange'));

      const localCart = JSON.parse(localStorage.getItem('shimmer_cart') || '[]');
      if (localCart.length > 0) {
        await Axios.post(SummaryApi.mergeCart.url, { localCart });
        localStorage.removeItem('shimmer_cart');
      }

      await checkAuthStatus();
      navigate('/');
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setRegisterError('');
    setRegisterLoading(true);
    try {
      await Axios({
        method: SummaryApi.register.method,
        url: SummaryApi.register.url,
        data: {
          name: values.name,
          email: values.email,
          password: values.password,
        },
      });

      // Auto login after successful registration
      await handleLogin({ email: values.email, password: values.password });
    } catch (err: any) {
      setRegisterError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleNextStep = () => {
    const { name, email } = registerForm.getValues();
    if (!name || !email) {
      setRegisterError('Please fill in your name and email address');
      return;
    }
    if (!registerForm.formState.errors.name && !registerForm.formState.errors.email) {
      setRegisterStep(2);
      setRegisterError('');
    }
  };

  const handlePreviousStep = () => {
    setRegisterStep(1);
    setRegisterError('');
  };

  const handleGoogleLogin = () => {
    window.location.href = `${SummaryApi.googleLogin.url}`;
  };

  // Reset register step when switching tabs
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (newTab === 'register') {
      setRegisterStep(1);
      setRegisterError('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Header Banner - Matching The Beer Beauty Design */}
      <div className="relative bg-gradient-to-r from-orange-500 to-pink-500 py-24">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            My Account
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Login Section - Only show when activeTab is 'login' */}
            {activeTab === 'login' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 h-[450px] flex flex-col">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">LOGIN</h2>

                {loginError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm text-center">{loginError}</p>
                  </div>
                )}

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="flex-1 flex flex-col">
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700">
                              Username or email address <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your email"
                                {...field}
                                className="h-11 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700">
                              Password <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Enter your password"
                                  {...field}
                                  className="h-11 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg transition-all duration-200 pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword((prev) => !prev)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
                                  tabIndex={-1}
                                >
                                  {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="remember"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                          />
                          <label htmlFor="remember" className="text-sm text-gray-600">
                            Remember me
                          </label>
                        </div>
                        <Link to="/forgot-password" className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors duration-200">
                          Lost your password?
                        </Link>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 mt-auto"
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          LOG IN
                        </div>
                      ) : (
                        'LOG IN'
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* Register Section - Only show when activeTab is 'register' */}
            {activeTab === 'register' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 h-[450px] flex flex-col">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">REGISTER</h2>


                {registerError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm text-center">{registerError}</p>
                  </div>
                )}

                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="flex-1 flex flex-col">
                    <div className="flex-1 space-y-4">
                      {registerStep === 1 && (
                        <>
                          <FormField
                            control={registerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700">
                                  Full Name <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your full name"
                                    {...field}
                                    className="h-11 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg transition-all duration-200"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700">
                                  Email address <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your email"
                                    {...field}
                                    className="h-11 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg transition-all duration-200"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      {registerStep === 2 && (
                        <>
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700">
                                  Password <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showPassword ? 'text' : 'password'}
                                      placeholder="Create a strong password"
                                      {...field}
                                      className="h-11 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg transition-all duration-200 pr-12"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword((prev) => !prev)}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
                                      tabIndex={-1}
                                    >
                                      {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700">
                                  Confirm Password <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showConfirmPassword ? 'text' : 'password'}
                                      placeholder="Confirm your password"
                                      {...field}
                                      className="h-11 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg transition-all duration-200 pr-12"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
                                      tabIndex={-1}
                                    >
                                      {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mt-4">
                      Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our privacy policy.
                    </div>

                    <div className="flex justify-between mt-4">
                      {registerStep > 1 && (
                        <Button
                          type="button"
                          onClick={handlePreviousStep}
                          className="w-full h-11 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Previous
                        </Button>
                      )}
                      {registerStep < 2 && (
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Next
                        </Button>
                      )}
                      {registerStep === 2 && (
                        <Button
                          type="submit"
                          className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                          disabled={registerLoading}
                        >
                          {registerLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Creating account...
                            </div>
                          ) : (
                            'REGISTER'
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Toggle Section - Always visible on the right */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 h-[450px] flex flex-col">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                {activeTab === 'login' ? 'REGISTER' : 'LOGIN'}
              </h2>

              <div className="text-center flex-1 flex flex-col justify-center">
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  {activeTab === 'login'
                    ? "Registering for this site allows you to access your order status and history. Just fill in the fields below, and we'll get a new account set up for you in no time. We will only ask you for information necessary to make the purchase process faster and easier."
                    : "Already have an account? Sign in to access your order history and manage your account."
                  }
                </p>
              </div>

              <Button
                onClick={() => handleTabChange(activeTab === 'login' ? 'register' : 'login')}
                className={`w-full h-11 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ${activeTab === 'login'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
              >
                {activeTab === 'login' ? 'REGISTER' : 'LOGIN'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;