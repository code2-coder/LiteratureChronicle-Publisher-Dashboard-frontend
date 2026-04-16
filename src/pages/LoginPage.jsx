import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      toast({ title: 'Login Failed', description: err.response?.data?.message || 'Invalid credentials.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/auth/reset-password', { email: resetEmail });
      toast({ title: 'Request Received', description: 'If a user with that email exists, a reset link will be sent.' });
      setResetModalOpen(false);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send reset email.', variant: 'destructive' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Author Login - Literature Chronicle</title>
        <link rel="icon" type="image/png" href="https://horizons-cdn.hostinger.com/9bc70898-334e-45cd-a18a-f7cba077ad04/6021826ec5c51410d3136593cfcafc49.png" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border p-8">
            <div className="text-center mb-8">
              <img src="https://horizons-cdn.hostinger.com/9bc70898-334e-45cd-a18a-f7cba077ad04/6021826ec5c51410d3136593cfcafc49.png" alt="Logo" className="h-20 w-20 rounded-full mx-auto mb-4 object-cover" />
              <h1 className="text-2xl font-bold text-primary">Author Portal</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Password</Label>
                  <button type="button" onClick={() => setResetModalOpen(true)} className="text-xs text-secondary hover:underline">Forgot Password?</button>
                </div>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Authenticating...' : 'Sign In'}</Button>
            </form>


          </div>
        </div>
      </div>

      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <form onSubmit={handleReset} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Send Reset Link</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginPage;