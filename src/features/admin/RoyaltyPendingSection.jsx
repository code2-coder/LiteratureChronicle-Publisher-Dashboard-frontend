import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import apiClient from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  WalletCards,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Phone,
  Mail,
  Building2,
  QrCode,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';

const RoyaltyPendingSection = () => {
  const [authors, setAuthors] = useState([]);
  const [summary, setSummary] = useState({
    totalPendingRoyalty: 0,
    totalRoyaltyEarned: 0,
    totalRoyaltyDisbursed: 0,
    authorsWithPendingCount: 0,
    totalAuthorsCount: 0,
    avgPendingAmount: 0,
    readyForPayoutCount: 0,
    missingDetailsCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters & Sorting
  const [amountFilter, setAmountFilter] = useState('pending'); // 'pending' (>0), 'high' (>=5000), 'medium' (>=1000), 'all'
  const [customMinAmount, setCustomMinAmount] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // 'all', 'ready', 'missing_details'
  const [sortBy, setSortBy] = useState('balance'); // 'balance', 'name', 'totalRoyalty', 'totalPayments'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc', 'asc'

  // Download All Data Modal
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportScope, setExportScope] = useState('pending'); // 'pending', 'all', 'filtered'
  const [exportFormat, setExportFormat] = useState('xlsx'); // 'xlsx', 'csv'

  // Copy state tracker
  const [copiedKey, setCopiedKey] = useState(null);

  const { toast } = useToast();

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Compute effective minAmount based on filter
  const getMinAmountParam = useCallback(() => {
    if (customMinAmount !== '') return parseFloat(customMinAmount) || 0;
    if (amountFilter === 'high') return 5000;
    if (amountFilter === 'medium') return 1000;
    if (amountFilter === 'pending') return 0.01;
    return null; // 'all'
  }, [amountFilter, customMinAmount]);

  // Fetch pending royalties from backend
  const fetchPendingRoyalties = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const minAmount = getMinAmountParam();
      const params = {
        page,
        limit,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        paymentStatus: paymentStatusFilter,
        ...(minAmount !== null ? { minAmount } : {})
      };

      const res = await apiClient.get('/royalties/pending', { params });
      const { data, summary: resSummary, pagination } = res.data;

      setAuthors(data || []);
      if (resSummary) {
        setSummary(resSummary);
      }
      if (pagination) {
        setTotalPages(pagination.pages || 1);
        setTotalItems(pagination.total || 0);
      }
    } catch (error) {
      console.error('Error loading pending royalties:', error);
      toast({
        title: 'Error loading ledger',
        description: error.response?.data?.message || 'Could not fetch royalty pending data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, debouncedSearch, sortBy, sortOrder, paymentStatusFilter, getMinAmountParam, toast]);

  useEffect(() => {
    fetchPendingRoyalties();
  }, [fetchPendingRoyalties]);

  const handleRefresh = () => {
    fetchPendingRoyalties(true);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({
      title: 'Copied to clipboard',
      description: text,
      duration: 2000
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyPaymentPackage = (author) => {
    const bank = author.bank_details || {};
    let text = `Author: ${author.name}\nContact: ${author.mobile_number || 'N/A'}\nPending Amount: ₹${author.balance.toLocaleString('en-IN')}`;
    
    if (bank.upi) {
      text += `\nUPI ID: ${bank.upi}`;
    }
    if (bank.account_number) {
      text += `\nBank: ${bank.bank_name || 'N/A'}\nAccount Holder: ${bank.holder_name || bank.account_holder || author.name}\nAccount Number: ${bank.account_number}\nIFSC Code: ${bank.ifsc_code || bank.ifsc || 'N/A'}`;
    }

    navigator.clipboard.writeText(text);
    toast({
      title: 'Payment Details Copied!',
      description: `Complete payout details for ${author.name} copied to clipboard.`
    });
  };

  // Export Data functionality (Excel & CSV)
  const handleDownloadData = async () => {
    setIsExporting(true);
    try {
      let params = { all: true, limit: 10000 };

      if (exportScope === 'pending') {
        params.minAmount = 0.01;
        params.sortBy = 'balance';
        params.sortOrder = 'desc';
      } else if (exportScope === 'filtered') {
        const minAmount = getMinAmountParam();
        params.search = debouncedSearch;
        params.paymentStatus = paymentStatusFilter;
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
        if (minAmount !== null) params.minAmount = minAmount;
      } else {
        params.sortBy = 'name';
        params.sortOrder = 'asc';
      }

      const res = await apiClient.get('/royalties/pending', { params });
      const exportList = res.data.data || [];

      if (exportList.length === 0) {
        toast({ title: 'No Data', description: 'No records matching the selected scope to export.' });
        setIsExporting(false);
        return;
      }

      const formattedRows = exportList.map((author, index) => {
        const bank = author.bank_details || {};
        return {
          'S.No': index + 1,
          'Author Name': author.name || 'Unnamed Author',
          'Contact Number': author.mobile_number || 'N/A',
          'Email Address': author.email || 'N/A',
          'Pending Royalty (INR)': author.balance || 0,
          'Total Royalty Earned (INR)': author.totalRoyalty || 0,
          'Total Royalty Paid (INR)': author.totalPayments || 0,
          'Payment Status': author.balance > 0 ? (author.isPaymentReady ? 'Ready for Payout' : 'Missing Payment Info') : 'Settled / No Balance',
          'UPI ID': bank.upi || '—',
          'Bank Name': bank.bank_name || '—',
          'Account Holder': bank.holder_name || bank.account_holder || author.name || '—',
          'Account Number': bank.account_number ? `'${bank.account_number}` : '—',
          'IFSC Code': bank.ifsc_code || bank.ifsc || '—',
          'Total Copies Sold': author.totalQuantitySold || 0,
          'Last Payment Date': author.lastPaymentDate ? new Date(author.lastPaymentDate).toLocaleDateString('en-IN') : 'None Recorded'
        };
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const fileName = `Literature_Chronicle_Royalty_Pending_${todayStr}`;

      const ws = XLSX.utils.json_to_sheet(formattedRows);

      const colKeys = Object.keys(formattedRows[0]);
      ws['!cols'] = colKeys.map(key => ({
        wch: Math.max(key.length + 4, 15)
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Royalty Pending Ledger');

      if (exportFormat === 'csv') {
        XLSX.writeFile(wb, `${fileName}.csv`, { bookType: 'csv' });
      } else {
        XLSX.writeFile(wb, `${fileName}.xlsx`, { bookType: 'xlsx' });
      }

      toast({
        title: 'Export Completed Successfully!',
        description: `Exported ${formattedRows.length} author records to ${exportFormat.toUpperCase()}.`
      });

      setDownloadModalOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: error.response?.data?.message || error.message || 'Could not download data.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const getInitials = (name) => {
    if (!name) return 'AU';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Executive Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-3xl border border-primary/10 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary p-2.5 rounded-2xl text-primary-foreground shadow-md shadow-primary/20">
              <WalletCards className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary tracking-tight flex items-center gap-2">
                Royalty Pending Ledger
              </h2>
              <p className="text-sm text-muted-foreground">
                Author pending royalty settlements, contact information, and download capabilities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="rounded-xl border-primary/20 bg-background/80 hover:bg-primary/5 gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setDownloadModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
          >
            <Download className="h-4 w-4" />
            Download All Data
          </Button>
        </div>
      </div>

      {/* Executive Metric / KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Royalty Pending */}
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card relative overflow-hidden rounded-3xl p-6 border-amber-500/20 bg-gradient-to-br from-amber-50/80 via-white/70 to-amber-50/30 dark:from-amber-950/20 dark:to-background shadow-md shadow-amber-500/5"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-bl-[3rem] -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Total Pending Royalty
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
              Outstanding
            </span>
          </div>
          <div className="text-3xl lg:text-4xl font-serif font-black text-amber-600 dark:text-amber-400 tracking-tight mb-2">
            {formatCurrency(summary.totalPendingRoyalty)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Across all pending authors</span>
            <span className="font-semibold text-foreground">
              Avg {formatCurrency(summary.avgPendingAmount)}
            </span>
          </div>
        </motion.div>

        {/* Authors Awaiting Payout */}
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card relative overflow-hidden rounded-3xl p-6 border-primary/20 bg-gradient-to-br from-primary/5 via-white/70 to-transparent shadow-md shadow-primary/5"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-primary/10 rounded-bl-[3rem] -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Authors Awaiting Payout
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/20">
              Roster
            </span>
          </div>
          <div className="text-3xl lg:text-4xl font-serif font-black text-primary tracking-tight mb-2">
            {summary.authorsWithPendingCount}
            <span className="text-base font-normal text-muted-foreground ml-2">/ {summary.totalAuthorsCount} authors</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> {summary.readyForPayoutCount} Ready
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5" /> {summary.missingDetailsCount} Missing Info
            </span>
          </div>
        </motion.div>

        {/* Total Accrued Royalty */}
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card relative overflow-hidden rounded-3xl p-6 border-border/80 bg-card/60 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-secondary" /> Lifetime Earned
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
              Sales Royalty
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-bold text-foreground tracking-tight mb-2">
            {formatCurrency(summary.totalRoyaltyEarned)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total sales commissions generated by authors
          </p>
        </motion.div>

        {/* Total Royalty Settled */}
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card relative overflow-hidden rounded-3xl p-6 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 via-white/70 to-emerald-50/20 dark:from-emerald-950/20 dark:to-background shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Settled / Paid
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              Disbursed
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-bold text-emerald-600 dark:text-emerald-400 tracking-tight mb-2">
            {formatCurrency(summary.totalRoyaltyDisbursed)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.totalRoyaltyEarned > 0
              ? `${Math.round((summary.totalRoyaltyDisbursed / summary.totalRoyaltyEarned) * 100)}% of total earnings paid out`
              : 'Historical disbursements'}
          </p>
        </motion.div>
      </div>

      {/* Search, Filter Chips & Sorting Control Bar */}
      <div className="glass-card rounded-3xl p-5 border border-border/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Author Name, Contact Number, Email, UPI ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background/80 rounded-2xl border-border focus-visible:ring-primary text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Amount Presets */}
            <div className="inline-flex bg-muted/60 p-1 rounded-2xl border border-border/60 text-xs font-semibold">
              <button
                onClick={() => { setAmountFilter('pending'); setCustomMinAmount(''); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  amountFilter === 'pending' && customMinAmount === ''
                    ? 'bg-background text-primary shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pending (&gt; ₹0)
              </button>
              <button
                onClick={() => { setAmountFilter('high'); setCustomMinAmount(''); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  amountFilter === 'high' && customMinAmount === ''
                    ? 'bg-background text-primary shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                &ge; ₹5,000
              </button>
              <button
                onClick={() => { setAmountFilter('medium'); setCustomMinAmount(''); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  amountFilter === 'medium' && customMinAmount === ''
                    ? 'bg-background text-primary shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                &ge; ₹1,000
              </button>
              <button
                onClick={() => { setAmountFilter('all'); setCustomMinAmount(''); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  amountFilter === 'all' && customMinAmount === ''
                    ? 'bg-background text-primary shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Roster
              </button>
            </div>

            {/* Payment Readiness Filter */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
              className="h-11 px-3.5 rounded-2xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Payment Statuses</option>
              <option value="ready">Ready for Payout (Has Bank/UPI)</option>
              <option value="missing_details">Missing Payment Details</option>
            </select>

            {/* Sort Selector */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
                setPage(1);
              }}
              className="h-11 px-3.5 rounded-2xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="balance-desc">Highest Pending First</option>
              <option value="balance-asc">Lowest Pending First</option>
              <option value="name-asc">Author Name (A-Z)</option>
              <option value="name-desc">Author Name (Z-A)</option>
              <option value="totalRoyalty-desc">Highest Total Earned</option>
              <option value="totalPayments-desc">Highest Total Paid</option>
            </select>
          </div>
        </div>

        {/* Applied Filter Summary Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span>Showing <strong>{authors.length}</strong> of <strong>{totalItems}</strong> matching authors</span>
            {(searchQuery || amountFilter !== 'pending' || paymentStatusFilter !== 'all' || customMinAmount) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setAmountFilter('pending');
                  setCustomMinAmount('');
                  setPaymentStatusFilter('all');
                  setSortBy('balance');
                  setSortOrder('desc');
                  setPage(1);
                }}
                className="text-primary hover:underline font-semibold ml-2"
              >
                Reset Filters
              </button>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>Amounts calculated in real-time from sales and disbursement records</span>
          </div>
        </div>
      </div>

      {/* Main Royalty Pending Ledger Table */}
      <div className="glass-card rounded-3xl border border-border overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/60 text-muted-foreground uppercase text-[11px] font-bold tracking-wider border-b border-border">
              <tr>
                <th className="py-4 px-6 cursor-pointer select-none" onClick={() => handleSortChange('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>Author Name</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer select-none" onClick={() => handleSortChange('mobile_number')}>
                  <div className="flex items-center gap-1.5">
                    <span>Contact Number</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer select-none" onClick={() => handleSortChange('balance')}>
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-extrabold">
                    <span>Pending Amount</span>
                    <ArrowUpDown className="h-3 w-3 opacity-90" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer select-none" onClick={() => handleSortChange('totalRoyalty')}>
                  <div className="flex items-center gap-1.5">
                    <span>Lifetime Royalty & Settled</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th className="py-4 px-6">
                  <span>Payment Details</span>
                </th>
                <th className="py-4 px-6 text-right">
                  <span>Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-muted-foreground">
                    <div className="inline-block p-4 rounded-full bg-primary/10 mb-3 text-primary animate-pulse">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                    </div>
                    <p className="text-base font-semibold text-foreground">Calculating pending balances...</p>
                    <p className="text-xs text-muted-foreground mt-1">Aggregating live sales ledgers and disbursement history</p>
                  </td>
                </tr>
              ) : authors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-muted-foreground">
                    <div className="inline-block p-4 rounded-full bg-muted mb-3 text-muted-foreground">
                      <WalletCards className="h-10 w-10 opacity-30" />
                    </div>
                    <p className="text-lg font-serif font-bold text-foreground">No matching author balances found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? `No authors match "${searchQuery}". Try clearing search or adjusting threshold.`
                        : 'All authors currently have their royalties fully settled or no records match your criteria.'}
                    </p>
                    {(searchQuery || amountFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setAmountFilter('all');
                          setPage(1);
                        }}
                        className="mt-4 rounded-xl"
                      >
                        View All Authors
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                authors.map((author) => {
                  const hasPending = author.balance > 0;
                  const isHighPriority = author.balance >= 5000;
                  const bank = author.bank_details || {};

                  return (
                    <tr
                      key={author._id}
                      className={`hover:bg-muted/40 transition-colors group ${
                        isHighPriority ? 'bg-amber-500/[0.02]' : ''
                      }`}
                    >
                      {/* Author Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                            {getInitials(author.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-serif font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2 truncate">
                              <span>{author.name || 'Unnamed Author'}</span>
                              {isHighPriority && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                                  High Priority
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                              <span>{author.email || 'No email provided'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Number */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {author.mobile_number ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 border border-border/80 group-hover:border-primary/20">
                            <Phone className="h-3.5 w-3.5 text-secondary" />
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {author.mobile_number}
                            </span>
                            <button
                              onClick={() => copyToClipboard(author.mobile_number, `phone-${author._id}`)}
                              title="Copy Contact Number"
                              className="ml-1 p-1 hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedKey === `phone-${author._id}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">No contact registered</span>
                        )}
                      </td>

                      {/* Pending Amount */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className={`text-lg font-mono font-bold tracking-tight ${
                            hasPending
                              ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                              : 'text-muted-foreground font-medium'
                          }`}>
                            {formatCurrency(author.balance)}
                          </div>
                          <div>
                            {hasPending ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Payable
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3" /> Settled
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Lifetime Sales & Paid */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-foreground flex items-center gap-2">
                            <span className="text-muted-foreground text-[11px]">Earned:</span>
                            <span className="font-semibold text-purple-700 dark:text-purple-400">{formatCurrency(author.totalRoyalty)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="text-[11px]">Settled:</span>
                            <span className="font-semibold text-emerald-600">{formatCurrency(author.totalPayments)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Payment Info */}
                      <td className="py-4 px-6 min-w-[200px]">
                        {bank.upi ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-medium">
                              <QrCode className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[140px]">{bank.upi}</span>
                              <button
                                onClick={() => copyToClipboard(bank.upi, `upi-${author._id}`)}
                                title="Copy UPI ID"
                                className="p-0.5 hover:bg-primary/20 rounded transition-colors"
                              >
                                {copiedKey === `upi-${author._id}` ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            {bank.account_number && (
                              <div className="text-[10px] text-muted-foreground">
                                Also has Bank: ••••{bank.account_number.slice(-4)}
                              </div>
                            )}
                          </div>
                        ) : bank.account_number ? (
                          <div className="space-y-0.5 text-xs">
                            <div className="font-semibold text-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-secondary" />
                              <span>{bank.bank_name || 'Bank Account'}</span>
                            </div>
                            <div className="text-muted-foreground font-mono text-[11px]">
                              A/C: ••••{bank.account_number.slice(-4)} ({bank.ifsc_code || bank.ifsc || 'No IFSC'})
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20 text-xs font-medium">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>Details Missing</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Payment Package */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyPaymentPackage(author)}
                            title="Copy Payment Details to Clipboard"
                            className="h-8 px-3 rounded-xl border-primary/20 hover:bg-primary/10 text-primary text-xs gap-1.5"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Details</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">
              Showing page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({totalItems} total authors)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="h-9 px-3 rounded-xl gap-1 text-xs"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (totalPages > 5) {
                    if (page > 3) pNum = page - 2 + i;
                    if (pNum > totalPages) pNum = totalPages - 4 + i;
                  }
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                        page === pNum
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="h-9 px-3 rounded-xl gap-1 text-xs"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Download All Data Modal */}
      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-none rounded-3xl p-6 sm:p-8 glass-card">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Download className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-serif font-bold text-primary">
              Download Royalty Pending Data
            </DialogTitle>
            <DialogDescription className="text-sm">
              Export complete author balances, contact details, and bank settlement info for accounting and disbursements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Scope selection */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Export Scope</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExportScope('pending')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    exportScope === 'pending'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <div className="text-xs font-bold">Only Pending</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Balance &gt; ₹0 ({summary.authorsWithPendingCount} authors)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope('filtered')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    exportScope === 'filtered'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <div className="text-xs font-bold">Current Filter</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Matching {totalItems} authors</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    exportScope === 'all'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <div className="text-xs font-bold">Entire Roster</div>
                  <div className="text-[10px] opacity-80 mt-0.5">All {summary.totalAuthorsCount} authors</div>
                </button>
              </div>
            </div>

            {/* Format selection */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">File Format</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('xlsx')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                    exportFormat === 'xlsx'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <div className="text-left">
                    <div className="text-xs font-bold">Excel (.xlsx)</div>
                    <div className="text-[10px] opacity-80">Formatted spreadsheet</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                    exportFormat === 'csv'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-800 dark:text-blue-300 font-bold'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="text-xs font-bold">CSV (.csv)</div>
                    <div className="text-[10px] opacity-80">Comma-separated text</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Included Fields preview */}
            <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 text-xs space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Included Data Columns:
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Author Name, Contact Number, Email, Pending Royalty Amount (INR), Total Royalty Earned, Total Royalty Paid, Payment Status, Bank Name, Account Holder, Account Number, IFSC Code, UPI ID, Total Copies Sold, and Timestamp.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDownloadModalOpen(false)}
              className="rounded-xl flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDownloadData}
              disabled={isExporting}
              className="rounded-xl flex-1 bg-primary text-primary-foreground gap-2"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download File
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoyaltyPendingSection;
