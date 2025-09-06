import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import Axios from "@/utils/Axios";
import SummaryApi from "../common/summaryApi";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Validation helpers
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^[6-9]\d{9}$/;
const isEmail = (val: string) => emailRegex.test(val.trim());
const isMobile = (val: string) => mobileRegex.test(val.trim());

const loginSchema = z.object({
  emailOrMobile: z
    .string()
    .min(1, { message: "Email or mobile number is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});
const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    emailOrMobile: z
      .string()
      .min(1, { message: "Email or mobile number is required." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const Login = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const navigate = useNavigate();
  const {
    loginUser,
    error: authError,
    clearError,
    isAuthenticated,
    loading,
  } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrMobile: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      emailOrMobile: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoginError("");
    clearError();
    setLoginLoading(true);
    try {
      const input = values.emailOrMobile.trim();
      const payload: any = {
        password: values.password,
      };
      if (isEmail(input)) payload.email = input;
      else if (isMobile(input)) payload.mobile = input;
      else {
        setLoginError("Please enter a valid email or mobile number.");
        setLoginLoading(false);
        return;
      }

      const success = await loginUser(payload);

      if (success) {
        navigate(from, { replace: true });
      } else {
        // Error is now set in the AuthContext, so we can use it here.
        // We'll set a local error for immediate feedback.
        setLoginError(
          authError || "Login failed. Please check your credentials."
        );
      }
    } catch (err: any) {
      setLoginError("An unexpected error occurred during login.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Registration API handler with debugging logs
  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setRegisterError("");
    setRegisterLoading(true);
    try {
      const input = values.emailOrMobile.trim();
      const payload: any = {
        name: values.name,
        password: values.password,
      };
      // Detect and assign email or mobile
      if (isEmail(input)) payload.email = input;
      else if (isMobile(input)) payload.mobile = input;
      else {
        setRegisterError(
          "Please enter a valid email address or 10-digit mobile number."
        );
        setRegisterLoading(false);
        return;
      }

      const response = await Axios({
        method: SummaryApi.register.method,
        url: SummaryApi.register.url,
        data: payload,
      });

      // Registration success: auto-login
      await handleLogin({
        emailOrMobile: values.emailOrMobile,
        password: values.password,
      });
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        "Registration failed. Please try again.";
      setRegisterError(errorMessage);
    } finally {
      setRegisterLoading(false);
    }
  };

  // Stepper for registration, 2-step UX
  const handleNextStep = () => {
    const { name, emailOrMobile } = registerForm.getValues();
    if (!name || !emailOrMobile) {
      setRegisterError("Please fill in your name and email or mobile number");
      return;
    }
    if (
      !registerForm.formState.errors.name &&
      !registerForm.formState.errors.emailOrMobile
    ) {
      setRegisterStep(2);
      setRegisterError("");
    }
  };
  const handlePreviousStep = () => {
    setRegisterStep(1);
    setRegisterError("");
  };

  const handleGoogleLogin = () => {
    window.location.href = `${SummaryApi.googleLogin.url}`;
  };

  // Switch tab resets form error and step
  const handleTabChange = (newTab: "login" | "register") => {
    setActiveTab(newTab);
    if (newTab === "register") {
      setRegisterStep(1);
      setRegisterError("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />
      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-primary/10 via-muted-brown/10 to-foreground/10 py-24">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
            My Account
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Login Section */}
            {activeTab === "login" && (
              <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-4 sm:p-6 lg:p-8 min-h-[450px] flex flex-col">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6 text-center">
                  LOGIN
                </h2>
                {loginError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive text-sm text-center">
                      {loginError}
                    </p>
                  </div>
                )}
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex-1 space-y-4">
                      {/* Email/Mobile */}
                      <FormField
                        control={loginForm.control}
                        name="emailOrMobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">
                              Email or mobile number{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your email or mobile number"
                                {...field}
                                className="h-11 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Password */}
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">
                              Password{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  {...field}
                                  className="h-11 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all duration-200 pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPassword((prev) => !prev)
                                  }
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-border hover:text-muted-brown transition-colors duration-200"
                                  tabIndex={-1}
                                >
                                  {showPassword ? (
                                    <FaEyeSlash className="h-5 w-5" />
                                  ) : (
                                    <FaEye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Remember + Forgot */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="remember"
                            checked={rememberMe}
                            onCheckedChange={(checked) =>
                              setRememberMe(checked as boolean)
                            }
                          />
                          <label
                            htmlFor="remember"
                            className="text-sm text-muted-brown"
                          >
                            Remember me
                          </label>
                        </div>
                        <Link
                          to="/forgot-password"
                          className="text-muted-brown hover:text-foreground text-sm font-medium transition-colors duration-200"
                        >
                          Lost your password?
                        </Link>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 mt-auto"
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                          LOG IN
                        </div>
                      ) : (
                        "LOG IN"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* Register Section */}
            {activeTab === "register" && (
              <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8 h-[450px] flex flex-col">
                <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
                  REGISTER
                </h2>
                {registerError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive text-sm text-center">
                      {registerError}
                    </p>
                  </div>
                )}
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(handleRegister)}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex-1 space-y-4">
                      {registerStep === 1 && (
                        <>
                          {/* Name */}
                          <FormField
                            control={registerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-foreground">
                                  Full Name{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your full name"
                                    {...field}
                                    className="h-11 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all duration-200"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {/* Email/Mobile */}
                          <FormField
                            control={registerForm.control}
                            name="emailOrMobile"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-foreground">
                                  Email or mobile number{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your email or mobile number"
                                    {...field}
                                    className="h-11 border-2 border-border focus:border-primary focus:ring-primary/20 rounded-lg transition-all duration-200"
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
                          {/* Password */}
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-foreground">
                                  Password{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Create a strong password"
                                      {...field}
                                      className="h-11 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all duration-200 pr-12"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowPassword((prev) => !prev)
                                      }
                                      className="absolute right-4 top-1/2 -translate-y-1/2 text-border hover:text-muted-brown transition-colors duration-200"
                                      tabIndex={-1}
                                    >
                                      {showPassword ? (
                                        <FaEyeSlash className="h-5 w-5" />
                                      ) : (
                                        <FaEye className="h-5 w-5" />
                                      )}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {/* Confirm Password */}
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-foreground">
                                  Confirm Password{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={
                                        showConfirmPassword
                                          ? "text"
                                          : "password"
                                      }
                                      placeholder="Confirm your password"
                                      {...field}
                                      className="h-11 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all duration-200 pr-12"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowConfirmPassword((prev) => !prev)
                                      }
                                      className="absolute right-4 top-1/2 -translate-y-1/2 text-border hover:text-muted-brown transition-colors duration-200"
                                      tabIndex={-1}
                                    >
                                      {showConfirmPassword ? (
                                        <FaEyeSlash className="h-5 w-5" />
                                      ) : (
                                        <FaEye className="h-5 w-5" />
                                      )}
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
                    <div className="text-xs text-border mt-4">
                      Your personal data will be used to support your experience
                      throughout this website, to manage access to your account,
                      and for other purposes described in our privacy policy.
                    </div>
                    <div className="flex justify-between mt-4">
                      {registerStep > 1 && (
                        <Button
                          type="button"
                          onClick={handlePreviousStep}
                          className="w-full h-11 bg-primary/20 hover:bg-primary/30 text-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Previous
                        </Button>
                      )}
                      {registerStep < 2 && (
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Next
                        </Button>
                      )}
                      {registerStep === 2 && (
                        <Button
                          type="submit"
                          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                          disabled={registerLoading}
                        >
                          {registerLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                              Creating account...
                            </div>
                          ) : (
                            "REGISTER"
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Toggle Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8 h-[450px] flex flex-col">
              <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
                {activeTab === "login" ? "REGISTER" : "LOGIN"}
              </h2>
              <div className="text-center flex-1 flex flex-col justify-center">
                <p className="text-muted-brown text-sm mb-6 leading-relaxed">
                  {activeTab === "login"
                    ? "Registering for this site allows you to access your order status and history. Just fill in the fields below, and we'll get a new account set up for you in no time. We will only ask you for information necessary to make the purchase process faster and easier."
                    : "Already have an account? Sign in to access your order history and manage your account."}
                </p>
              </div>
              <Button
                onClick={() =>
                  handleTabChange(activeTab === "login" ? "register" : "login")
                }
                className={`w-full h-11 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ${
                  activeTab === "login"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                }`}
              >
                {activeTab === "login" ? "REGISTER" : "LOGIN"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
