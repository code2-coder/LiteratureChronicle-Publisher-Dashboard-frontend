import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import apiClient from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast({ title: 'Success', description: 'Password reset link sent to your email.' });
    } catch (err) {
      toast({ 
        title: 'Request Failed', 
        description: err.response?.data?.message || 'Could not send reset email.', 
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
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-primary/5 p-10">
            <div className="text-center mb-10">
              <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-primary/40" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-primary mb-3">Recover Access</h1>
              <p className="text-muted-foreground font-light text-sm">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <Input 
                    type="email" 
                    placeholder="name@example.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="rounded-xl py-6 bg-slate-50/50 border-primary/10 focus:bg-white transition-all"
                    required 
                  />
                </div>
                <div className="space-y-4">
                  <Button type="submit" className="w-full py-7 rounded-2xl bg-primary shadow-xl shadow-primary/10 font-bold text-lg" disabled={loading}>
                    {loading ? 'Sending Request...' : 'Send Reset Link'}
                  </Button>
                  <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </Link>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-8">
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col items-center gap-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                  <div>
                    <h3 className="font-bold text-green-800">Email Sent Successfully</h3>
                    <p className="text-xs text-green-700/70 mt-1">Please check your inbox (and spam folder) for further instructions.</p>
                  </div>
                </div>
                <Link to="/login">
                  <Button variant="outline" className="w-full py-7 rounded-2xl border-primary/10 font-bold text-lg">
                    Return to Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
