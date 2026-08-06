import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Banknote, 
  Edit, 
  Trash2, 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  X, 
  CreditCard,
  ChevronsUpDown,
  Filter
} from 'lucide-react';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.jsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/utils/utils';

const WithdrawalManagementSection = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Modals / Dialog State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingWithdrawal, setEditingWithdrawal] = useState(null);
  const [openAuthorPopover, setOpenAuthorPopover] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    authorId: '',
    amount: '',
    status: 'pending',
    bank_name: '',
    account_holder: '',
    account_number: '',
    ifsc_code: '',
    upi: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [withdrawalToDelete, setWithdrawalToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const fetchWithdrawals = async () => {
    try {
      const res = await apiClient.get('/withdrawals');
      setWithdrawals(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({ title: 'Error', description: 'Failed to load withdrawal requests.', variant: 'destructive' });
    }
  };

  const fetchAuthors = async () => {
    try {
      const res = await apiClient.get('/auth/authors', { params: { limit: 1000 } });
      setAuthors(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchWithdrawals(), fetchAuthors()]);
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and Search logic
  const filteredWithdrawals = withdrawals.filter(w => {
    const authorName = w.authorId?.name?.toLowerCase() || '';
    const authorEmail = w.authorId?.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = authorName.includes(query) || authorEmail.includes(query);
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
  const paginatedWithdrawals = filteredWithdrawals.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const handleOpenFormModal = (withdrawal = null) => {
    if (withdrawal) {
      setEditingWithdrawal(withdrawal);
      setFormData({
        authorId: withdrawal.authorId?._id || withdrawal.authorId || '',
        amount: withdrawal.amount || '',
        status: withdrawal.status || 'pending',
        bank_name: withdrawal.bank_details?.bank_name || '',
        account_holder: withdrawal.bank_details?.holder_name || withdrawal.bank_details?.account_holder || '',
        account_number: withdrawal.bank_details?.account_number || '',
        ifsc_code: withdrawal.bank_details?.ifsc_code || '',
        upi: withdrawal.bank_details?.upi || '',
      });
    } else {
      setEditingWithdrawal(null);
      setFormData({
        authorId: '',
        amount: '',
        status: 'pending',
        bank_name: '',
        account_holder: '',
        account_number: '',
        ifsc_code: '',
        upi: '',
      });
    }
    setIsFormModalOpen(true);
  };

  const handleAuthorSelect = (authorId) => {
    const selected = authors.find(a => a._id === authorId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        authorId: selected._id,
        bank_name: selected.bank_details?.bank_name || '',
        account_holder: selected.bank_details?.holder_name || selected.bank_details?.account_holder || selected.name || '',
        account_number: selected.bank_details?.account_number || '',
        ifsc_code: selected.bank_details?.ifsc_code || '',
        upi: selected.bank_details?.upi || '',
      }));
    }
    setOpenAuthorPopover(false);
  };

  const handleQuickStatusChange = async (withdrawal, newStatus) => {
    try {
      await apiClient.put(`/withdrawals/${withdrawal._id}`, { status: newStatus });
      toast({ title: 'Success', description: `Request status updated to ${newStatus}.` });
      fetchWithdrawals();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.authorId) {
      toast({ title: 'Validation Error', description: 'Please select an author.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        authorId: formData.authorId,
        amount: parseFloat(formData.amount),
        status: formData.status,
        bank_details: {
          bank_name: formData.bank_name,
          holder_name: formData.account_holder,
          account_number: formData.account_number,
          ifsc_code: formData.ifsc_code,
          upi: formData.upi
        }
      };

      if (editingWithdrawal) {
        await apiClient.put(`/withdrawals/${editingWithdrawal._id}`, payload);
        toast({ title: 'Success', description: 'Withdrawal request synchronized successfully.' });
      } else {
        await apiClient.post('/withdrawals', payload);
        toast({ title: 'Success', description: 'Withdrawal request created successfully.' });
      }
      setIsFormModalOpen(false);
      fetchWithdrawals();
    } catch (error) {
      console.error('Error saving request:', error);
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save request.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (withdrawal) => {
    setWithdrawalToDelete(withdrawal._id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!withdrawalToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/withdrawals/${withdrawalToDelete}`);
      toast({ title: 'Success', description: 'Withdrawal request deleted successfully.' });
      fetchWithdrawals();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({ title: 'Error', description: 'Failed to delete withdrawal request.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setWithdrawalToDelete(null);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-150';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-150';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-150';
      case 'processed': return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-150';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Banknote className="h-6 w-6" /> Withdrawal Requests
        </h2>
        <Button onClick={() => handleOpenFormModal()}>
          <Plus className="h-4 w-4 mr-2" /> Add Request
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by author name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full bg-background"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="flex h-10 w-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="processed">Processed</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-xs tracking-wider border-b border-border">
              <tr>
                <th className="py-4 px-6">Author</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Requested At</th>
                <th className="py-4 px-6">Bank Details</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p>Loading withdrawal requests...</p>
                  </td>
                </tr>
              ) : paginatedWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-muted-foreground">
                    <Banknote className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">No withdrawal requests found.</p>
                  </td>
                </tr>
              ) : (
                paginatedWithdrawals.map((w) => (
                  <tr key={w._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-foreground">{w.authorId?.name || 'Unknown Author'}</div>
                      <div className="text-xs text-muted-foreground">{w.authorId?.email || 'No Email'}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-foreground">{formatCurrency(w.amount)}</td>
                    <td className="py-4 px-6">
                      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors", getStatusBadgeClass(w.status))}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{formatDate(w.requested_at || w.createdAt)}</td>
                    <td className="py-4 px-6 text-xs max-w-[220px] truncate text-muted-foreground">
                      {w.bank_details?.upi ? (
                        <span className="font-mono bg-primary/5 px-2 py-0.5 rounded text-primary border border-primary/10">
                          {w.bank_details.upi}
                        </span>
                      ) : w.bank_details?.account_number ? (
                        <div className="leading-tight">
                          <span className="font-medium text-foreground">{w.bank_details.bank_name}</span>
                          <div>A/C: {w.bank_details.account_number}</div>
                          <div>IFSC: {w.bank_details.ifsc_code}</div>
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground/50">None</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1.5 items-center">
                        {/* Quick Approve / Reject actions for pending */}
                        {w.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleQuickStatusChange(w, 'approved')} 
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 rounded-full"
                              title="Approve Request"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleQuickStatusChange(w, 'rejected')} 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                              title="Reject Request"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {/* Quick Process actions for approved */}
                        {w.status === 'approved' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleQuickStatusChange(w, 'processed')} 
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8 rounded-full"
                            title="Mark as Processed"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenFormModal(w)} 
                          className="text-primary hover:bg-primary/5 h-8 w-8 rounded-full"
                          title="Edit Details"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(w)} 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                          title="Delete Request"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing {paginatedWithdrawals.length} of {filteredWithdrawals.length} requests</p>
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

      {/* Create / Edit Dialog */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingWithdrawal ? 'Edit Withdrawal Request' : 'Create Withdrawal Request'}
            </DialogTitle>
            <DialogDescription>
              Configure the withdrawal transaction values, status, and target bank coordinates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* Author Picker (only enabled/visible when creating) */}
            {!editingWithdrawal ? (
              <div className="space-y-2">
                <Label className="flex gap-1.5 items-center">
                  Target Author <span className="text-red-500 font-bold">*</span>
                </Label>
                <Popover open={openAuthorPopover} onOpenChange={setOpenAuthorPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openAuthorPopover}
                      className="w-full justify-between h-10 px-3 py-2 border border-input hover:bg-background bg-background font-normal"
                    >
                      <span className="truncate">
                        {formData.authorId
                          ? authors.find((author) => author._id === formData.authorId)?.name || "Select author..."
                          : "Select author..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search author..." />
                      <CommandList>
                        <CommandEmpty>No author found.</CommandEmpty>
                        <CommandGroup>
                          {authors.map((author) => (
                            <CommandItem
                              key={author._id}
                              value={`${author.name} ${author.email}`}
                              onSelect={() => handleAuthorSelect(author._id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  formData.authorId === author._id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{author.name} ({author.email})</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Author</Label>
                <div className="text-base font-semibold text-primary">
                  {editingWithdrawal.authorId?.name || 'Unknown Author'} ({editingWithdrawal.authorId?.email})
                </div>
              </div>
            )}

            {/* Amount and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) <span className="text-red-500 font-bold">*</span></Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Transaction Status</Label>
                <select 
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="processed">Processed</option>
                </select>
              </div>
            </div>

            {/* Bank Coordinates */}
            <div className="bg-muted/40 p-4 rounded-xl border border-border mt-2">
              <h4 className="font-semibold text-primary text-sm mb-3">Bank & Payment Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_holder">Account Holder Name</Label>
                  <Input
                    id="account_holder"
                    value={formData.account_holder}
                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                    placeholder="Holder Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="Account Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc_code">IFSC Code</Label>
                  <Input
                    id="ifsc_code"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                    placeholder="IFSC Code"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="upi">UPI ID</Label>
                  <Input
                    id="upi"
                    value={formData.upi}
                    onChange={(e) => setFormData({ ...formData, upi: e.target.value })}
                    placeholder="e.g. name@upi"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Request'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog 
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Delete Withdrawal Request"
        message="Are you sure you want to permanently remove this withdrawal request? This action is irreversible."
      />
    </div>
  );
};

export default WithdrawalManagementSection;
