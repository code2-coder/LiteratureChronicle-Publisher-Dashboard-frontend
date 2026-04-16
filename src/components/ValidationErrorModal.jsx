
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';

const ValidationErrorModal = ({ isOpen, onClose, errors }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col border-destructive/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive text-xl font-bold">
            <AlertTriangle className="h-6 w-6" />
            Validation Errors Detected
          </DialogTitle>
          <DialogDescription>
            Please fix the following {errors.length} errors in your spreadsheet and upload again. No data has been imported.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 mt-4 pr-4">
          <div className="space-y-4">
            {errors.map((err, i) => (
              <div key={i} className="border-l-4 border-destructive bg-destructive/5 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-destructive flex items-center gap-2">
                    <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md">
                      Row {err.row}
                    </span>
                    {err.type}
                  </h4>
                </div>
                <p className="text-sm font-medium text-foreground mb-3">{err.message}</p>
                
                {err.expected !== undefined && err.provided !== undefined && (
                  <div className="grid grid-cols-2 gap-3 text-xs bg-background/80 p-3 rounded-md border border-destructive/10">
                    <div>
                      <span className="block text-muted-foreground font-semibold uppercase tracking-wider mb-1">Expected / Database Value</span>
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{err.expected || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-muted-foreground font-semibold uppercase tracking-wider mb-1">Provided in File</span>
                      <span className="font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">{err.provided || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6 border-t pt-4">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
            Close and Fix Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationErrorModal;
