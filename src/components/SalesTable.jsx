import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, Edit, Trash2, Layers } from 'lucide-react';
import { calculateRoyalty } from '@/utils/royaltyCalculator.js';
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
      
      <div className="border border-border/50 rounded-xl bg-card overflow-hidden shadow-sm overflow-x-auto scrollbar-thin">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                {!isRoyaltyTable && <TableHead className="w-28 text-xs font-bold text-muted-foreground">Order ID</TableHead>}
                {!isRoyaltyTable && <TableHead className="w-32 text-xs font-bold text-muted-foreground">ISBN</TableHead>}
                {!isRoyaltyTable && <TableHead className="w-24 text-xs font-bold text-muted-foreground">Type</TableHead>}
                
                <TableHead className="min-w-[200px] text-xs font-bold text-muted-foreground">
                  <button onClick={() => handleSort(isRoyaltyTable ? 'author_name' : 'title')} className="flex items-center gap-1.5 hover:text-primary transition-colors font-bold">
                    {isRoyaltyTable ? 'Author Name' : 'Title'} <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                
                {!isRoyaltyTable && <TableHead className="w-28 text-xs font-bold text-muted-foreground">Platform</TableHead>}
                {!isRoyaltyTable && <TableHead className="w-24 text-right text-xs font-bold text-muted-foreground">MRP</TableHead>}
                {!isRoyaltyTable && <TableHead className="w-20 text-right text-xs font-bold text-muted-foreground">Qty</TableHead>}
                
                {showRoyalty && !isRoyaltyTable && <TableHead className="w-24 text-right text-xs font-bold text-muted-foreground">Royalty</TableHead>}
                
                {isRoyaltyTable && <TableHead className="w-24 text-right text-xs font-bold text-muted-foreground">Amount</TableHead>}
                {isRoyaltyTable && <TableHead className="w-24 text-right text-xs font-bold text-muted-foreground">Paid Amount</TableHead>}
                {isRoyaltyTable && <TableHead className="w-24 text-right text-xs font-bold text-muted-foreground">Balance</TableHead>}
                
                <TableHead className="w-32 text-right text-xs font-bold text-muted-foreground">
                  <button onClick={() => handleSort(isRoyaltyTable ? 'payment_date' : 'order_date')} className="flex items-center gap-1.5 hover:text-primary transition-colors ml-auto font-bold">
                    {isRoyaltyTable ? 'Payment Date' : 'Order Date'} <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                {!isRoyaltyTable && <TableHead className="w-20 text-right text-xs font-bold text-muted-foreground">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Layers className="h-8 w-8 opacity-30" />
                      <p className="text-xs font-medium">No records found matching your criteria.</p>
                    </div>
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
                      <TableRow key={recordId} className="hover:bg-muted/20 border-b border-border/40 transition-colors">
                        <td className="p-3 font-serif font-bold text-primary">{record.author_name || record.authorId?.name || 'Unknown'}</td>
                        <td className="p-3 text-right font-semibold font-mono tabular-nums">{formatCurrency(amount)}</td>
                        <td className="p-3 text-right text-green-600 font-bold font-mono tabular-nums">{formatCurrency(paidAmount)}</td>
                        <td className={`p-3 text-right font-extrabold font-mono tabular-nums ${balanceAmount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {formatCurrency(balanceAmount)}
                        </td>
                        <td className="p-3 text-right text-muted-foreground text-xs">{formatDate(record.payment_date)}</td>
                      </TableRow>
                    );
                  }

                  const mrp = record.mrp || 0;
                  const qty = record.quantity || 1;
                  const comm = record.platformId?.commission_percentage || 0;
                  const printCost = record.bookId?.printing_cost || 0;
                  const bookType = record.bookId?.format || record.format || 'physical';
                  const royalty = calculateRoyalty(mrp, comm, printCost, qty, bookType);

                  const getPlatformBadge = (name) => {
                    const norm = (name || '').toLowerCase();
                    if (norm.includes('amazon')) return 'bg-amber-50 text-amber-700 border-amber-200/50';
                    if (norm.includes('flipkart')) return 'bg-blue-50 text-blue-700 border-blue-200/50';
                    return 'bg-purple-50 text-purple-700 border-purple-200/50';
                  };

                  const truncateId = (id) => {
                    if (!id) return 'N/A';
                    if (id.length <= 12) return id;
                    return `${id.substring(0, 6)}...${id.substring(id.length - 4)}`;
                  };

                  return (
                    <TableRow key={recordId} className="hover:bg-muted/20 border-b border-border/40 transition-colors">
                      <TableCell className="font-mono text-[10px] text-muted-foreground font-semibold" title={record.order_id}>
                        {truncateId(record.order_id)}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground font-semibold">
                        {record.isbn}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                          bookType === 'ebook' 
                            ? 'bg-sky-50 text-sky-700 border-sky-200/50' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                        }`}>
                          {bookType === 'ebook' ? 'Ebook' : 'Print'}
                        </span>
                      </TableCell>
                      <TableCell className="font-serif font-bold text-primary max-w-[220px] truncate" title={record.title}>
                        {record.title}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${getPlatformBadge(record.platform_name)}`}>
                          {record.platform_name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold font-mono tabular-nums text-xs">{formatCurrency(mrp)}</TableCell>
                      <TableCell className="text-right font-bold font-mono tabular-nums text-xs">{qty}</TableCell>
                      {showRoyalty && (
                        <TableCell className="text-right text-purple-700 font-extrabold font-mono tabular-nums text-xs">
                          {formatCurrency(royalty)}
                        </TableCell>
                      )}
                      <TableCell className="text-right text-muted-foreground text-xs font-medium">
                        {formatDate(record.order_date || record.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onEdit && onEdit(record)}
                            className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onDelete && onDelete(record._id)}
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
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
