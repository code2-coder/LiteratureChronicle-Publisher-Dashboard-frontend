import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Edit, Trash2, Plus, X, Image as ImageIcon, Library, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import ImageGallery from '@/components/ImageGallery';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const BookForm = ({ initialData, authors, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '', isbn: '', mrp: '', printing_cost: '', sku_code: '', authorId: '', book_sizes: '5x8', custom_width: '', custom_height: '', format: 'physical'
    }
  );
  const [coverFile, setCoverFile] = useState(null);
  const [coverUrl, setCoverUrl] = useState(initialData?.book_cover || '');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('isbn', formData.isbn);
      submitData.append('mrp', parseFloat(formData.mrp) || 0);
      submitData.append('printing_cost', parseFloat(formData.printing_cost) || 0);
      submitData.append('sku_code', formData.sku_code || '');
      submitData.append('authorId', formData.authorId);
      submitData.append('format', formData.format);
      
      const size = formData.book_sizes === 'custom' ? `${formData.custom_width}x${formData.custom_height}` : formData.book_sizes;
      submitData.append('book_sizes', size);
      
      if (coverFile) {
        submitData.append('book_cover', coverFile);
      } else if (coverUrl) {
        submitData.append('book_cover', coverUrl);
      }

      if (initialData?._id) {
        await apiClient.put(`/books/${initialData._id}`, submitData);
      } else {
        // Log entries for debugging
        console.log('--- SUBMITTING BOOK DATA ---');
        for (let [key, value] of submitData.entries()) {
          console.log(`${key}:`, value);
        }
        await apiClient.post('/books', submitData);
      }
      toast({ title: 'Success', description: 'Book saved successfully.' });
      onSuccess();
    } catch (error) {
      console.error('--- BOOK SUBMISSION ERROR ---');
      console.error(error);
      const errorMsg = error.response?.data?.errors 
        ? error.response.data.errors.join(', ') 
        : (error.response?.data?.message || error.message);
      
      toast({ 
        title: 'Submission Error', 
        description: errorMsg, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-primary">{initialData ? 'Edit Book' : 'Add New Book'}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Book Title</Label><Input name="title" value={formData.title} onChange={handleChange} required /></div>
        <div className="space-y-2"><Label>ISBN</Label><Input name="isbn" value={formData.isbn} onChange={handleChange} required /></div>
        
        <div className="space-y-2">
          <Label>Book Format</Label>
          <select name="format" value={formData.format} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="physical">Physical Book</option>
            <option value="ebook">Ebook</option>
          </select>
        </div>

        <div className="space-y-2"><Label>Base MRP (₹)</Label><Input name="mrp" type="number" step="0.01" value={formData.mrp} onChange={handleChange} required /></div>

        {formData.format === 'physical' && (
          <div className="space-y-2">
            <Label>Printing Cost (₹)</Label>
            <Input 
              name="printing_cost" 
              type="number" 
              step="0.01" 
              value={formData.printing_cost} 
              onChange={handleChange} 
              required
            />
          </div>
        )}

        <div className="space-y-2"><Label>SKU Code</Label><Input name="sku_code" value={formData.sku_code} onChange={handleChange} required /></div>
        <div className="space-y-2">
          <Label>Author</Label>
          <select name="authorId" value={formData.authorId} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Select Author</option>
            {authors.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Book Size</Label>
          <select name="book_sizes" value={formData.book_sizes} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="5x8">5×8</option>
            <option value="6x9">6×9</option>
            <option value="8x11">8×11</option>
            <option value="custom">Custom Size</option>
          </select>
        </div>
        {formData.book_sizes === 'custom' && (
          <div className="flex gap-2 items-end">
            <div className="space-y-2 flex-1"><Label>Width (in)</Label><Input name="custom_width" value={formData.custom_width} onChange={handleChange} required /></div>
            <div className="space-y-2 flex-1"><Label>Height (in)</Label><Input name="custom_height" value={formData.custom_height} onChange={handleChange} required /></div>
          </div>
        )}
        <div className="space-y-2 md:col-span-2">
          <Label>Book Cover Image</Label>
          <div className="flex gap-4 items-start">
            <div className="flex-1 space-y-2">
              <Input 
                type="file" 
                accept="image/*" 
                onChange={e => {
                  setCoverFile(e.target.files[0]);
                  setCoverUrl('');
                }} 
              />
              <p className="text-xs text-muted-foreground">Upload a new image or pick one from the library.</p>
            </div>
            <div className="pt-0.5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsGalleryOpen(true)}
                className="flex gap-2"
              >
                <Library className="h-4 w-4" /> Media Library
              </Button>
            </div>
          </div>
          {(coverUrl || (coverFile && URL.createObjectURL(coverFile))) && (
            <div className="mt-4 p-2 border border-border rounded-lg w-32 aspect-[3/4] relative overflow-hidden group">
              <img 
                src={coverFile ? URL.createObjectURL(coverFile) : coverUrl} 
                alt="Preview" 
                className="w-full h-full object-cover rounded"
              />
              <button 
                type="button"
                onClick={() => { setCoverFile(null); setCoverUrl(''); }}
                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Book Cover</DialogTitle>
            <DialogDescription>
              Choose an existing image from your Cloudinary media library.
            </DialogDescription>
          </DialogHeader>
          <ImageGallery 
            selectable 
            onSelect={(url) => {
              setCoverUrl(url);
              setCoverFile(null);
              setIsGalleryOpen(false);
            }} 
          />
        </DialogContent>
      </Dialog>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Book'}</Button>
      </div>
    </form>
  );
};

const BookManagementSection = () => {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { toast } = useToast();

  // Calculate ebook vs Physical analysis for books
  const bookAnalysis = React.useMemo(() => {
    if (books.length === 0) return { ebook: 0, physical: 0, total: 0 };
    const ebook = books.filter(b => (b.format || b.book_type || 'physical').toLowerCase() === 'ebook').length;
    const physical = books.filter(b => (b.format || b.book_type || 'physical').toLowerCase() === 'physical').length;
    return { ebook, physical, total: ebook + physical };
  }, [books]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, aRes] = await Promise.all([
        apiClient.get('/books', { params: { page, limit: 10, search } }),
        apiClient.get('/auth/authors')
      ]);
      setBooks(bRes.data.data);
      setTotalPages(bRes.data.pages);
      setTotalItems(bRes.data.total);
      
      // Handle the case where authors list might also be paginated in the future
      setAuthors(Array.isArray(aRes.data) ? aRes.data : aRes.data.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset to page 1 when search changes
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await apiClient.delete(`/books/${id}`);
      toast({ title: 'Success', description: 'Book deleted.' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2"><BookOpen className="h-6 w-6" /> Book Catalog</h2>
        {!isFormOpen && <Button onClick={() => { setEditingBook(null); setIsFormOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Add Book</Button>}
      </div>

      {isFormOpen && <BookForm initialData={editingBook} authors={authors} onSuccess={() => { setIsFormOpen(false); fetchData(); }} onCancel={() => setIsFormOpen(false)} />}

      {bookAnalysis.total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Ebook Books</p>
            <p className="text-2xl font-bold text-blue-600">{bookAnalysis.ebook}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Physical Books</p>
            <p className="text-2xl font-bold text-green-600">{bookAnalysis.physical}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Total Books</p>
            <p className="text-2xl font-bold text-primary">{totalItems}</p>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search books by title, ISBN, or SKU..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-9 h-10 w-full md:max-w-md bg-background" 
        />
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-background text-primary uppercase font-medium border-b border-border">
              <tr>
                <th className="py-4 px-6">Cover</th>
                <th className="py-4 px-6">Title</th>
                <th className="py-4 px-6">Author</th>
                <th className="py-4 px-6">Format</th>
                <th className="py-4 px-6">Base MRP</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {books.map((book) => (
                <tr key={book._id} className="hover:bg-background/50">
                  <td className="py-4 px-6">
                    {book.book_cover ? <img src={book.book_cover} alt={book.title} className="w-12 h-16 object-cover rounded" /> : <div className="w-12 h-16 bg-muted flex items-center justify-center rounded"><ImageIcon className="h-5 w-5 text-muted-foreground/50" /></div>}
                  </td>
                  <td className="py-4 px-6 font-medium">{book.title}</td>
                  <td className="py-4 px-6 text-muted-foreground">{book.authorId?.name || 'Unknown'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${book.format === 'ebook' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {book.format === 'ebook' ? 'Ebook' : 'Physical'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">₹{book.mrp}</td>
                  <td className="py-4 px-6 text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingBook(book); setIsFormOpen(true); }}><Edit className="h-4 w-4 text-blue-600" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(book._id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground">Showing {books.length} of {totalItems} books</p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold px-3 py-1 bg-muted rounded-md border">
              {page} / {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === totalPages} 
              onClick={() => setPage(page + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManagementSection;
