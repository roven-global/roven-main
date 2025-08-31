import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Shield, Heart, Star, Mail } from "lucide-react";
import Axios from "@/utils/Axios";
import SummaryApi from "../common/summaryApi";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Email is required");
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
      navigate("/otp-verification", { state: { email } });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to send reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Header Banner - Matching Login Page Design */}
      <div className="relative bg-gradient-to-br from-primary/10 via-muted-brown/10 to-foreground/10 py-24">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="font-sans text-5xl md:text-6xl font-bold text-foreground mb-4">
            Reset Password
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Forgot Password Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8 h-[450px] flex flex-col">
              <h2 className="font-sans text-3xl font-bold text-foreground mb-6 text-center">
                RESET PASSWORD
              </h2>

              <div className="mb-6">
                <p className="text-muted-brown text-sm leading-relaxed">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4">
                  <div>
                    <label
                      className="block text-sm font-semibold text-foreground mb-2"
                      htmlFor="email"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      required
                      className="h-11 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all duration-200"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-muted-brown text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 mt-auto"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending reset link...
                    </div>
                  ) : (
                    "SEND RESET LINK"
                  )}
                </Button>
              </form>
            </div>

            {/* Information Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8 h-[450px] flex flex-col">
              <h2 className="font-sans text-3xl font-bold text-foreground mb-6 text-center">
                NEED HELP?
              </h2>

              <div className="text-center flex-1 flex flex-col justify-center">
                <p className="text-muted-brown text-sm mb-6 leading-relaxed">
                  Don't worry! It happens to the best of us. Enter your email
                  address and we'll send you a secure link to reset your
                  password. The link will expire in 10 minutes for your
                  security.
                </p>

                <div className="text-xs text-border mb-6">
                  Make sure to check your spam folder if you don't receive the
                  email within a few minutes.
                </div>
              </div>

              <div className="text-center">
                <p className="text-muted-brown text-sm">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="text-foreground hover:text-primary font-semibold transition-colors duration-200"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ForgotPassword;
