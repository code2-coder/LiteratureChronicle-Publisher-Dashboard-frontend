import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download } from 'lucide-react';

const BalanceSheetDownloader = ({ authorsData }) => {
  const [threshold, setThreshold] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = () => {
    let filteredData = authorsData.filter(a => a.balance >= threshold);
    
    // Date filtering would ideally happen on the server or by filtering the underlying sales/royalty records
    // For this component, we'll assume authorsData already contains the calculated balances

    const exportData = filteredData.map(author => {
      const bank = author.bank_details || {};
      const bankStr = bank.account_holder ? 
        `${bank.account_holder} / ${bank.account_number} / ${bank.ifsc} / ${bank.upi || 'N/A'}` : 'Not Provided';

      return {
        'Author Name': author.name,
        'Contact Number': author.mobile_number || 'N/A',
        'Balance Amount': author.balance,
        'Bank Details': bankStr
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');
    XLSX.writeFile(wb, `Balance_Sheet_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/20 text-primary">
          <Download className="h-4 w-4 mr-2" />
          Download Balance Sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Balance Sheet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Minimum Balance Threshold (₹)</Label>
            <Input 
              type="number" 
              value={threshold} 
              onChange={(e) => setThreshold(Number(e.target.value))} 
              min="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date (Optional)</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleDownload} className="w-full mt-4">Download Excel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BalanceSheetDownloader;