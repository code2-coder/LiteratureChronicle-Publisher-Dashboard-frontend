import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, Edit, Trash2, Loader2, FileX, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import SalesTable from '@/components/SalesTable.jsx';

const UploadHistorySection = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [sales, setSales] = useState([]);
  const [royaltyData, setRoyaltyData] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [authorsMap, setAuthorsMap] = useState({});
  const [loading, setLoading] = useState(true);
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
      const res = await apiClient.get('/auth/authors');
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search,
        startDate,
        endDate,
        dateField: activeTab === 'sales' ? 'order_date' : 'payment_date'
      };

      if (activeTab === 'sales') {
        const res = await apiClient.get('/sales', { params });
        setSales(res.data.data);
        setTotalPages(res.data.pages);
        setTotalItems(res.data.total);
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
    }
  }, [activeTab, page, search, startDate, endDate, toast]);

  useEffect(() => {
    setPage(1); // Reset page when tab or filters change
  }, [activeTab, search, startDate, endDate]);

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
      // Format as YYYY-MM-DD for the date input
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

  // Calculate ebook vs Physical analysis for sales
  const salesAnalysis = React.useMemo(() => {
    if (sales.length === 0) return { ebook: 0, physical: 0, total: 0 };
    const ebook = sales.filter(s => (s.bookId?.format || s.format || 'physical').toLowerCase() === 'ebook').length;
    const physical = sales.filter(s => (s.bookId?.format || s.format || 'physical').toLowerCase() === 'physical').length;
    return { ebook, physical, total: ebook + physical };
  }, [sales]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary flex items-center gap-2"><History className="h-6 w-6" /> Upload History</h2>
      <div className="flex space-x-2 border-b pb-2">
        <Button variant={activeTab === 'sales' ? 'default' : 'ghost'} onClick={() => setActiveTab('sales')}>Sales Data</Button>
        <Button variant={activeTab === 'royalty' ? 'default' : 'ghost'} onClick={() => setActiveTab('royalty')}>Royalty Data</Button>
      </div>

      {activeTab === 'sales' && salesAnalysis.total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Ebook Sales</p>
            <p className="text-2xl font-bold text-blue-600">{salesAnalysis.ebook}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Physical Sales</p>
            <p className="text-2xl font-bold text-green-600">{salesAnalysis.physical}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Total Records</p>
            <p className="text-2xl font-bold text-primary">{totalItems}</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/20 rounded-xl border border-border/50">
        <div className="flex-1 min-w-[240px] space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Search Records</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'sales' ? "Search title, ISBN, order ID..." : "Search author name or contact..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-background"
            />
          </div>
        </div>

        <div className="w-[160px] space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Start Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-9 h-10 bg-background"
            />
          </div>
        </div>

        <div className="w-[160px] space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">End Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-9 h-10 bg-background"
            />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setPage(1); }}
          className="h-10 text-xs px-3"
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
