import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  History, Edit, Trash2, Loader2, FileX, Calendar, ChevronLeft, ChevronRight,
  Search, BarChart3, PieChart as PieIcon, TrendingUp, DollarSign, Layers,
  BookOpen, ChevronDown, Sparkles, AlertCircle, ShoppingCart, Percent, X
} from 'lucide-react';
import SalesTable from '@/components/SalesTable.jsx';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';

const UploadHistorySection = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [sales, setSales] = useState([]);
  const [royaltyData, setRoyaltyData] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [authorsMap, setAuthorsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [salesStats, setSalesStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { toast } = useToast();

  // Edit states for Royalty
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Edit states for Sales
  const [editSaleModalOpen, setEditSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [saleFormData, setSaleFormData] = useState({});
  const [savingSale, setSavingSale] = useState(false);

  const fetchAuthorsMap = async () => {
    try {
      const res = await apiClient.get('/auth/authors', { params: { limit: 1000 } });
      const users = res.data;
      const map = {};
      users.forEach(u => {
        if (u.mobile_number) {
          map[u.mobile_number] = u.name || 'Unknown Author';
        }
      });
      setAuthorsMap(map);
    } catch (error) {
      console.error('Failed to fetch authors map:', error);
    }
  };

  // Debounce the search term by 500ms before triggering a fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch,
        startDate,
        endDate,
        dateField: activeTab === 'sales' ? 'order_date' : 'payment_date'
      };

      if (activeTab === 'sales') {
        setLoadingStats(true);
        const [salesRes, statsRes] = await Promise.all([
          apiClient.get('/sales', { params }),
          apiClient.get('/sales/stats', { params })
        ]);
        setSales(salesRes.data.data);
        setTotalPages(salesRes.data.pages);
        setTotalItems(salesRes.data.total);
        setSalesStats(statsRes.data);
        setLoadingStats(false);
      } else {
        await fetchAuthorsMap();
        const res = await apiClient.get('/royalties', { params });
        setRoyaltyData(res.data.data);
        setTotalPages(res.data.pages);
        setTotalItems(res.data.total);
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load history data.', variant: 'destructive' });
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  }, [activeTab, page, limit, debouncedSearch, startDate, endDate, toast]);

  useEffect(() => {
    setPage(1); // Reset page when tab or filters change
  }, [activeTab, debouncedSearch, startDate, endDate, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteRoyalty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this royalty record?')) return;
    try {
      await apiClient.delete(`/royalties/${id}`);
      toast({ title: 'Success', description: 'Record deleted successfully.' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete record.', variant: 'destructive' });
    }
  };

  const handleEditRoyaltyClick = (record) => {
    setEditingRecord(record);
    let datePart = '';
    if (record.payment_date) {
      const d = new Date(record.payment_date);
      datePart = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    setFormData({
      author_contact_number: record.author_contact_number,
      amount: record.amount,
      paid_amount: record.paid_amount || 0,
      payment_date: datePart,
    });
    setEditModalOpen(true);
  };

  const handleUpdateRoyalty = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      if (payload.payment_date) payload.payment_date = new Date(payload.payment_date).toISOString();

      await apiClient.put(`/royalties/${editingRecord._id}`, payload);
      toast({ title: 'Success', description: 'Record updated successfully.' });
      setEditModalOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update record.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleEditSaleClick = (sale) => {
    setEditingSale(sale);
    let datePart = '';
    if (sale.order_date) {
      const d = new Date(sale.order_date);
      datePart = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    setSaleFormData({
      mrp: sale.mrp,
      quantity: sale.quantity,
      order_date: datePart,
    });
    setEditSaleModalOpen(true);
  };

  const handleUpdateSale = async (e) => {
    e.preventDefault();
    setSavingSale(true);
    try {
      const payload = { ...saleFormData };
      if (payload.order_date) payload.order_date = new Date(payload.order_date).toISOString();

      await apiClient.put(`/sales/${editingSale._id}`, payload);
      toast({ title: 'Success', description: 'Sale record updated successfully.' });
      setEditSaleModalOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update sale record.', variant: 'destructive' });
    } finally {
      setSavingSale(false);
    }
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales record?')) return;
    try {
      await apiClient.delete(`/sales/${id}`);
      toast({ title: 'Success', description: 'Sale record deleted successfully.' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete record.', variant: 'destructive' });
    }
  };

  const getPlatformColor = (name) => {
    const norm = (name || '').toLowerCase();
    if (norm.includes('amazon')) return '#f59e0b';
    if (norm.includes('flipkart')) return '#3b82f6';
    return '#8b5cf6';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary flex items-center gap-2"><History className="h-6 w-6" /> Upload History</h2>
      <div className="flex space-x-2 border-b pb-2">
        <Button variant={activeTab === 'sales' ? 'default' : 'ghost'} onClick={() => setActiveTab('sales')}>Sales Data</Button>
        <Button variant={activeTab === 'royalty' ? 'default' : 'ghost'} onClick={() => setActiveTab('royalty')}>Royalty Data</Button>
      </div>

      {/* Premium Stat Cards */}
      {activeTab === 'sales' && salesStats && salesStats.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-card bg-gradient-to-br from-white/70 to-blue-50/40 rounded-2xl p-5 border border-white/50 premium-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Transactions</p>
                <p className="text-3xl font-extrabold text-primary font-mono tracking-tight">{totalItems}</p>
              </div>
              <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-600">
                <History className="h-5 w-5" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden mt-4">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Matching search & filters</p>
          </div>

          <div className="glass-card bg-gradient-to-br from-white/70 to-emerald-50/40 rounded-2xl p-5 border border-white/50 premium-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Units Distributed</p>
                <p className="text-3xl font-extrabold text-primary font-mono tracking-tight">{salesStats.summary.totalQuantity || 0}</p>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-4 font-semibold">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Ebook: {salesStats.summary.totalEbook || 0}</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Print: {salesStats.summary.totalPhysical || 0}</span>
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-white/70 to-amber-50/40 rounded-2xl p-5 border border-white/50 premium-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Estimated Revenue</p>
                <p className="text-3xl font-extrabold text-primary font-mono tracking-tight">{formatCurrency(salesStats.summary.totalRevenue)}</p>
              </div>
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden mt-4">
              <div 
                className="bg-amber-500 h-full rounded-full" 
                style={{ width: `${salesStats.summary.totalRevenue ? Math.min(100, (salesStats.summary.totalRoyalty / salesStats.summary.totalRevenue) * 100) : 0}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-semibold flex justify-between">
              <span>Avg Sales Value:</span>
              <span className="font-mono">{formatCurrency(salesStats.summary.totalItems ? (salesStats.summary.totalRevenue / salesStats.summary.totalItems) : 0)}</span>
            </p>
          </div>

          <div className="glass-card bg-gradient-to-br from-white/70 to-purple-50/40 rounded-2xl p-5 border border-white/50 premium-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Accrued Royalties</p>
                <p className="text-3xl font-extrabold text-purple-700 font-mono tracking-tight">{formatCurrency(salesStats.summary.totalRoyalty)}</p>
              </div>
              <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-600">
                <Percent className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-4 font-semibold">
              <span>Royalty Yield Rate:</span>
              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                {salesStats.summary.totalRevenue ? ((salesStats.summary.totalRoyalty / salesStats.summary.totalRevenue) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts */}
      {activeTab === 'sales' && salesStats && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="bg-amber-500/10 p-2 rounded-lg">
                <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-primary">Interactive Sales & Royalty Analytics</h3>
                <p className="text-[10px] text-muted-foreground">Visualize distribution trends, split analysis, and sales history</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="gap-2 text-xs font-semibold h-9"
            >
              {showAnalytics ? 'Hide Charts' : 'Show Charts'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${showAnalytics ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h4 className="text-xs font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> Sales Trend & Royalties
                </h4>
                <div className="h-[280px] w-full">
                  {salesStats.dailySales && salesStats.dailySales.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesStats.dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRoyalty" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="_id"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          tickFormatter={(date) => {
                            try {
                              return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                            } catch (e) {
                              return date;
                            }
                          }}
                        />
                        <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(val) => `₹${val}`} />
                        <ChartTooltip
                          contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }}
                          labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: '700' }} />
                        <Area yAxisId="left" type="monotone" dataKey="salesCount" name="Units Sold" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                        <Area yAxisId="right" type="monotone" dataKey="royalty" name="Estimated Royalty (₹)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRoyalty)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                      <AlertCircle className="h-8 w-8 opacity-40" />
                      <p className="text-xs">No trend data available for this range</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
                <h4 className="text-xs font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <PieIcon className="h-4 w-4 text-amber-500" /> Platform Distribution Split
                </h4>
                <div className="h-[200px] w-full relative flex-1 flex items-center justify-center">
                  {salesStats.platformDistribution && salesStats.platformDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesStats.platformDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="quantity"
                          nameKey="_id"
                        >
                          {salesStats.platformDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getPlatformColor(entry._id)} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 11 }}
                          formatter={(value, name, props) => [`${value} Units (₹${formatCurrency(props.payload.royalty)} Royalty)`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                      <AlertCircle className="h-8 w-8 opacity-40" />
                      <p className="text-xs">No distribution data available</p>
                    </div>
                  )}
                </div>
                {salesStats.platformDistribution && salesStats.platformDistribution.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t">
                    {salesStats.platformDistribution.map((entry, index) => (
                      <div key={entry._id} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getPlatformColor(entry._id) }} />
                        <span>{entry._id} ({entry.quantity} units)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/20 rounded-xl border border-border/50">
        <div className="flex-1 min-w-[240px] space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1 font-bold">Search Records</Label>
          <div className="relative">
            {search !== debouncedSearch ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              id="sales-search-input"
              placeholder={activeTab === 'sales' ? "Search title, ISBN, order ID..." : "Search author name or contact..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-10 bg-background border-border/70"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="w-[150px] space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1 font-bold">Start Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              id="sales-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-9 h-10 bg-background border-border/70"
            />
          </div>
        </div>

        <div className="w-[150px] space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1 font-bold">End Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              id="sales-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-9 h-10 bg-background border-border/70"
            />
          </div>
        </div>

        <div className="w-[130px] space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1 font-bold">Page Size</Label>
          <select
            id="sales-page-size"
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="w-full h-10 px-3 bg-background border border-input rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary/20"
          >
            <option value={10}>10 records</option>
            <option value={25}>25 records</option>
            <option value={50}>50 records</option>
            <option value={100}>100 records</option>
          </select>
        </div>

        <Button
          id="sales-filter-reset"
          variant="outline"
          onClick={() => { setSearch(''); setDebouncedSearch(''); setStartDate(''); setEndDate(''); setPage(1); }}
          className="h-10 text-xs px-4 font-bold border-border/80 hover:bg-muted"
          disabled={!search && !startDate && !endDate && page === 1 && limit === 10}
        >
          Reset
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden p-4 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              {activeTab === 'sales' ? (
                <SalesTable
                  sales={sales}
                  showRoyalty={true}
                  onRefresh={fetchData}
                  isPaginated={true}
                  onEdit={handleEditSaleClick}
                  onDelete={handleDeleteSale}
                />
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3">Author Name</th>
                      <th className="p-3">Contact Number</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Paid Amount</th>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {royaltyData.map(r => {
                      const authorName = r.authorId?.name || authorsMap[r.author_contact_number] || 'Unknown';
                      return (
                        <tr key={r._id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3 font-medium">{authorName}</td>
                          <td className="p-3 font-mono text-xs">{r.author_contact_number}</td>
                          <td className="p-3 font-semibold">{formatCurrency(r.amount)}</td>
                          <td className="p-3 text-green-600 font-semibold">{formatCurrency(r.paid_amount)}</td>
                          <td className="p-3">{formatDate(r.payment_date)}</td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditRoyaltyClick(r)}><Edit className="h-4 w-4 text-blue-600" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteRoyalty(r._id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Showing {activeTab === 'sales' ? sales.length : royaltyData.length} of {totalItems} records
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-bold px-3 py-1 bg-muted rounded-md border">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Edit Royalty Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateRoyalty} className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Contact Number</Label><Input value={formData.author_contact_number || ''} onChange={(e) => setFormData({ ...formData, author_contact_number: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" step="0.01" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Paid Amount (₹)</Label><Input type="number" step="0.01" value={formData.paid_amount || ''} onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })} /></div>
            <div className="space-y-2"><Label>Payment Date</Label><Input type="date" value={formData.payment_date || ''} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} required /></div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={editSaleModalOpen} onOpenChange={setEditSaleModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Edit Sale Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSale} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>MRP (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={saleFormData.mrp || ''}
                onChange={(e) => setSaleFormData({ ...saleFormData, mrp: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={saleFormData.quantity || ''}
                onChange={(e) => setSaleFormData({ ...saleFormData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Order Date</Label>
              <Input
                type="date"
                value={saleFormData.order_date || ''}
                onChange={(e) => setSaleFormData({ ...saleFormData, order_date: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditSaleModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={savingSale}>{savingSale ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadHistorySection;
