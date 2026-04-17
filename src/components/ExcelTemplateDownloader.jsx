import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';

const ExcelTemplateDownloader = () => {
  const [templateType, setTemplateType] = useState('sales');
  const [downloading, setDownloading] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (templateType === 'sales') {
        const response = await apiClient.get('/sales');
        const salesData = response.data;

        let templateData = [];

        if (salesData.length > 0) {
          templateData = salesData.map(sale => ({
            Title: sale.title || '',
            ISBN: sale.isbn || '',
            MRP: sale.mrp || 0,
            'Order ID': sale.order_id || '',
            'Platform Name': sale.platform_name || '',
            Quantity: sale.quantity || 1,
            'Order Date': formatDate(sale.order_date),
          }));
        } else {
          // Fallback to example if no data
          templateData = [
            {
              Title: 'Example Book Title',
              ISBN: '978-3-16-148410-0',
              MRP: 499,
              'Order ID': 'ORD-001',
              'Platform Name': 'Amazon',
              Quantity: 1,
              'Order Date': formatDate(new Date()),
            },
          ];
        }

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Book Sales');
        XLSX.writeFile(wb, 'Current_Book_Sales.xlsx');
      } else {
        const response = await apiClient.get('/royalties');
        const royaltyData = response.data;

        let templateData = [];

        if (royaltyData.length > 0) {
          templateData = royaltyData.map(r => ({
            'Author Name': r.author_name || (r.authorId?.name) || '',
            'Contact Number': r.author_contact_number || '',
            Amount: r.paid_amount || 0,
            'Payment Date': formatDate(r.payment_date),
            Status: r.status || 'paid',
          }));
        } else {
          templateData = [
            {
              'Author Name': 'John Doe',
              'Contact Number': '9876543210',
              Amount: 15000,
              'Payment Date': formatDate(new Date()),
              Status: 'Paid',
            },
          ];
        }

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Royalty');
        XLSX.writeFile(wb, 'Current_Royalty_Data.xlsx');
      }
    } catch (error) {
      console.error("Error downloading data:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full space-y-1.5">
        <label className="text-[10px] font-bold tracking-widest text-primary/60 uppercase ml-1">
          Select Ledger Type
        </label>
        <Select value={templateType} onValueChange={setTemplateType}>
          <SelectTrigger className="rounded-2xl border-primary/10 bg-white/50 backdrop-blur-sm h-11 text-sm focus:ring-secondary/20">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-primary/10 shadow-2xl">
            <SelectItem value="sales" className="rounded-xl focus:bg-primary/5">Book Sales Ledger</SelectItem>
            <SelectItem value="royalty" className="rounded-xl focus:bg-primary/5">Royalty Template</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleDownload}
        size="lg"
        disabled={downloading}
        className="w-full py-6 rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20 hover:shadow-secondary/30 hover:-translate-y-0.5 transition-all duration-300 font-bold flex items-center justify-center gap-2 group"
      >
        {downloading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Download className="h-5 w-5 transition-transform group-hover:bounce" />
        )}
        <span className="truncate">{downloading ? 'Downloading...' : 'Download Current Data'}</span>
      </Button>
    </div>
  );
};

export default ExcelTemplateDownloader;
