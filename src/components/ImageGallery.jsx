import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, Check, Loader2, Image as ImageIcon, ExternalLink, RefreshCw, Upload } from 'lucide-react';

const ImageGallery = ({ onSelect, selectable = false }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const { toast } = useToast();

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/images');
      setImages(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch images from Cloudinary.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      await apiClient.post('/images', formData);
      toast({ title: 'Success', description: 'Image uploaded successfully.' });
      fetchImages();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.message || 'Failed to upload image.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (public_id) => {
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) return;

    try {
      await apiClient.delete(`/images/${encodeURIComponent(public_id)}`);
      setImages(images.filter((img) => img.public_id !== public_id));
      toast({ title: 'Success', description: 'Image deleted from Cloudinary.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete image.',
        variant: 'destructive',
      });
    }
  };

  const filteredImages = images.filter((img) =>
    img.public_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search images..."
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
            accept="image/*"
          />
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 md:flex-none"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchImages} disabled={uploading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading your media library...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
          <p>{searchQuery ? 'No images match your search.' : 'Your media library is empty.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredImages.map((img) => (
            <div
              key={img.public_id}
              className="group relative bg-card border border-border rounded-xl overflow-hidden aspect-[3/4] hover:shadow-lg transition-all duration-300"
            >
              <img
                src={img.secure_url}
                alt={img.public_id}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
                <p className="text-[10px] text-white/80 truncate mb-auto">{img.public_id.split('/').pop()}</p>
                <div className="flex gap-2">
                  {selectable && (
                    <Button
                      size="sm"
                      className="w-full h-8 bg-primary hover:bg-primary/90 text-white"
                      onClick={() => onSelect(img.secure_url)}
                    >
                      <Check className="h-3 w-3 mr-1" /> Select
                    </Button>
                  )}
                  <div className="flex gap-1 w-full justify-between items-center">
                    <a
                      href={img.secure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                      title="View full size"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(img.public_id)}
                      className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-colors"
                      title="Delete image"
                      aria-label={`Delete image ${img.public_id.split('/').pop()}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
