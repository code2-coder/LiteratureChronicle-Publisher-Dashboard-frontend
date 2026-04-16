import React, { useState, useMemo } from 'react';
import apiClient from '@/lib/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { calculateRoyalty } from '@/lib/royaltyCalculator.js';
import { Button } from '@/components/ui/button';

const SalesTable = ({ sales, showRoyalty = false, isPaginated = false, onEdit, onDelete }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [filter, setFilter] = useState('');

  const handleSort = (key) => {
    setSortConfig({ 
      key, 
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' 
    });
  };

  const filteredAndSortedSales = useMemo(() => {
    if (isPaginated) return sales; // Use raw sales from backend when paginated

    let filtered = (Array.isArray(sales) ? sales : []).filter(s => 
      s.title?.toLowerCase().includes(filter.toLowerCase()) || 
      s.isbn?.includes(filter) ||
      s.order_id?.toLowerCase().includes(filter.toLowerCase()) ||
      s.author_name?.toLowerCase().includes(filter.toLowerCase())
    );
    
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'order_date' || sortConfig.key === 'payment_date') { 
        aVal = new Date(aVal || a.createdAt); 
        bVal = new Date(bVal || b.createdAt); 
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [sales, filter, sortConfig]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-IN') : 'N/A';

  // Determine if this is a royalty table based on data shape
  const isRoyaltyTable = Array.isArray(sales) && sales.length > 0 && sales[0].payment_date !== undefined;

  return (
    <div className="space-y-4">
      {!isPaginated && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Input 
            placeholder="Search records..." 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            className="max-w-md bg-background" 
          />
        </div>
      )}
      
      <div className="border rounded-xl bg-card overflow-hidden shadow-sm overflow-x-auto scrollbar-thin">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                {!isRoyaltyTable && <TableHead className="w-24">Order ID</TableHead>}
                {!isRoyaltyTable && <TableHead className="w-32">ISBN</TableHead>}
                {!isRoyaltyTable && <TableHead className="w-24">Type</TableHead>}
                
                <TableHead className="min-w-[200px]">
                  <button onClick={() => handleSort(isRoyaltyTable ? 'author_name' : 'title')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    {isRoyaltyTable ? 'Author Name' : 'Title'} <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                
                {!isRoyaltyTable && <TableHead className="w-24">Platform</TableHead>}
                {!isRoyaltyTable && <TableHead className="w-24">MRP</TableHead>}
                {!isRoyaltyTable && <TableHead className="w-20">Qty</TableHead>}
                
                {showRoyalty && !isRoyaltyTable && <TableHead className="w-24">Royalty</TableHead>}
                
                {isRoyaltyTable && <TableHead className="w-24">Amount</TableHead>}
                {isRoyaltyTable && <TableHead className="w-24">Paid Amount</TableHead>}
                {isRoyaltyTable && <TableHead className="w-24">Balance Amount</TableHead>}
                
                <TableHead className="w-32 text-right">
                  <button onClick={() => handleSort(isRoyaltyTable ? 'payment_date' : 'order_date')} className="flex items-center gap-1 hover:text-primary transition-colors ml-auto">
                    {isRoyaltyTable ? 'Payment Date' : 'Order Date'} <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                {!isRoyaltyTable && <TableHead className="w-20 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    No records found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedSales.map((record, i) => {
                  const recordId = record._id || record.id || i;
                  
                  if (isRoyaltyTable) {
                    const amount = parseFloat(record.amount) || 0;
                    const paidAmount = parseFloat(record.paid_amount) || amount;
                    const balanceAmount = Math.max(0, amount - paidAmount);
                    
                    return (
                      <TableRow key={recordId} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-serif font-bold text-primary">{record.author_name || record.authorId?.name || 'Unknown'}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(amount)}</TableCell>
                        <TableCell className="text-green-600 font-bold">{formatCurrency(paidAmount)}</TableCell>
                        <TableCell className="text-orange-600 font-extrabold">{formatCurrency(balanceAmount)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatDate(record.payment_date)}</TableCell>
                      </TableRow>
                    );
                  }

                  const mrp = record.mrp || 0;
                  const qty = record.quantity || 1;
                  const comm = record.platformId?.commission_percentage || 0;
                  const printCost = record.bookId?.printing_cost || 0;
                  const bookType = record.bookId?.format || record.format || 'physical';
                  const royalty = calculateRoyalty(mrp, comm, printCost, qty, bookType);

                  return (
                    <TableRow key={recordId} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{record.order_id}</TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{record.isbn}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${bookType === 'ebook' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                          {bookType === 'ebook' ? 'Ebook' : 'Physical'}
                        </span>
                      </TableCell>
                      <TableCell className="font-serif font-bold text-primary max-w-[200px] truncate" title={record.title}>{record.title}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-lg bg-primary/5 px-2 py-1 text-[10px] font-bold text-primary border border-primary/10">
                          {record.platform_name}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(mrp)}</TableCell>
                      <TableCell className="font-bold">{qty}</TableCell>
                      {showRoyalty && <TableCell className="text-green-600 font-extrabold">{formatCurrency(royalty)}</TableCell>}
                      <TableCell className="text-right text-muted-foreground">{formatDate(record.order_date || record.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onEdit && onEdit(record)}
                            className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onDelete && onDelete(record._id)}
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default SalesTable;
