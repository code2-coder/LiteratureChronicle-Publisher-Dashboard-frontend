import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Server, Edit, Trash2, Plus } from 'lucide-react';

const PlatformManagementSection = () => {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [formData, setFormData] = useState({ name: '', commission_percentage: '' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/platforms');
      setPlatforms(res.data);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast({ title: 'Error', description: 'Failed to load platforms.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleOpenModal = (platform = null) => {
    if (platform) {
      setEditingPlatform(platform);
      setFormData({ name: platform.name, commission_percentage: platform.commission_percentage });
    } else {
      setEditingPlatform(null);
      setFormData({ name: '', commission_percentage: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this platform?')) return;
    try {
      await apiClient.delete(`/platforms/${id}`);
      toast({ title: 'Success', description: 'Platform deleted successfully.' });
      fetchPlatforms();
    } catch (error) {
      console.error('Error deleting platform:', error);
      toast({ title: 'Error', description: 'Failed to delete platform.', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        commission_percentage: parseFloat(formData.commission_percentage),
      };

      if (editingPlatform) {
        await apiClient.put(`/platforms/${editingPlatform._id}`, payload);
        toast({ title: 'Success', description: 'Platform updated successfully.' });
      } else {
        await apiClient.post('/platforms', payload);
        toast({ title: 'Success', description: 'Platform created successfully.' });
      }
      setIsModalOpen(false);
      fetchPlatforms();
    } catch (error) {
      console.error('Error saving platform:', error);
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save platform.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Server className="h-6 w-6" />
          Platform Management
        </h2>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" /> Add Platform
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading platforms...</div>
        ) : platforms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background text-primary uppercase font-medium border-b border-border">
                <tr>
                  <th className="py-4 px-6">Platform Name</th>
                  <th className="py-4 px-6">Commission Percentage</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {platforms.map((platform) => (
                  <tr key={platform._id} className="hover:bg-background/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-primary">{platform.name}</td>
                    <td className="py-4 px-6 text-muted-foreground">{platform.commission_percentage}%</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(platform)}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(platform._id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-background/50">
            <Server className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground italic">No platforms found.</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              {editingPlatform ? 'Edit Platform' : 'Add Platform'}
            </DialogTitle>
            <DialogDescription>
              Configure the distribution platform metadata and commission structures.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Platform Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission_percentage">Commission Percentage (%)</Label>
              <Input
                id="commission_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.commission_percentage}
                onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Platform'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlatformManagementSection;