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
  BookOpen, Wallet, TrendingUp, Loader2, RefreshCw, X, ChevronRight, Star, Quote
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
  const [booksData, setBooksData] = useState({ list: [] });
  const [selectedBook, setSelectedBook] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

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
      // The backend now provides pre-calculated stats in the profile response
      const [profileRes, withdrawalsRes, paymentsRes, salesRes, booksRes] = await Promise.allSettled([
        apiClient.get('/auth/profile'),
        apiClient.get('/withdrawals'),
        apiClient.get('/royalties'),
        apiClient.get('/sales', { params: { limit: 1000 } }),
        apiClient.get('/books')
      ]);

      let backendStats = { totalRoyalty: 0, totalPayments: 0, balance: 0, totalQuantitySold: 0 };

      if (profileRes.status === 'fulfilled') {
        const pData = profileRes.value.data;
        const profile = pData.data || pData;
        setAuthorProfile(profile);
        if (profile.stats) {
          backendStats = profile.stats;
        }
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

      setSales(authorSales);
      setBooksData({
        list: authorBooks
      });

      setStats({
        publishedWorks: authorBooks.length,
        totalRoyalty: backendStats.totalRoyalty,
        paidRoyalty: backendStats.totalPayments,
        balanceRoyalty: backendStats.balance,
        totalQuantitySold: backendStats.totalQuantitySold
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
        name: editForm.name,
        email: editForm.email,
        mobile_number: editForm.mobile_number,
        // SECURITY: Bank details are intentionally omitted here as they can only be edited by Admin.
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

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setIsBookModalOpen(true);
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
      <div className="min-h-screen bg-[#fcfbf9] bg-mesh">
        <Header />

        <motion.div
          className="container mx-auto px-4 py-12 max-w-7xl"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-border/50 pb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary tracking-tight mb-2">Author Portfolio</h1>
              <p className="text-muted-foreground text-lg font-light italic">Refining the legacy of {currentUser?.name}.</p>
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
              variant={activeTab === 'works' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('works')}
              className={`rounded-xl px-8 py-6 ${activeTab === 'works' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
            >
              My Works
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
                      <h2 className="text-2xl font-serif font-bold text-primary">Performance Overview</h2>
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

              {activeTab === 'works' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 bg-secondary rounded-full"></div>
                      <h2 className="text-2xl font-serif font-bold text-primary">Your Portfolio</h2>
                    </div>
                    {booksData.list.length > 0 && (
                      <span className="bg-primary/5 text-primary px-4 py-2 rounded-full text-xs font-bold border border-primary/10">
                        {booksData.list.length} {booksData.list.length === 1 ? 'Work' : 'Works'} Registered
                      </span>
                    )}
                  </div>
                  
                  {loadingSales ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="animate-spin h-10 w-10 text-primary" />
                      <p className="text-muted-foreground animate-pulse font-serif italic">Curating your works...</p>
                    </div>
                  ) : booksData.list.length === 0 ? (
                    <div className="glass-card rounded-3xl p-20 text-center flex flex-col items-center gap-4">
                      <div className="bg-primary/5 p-6 rounded-full">
                        <BookOpen className="h-12 w-12 text-primary/30" />
                      </div>
                      <h3 className="text-xl font-bold text-primary">No works found</h3>
                      <p className="text-muted-foreground max-w-sm">No books have been assigned to your profile yet. Please contact the administrator if you believe this is an error.</p>
                    </div>
                  ) : (
                    <div className="glass-card rounded-3xl border-none overflow-hidden premium-shadow">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-primary/5 text-primary uppercase text-[10px] font-bold tracking-[0.2em] border-b border-primary/10">
                            <tr>
                              <th className="py-6 px-8">Catalog Info</th>
                              <th className="py-6 px-8">ISBN / SKU</th>
                              <th className="py-6 px-8">Format</th>
                              <th className="py-6 px-8 text-center">Pages</th>
                              <th className="py-6 px-8 text-right">Market MRP</th>
                              <th className="py-6 px-8 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-primary/5">
                            {booksData.list.map((book) => (
                              <tr key={book._id} className="hover:bg-primary/[0.02] transition-colors group">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-4">
                                    <div className="h-14 w-10 bg-muted rounded shadow-sm overflow-hidden flex-shrink-0">
                                      {book.book_cover ? (
                                        <img src={book.book_cover} alt={book.title} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                          <BookOpen className="h-4 w-4 text-primary/20" />
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-serif font-bold text-primary text-sm line-clamp-1">{book.title}</p>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Registered {new Date(book.createdAt).getFullYear()}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 font-mono text-[11px] text-muted-foreground">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-primary/70">{book.isbn}</span>
                                    <span className="opacity-50">{book.sku_code || 'No SKU'}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${book.format === 'ebook' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                    {book.format === 'ebook' ? 'Digital' : 'Physical'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center font-bold text-primary/80">
                                  {book.pages || '--'}
                                </td>
                                <td className="py-4 px-6 text-right font-serif font-bold text-secondary text-sm">
                                  ₹{book.mrp}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleBookClick(book)}
                                    className="rounded-lg h-8 px-3 text-secondary hover:text-secondary hover:bg-secondary/5 border border-transparent hover:border-secondary/20 transition-all font-bold text-[10px] uppercase tracking-widest"
                                  >
                                    View Detail
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
              <p className="text-2xl font-serif font-bold text-primary">{formatCurrency(stats.balanceRoyalty)}</p>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-bold secondary-foreground uppercase tracking-wider">Settlement Amount (₹)</Label>
              <Input type="number" step="0.01" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} className="py-6 text-xl font-serif bg-white border-primary/10 rounded-2xl text-center" placeholder="0.00" required />
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
            <DialogTitle className="text-2xl font-serif font-bold text-primary border-b pb-4">Refine Portfolio Details</DialogTitle>
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
            <div className="bg-primary/5 p-6 rounded-2xl space-y-4 border border-primary/10 relative">
              <div className="flex justify-between items-center">
                <h4 className="font-serif font-bold text-primary flex items-center gap-2"><Wallet className="h-4 w-4" /> Settlement Coordinates</h4>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">Admin Edit Only</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Bank Name" className="rounded-xl bg-white/50 cursor-not-allowed" value={editForm.bank_name} readOnly />
                <Input placeholder="IFSC Code" className="rounded-xl bg-white/50 cursor-not-allowed" value={editForm.ifsc_code} readOnly />
                <Input placeholder="Holder Name" className="rounded-xl bg-white/50 cursor-not-allowed" value={editForm.account_holder} readOnly />
                <Input placeholder="Account Number" className="rounded-xl bg-white/50 cursor-not-allowed" value={editForm.account_number} readOnly />
                <div className="col-span-2 text-primary"><Input placeholder="UPI Endpoint (Optional)" className="rounded-xl bg-white/50 cursor-not-allowed" value={editForm.upi} readOnly /></div>
              </div>
              <p className="text-[10px] text-muted-foreground italic text-center mt-2">To update bank details, please contact the portal administrator.</p>
            </div>
            <div className="flex justify-end gap-3 pt-6"><Button variant="ghost" onClick={() => setEditProfileModalOpen(false)}>Cancel</Button><Button type="submit" className="rounded-full px-8 py-6 bg-primary shadow-xl" disabled={submittingEdit}>Save Portfolio Changes</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <DialogContent className="sm:max-w-[550px] border-none glass-card rounded-3xl p-0 overflow-hidden">
          {selectedBook && (
            <div className="flex flex-col">
              <DialogHeader className="sr-only">
                <DialogTitle>{selectedBook.title}</DialogTitle>
                <DialogDescription>Detailed information for {selectedBook.title}</DialogDescription>
              </DialogHeader>
              
              <div className="relative aspect-video w-full overflow-hidden">
                {selectedBook.book_cover ? (
                  <img src={selectedBook.book_cover} alt={selectedBook.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <BookOpen className="h-20 w-20 text-muted-foreground/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit mb-3 ${selectedBook.format === 'ebook' ? 'bg-blue-500 text-white' : 'bg-secondary text-secondary-foreground'}`}>
                    {selectedBook.format === 'ebook' ? 'Digital Edition' : 'Physical Edition'}
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-white line-clamp-2">{selectedBook.title}</h3>
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ISBN Number</p>
                    <p className="text-sm font-mono font-bold text-primary">{selectedBook.isbn}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SKU Code</p>
                    <p className="text-sm font-mono font-bold text-primary">{selectedBook.sku_code || 'N/A'}</p>
                  </div>
                  
                  <div className="col-span-2 grid grid-cols-3 gap-4 py-6 border-y border-primary/5">
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Pages</p>
                      <p className="text-lg font-bold text-primary">{selectedBook.pages || 'N/A'}</p>
                    </div>
                    <div className="text-center space-y-1 border-x border-primary/5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Size</p>
                      <p className="text-lg font-bold text-primary">{selectedBook.book_sizes || 'Standard'}</p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Base MRP</p>
                      <p className="text-lg font-bold text-secondary">₹{selectedBook.mrp}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={() => setIsBookModalOpen(false)} className="rounded-xl px-10 py-6 bg-primary text-primary-foreground shadow-xl">Close Details</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthorDashboard;
