import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiClient from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
    }
    
    setLoading(true);
    try {
      await apiClient.put(`/auth/reset-password/${token}`, { password });
      toast({ title: 'Success', description: 'Password reset successful. You can now login.' });
      navigate('/login');
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err.response?.data?.message || 'Token may be invalid or expired.', 
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
              <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <KeyRound className="h-10 w-10 text-secondary" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-primary mb-3">Set New Password</h1>
              <p className="text-muted-foreground font-light text-sm">
                Ensure your new password is at least 8 characters long and includes numbers or symbols for security.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="rounded-xl py-6 bg-slate-50/50 border-primary/10 focus:bg-white transition-all pr-12"
                    minLength={8}
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
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</Label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="rounded-xl py-6 bg-slate-50/50 border-primary/10 focus:bg-white transition-all"
                  required 
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full py-7 rounded-2xl bg-primary shadow-xl shadow-primary/10 font-bold text-lg flex items-center justify-center gap-3" disabled={loading}>
                  {loading ? 'Updating...' : (
                    <>
                      <ShieldCheck className="h-5 w-5" /> Update Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
