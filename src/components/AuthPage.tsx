import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Zap, Sparkles } from 'lucide-react';
import logo from 'figma:asset/Generated Image November 18, 2025 - 5_26PM.png';

export const AuthPage: React.FC = () => {
  const { login, signup, isLoading } = useAuth();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);


  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const result = await login(loginData.email, loginData.password);

    if (result.success) {
      setMessage('✅ Login successful! Redirecting...');
    } else if (result.message?.includes('Invalid login credentials')) {
      setError('❌ Incorrect email or password.');
    } else if (result.message?.includes('Email not confirmed')) {
      setError('⚠️ Please verify your email before logging in.');
    } else {
      setError(result.message || '❌ Login failed. Please try again.');
    }
  };

  // Signup handler
  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage(null);
  setError(null);

  try {
    // Step 1: Request OTP from backend
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: signupData.email }),
    });

    const data = await response.json();

    if (response.ok) {
      setOtpSent(true);
      setMessage('✅ OTP sent to your email. Please enter it to verify.');
    } else {
      setError(data.message || '❌ Failed to send OTP.');
    }
  } catch (err) {
    console.error(err);
    setError('❌ Network error while sending OTP.');
  }
};
const handleVerifyOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage(null);
  setError(null);
  setIsVerifying(true);
  console.log("VERIFY-OTP request body:", { email: signupData.email, otp });
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
  email: signupData.email,
  otp,
   password: signupData.password,
  name: signupData.name,
}),
    });
    console.log("verify-otp response status:", response.status);
    
    const data = await response.json();
    console.log("verify-otp response data:", data);
    if (response.ok && data.success) {
      // Proceed with signup after successful verification
      const result = await signup(signupData.name, signupData.email, signupData.password);
      if (result.success) {
        setMessage('✅ Account created successfully!');
        setOtpSent(false);
      } else {
        setError(result.message || '❌ Signup failed after verification.');
      }
    } else {
      setError(data.message || '❌ Invalid OTP.');
    }
  } catch (err) {
    console.error(err);
    setError('❌ Network error while verifying OTP.');
  } finally {
    setIsVerifying(false);
  }
};


  // Google login handler
  const loginWithGoogle = async () => {
    const { supabase } = await import('../lib/supabase'); // dynamic import to avoid SSR issues
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL, // make sure this is set in Vercel & .env
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google login failed:', err.message);
      alert('Google login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Resuma Builder" className="h-10 w-10" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
            Resuma Builder
          </h1>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          {/* Hero Section */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full mb-4">
                <Sparkles className="h-4 w-4 text-pink-600" />
                <span className="text-sm font-medium text-pink-900">
                  AI-Powered Resume Builder
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Build ATS-Friendly Resumes in Minutes
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Get hired faster with AI-powered resume builder designed for Pakistani job market. 
                Create professional resumes and cover letters that pass ATS screening.
              </p>
            </div>

            <div className="space-y-4">
              {[
                'ATS-Friendly Templates',
                'AI-Powered Content Generation',
                'Resume ATS Score Checker',
                'Tailored for Pakistani Market',
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{text}</span>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-6 w-6" />
                <span className="font-semibold text-lg">Limited Time Offer</span>
              </div>
              <p className="text-white/90 text-lg">
                Premium features for just <strong className="text-2xl">PKR 2,999</strong>
              </p>
              <p className="text-white/80 text-sm mt-2">
                Full access to AI tools, unlimited resumes, and priority support.
              </p>
            </div>
          </div>

          {/* Auth Forms */}
          <Card className="w-full max-w-md mx-auto shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Create your account or sign in to build your professional resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                {/* LOGIN TAB */}
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                        required
                      />
                    </div>

                    {/* ✅ Messages for login */}
                    {message && <p className="text-green-600 text-sm font-medium">{message}</p>}
                    {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                {/* SIGNUP TAB */}
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={otpSent ? handleVerifyOtp : handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="enter your full name"
                        value={signupData.name}
                        onChange={(e) =>
                          setSignupData({ ...signupData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={signupData.email}
                        onChange={(e) =>
                          setSignupData({ ...signupData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a strong password"
                        value={signupData.password}
                        onChange={(e) =>
                          setSignupData({ ...signupData, password: e.target.value })
                        }
                        required
                      />
                    </div>

                    {/* ✅ Messages for signup */}
                    {message && <p className="text-green-600 text-sm font-medium">{message}</p>}
                    {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
{otpSent && (
  <div className="space-y-2">
    <Label htmlFor="otp">Enter OTP</Label>
    <Input
      id="otp"
      type="text"
      placeholder="Enter the 6-digit code"
      value={otp}
      onChange={(e) => setOtp(e.target.value)}
      required
    />
  </div>
)}

                    <Button type="submit" className="w-full" disabled={isLoading || isVerifying}>
  {isLoading || isVerifying
    ? otpSent
      ? 'Verifying...'
      : 'Sending OTP...'
    : otpSent
      ? 'Verify OTP'
      : 'Send OTP'}
</Button>

                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={loginWithGoogle}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
