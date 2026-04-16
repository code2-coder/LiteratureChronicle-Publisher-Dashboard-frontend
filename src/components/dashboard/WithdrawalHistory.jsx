import React from 'react';
import { Wallet } from 'lucide-react';

const WithdrawalHistory = ({ withdrawals, formatDateStandard, formatCurrency }) => {
  return (
    <div className="bg-card rounded-2xl border p-8 shadow-sm max-w-4xl">
      <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
        <Wallet className="h-6 w-6 text-primary" /> Withdrawal History
      </h2>
      {Array.isArray(withdrawals) && withdrawals.length > 0 ? (
        <div className="overflow-hidden border rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-semibold text-muted-foreground">Request Date</th>
                <th className="p-4 font-semibold text-muted-foreground">Amount</th>
                <th className="p-4 font-semibold text-muted-foreground text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {withdrawals.map(w => (
                <tr key={w._id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">{formatDateStandard(w.createdAt)}</td>
                  <td className="p-4 font-semibold text-foreground">{formatCurrency(w.amount)}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                      w.status === 'processed' ? 'bg-green-100 text-green-800 border border-green-200' : 
                      w.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' : 
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {w.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-muted/30 rounded-xl p-8 text-center border border-dashed border-border">
          <Wallet className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No withdrawal requests found.</p>
        </div>
      )}
    </div>
  );
};

export default WithdrawalHistory;
