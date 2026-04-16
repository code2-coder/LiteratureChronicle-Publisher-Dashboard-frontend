import React from 'react';
import { CreditCard, Loader2, CircleDollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PaymentSummary = ({ loading, payments, formatCurrency, formatToDDMMYYYY }) => {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-border bg-muted/20">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> 
          Payment Summary
        </h2>
      </div>
      <div className="flex-1 p-0 overflow-y-auto max-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <CircleDollarSign className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No payments recorded</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-transparent sticky top-0 backdrop-blur-md">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-xs">Payment Date</TableHead>
                <TableHead className="font-semibold text-xs text-right">Amount Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(payments) && payments.map(payment => (
                <TableRow key={payment._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm font-mono">{formatToDDMMYYYY(payment.payment_date)}</TableCell>
                  <TableCell className="text-right font-medium text-green-600">{formatCurrency(payment.paid_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default PaymentSummary;
