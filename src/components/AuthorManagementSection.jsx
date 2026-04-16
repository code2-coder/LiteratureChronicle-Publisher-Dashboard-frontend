import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Edit, Trash2, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import BalanceSheetDownloader from './BalanceSheetDownloader.jsx';
import DeleteConfirmationDialog from './DeleteConfirmationDialog.jsx';
import { calculateTotalRoyalty, calculatePaidRoyalty, calculateRoyalty } from '@/lib/royaltyCalculator.js';

const AuthorManagementSection = () => {
  const [authors, setAuthors] = useState([]);
  const [allAuthorsSummary, setAllAuthorsSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  
  const fetchAuthors = async () => {
    setLoading(true);
    try {
      // 1. Fetch paginated authors, FULL author roster (for summary), all sales, and all royalties
      const [authRes, fullAuthRes, salesRes, royaltiesRes] = await Promise.all([
        apiClient.get('/auth/authors', { params: { page, limit: 10, search: searchQuery } }),
        apiClient.get('/auth/authors', { params: { limit: 10000, search: searchQuery } }),
        apiClient.get('/sales', { params: { limit: 10000 } }),
        apiClient.get('/royalties', { params: { limit: 10000 } })
      ]);

      const { data: users, total, pages } = authRes.data;
      const allUsers = fullAuthRes.data.data || fullAuthRes.data;
      const allSales = salesRes.data.data || salesRes.data;
      const allRoyalties = royaltiesRes.data.data || royaltiesRes.data;

      // 2. Helper function to calculate stats for a single user
      const calculateUserStats = (user) => {
        const authorSales = allSales.filter(sale => {
          const sAuthorId = sale.authorId?._id || sale.authorId;
          const uId = user._id;
          return sAuthorId === uId || sAuthorId?.toString() === uId?.toString();
        });

        const totalRoyaltyValue = authorSales.reduce((sum, sale) => {
          const mrp = sale.mrp || 0;
          const qty = sale.quantity || 1;
          const comm = sale.platformId?.commission_percentage || 0;
          const printCost = sale.bookId?.printing_cost || 0;
          const bookType = sale.bookId?.format || sale.format || 'physical';
          return sum + calculateRoyalty(mrp, comm, printCost, qty, bookType);
        }, 0);

        const totalPaymentsValue = allRoyalties
          .filter(r => r.author_contact_number === user.mobile_number)
          .reduce((sum, r) => sum + (parseFloat(r.paid_amount) || 0), 0);

        return {
          ...user,
          totalPayments: totalPaymentsValue,
          balance: Math.max(0, totalRoyaltyValue - totalPaymentsValue)
        };
      };

      // 3. Process current page authors
      const enrichedAuthors = users.map(calculateUserStats);
      
      // 4. Process all authors for global summary/download
      const fullSummary = allUsers.map(calculateUserStats);

      setAuthors(enrichedAuthors);
      setAllAuthorsSummary(fullSummary);
      setTotalPages(pages);
      setTotalItems(total);
    } catch (error) {
      console.error('Error fetching authors:', error);
      toast({ title: 'Error', description: 'Failed to load authors.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset to page 1 on search
  }, [searchQuery]);

  useEffect(() => {
    fetchAuthors();
  }, [page, searchQuery]);

  const handleEditStart = (author) => {
    setEditingAuthor(author);
    setEditForm({ 
      name: author.name || '', 
      email: author.email || '', 
      mobile_number: author.mobile_number || '', 
      bank_name: author.bank_details?.bank_name || '',
      bank_account_holder: author.bank_details?.holder_name || author.bank_details?.account_holder || '',
      bank_account_number: author.bank_details?.account_number || '',
      bank_ifsc: author.bank_details?.ifsc_code || '',
      bank_upi: author.bank_details?.upi || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        name: editForm.name,
        email: editForm.email,
        mobile_number: editForm.mobile_number,
        bank_details: {
          bank_name: editForm.bank_name,
          account_holder: editForm.bank_account_holder, // This will be mapped to holder_name in controller
          account_number: editForm.bank_account_number,
          ifsc_code: editForm.bank_ifsc,
          upi: editForm.bank_upi
        }
      };

      await apiClient.put(`/auth/${editingAuthor._id}`, payload);
      toast({ title: 'Success', description: 'Author profile successfully synchronized.' });
      setEditModalOpen(false);
      fetchAuthors();
    } catch (error) {
      toast({ title: 'Operational Error', description: error.response?.data?.message || error.message, variant: 'destructive' });
    }
  };

  const handleDeleteClick = (id) => {
    setAuthorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!authorToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/auth/${authorToDelete}`);
      toast({ title: 'Success', description: 'Author record permanently removed.' });
      fetchAuthors();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to purge author record.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAuthorToDelete(null);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Users className="h-6 w-6" /> Author Roster
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search authors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[250px] bg-background"
            />
          </div>
          <BalanceSheetDownloader authorsData={allAuthorsSummary} />
          <Button onClick={() => setBalanceModalOpen(true)} variant="secondary" className="shadow-sm">
            Balance Summary
          </Button>
        </div>
      </div>



      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-xs tracking-wider border-b border-border">
              <tr>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Mobile</th>
                <th className="py-4 px-6">UPI ID</th>
                <th className="py-4 px-6">Total Collected</th>
                <th className="py-4 px-6">Pending Settlement</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p>Loading authors data...</p>
                  </td>
                </tr>
              ) : authors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">No authors found.</p>
                  </td>
                </tr>
              ) : (
                authors.map((author) => (
                  <tr key={author._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-foreground">{author.name || 'Unnamed Author'}</td>
                    <td className="py-4 px-6 text-muted-foreground">{author.email}</td>
                    <td className="py-4 px-6 text-muted-foreground">{author.mobile_number || 'N/A'}</td>
                    <td className="py-4 px-6 text-muted-foreground font-medium">{author.bank_details?.upi || '—'}</td>
                    <td className="py-4 px-6 text-green-600 font-medium">{formatCurrency(author.totalPayments)}</td>
                    <td className="py-4 px-6 font-bold text-orange-600">{formatCurrency(author.balance)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditStart(author)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(author._id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground">Showing {authors.length} of {totalItems} authors</p>
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

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Author Profile</DialogTitle>
            <DialogDescription>
              Modify author contact information and banking details for accurate settlements.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-5 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Mobile Number</Label><Input value={editForm.mobile_number} onChange={e => setEditForm({...editForm, mobile_number: e.target.value})} required /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required /></div>
            </div>
            
            <div className="bg-muted/40 p-4 rounded-xl border border-border mt-6">
              <h4 className="font-semibold text-primary mb-4">Bank & Payment Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Bank Name</Label><Input value={editForm.bank_name} onChange={e => setEditForm({...editForm, bank_name: e.target.value})} /></div>
                <div className="space-y-2"><Label>Account Holder</Label><Input value={editForm.bank_account_holder} onChange={e => setEditForm({...editForm, bank_account_holder: e.target.value})} /></div>
                <div className="space-y-2"><Label>Account Number</Label><Input value={editForm.bank_account_number} onChange={e => setEditForm({...editForm, bank_account_number: e.target.value})} /></div>
                <div className="space-y-2"><Label>IFSC Code</Label><Input value={editForm.bank_ifsc} onChange={e => setEditForm({...editForm, bank_ifsc: e.target.value})} /></div>
                <div className="space-y-2 sm:col-span-2"><Label>UPI ID</Label><Input value={editForm.bank_upi} onChange={e => setEditForm({...editForm, bank_upi: e.target.value})} /></div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={balanceModalOpen} onOpenChange={setBalanceModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Author Balance Summary</DialogTitle>
            <DialogDescription>
              A bird's-eye view of all pending balances across your author roster.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-xl overflow-hidden mt-4">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Author</th>
                  <th className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right">Balance Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...allAuthorsSummary].sort((a, b) => b.balance - a.balance).map(a => (
                  <tr key={a._id} className="hover:bg-muted/30">
                    <td className="p-4 font-medium">{a.name || 'Unnamed Author'}</td>
                    <td className="p-4 font-bold text-orange-600 text-right">{formatCurrency(a.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog 
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Remove Author"
        message="Are you sure you want to permanently delete this author?"
      />
    </div>
  );
};

export default AuthorManagementSection;
