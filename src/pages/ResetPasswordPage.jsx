import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiClient from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
    }
    
    setLoading(true);
    try {
      await apiClient.put(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast({ title: 'Success', description: 'Your password has been reset.' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast({ 
        title: 'Error', 
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
        <title>Reset Password - Literature Chronicle</title>
      </Helmet>

      <div className="min-h-screen bg-[#fcfbf9] flex flex-col font-sans">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-primary/5 p-10">
            <div className="text-center mb-10">
              <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="h-10 w-10 text-primary/40" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-primary mb-3">New Credentials</h1>
              <p className="text-muted-foreground font-light text-sm">
                Secure your account by creating a new strong password.
              </p>
            </div>

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="rounded-xl py-6 bg-slate-50/50 border-primary/10"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
                  <Input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="rounded-xl py-6 bg-slate-50/50 border-primary/10"
                    required 
                  />
                </div>
                <Button type="submit" className="w-full py-7 rounded-2xl bg-primary shadow-xl shadow-primary/10 font-bold text-lg group" disabled={loading}>
                  {loading ? 'Updating...' : 'Set New Password'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="bg-green-50 p-8 rounded-2xl border border-green-100 flex flex-col items-center gap-4">
                  <ShieldCheck className="h-16 w-16 text-green-600" />
                  <h3 className="text-xl font-bold text-green-800">Security Updated</h3>
                  <p className="text-sm text-green-700/70">Your password has been changed. Redirecting to login...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
