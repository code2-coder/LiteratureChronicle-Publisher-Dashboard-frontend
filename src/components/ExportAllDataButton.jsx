import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import apiClient from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  FileDown, 
  Loader2, 
  Calendar as CalendarIcon, 
  Database, 
  Check, 
  AlertCircle, 
  Filter, 
  ListChecks, 
  Clock, 
  ChevronRight,
  BookOpen, 
  Users, 
  Monitor, 
  ArrowDownLeft, 
  TrendingUp, 
  Coins 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ExportAllDataButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportRange, setExportRange] = useState('all'); // 'all' or 'custom'
  const [exportStep, setExportStep] = useState('');
  
  // Default to last 30 days
  const getPastDateStr = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };
  
  const getTodayStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getPastDateStr(30));
  const [endDate, setEndDate] = useState(getTodayStr());

  const [selectedTables, setSelectedTables] = useState({
    books: true,
    authors: true,
    platforms: true,
    withdrawals: true,
    sales: true,
    royalties: true,
  });

  const { toast } = useToast();

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const applyPreset = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'last7':
        start.setDate(today.getDate() - 7);
        break;
      case 'last30':
        start.setDate(today.getDate() - 30);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        break;
    }

    const formatDateInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(end));
    setExportRange('custom');
  };

  const toggleTable = (tableKey) => {
    setSelectedTables(prev => ({
      ...prev,
      [tableKey]: !prev[tableKey]
    }));
  };

  const selectAllTables = (value) => {
    setSelectedTables({
      books: value,
      authors: value,
      platforms: value,
      withdrawals: value,
      sales: value,
      royalties: value,
    });
  };

  const isDateInRange = (dateVal, startStr, endStr) => {
    if (exportRange === 'all') return true;
    if (!dateVal) return false;
    
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    
    if (startStr) {
      const start = new Date(startStr);
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    
    if (endStr) {
      const end = new Date(endStr);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    
    return true;
  };

  const handleExport = async () => {
    // Check if at least one table is selected
    const activeTables = Object.keys(selectedTables).filter(key => selectedTables[key]);
    if (activeTables.length === 0) {
      toast({ 
        title: 'Selection Required', 
        description: 'Please select at least one database collection to export.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsExporting(true);
    try {
      toast({ title: 'Exporting Data', description: 'Initializing query engines...' });

      // Create Workbook
      const wb = XLSX.utils.book_new();
      
      const fetchParams = {};
      if (exportRange === 'custom') {
        if (startDate) fetchParams.startDate = startDate;
        if (endDate) fetchParams.endDate = endDate;
      }

      // 1. Books Sheet
      if (selectedTables.books) {
        setExportStep('Fetching books data...');
        const res = await apiClient.get('/books', { params: { limit: 100000 } });
        const data = res.data.data || res.data || [];
        setExportStep('Filtering Books...');
        const filtered = data.filter(item => isDateInRange(item.createdAt, startDate, endDate));
        
        const mapped = filtered.map(book => ({
          'Book ID': book._id || '',
          'Title': book.title || '',
          'ISBN': book.isbn || '',
          'SKU Code': book.sku_code || '',
          'Format': book.format || '',
          'Base MRP (INR)': book.mrp || 0,
          'Printing Cost (INR)': book.printing_cost || 0,
          'Number of Pages': book.pages || 0,
          'Author Name': book.authorId?.name || '',
          'Author Email': book.authorId?.email || '',
          'Book Size': book.book_sizes || '',
          'Cover Image URL': book.book_cover || '',
          'Created At': formatDate(book.createdAt)
        }));
        
        if (mapped.length > 0) {
          const ws = XLSX.utils.json_to_sheet(mapped);
          XLSX.utils.book_append_sheet(wb, ws, 'Books');
        }
      }

      // 2. Authors Sheet
      if (selectedTables.authors) {
        setExportStep('Fetching authors data...');
        const res = await apiClient.get('/auth/authors', { params: { limit: 100000 } });
        const data = res.data.data || res.data || [];
        setExportStep('Filtering Authors...');
        const filtered = data.filter(item => isDateInRange(item.createdAt, startDate, endDate));

        const mapped = filtered.map(author => {
          const bank = author.bank_details || {};
          return {
            'Author ID': author._id || '',
            'Name': author.name || '',
            'Email': author.email || '',
            'Mobile Number': author.mobile_number || 'N/A',
            'Bank Name': bank.bank_name || 'N/A',
            'Account Holder': bank.holder_name || bank.account_holder || 'N/A',
            'Account Number': bank.account_number || 'N/A',
            'IFSC Code': bank.ifsc_code || bank.ifsc || 'N/A',
            'UPI ID': bank.upi || 'N/A',
            'Total Royalty (INR)': author.totalRoyalty || 0,
            'Total Payments (INR)': author.totalPayments || 0,
            'Balance (INR)': author.balance || 0,
            'Created At': formatDate(author.createdAt)
          };
        });

        if (mapped.length > 0) {
          const ws = XLSX.utils.json_to_sheet(mapped);
          XLSX.utils.book_append_sheet(wb, ws, 'Authors');
        }
      }

      // 3. Platforms Sheet
      if (selectedTables.platforms) {
        setExportStep('Fetching platforms...');
        const res = await apiClient.get('/platforms');
        const data = res.data || [];
        setExportStep('Filtering Platforms...');
        const filtered = data.filter(item => isDateInRange(item.createdAt, startDate, endDate));

        const mapped = filtered.map(p => ({
          'Platform ID': p._id || '',
          'Name': p.name || '',
          'Commission Percentage (%)': p.commission_percentage || 0,
          'Created At': formatDate(p.createdAt)
        }));

        if (mapped.length > 0) {
          const ws = XLSX.utils.json_to_sheet(mapped);
          XLSX.utils.book_append_sheet(wb, ws, 'Platforms');
        }
      }

      // 4. Withdrawals Sheet
      if (selectedTables.withdrawals) {
        setExportStep('Fetching withdrawals...');
        const res = await apiClient.get('/withdrawals');
        const data = res.data || [];
        setExportStep('Filtering Withdrawals...');
        const filtered = data.filter(item => isDateInRange(item.requested_at || item.createdAt, startDate, endDate));

        const mapped = filtered.map(w => {
          const bank = w.bank_details || {};
          return {
            'Withdrawal ID': w._id || '',
            'Author Name': w.authorId?.name || '',
            'Author Email': w.authorId?.email || '',
            'Amount Requested (INR)': w.amount || 0,
            'Status': w.status || '',
            'Bank Name': bank.bank_name || 'N/A',
            'Account Holder': bank.holder_name || 'N/A',
            'Account Number': bank.account_number || 'N/A',
            'IFSC Code': bank.ifsc_code || 'N/A',
            'Requested At': formatDate(w.requested_at || w.createdAt),
            'Processed At': w.processed_at ? formatDate(w.processed_at) : 'N/A'
          };
        });

        if (mapped.length > 0) {
          const ws = XLSX.utils.json_to_sheet(mapped);
          XLSX.utils.book_append_sheet(wb, ws, 'Withdrawals');
        }
      }

      // 5. Sales History Sheet
      if (selectedTables.sales) {
        setExportStep('Fetching sales history (optimized)...');
        // Pass dates to backend query where supported for speed
        const res = await apiClient.get('/sales', { 
          params: { 
            limit: 100000, 
            ...(exportRange === 'custom' ? { startDate, endDate } : {})
          } 
        });
        const data = res.data.data || res.data || [];
        setExportStep('Filtering Sales...');
        const filtered = data.filter(item => isDateInRange(item.order_date || item.createdAt, startDate, endDate));

        const mapped = filtered.map(s => ({
          'Sale ID': s._id || '',
          'Order ID': s.order_id || '',
          'Order Date': formatDate(s.order_date),
          'Book Title': s.title || '',
          'ISBN': s.isbn || '',
          'Format': s.format || '',
          'MRP (INR)': s.mrp || 0,
          'Quantity': s.quantity || 1,
          'Platform Name': s.platform_name || '',
          'Author Name': s.authorId?.name || '',
          'Upload Date': formatDate(s.upload_date || s.createdAt)
        }));

        if (mapped.length > 0) {
          const ws = XLSX.utils.json_to_sheet(mapped);
          XLSX.utils.book_append_sheet(wb, ws, 'Sales History');
        }
      }

      // 6. Royalty Payments Sheet
      if (selectedTables.royalties) {
        setExportStep('Fetching royalty payments (optimized)...');
        // Pass dates to backend query where supported
        const res = await apiClient.get('/royalties', { 
          params: { 
            limit: 100000, 
            ...(exportRange === 'custom' ? { startDate, endDate } : {})
          } 
        });
        const data = res.data.data || res.data || [];
        setExportStep('Filtering Royalties...');
        const filtered = data.filter(item => isDateInRange(item.payment_date || item.createdAt, startDate, endDate));

        const mapped = filtered.map(r => ({
          'Royalty ID': r._id || '',
          'Author Name': r.author_name || r.authorId?.name || '',
          'Contact Number': r.author_contact_number || '',
          'Paid Amount (INR)': r.paid_amount || 0,
          'Status': r.status || '',
          'Payment Date': formatDate(r.payment_date),
          'Upload Date': formatDate(r.upload_date || r.createdAt)
        }));

        if (mapped.length > 0) {
          const ws = XLSX.utils.json_to_sheet(mapped);
          XLSX.utils.book_append_sheet(wb, ws, 'Royalty Payments');
        }
      }

      setExportStep('Compiling Excel workbook...');
      
      // Check if we actually wrote any sheets to the workbook
      if (wb.SheetNames.length === 0) {
        toast({ 
          title: 'No Data Found', 
          description: 'No matching records exist for the selected date range.', 
          variant: 'warning' 
        });
        return;
      }

      // Write Workbook to File
      const rangeStr = exportRange === 'all' ? 'All_Time' : `${startDate}_to_${endDate}`;
      XLSX.writeFile(wb, `Literature_Chronicle_Data_${rangeStr}.xlsx`);

      toast({ title: 'Export Complete', description: 'Configured database tables downloaded successfully.' });
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export Failed', description: 'Could not fetch or compile catalog data.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
      setExportStep('');
    }
  };

  const isAllTablesSelected = Object.values(selectedTables).every(v => v);
  const isSomeTablesSelected = Object.values(selectedTables).some(v => v) && !isAllTablesSelected;

  const tableList = [
    { key: 'books', label: 'Books Catalog', icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
    { key: 'authors', label: 'Author Ledger', icon: Users, color: 'text-purple-500 bg-purple-500/10' },
    { key: 'platforms', label: 'Sale Platforms', icon: Monitor, color: 'text-teal-500 bg-teal-500/10' },
    { key: 'withdrawals', label: 'Withdrawal Requests', icon: ArrowDownLeft, color: 'text-red-500 bg-red-500/10' },
    { key: 'sales', label: 'Sales History', icon: TrendingUp, color: 'text-green-500 bg-green-500/10' },
    { key: 'royalties', label: 'Royalty Payments', icon: Coins, color: 'text-amber-500 bg-amber-500/10' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="relative overflow-hidden border border-secondary/30 hover:border-secondary/60 bg-secondary/5 hover:bg-secondary/10 text-secondary font-bold rounded-xl h-10 px-4 flex items-center gap-2 transition-all duration-300 ease-out active:scale-95 group"
        >
          {/* Premium Shimmer Overlay */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] ease-out"></span>
          <FileDown className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 text-secondary" />
          <span className="relative z-10">Export Data</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-secondary/20 bg-background/95 backdrop-blur-xl shadow-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-secondary">
            <div className="p-2 rounded-xl bg-secondary/10">
              <Database className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-serif font-bold text-foreground">Export Database Records</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Configure data boundaries, filter by creation or transaction dates, and compile customizable Excel workbooks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          {/* Timeframe Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> 1. Select Timeframe
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* All Time Card */}
              <button
                type="button"
                onClick={() => setExportRange('all')}
                className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-300 ${
                  exportRange === 'all'
                    ? 'border-secondary bg-secondary/5 text-foreground ring-2 ring-secondary/20 shadow-md'
                    : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Database className={`h-5 w-5 ${exportRange === 'all' ? 'text-secondary' : 'text-muted-foreground'}`} />
                  {exportRange === 'all' && (
                    <span className="h-4 w-4 rounded-full bg-secondary flex items-center justify-center text-white text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <span className="font-semibold text-sm mt-3 text-foreground">All Time</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">Download full historical records.</span>
              </button>

              {/* Custom Date Range Card */}
              <button
                type="button"
                onClick={() => setExportRange('custom')}
                className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-300 ${
                  exportRange === 'custom'
                    ? 'border-secondary bg-secondary/5 text-foreground ring-2 ring-secondary/20 shadow-md'
                    : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <CalendarIcon className={`h-5 w-5 ${exportRange === 'custom' ? 'text-secondary' : 'text-muted-foreground'}`} />
                  {exportRange === 'custom' && (
                    <span className="h-4 w-4 rounded-full bg-secondary flex items-center justify-center text-white text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <span className="font-semibold text-sm mt-3 text-foreground">Date Filtered</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">Filter items by transaction dates.</span>
              </button>
            </div>

            {/* Custom Date Picker Inputs */}
            {exportRange === 'custom' && (
              <div className="p-4 rounded-2xl border border-secondary/10 bg-secondary/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Date presets row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground mr-1">Presets:</span>
                  <button 
                    type="button" 
                    onClick={() => applyPreset('last7')}
                    className="px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-muted font-medium transition-colors text-foreground"
                  >
                    Last 7D
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset('last30')}
                    className="px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-muted font-medium transition-colors text-foreground"
                  >
                    Last 30D
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset('thisMonth')}
                    className="px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-muted font-medium transition-colors text-foreground"
                  >
                    This Month
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset('lastMonth')}
                    className="px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-muted font-medium transition-colors text-foreground"
                  >
                    Last Month
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset('thisYear')}
                    className="px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-muted font-medium transition-colors text-foreground"
                  >
                    This Year
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      max={endDate || getTodayStr()}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      max={getTodayStr()}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Database Tables Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" /> 2. Choose Collections
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectAllTables(true)}
                  className="text-xs text-secondary hover:underline font-semibold"
                >
                  Select All
                </button>
                <span className="text-muted-foreground text-xs">•</span>
                <button
                  type="button"
                  onClick={() => selectAllTables(false)}
                  className="text-xs text-muted-foreground hover:underline font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tableList.map(table => {
                const IconComp = table.icon;
                const isChecked = selectedTables[table.key];
                return (
                  <button
                    key={table.key}
                    type="button"
                    onClick={() => toggleTable(table.key)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] ${
                      isChecked
                        ? 'border-secondary/35 bg-secondary/[0.03] text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${table.color} shrink-0`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-foreground">{table.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {isChecked ? 'Selected' : 'Skipped'}
                      </p>
                    </div>
                    <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                      isChecked 
                        ? 'border-secondary bg-secondary text-white' 
                        : 'border-border bg-background'
                    }`}>
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date notice block */}
          {exportRange === 'custom' && (
            <div className="flex gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Filtering parameters applied:</strong> Collections will be filtered based on creation timelines. Transaction sheets (Sales, Royalties, Withdrawals) will filter on exact execution dates.
              </p>
            </div>
          )}

          {/* Export process info overlay */}
          {isExporting && exportStep && (
            <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/20 flex items-center gap-3 animate-pulse">
              <Loader2 className="h-5 w-5 animate-spin text-secondary shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-secondary">Exporting Database:</span>{' '}
                <span className="text-muted-foreground font-medium">{exportStep}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
            className="rounded-xl font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="relative overflow-hidden bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold rounded-xl px-5 flex items-center gap-2 group transition-all duration-300 active:scale-[0.98]"
          >
            {/* Shimmer on hover */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] ease-out"></span>
            
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 text-primary-foreground group-hover:-translate-y-0.5 group-hover:scale-110 transition-all duration-300" />
                <span>Generate Export</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportAllDataButton;
