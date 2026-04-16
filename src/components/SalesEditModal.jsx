import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileEdit } from 'lucide-react';

const SalesEditModal = ({ isOpen, onClose, record, onSave }) => {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (record && isOpen) {
      setFormData({
        title: record.title || '',
        isbn: record.isbn || '',
        mrp: record.mrp || '',
        order_id: record.order_id || '',
        platform_name: record.platform_name || '',
        quantity: record.quantity || 1,
        order_date: record.order_date ? record.order_date.split('T')[0] : (record.createdAt ? record.createdAt.split('T')[0] : ''),
      });
    }
  }, [record, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.isbn || !formData.mrp || !formData.order_id || !formData.platform_name) {
      toast({ title: 'Validation Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        isbn: formData.isbn,
        mrp: parseFloat(formData.mrp),
        order_id: formData.order_id,
        platform_name: formData.platform_name,
        quantity: parseInt(formData.quantity, 10),
      };

      if (formData.order_date) {
        payload.order_date = new Date(formData.order_date).toISOString();
      }

      const recordId = record._id || record.id;
      await apiClient.put(`/sales/${recordId}`, payload);
      
      toast({ title: 'Success', description: 'Sales record updated successfully.' });
      onSave(); 
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast({ title: 'Update Failed', description: error.response?.data?.message || 'Failed to update record.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-secondary" />
            Edit Sales Record
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Book Title</Label>
              <Input id="title" name="title" value={formData.title || ''} onChange={handleChange} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" name="isbn" value={formData.isbn || ''} onChange={handleChange} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="order_id">Order ID</Label>
              <Input id="order_id" name="order_id" value={formData.order_id || ''} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mrp">MRP (₹)</Label>
              <Input id="mrp" name="mrp" type="number" step="0.01" min="0" value={formData.mrp || ''} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" min="1" value={formData.quantity || ''} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform_name">Platform Name</Label>
              <Input id="platform_name" name="platform_name" value={formData.platform_name || ''} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_date">Order Date</Label>
              <Input id="order_date" name="order_date" type="date" value={formData.order_date || ''} onChange={handleChange} required />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SalesEditModal;
