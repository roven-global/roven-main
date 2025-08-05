import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import Axios from '@/utils/Axios';
import SummaryApi from '../common/summaryApi';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { FcGoogle } from "react-icons/fc";

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(1, { message: "Password is required." }),
});

const registerSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

interface LoginModalProps {
    open: boolean;
    onClose: () => void;
}

const LoginModal = ({ open, onClose }: LoginModalProps) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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

            window.dispatchEvent(new Event('loginStateChange'));

            const localCart = JSON.parse(localStorage.getItem('shimmer_cart') || '[]');
            if (localCart.length > 0) {
                await Axios.post(SummaryApi.mergeCart.url, { localCart });
                localStorage.removeItem('shimmer_cart');
            }

            await checkAuthStatus();
            onClose();
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (values: z.infer<typeof registerSchema>) => {
        setError('');
        setLoading(true);
        try {
            const response = await Axios({
                method: SummaryApi.register.method,
                url: SummaryApi.register.url,
                data: {
                    name: values.name,
                    email: values.email,
                    password: values.password,
                },
            });

            if (response.data.success) {
                // Auto login after successful registration
                await handleLogin({ email: values.email, password: values.password });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${SummaryApi.googleLogin.url}`;
    };

    const handleClose = () => {
        setError('');
        setActiveTab('login');
        loginForm.reset();
        registerForm.reset();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md p-0 bg-white">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex justify-center items-center">
                        <DialogTitle className="text-2xl font-bold text-gray-900">My Account</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-6">
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    {/* Login Form */}
                    {activeTab === 'login' && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">LOGIN</h3>
                            <Form {...loginForm}>
                                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                                    <FormField
                                        control={loginForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">Username or email address *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your email" {...field} />
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
                                                <FormLabel className="text-sm font-medium">Password *</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? 'text' : 'password'}
                                                            placeholder="Enter your password"
                                                            {...field}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword((prev) => !prev)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2">
                                            <input type="checkbox" className="rounded" />
                                            <span className="text-sm text-gray-600">Remember me</span>
                                        </label>
                                        <a href="/forgot-password" className="text-orange-500 hover:underline text-sm font-medium">
                                            Lost your password?
                                        </a>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
                                        disabled={loading}
                                    >
                                        {loading ? 'Logging in...' : 'LOG IN'}
                                    </Button>
                                </form>
                            </Form>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full mt-4"
                                    onClick={handleGoogleLogin}
                                >
                                    <FcGoogle className="mr-2 h-5 w-5" />
                                    Google
                                </Button>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <button
                                        onClick={() => setActiveTab('register')}
                                        className="text-orange-500 hover:underline font-medium"
                                    >
                                        Register now
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Register Form */}
                    {activeTab === 'register' && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">REGISTER</h3>
                            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                Registering for this site allows you to access your order status and history.
                                Just fill in the fields below, and we'll get a new account set up for you in no time.
                                We will only ask you for information necessary to make the purchase process faster and easier.
                            </p>

                            <Form {...registerForm}>
                                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                                    <FormField
                                        control={registerForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">Full Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your full name" {...field} />
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
                                                <FormLabel className="text-sm font-medium">Email Address *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={registerForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">Password *</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? 'text' : 'password'}
                                                            placeholder="Enter your password"
                                                            {...field}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword((prev) => !prev)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                                    <FormField
                                        control={registerForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">Confirm Password *</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showConfirmPassword ? 'text' : 'password'}
                                                            placeholder="Confirm your password"
                                                            {...field}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                            tabIndex={-1}
                                                        >
                                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
                                        disabled={loading}
                                    >
                                        {loading ? 'Creating account...' : 'REGISTER'}
                                    </Button>
                                </form>
                            </Form>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full mt-4"
                                    onClick={handleGoogleLogin}
                                >
                                    <FcGoogle className="mr-2 h-5 w-5" />
                                    Google
                                </Button>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600">
                                    Already registered?{' '}
                                    <button
                                        onClick={() => setActiveTab('login')}
                                        className="text-orange-500 hover:underline font-medium"
                                    >
                                        Login now
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LoginModal; 