import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import apiClient from '@/lib/apiClient';
import { calculateAuthorBalance } from '@/lib/royaltyCalculator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import UploadSuccessModal from './UploadSuccessModal.jsx';
import ValidationErrorModal from './ValidationErrorModal.jsx';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const FileUploadModal = ({ isOpen, onClose, type }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  // Validation state
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setValidationErrors([]);

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const cleanedData = res.data.map(row => {
            const cleanedRow = {};
            Object.keys(row).forEach(key => {
              if (!key.startsWith('__')) {
                cleanedRow[key] = row[key];
              }
            });
            return cleanedRow;
          });
          setParsedData(cleanedData);
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        const cleanedData = data.filter(row => Object.values(row).some(val => val !== ''))
          .map(row => {
            const cleanedRow = {};
            Object.keys(row).forEach(key => {
              if (!key.startsWith('__')) {
                cleanedRow[key] = row[key];
              }
            });
            return cleanedRow;
          });
        setParsedData(cleanedData);
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const parseCustomDate = (dateStr) => {
    if (!dateStr) return new Date();

    // Handle Excel serial numbers
    if (typeof dateStr === 'number') {
      return new Date(Math.round((dateStr - 25569) * 86400 * 1000));
    }

    const str = String(dateStr).trim();

    // Handle DD/MM/YYYY or DD-MM-YYYY
    const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const match = str.match(dmyRegex);

    if (match) {
      const [_, day, month, year] = match;
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!isNaN(date.getTime())) return date;
    }

    // Fallback to standard JS parsing
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
  };

  const validateData = async () => {
    setValidating(true);
    const errors = [];

    try {
      if (type === 'sales') {
        const [booksRes, platformsRes] = await Promise.all([
          apiClient.get('/books', { params: { limit: 1000 } }),
          apiClient.get('/platforms')
        ]);
        const books = booksRes.data.data || booksRes.data;
        const platforms = platformsRes.data.data || platformsRes.data;

        if (!platforms || platforms.length === 0) {
          toast({
            title: 'Configuration Error',
            description: 'No platforms found in database. Please register platforms in Platform Management first.',
            variant: 'destructive'
          });
          setValidating(false);
          return false;
        }

        // 1. Check for duplicates within the current file
        const fileOrderIds = new Set();
        const internalDuplicates = new Set();

        parsedData.forEach((row) => {
          const orderId = String(row['Order ID'] || row.order_id || '').trim();
          if (orderId) {
            if (fileOrderIds.has(orderId)) internalDuplicates.add(orderId);
            fileOrderIds.add(orderId);
          }
        });

        // 2. Check for duplicates against the database
        const orderIdsToCheck = Array.from(fileOrderIds);
        let existingDbIds = [];
        if (orderIdsToCheck.length > 0) {
          try {
            const dupRes = await apiClient.post('/sales/check-duplicates', { order_ids: orderIdsToCheck });
            existingDbIds = dupRes.data.existingIds || [];
          } catch (e) {
            console.error('Failed to check for database duplicates');
          }
        }

        parsedData.forEach((row, index) => {
          const rowNum = index + 2;
          const title = row.Title || row.title || '';
          const isbn = String(row.ISBN || row.isbn || '').trim();
          const pName = row['Platform Name'] || row.platform_name || '';
          const orderId = String(row['Order ID'] || row.order_id || '').trim();

          if (!isbn) {
            errors.push({ row: rowNum, type: 'Missing Data', message: 'ISBN field is required.' });
            return;
          }

          if (!orderId) {
            errors.push({ row: rowNum, type: 'Missing Data', message: 'Order ID is required.' });
            return;
          }

          if (internalDuplicates.has(orderId)) {
            errors.push({ row: rowNum, type: 'Duplicate', message: `Duplicate Order ID found multiple times in this file.`, provided: orderId });
          }

          if (existingDbIds.includes(orderId)) {
            errors.push({ row: rowNum, type: 'Security', message: `This Order ID already exists in the system (previously imported).`, provided: orderId });
          }

          const book = books.find(b => b.isbn === isbn);
          if (!book) {
            errors.push({ row: rowNum, type: 'Not Found', message: `Book with ISBN not found in database.`, provided: isbn });
            return;
          }

          if (title.toLowerCase().trim() !== book.title.toLowerCase().trim()) {
            errors.push({ row: rowNum, type: 'Mismatch', message: 'Provided title does not match the title registered for this ISBN.', expected: book.title, provided: title || '(empty)' });
          }

          if (!pName) {
            errors.push({ row: rowNum, type: 'Missing Data', message: 'Platform Name is required.' });
          } else {
            const platform = platforms.find(p => p.name.toLowerCase().trim() === pName.toLowerCase().trim());
            if (!platform) {
              const platformNames = platforms.map(p => p.name).join(', ');
              errors.push({
                row: rowNum,
                type: 'Not Found',
                message: `Platform not found in database. Valid platforms are: ${platformNames}`,
                provided: pName
              });
            }
          }
        });

      } else if (type === 'royalty') {
        const authorsRes = await apiClient.get('/auth/authors', { params: { limit: 1000 } });
        const authors = authorsRes.data.data || authorsRes.data;

        for (const [index, row] of parsedData.entries()) {
          const rowNum = index + 2;
          const authorName = String(row['Author Name'] || row.author_name || row.Name || row.name || '').trim();
          const contactNumber = String(row['Contact Number'] || row.contact_number || row['Mobile Number'] || row.mobile_number || '').trim();
          const amount = parseFloat(row['Total Payment'] || row.Amount || row.amount || row.paid_amount || 0);
          const paymentDate = row['Payment Date'] || row.payment_date;

          if (!authorName) {
            errors.push({ row: rowNum, type: 'Missing Data', message: 'Author Name column is required.' });
          }

          if (!contactNumber) {
            errors.push({ row: rowNum, type: 'Missing Data', message: 'Contact Number column is required.' });
          } else {
            const authorExists = authors.some(a => a.mobile_number === contactNumber);
            if (!authorExists) {
              errors.push({ row: rowNum, type: 'Not Found', message: 'Contact Number does not match any registered author.', provided: contactNumber });
            }
          }

          if (isNaN(amount) || amount <= 0) {
            errors.push({ row: rowNum, type: 'Invalid Data', message: 'A valid Amount greater than 0 is required.' });
          }

          if (!paymentDate) {
            errors.push({ row: rowNum, type: 'Missing Data', message: 'Payment Date is required.' });
          }

          // Balance Validation
          const author = authors.find(a => a.mobile_number === contactNumber);
          if (author && (row.Status || row.status || 'paid').toLowerCase() === 'paid') {
            const balance = await calculateAuthorBalance(author._id, author.mobile_number);
            if (amount > balance) {
              errors.push({
                row: rowNum,
                type: 'Warning',
                message: `Payment amount (₹${amount}) exceeds author's pending balance (₹${balance.toFixed(2)}).`,
                expected: `₹${balance.toFixed(2)}`,
                provided: `₹${amount}`
              });
            }
          }
        }
      }
    } catch (err) {
      toast({ title: 'Validation Error', description: 'Failed to fetch database records for validation.', variant: 'destructive' });
      setValidating(false);
      return false;
    }

    setValidating(false);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationErrors(true);
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    const isValid = await validateData();
    if (!isValid) return;

    setUploading(true);
    try {
      if (type === 'sales') {
        const [booksRes, platformsRes] = await Promise.all([
          apiClient.get('/books', { params: { limit: 1000 } }),
          apiClient.get('/platforms')
        ]);
        const books = booksRes.data.data || booksRes.data;
        const platforms = platformsRes.data.data || platformsRes.data;

        const salesToUpload = parsedData.map(row => {
          const isbn = String(row.ISBN || row.isbn || '').trim();
          const pName = String(row['Platform Name'] || row.platform_name || '').trim();
          const book = books.find(b => b.isbn === isbn);
          const platform = platforms.find(p => p.name.toLowerCase() === pName.toLowerCase());

          return {
            title: row.Title || row.title,
            isbn: isbn,
            mrp: parseFloat(row.MRP || row.mrp || 0),
            order_id: String(row['Order ID'] || row.order_id || ''),
            platform_name: pName,
            platformId: platform?._id,
            bookId: book?._id,
            authorId: book?.authorId?._id || book?.authorId, // Handle both populated and non-populated
            quantity: parseInt(row.Quantity || row.quantity || 1),
            format: row.format || row.Format || row.book_type || book?.format || 'physical',
            order_date: parseCustomDate(row['Order Date'] || row.order_date).toISOString()
          };
        });

        const res = await apiClient.post('/sales/bulk-upload', {
          sales: salesToUpload,
          upload_date: new Date().toISOString()
        });
        setSuccessCount(res.data.count);
        toast({ title: 'Upload Complete', description: `Successfully uploaded ${res.data.count} records.` });
      } else if (type === 'royalty') {
        const authorsRes = await apiClient.get('/auth/authors', { params: { limit: 1000 } });
        const authors = authorsRes.data.data || authorsRes.data;

        const royaltiesToUpload = parsedData.map(row => {
          const authorName = String(row['Author Name'] || row.author_name || row.Name || row.name || '').trim();
          const contactNumber = String(row['Contact Number'] || row.contact_number || row['Mobile Number'] || row.mobile_number || '').trim();
          const amount = parseFloat(row['Total Payment'] || row.Amount || row.amount || row.paid_amount || 0);
          const paymentDate = parseCustomDate(row['Payment Date'] || row.payment_date);
          const status = String(row.Status || row.status || 'paid').toLowerCase().trim();

          const author = authors.find(a => a.mobile_number === contactNumber);

          return {
            authorId: author?._id,
            author_name: authorName,
            author_contact_number: contactNumber,
            amount: amount,
            paid_amount: amount,
            payment_date: paymentDate.toISOString(),
            status: status
          };
        });

        const res = await apiClient.post('/royalties/bulk-upload', {
          royalties: royaltiesToUpload,
          upload_date: new Date().toISOString()
        });
        setSuccessCount(res.data.count);
        toast({ title: 'Upload Complete', description: `Successfully uploaded ${res.data.count} royalty records.` });
      }

      setShowSuccess(true);
      setFile(null);
      setParsedData([]);
      onClose();
    } catch (error) {
      toast({ title: 'Upload Failed', description: error.response?.data?.message || error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleModalClose = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Upload {type === 'sales' ? 'Sales' : 'Royalty'} Data</DialogTitle>
            <DialogDescription>
              Upload your CSV or Excel file. The system will automatically validate the data before importing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{parsedData.length} rows detected</p>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-4 rounded-full text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); setFile(null); setParsedData([]); setValidationErrors([]); }}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="bg-muted p-4 rounded-full mb-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-lg mb-1">Click to browse or drag file here</p>
                  <p className="text-sm text-muted-foreground">Supports .CSV, .XLSX, .XLS</p>
                </div>
              )}
            </div>

            {parsedData.length > 0 && (
              <div className="border rounded-xl p-5 bg-card shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-primary">Data Preview</p>
                  <span className="text-xs font-medium bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-md">Showing top 3 rows</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-muted/80 text-muted-foreground uppercase tracking-wider">
                      <tr>
                        {Object.keys(parsedData[0]).map(k => <th key={k} className="p-3 font-semibold">{k}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedData.slice(0, 3).map((r, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          {Object.values(r).map((v, j) => <td key={j} className="p-3">{String(v)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-8 border-t pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handleModalClose} disabled={uploading || validating}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || validating || parsedData.length === 0}
              className="min-w-[140px]"
            >
              {validating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating...</>
              ) : uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
              ) : (
                'Validate & Import'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ValidationErrorModal
        isOpen={showValidationErrors}
        onClose={() => setShowValidationErrors(false)}
        errors={validationErrors}
      />

      <UploadSuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        recordCount={successCount}
      />
    </>
  );
};

export default FileUploadModal;
