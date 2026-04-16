import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';

const UploadSuccessModal = ({ isOpen, onClose, recordCount }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center border-border">
        <div className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mb-6 animate-in zoom-in duration-300" />
          <DialogTitle className="text-2xl font-bold text-primary mb-2">Upload Successful</DialogTitle>
          <DialogDescription className="text-muted-foreground text-lg">
            Successfully uploaded {recordCount} records.
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadSuccessModal;