import React from 'react';
import { User, Banknote, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProfileSettings = ({ authorProfile, onEdit }) => {
  return (
    <div className="bg-card rounded-2xl border p-8 shadow-sm max-w-4xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl"><User className="h-6 w-6 text-primary" /></div>
          <h2 className="text-2xl font-bold text-primary">Personal Information</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" /> Edit
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <p className="text-xs tracking-wider text-muted-foreground font-semibold uppercase mb-1">Full Name</p>
          <p className="text-xl font-semibold text-foreground">{authorProfile.name}</p>
        </div>
        <div>
          <p className="text-xs tracking-wider text-muted-foreground font-semibold uppercase mb-1">Email Address</p>
          <p className="text-xl font-semibold text-foreground">{authorProfile.email}</p>
        </div>
        <div>
          <p className="text-xs tracking-wider text-muted-foreground font-semibold uppercase mb-1">Contact Number</p>
          <p className="text-xl font-semibold text-foreground">{authorProfile.mobile_number || 'Not provided'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-8 pb-4 border-b">
        <div className="bg-secondary/10 p-3 rounded-xl"><Banknote className="h-6 w-6 text-secondary" /></div>
        <h2 className="text-2xl font-bold text-primary">Bank & Payment Details</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="text-xs tracking-wider text-muted-foreground font-semibold uppercase mb-1">Bank Name</p>
          <p className="text-lg font-medium text-foreground">{authorProfile.bank_details?.bank_name || 'Not provided'}</p>
        </div>
        <div>
          <p className="text-xs tracking-wider text-muted-foreground font-semibold uppercase mb-1">Account Holder</p>
          <p className="text-lg font-medium text-foreground">{authorProfile.bank_details?.holder_name || 'Not provided'}</p>
        </div>
        <div>
          <p className="text-xs tracking-wider text-muted-foreground font-semibold uppercase mb-1">Account Number</p>
          <p className="text-lg font-mono tracking-wide text-foreground bg-muted/50 w-fit px-2 py-1 rounded">{authorProfile.bank_details?.account_number || 'Not provided'}</p>
        </div>
        <div>
          <p className="text-xs tracking-wider text-muted-foreground font-semibold uppercase mb-1">IFSC Code</p>
          <p className="text-lg font-mono tracking-wide text-foreground">{authorProfile.bank_details?.ifsc_code || 'Not provided'}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
