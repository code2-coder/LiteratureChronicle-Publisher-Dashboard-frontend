import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import SalesTable from '@/components/SalesTable.jsx';
import StatsCards from '@/components/dashboard/StatsCards.jsx';
import PaymentSummary from '@/components/dashboard/PaymentSummary.jsx';
import ProfileSettings from '@/components/dashboard/ProfileSettings.jsx';
import WithdrawalHistory from '@/components/dashboard/WithdrawalHistory.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen, Wallet, TrendingUp, Loader2, RefreshCw
} from 'lucide-react';
import { calculateRoyalty } from '@/lib/royaltyCalculator.js';

const AuthorDashboard = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [loadingSales, setLoadingSales] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [authorProfile, setAuthorProfile] = useState(null);

  const [stats, setStats] = useState({
    publishedWorks: 0,
    totalRoyalty: 0,
    paidRoyalty: 0,
    balanceRoyalty: 0,
    totalQuantitySold: 0
  });

  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const formatCurrency = useCallback((amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0), []);

  const formatDateStandard = useCallback((dateString) =>
    new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }), []);

  const formatToDDMMYYYY = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }, []);

  const loadAllData = useCallback(async (isManualRefresh = false) => {
    if (!currentUser) return;
    if (isManualRefresh) setIsRefreshing(true);

    try {
      const [profileRes, withdrawalsRes, paymentsRes, salesRes, booksRes, platformsRes] = await Promise.allSettled([
        apiClient.get('/auth/profile'),
        apiClient.get('/withdrawals'),
        apiClient.get('/royalties'),
        apiClient.get('/sales'),
        apiClient.get('/books'),
        apiClient.get('/platforms')
      ]);

      if (profileRes.status === 'fulfilled') {
        const pData = profileRes.value.data;
        setAuthorProfile(pData.data || pData);
      }

      if (withdrawalsRes.status === 'fulfilled') {
        const wData = withdrawalsRes.value.data;
        setWithdrawals(Array.isArray(wData.data) ? wData.data : (Array.isArray(wData) ? wData : []));
      }

      if (paymentsRes.status === 'fulfilled') {
        const rData = paymentsRes.value.data;
        setPayments(Array.isArray(rData.data) ? rData.data : (Array.isArray(rData) ? rData : []));
      }

      const salesRaw = salesRes.status === 'fulfilled' ? salesRes.value.data : [];
      const authorSales = Array.isArray(salesRaw.data) ? salesRaw.data : (Array.isArray(salesRaw) ? salesRaw : []);

      const booksRaw = booksRes.status === 'fulfilled' ? booksRes.value.data : [];
      const authorBooks = Array.isArray(booksRaw.data) ? booksRaw.data : (Array.isArray(booksRaw) ? booksRaw : []);

      const platformsRaw = platformsRes.status === 'fulfilled' ? platformsRes.value.data : [];
      const allPlatforms = Array.isArray(platformsRaw.data) ? platformsRaw.data : (Array.isArray(platformsRaw) ? platformsRaw : []);

      setSales(authorSales);

      const paymentsForCalc = paymentsRes.status === 'fulfilled' ? paymentsRes.value.data : [];
      const finalPayments = Array.isArray(paymentsForCalc.data) ? paymentsForCalc.data : (Array.isArray(paymentsForCalc) ? paymentsForCalc : []);

      const paidRoyalty = finalPayments.reduce(
        (sum, r) => sum + (parseFloat(r.paid_amount) || 0), 0
      );

      const totalRoyalty = authorSales.reduce((sum, sale) => {
        const book = sale.bookId || authorBooks.find(b => b._id === sale.bookId);
        if (!book) return sum;

        let platformCommission = sale.platformId?.commission_percentage || 0;
        if (!platformCommission && sale.platform_name) {
          const platform = allPlatforms.find(p => p.name.toLowerCase() === sale.platform_name.toLowerCase());
          platformCommission = platform?.commission_percentage || 0;
        }

        return sum + calculateRoyalty(
          sale.mrp, platformCommission, book.printing_cost || 0,
          sale.quantity || 1, book.format || 'physical'
        );
      }, 0);

      setStats({
        publishedWorks: authorBooks.length,
        totalRoyalty,
        paidRoyalty,
        balanceRoyalty: Math.max(0, totalRoyalty - paidRoyalty),
        totalQuantitySold: authorSales.reduce((sum, s) => sum + (s.quantity || 1), 0)
      });

      if (isManualRefresh) toast({ title: 'Success', description: 'Dashboard updated' });
    } catch (error) {
      console.error('Data load error:', error);
      toast({ title: 'Error', description: 'Failed to fetch dashboard data', variant: 'destructive' });
    } finally {
      setLoadingSales(false);
      setIsRefreshing(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => loadAllData(false), 60000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  const handleEditProfile = () => {
    setEditForm({
      name: authorProfile?.name || '',
      email: authorProfile?.email || '',
      mobile_number: authorProfile?.mobile_number || '',
      bank_name: authorProfile?.bank_details?.bank_name || '',
      account_holder: authorProfile?.bank_details?.holder_name || '',
      account_number: authorProfile?.bank_details?.account_number || '',
      ifsc_code: authorProfile?.bank_details?.ifsc_code || '',
      upi: authorProfile?.bank_details?.upi || ''
    });
    setEditProfileModalOpen(true);
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      await apiClient.put('/auth/profile', {
        ...editForm,
        bank_details: {
          bank_name: editForm.bank_name,
          holder_name: editForm.account_holder,
          account_number: editForm.account_number,
          ifsc_code: editForm.ifsc_code,
          upi: editForm.upi
        }
      });
      toast({ title: 'Success', description: 'Profile updated' });
      setEditProfileModalOpen(false);
      loadAllData();
    } catch (error) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0 || amount > stats.balanceRoyalty) {
      return toast({ title: 'Invalid amount', variant: 'destructive' });
    }
    setSubmittingWithdrawal(true);
    try {
      const { data } = await apiClient.post('/withdrawals', { amount });
      setWithdrawals(prev => [data, ...prev]);
      toast({ title: 'Request Sent' });
      setWithdrawalModalOpen(false);
      setWithdrawalAmount('');
    } catch (error) {
      toast({ title: 'Request Failed', variant: 'destructive' });
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  return (
    <>
      <Helmet><title>Author Portfolio - Literature Chronicle</title></Helmet>
      <div className="min-h-screen bg-[#fcfbf9]">
        <Header />

        <motion.div
          className="container mx-auto px-4 py-12 max-w-7xl"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-border/50 pb-8">
            <div>
              <h1 className="text-5xl font-serif font-bold text-primary tracking-tight mb-3">Author Portfolio</h1>
              <p className="text-muted-foreground text-xl font-light italic">Refining the legacy of {currentUser?.name}.</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => loadAllData(true)} variant="ghost" className="rounded-full hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all" disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Update Records'}
              </Button>
              <Button onClick={() => setWithdrawalModalOpen(true)} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/10 px-8 py-6 text-lg">
                <Wallet className="h-5 w-5 mr-3" /> Withdraw Funds
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex space-x-2 mb-10 bg-primary/5 p-1.5 rounded-2xl w-fit border border-primary/10">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('overview')}
              className={`rounded-xl px-8 py-6 ${activeTab === 'overview' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
            >
              Analytics
            </Button>
            <Button
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('profile')}
              className={`rounded-xl px-8 py-6 ${activeTab === 'profile' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
            >
              Profile & Bank
            </Button>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-12">
                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-8 w-1 bg-secondary rounded-full"></div>
                      <h2 className="text-3xl font-serif font-bold text-primary">Performance Overview</h2>
                    </div>
                    <StatsCards stats={stats} formatCurrency={formatCurrency} />
                  </section>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1">
                      <PaymentSummary payments={payments} formatCurrency={formatCurrency} formatToDDMMYYYY={formatToDDMMYYYY} />
                    </div>
                    <div className="lg:col-span-2">
                      <div className="glass-card rounded-3xl p-8 premium-shadow border-none">
                        <h2 className="text-2xl font-serif font-bold text-primary flex items-center gap-3 mb-8">
                          <BookOpen className="h-6 w-6 text-secondary" />
                          Sales Ledger
                        </h2>
                        {loadingSales ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin h-10 w-10 text-primary" />
                            <p className="text-muted-foreground animate-pulse">Synchronizing records...</p>
                          </div>
                        ) : (
                          <SalesTable sales={sales} showRoyalty={true} onRefresh={loadAllData} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && authorProfile && (
                <div className="space-y-10">
                  <ProfileSettings authorProfile={authorProfile} onEdit={handleEditProfile} />
                  <WithdrawalHistory withdrawals={withdrawals} formatCurrency={formatCurrency} formatDateStandard={formatDateStandard} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <Dialog open={withdrawalModalOpen} onOpenChange={setWithdrawalModalOpen}>
        <DialogContent className="sm:max-w-[450px] border-none glass-card rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-serif font-bold text-primary">Request Withdrawal</DialogTitle>
            <DialogDescription>
              Review your available balance and request a fund transfer to your registered account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdrawalSubmit} className="space-y-8 mt-4">
            <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl flex flex-col gap-1 items-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Available for Settlement</p>
              <p className="text-4xl font-serif font-bold text-primary">{formatCurrency(stats.balanceRoyalty)}</p>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-bold secondary-foreground uppercase tracking-wider">Settlement Amount (₹)</Label>
              <Input type="number" step="0.01" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} className="py-8 text-2xl font-serif bg-white border-primary/10 rounded-2xl text-center" placeholder="0.00" required />
              <p className="text-xs text-muted-foreground text-center italic">Funds will be transferred to your registered bank account.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setWithdrawalModalOpen(false)} className="rounded-full">Cancel</Button>
              <Button type="submit" className="rounded-full px-8 py-6 bg-primary shadow-xl" disabled={submittingWithdrawal || stats.balanceRoyalty <= 0}>Confirm Withdrawal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editProfileModalOpen} onOpenChange={setEditProfileModalOpen}>
        <DialogContent className="sm:max-w-[600px] border-none glass-card rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-serif font-bold text-primary border-b pb-4">Refine Portfolio Details</DialogTitle>
            <DialogDescription>
              Update your contact information and bank details for royalty settlements.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProfileSubmit} className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-widest">Legal Name</Label><Input className="rounded-xl py-6" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-widest">Mobile Number</Label><Input className="rounded-xl py-6" value={editForm.mobile_number} onChange={e => setEditForm({ ...editForm, mobile_number: e.target.value })} /></div>
              <div className="col-span-2 space-y-2"><Label className="text-xs font-bold uppercase tracking-widest">Primary Email</Label><Input className="rounded-xl py-6" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
            </div>
            <div className="bg-primary/5 p-6 rounded-2xl space-y-4 border border-primary/10">
              <h4 className="font-serif font-bold text-primary flex items-center gap-2"><Wallet className="h-4 w-4" /> Settlement Coordinates</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Bank Name" className="rounded-xl" value={editForm.bank_name} onChange={e => setEditForm({ ...editForm, bank_name: e.target.value })} />
                <Input placeholder="IFSC Code" className="rounded-xl" value={editForm.ifsc_code} onChange={e => setEditForm({ ...editForm, ifsc_code: e.target.value })} />
                <Input placeholder="Holder Name" className="rounded-xl" value={editForm.account_holder} onChange={e => setEditForm({ ...editForm, account_holder: e.target.value })} />
                <Input placeholder="Account Number" className="rounded-xl" value={editForm.account_number} onChange={e => setEditForm({ ...editForm, account_number: e.target.value })} />
                <div className="col-span-2 text-primary"><Input placeholder="UPI Endpoint (Optional)" className="rounded-xl" value={editForm.upi} onChange={e => setEditForm({ ...editForm, upi: e.target.value })} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6"><Button variant="ghost" onClick={() => setEditProfileModalOpen(false)}>Cancel</Button><Button type="submit" className="rounded-full px-8 py-6 bg-primary shadow-xl" disabled={submittingEdit}>Save Portfolio Changes</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthorDashboard;

