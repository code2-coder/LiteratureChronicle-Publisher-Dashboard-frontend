import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const AuthorForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    mobile_number: '',
    bank_name: '',
    bank_account_holder: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_upi: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name || !formData.mobile_number) {
      toast({ title: 'Validation Error', description: 'Mandatory fields are required', variant: 'destructive' });
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile_number)) {
      toast({ title: 'Validation Error', description: 'Valid 10-digit mobile number required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        mobile_number: formData.mobile_number,
        role: 'author',
        bank_details: {
          bank_name: formData.bank_name,
          holder_name: formData.bank_account_holder,
          account_number: formData.bank_account_number,
          ifsc_code: formData.bank_ifsc,
          upi: formData.bank_upi
        }
      };

      await apiClient.post('/auth/register', payload);

      toast({ title: 'Success', description: 'Author account created successfully' });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating author:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create author profile.';
      toast({ title: 'Registration Failed', description: errorMsg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="space-y-4">
        <h4 className="font-serif font-bold text-lg border-b pb-2">Mandatory Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile_number">Mobile Number *</Label>
            <Input id="mobile_number" name="mobile_number" type="tel" value={formData.mobile_number} onChange={handleChange} maxLength={10} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
                value={formData.password} 
                onChange={handleChange} 
                minLength={8} 
                required 
                className="pr-10"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-serif font-bold text-lg border-b pb-2">Bank Details (Optional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input id="bank_name" name="bank_name" value={formData.bank_name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account_holder">Account Holder Name</Label>
            <Input id="bank_account_holder" name="bank_account_holder" value={formData.bank_account_holder} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account_number">Account Number</Label>
            <Input id="bank_account_number" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_ifsc">IFSC Code</Label>
            <Input id="bank_ifsc" name="bank_ifsc" value={formData.bank_ifsc} onChange={handleChange} maxLength={11} className="uppercase" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_upi">UPI Number/ID</Label>
            <Input id="bank_upi" name="bank_upi" value={formData.bank_upi} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 sticky bottom-0 bg-background py-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Register Author'}</Button>
      </div>
    </form>
  );
};

export default AuthorForm;
