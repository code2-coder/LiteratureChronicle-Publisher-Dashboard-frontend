import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '@/services/apiClient';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, Lock, ShieldCheck, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [email, setEmail] = useState('');
  
  // OTP States
  const [otp, setOtp] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];
  
  // Password States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Resend OTP Countdown Timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Success auto-redirect
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    const cleanedVal = value.replace(/\D/g, '');
    if (!cleanedVal) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = '';
      setOtpValues(newOtpValues);
      setOtp(newOtpValues.join(''));
      return;
    }
    
    const char = cleanedVal.substring(cleanedVal.length - 1);
    const newOtpValues = [...otpValues];
    newOtpValues[index] = char;
    setOtpValues(newOtpValues);
    setOtp(newOtpValues.join(''));

    // Auto-focus next input
    if (index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  // Backspace navigation in OTP boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = '';
        setOtpValues(newOtpValues);
        setOtp(newOtpValues.join(''));
        otpRefs[index - 1].current.focus();
      }
    }
  };

  // Paste support for 6-digit OTP code
  const handleOtpPaste = (e) => {
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const newValues = pasteData.split('');
      setOtpValues(newValues);
      setOtp(pasteData);
      otpRefs[5].current.focus();
    }
    e.preventDefault();
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-slate-200', width: 'w-0' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    if (score === 1) return { score: 1, text: 'Weak', color: 'bg-red-500', width: 'w-1/4', textClass: 'text-red-500' };
    if (score === 2) return { score: 2, text: 'Fair', color: 'bg-amber-500', width: 'w-2/4', textClass: 'text-amber-500' };
    if (score === 3) return { score: 3, text: 'Good', color: 'bg-blue-500', width: 'w-3/4', textClass: 'text-blue-500' };
    if (score === 4) return { score: 4, text: 'Strong', color: 'bg-emerald-500', width: 'w-full', textClass: 'text-emerald-500' };
    return { score: 0, text: '', color: 'bg-slate-200', width: 'w-0' };
  };

  const strength = getPasswordStrength(password);

  // Step 1 Submission: Request OTP
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setStep(2);
      setCountdown(60);
      toast({ title: 'OTP Sent', description: 'Check your inbox for the 6-digit OTP code.' });
    } catch (err) {
      toast({ 
        title: 'Request Failed', 
        description: err.response?.data?.message || 'Could not send OTP email.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Action
  const handleResendOTP = async () => {
    setResending(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setCountdown(60);
      // Reset OTP values
      setOtpValues(['', '', '', '', '', '']);
      setOtp('');
      otpRefs[0].current?.focus();
      toast({ title: 'New OTP Sent', description: 'A new 6-digit OTP has been sent to your email.' });
    } catch (err) {
      toast({ 
        title: 'Resend Failed', 
        description: err.response?.data?.message || 'Could not resend OTP.', 
        variant: 'destructive' 
      });
    } finally {
      setResending(false);
    }
  };

  // Step 2 Submission: Verify and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
    }
    if (otp.length !== 6) {
      return toast({ title: 'Invalid OTP', description: 'Please enter the complete 6-digit OTP.', variant: 'destructive' });
    }
    
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { email, otp, password });
      setSuccess(true);
      toast({ title: 'Reset Successful', description: 'Your password has been reset successfully.' });
    } catch (err) {
      toast({ 
        title: 'Reset Failed', 
        description: err.response?.data?.message || 'Failed to reset password.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - Literature Chronicle</title>
      </Helmet>

      <div className="min-h-screen bg-[#fcfbf9] flex flex-col font-sans">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-primary/5 p-10 transition-all duration-300">
            
            {success ? (
              // Success Screen
              <div className="text-center space-y-8 py-4">
                <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 flex flex-col items-center gap-5">
                  <div className="bg-emerald-500 text-white rounded-full p-4 animate-bounce">
                    <ShieldCheck className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-slate-800">Security Updated</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Your password has been changed. We are redirecting you to the login screen...
                    </p>
                  </div>
                </div>
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full py-7 rounded-2xl border-primary/10 font-bold text-lg hover:bg-slate-50 transition-colors">
                    Return to Login
                  </Button>
                </Link>
              </div>
            ) : step === 1 ? (
              // Step 1: Request OTP Form
              <div>
                <div className="text-center mb-10">
                  <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="h-10 w-10 text-primary/50" />
                  </div>
                  <h1 className="text-3xl font-serif font-bold text-primary mb-3">Recover Access</h1>
                  <p className="text-muted-foreground font-light text-sm leading-relaxed px-2">
                    Enter your email address and we'll send a 6-digit OTP code to verify your request.
                  </p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                    <Input 
                      type="email" 
                      placeholder="name@example.com"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="rounded-xl py-6 bg-slate-50/50 border-primary/10 focus:bg-white focus:ring-2 focus:ring-primary/15 transition-all text-base"
                      required 
                    />
                  </div>
                  <div className="space-y-4">
                    <Button type="submit" className="w-full py-7 rounded-2xl bg-primary shadow-xl shadow-primary/10 font-bold text-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending OTP...
                        </>
                      ) : 'Send OTP'}
                    </Button>
                    <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors py-2">
                      <ArrowLeft className="h-4 w-4" /> Back to Login
                    </Link>
                  </div>
                </form>
              </div>
            ) : (
              // Step 2: Verify OTP & Reset Password Form
              <div>
                <div className="text-center mb-10">
                  <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <KeyRound className="h-10 w-10 text-primary/50" />
                  </div>
                  <h1 className="text-3xl font-serif font-bold text-primary mb-3">Reset Password</h1>
                  <p className="text-muted-foreground font-light text-sm leading-relaxed px-2">
                    Enter the code we sent to your email and set a new secure password.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* Email Box display */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">OTP sent to</p>
                      <p className="text-sm font-semibold text-slate-800 break-all">{email}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setStep(1); setOtp(''); setOtpValues(['', '', '', '', '', '']); }} 
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Segmented OTP Inputs */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">6-Digit Code</Label>
                    <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                      {otpValues.map((val, idx) => (
                        <input
                          key={idx}
                          ref={otpRefs[idx]}
                          type="text"
                          maxLength={1}
                          pattern="\d*"
                          value={val}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-primary/10 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-none"
                          required
                        />
                      ))}
                    </div>

                    {/* Resend Timer section */}
                    <div className="text-right pt-1">
                      {countdown > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Didn't receive code? Resend in <span className="font-semibold text-slate-800">{countdown}s</span>
                        </p>
                      ) : (
                        <button 
                          type="button" 
                          onClick={handleResendOTP} 
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 ml-auto"
                          disabled={resending}
                        >
                          {resending && <Loader2 className="h-3 w-3 animate-spin" />}
                          Resend OTP Code
                        </button>
                      )}
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="rounded-xl py-6 pr-12 bg-slate-50/50 border-primary/10 focus:bg-white focus:ring-2 focus:ring-primary/15 transition-all text-base"
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-1.5 px-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground">Password strength:</span>
                          <span className={`font-bold ${strength.textClass}`}>{strength.text}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
                    <div className="relative">
                      <Input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="rounded-xl py-6 pr-12 bg-slate-50/50 border-primary/10 focus:bg-white focus:ring-2 focus:ring-primary/15 transition-all text-base"
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-4 pt-4">
                    <Button type="submit" className="w-full py-7 rounded-2xl bg-primary shadow-xl shadow-primary/10 font-bold text-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Resetting Password...
                        </>
                      ) : 'Reset Password'}
                    </Button>
                    
                    <button 
                      type="button" 
                      onClick={() => { setStep(1); setOtp(''); setOtpValues(['', '', '', '', '', '']); setPassword(''); setConfirmPassword(''); }} 
                      className="w-full flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors py-2"
                    >
                      <ArrowLeft className="h-4 w-4" /> Change Email / Go Back
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
