import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Axios from "@/utils/Axios";
import SummaryApi from "../common/summaryApi";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || "";
  const [email] = useState(emailFromState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
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
    setSuccess("");
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await Axios({
        method: SummaryApi.reset_password.method,
        url: SummaryApi.reset_password.url,
        data: { email, newPassword: password, confirmPassword },
      });
      setSuccess("Password reset successful! Redirecting to home...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
        <div className="max-w-md mx-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg border border-border/50 p-8"
          >
            <h2 className="font-sans text-3xl font-bold text-foreground mb-6 text-center">
              Reset Password
            </h2>
            <p className="text-muted-brown text-center mb-6">
              Reset password for{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
            {error && (
              <p className="text-destructive text-center mb-4 text-sm">{error}</p>
            )}
            {success && (
              <p className="text-primary text-center mb-4 text-sm">{success}</p>
            )}
            <div className="mb-5 relative">
              <label
                className="block text-foreground mb-1 font-medium"
                htmlFor="password"
              >
                New Password
              </label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
                className="h-11 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all duration-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-9 text-border hover:text-muted-brown transition-colors duration-200"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className="mb-6 relative">
              <label
                className="block text-foreground mb-1 font-medium"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                className="h-11 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all duration-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-9 text-border hover:text-muted-brown transition-colors duration-200"
                tabIndex={-1}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                  Resetting...
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPassword;
