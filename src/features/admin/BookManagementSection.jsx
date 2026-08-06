import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
<<<<<<< HEAD
import { BookOpen, Edit, Trash2, Plus, X, Image as ImageIcon, Library, ChevronLeft, ChevronRight, Search, Copy, Check, ChevronsUpDown, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
=======
import { BookOpen, Edit, Trash2, Plus, X, Image as ImageIcon, Library, ChevronLeft, ChevronRight, Search, Copy, Check, ChevronsUpDown } from 'lucide-react';
>>>>>>> 255a2ef2ab893b247bdd9162309f8c1c1052527f
import ImageGallery from '@/components/ImageGallery';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
<<<<<<< HEAD
import { cn } from '@/utils/utils';
=======
import { cn } from '@/lib/utils';
>>>>>>> 255a2ef2ab893b247bdd9162309f8c1c1052527f

const BookForm = ({ initialData, authors, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '', isbn: '', mrp: '', printing_cost: '', sku_code: '', authorId: '', book_sizes: '5x8', custom_width: '', custom_height: '', format: 'physical', pages: 0
    }
  );
  const [coverFile, setCoverFile] = useState(null);
  const [coverUrl, setCoverUrl] = useState(initialData?.book_cover || '');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [openAuthor, setOpenAuthor] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      // Normalize ISBN (remove hyphens/spaces) before saving to DB
      const normalizedIsbn = (formData.isbn || '').replace(/[^0-9X]/gi, '').toUpperCase();
      submitData.append('isbn', normalizedIsbn);
      submitData.append('mrp', parseFloat(formData.mrp) || 0);
      submitData.append('printing_cost', parseFloat(formData.printing_cost) || 0);
      submitData.append('sku_code', formData.sku_code || '');
      submitData.append('authorId', formData.authorId);
      submitData.append('format', formData.format);
      submitData.append('pages', parseInt(formData.pages) || 0);
      
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
        <div className="space-y-2"><Label>Number of Pages</Label><Input name="pages" type="number" value={formData.pages} onChange={handleChange} required /></div>
        <div className="space-y-2">
          <Label className="flex gap-1.5 items-center">
            Author <span className="text-red-500 font-bold">*</span>
          </Label>
          <Popover open={openAuthor} onOpenChange={setOpenAuthor}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openAuthor}
                className="w-full justify-between h-10 px-3 py-2 border-2 border-primary/10 hover:bg-background bg-background font-normal"
              >
                <span className="truncate">
                  {formData.authorId
                    ? authors.find((author) => author._id === formData.authorId)?.name || "Select author..."
                    : "Select author..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search author..." />
                <CommandList>
                  <CommandEmpty>No author found.</CommandEmpty>
                  <CommandGroup>
                    {authors.map((author) => (
                      <CommandItem
                        key={author._id}
                        value={`${author.name} ${author.email}`}
                        onSelect={() => {
                          setFormData({ ...formData, authorId: author._id });
                          setOpenAuthor(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            formData.authorId === author._id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{author.name} ({author.email})</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
  const itemsPerPage = 8;
  const [expandedRows, setExpandedRows] = useState({});
  const [copiedText, setCopiedText] = useState('');

  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, aRes] = await Promise.all([
<<<<<<< HEAD
        apiClient.get('/books', { params: { limit: 1000, search } }),
=======
        apiClient.get('/books', { params: { page, limit: 10, search } }),
>>>>>>> 255a2ef2ab893b247bdd9162309f8c1c1052527f
        apiClient.get('/auth/authors', { params: { limit: 1000 } })
      ]);
      setBooks(bRes.data.data || bRes.data || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book edition?')) return;
    try {
      await apiClient.delete(`/books/${id}`);
      toast({ title: 'Success', description: 'Book edition deleted.' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  const handleDuplicate = (book) => {
    const clonedBook = {
      ...book,
      _id: null,
      isbn: '', 
      sku_code: '', 
      format: book.format === 'physical' ? 'ebook' : 'physical',
      mrp: book.format === 'physical' ? (book.mrp * 0.5).toFixed(2) : (book.mrp * 2).toFixed(2),
    };
    setEditingBook(clonedBook);
    setIsFormOpen(true);
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  // Group books by Title and Author
  const groupedBooks = [];
  books.forEach((book) => {
    const authorIdVal = book.authorId?._id || book.authorId || 'unknown';
    const authorName = book.authorId?.name || 'Unknown Author';
    const key = `${book.title.toLowerCase().trim()}_${authorIdVal}`;
    
    let group = groupedBooks.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        title: book.title,
        authorName,
        authorId: authorIdVal,
        book_cover: book.book_cover,
        pages: book.pages,
        editions: []
      };
      groupedBooks.push(group);
    }
    group.editions.push(book);
    if (book.book_cover && !group.book_cover) {
      group.book_cover = book.book_cover;
    }
    if (book.pages && !group.pages) {
      group.pages = book.pages;
    }
  });

  // Pagination for groups
  const totalItems = groupedBooks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedGroups = groupedBooks.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleRow = (key) => {
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2"><BookOpen className="h-6 w-6" /> Book Catalog</h2>
        {!isFormOpen && <Button onClick={() => { setEditingBook(null); setIsFormOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Add Book</Button>}
      </div>

      {isFormOpen && <BookForm initialData={editingBook} authors={authors} onSuccess={() => { setIsFormOpen(false); fetchData(); }} onCancel={() => setIsFormOpen(false)} />}

      {/* Summary Info Card */}
      {totalItems > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unique Titles</p>
              <p className="text-3xl font-extrabold text-primary mt-1">{totalItems}</p>
            </div>
            <BookOpen className="h-8 w-8 text-primary/40" />
          </div>
          <div className="p-5 bg-secondary/5 rounded-2xl border border-secondary/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Formats/Editions</p>
              <p className="text-3xl font-extrabold text-secondary mt-1">{books.length}</p>
            </div>
            <Library className="h-8 w-8 text-secondary/40" />
          </div>
        </div>
      )}

      {/* Search and Navigation Bar */}
      <div className="flex flex-col sm:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-muted/50 p-1 rounded-xl w-fit border border-border">
          <div className="px-6 py-1.5 text-sm font-bold text-primary bg-background rounded-lg shadow-sm border border-border/50">
            All Editions
          </div>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title, ISBN, or SKU..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9 h-10 w-full bg-background" 
          />
        </div>
      </div>

      {/* Grouped Table */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-xs tracking-wider border-b border-border">
              <tr>
                <th className="py-4 px-6 w-[80px]">Cover</th>
                <th className="py-4 px-6">Title & Author</th>
                <th className="py-4 px-6">Editions Available</th>
                <th className="py-4 px-6">Pages</th>
                <th className="py-4 px-6 text-center">Collapse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p>Loading books database...</p>
                  </td>
                </tr>
              ) : paginatedGroups.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">No books found in catalog.</p>
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((group) => {
                  const isExpanded = !!expandedRows[group.key];
                  
                  return (
                    <React.Fragment key={group.key}>
                      {/* Main Group Row */}
                      <tr className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => toggleRow(group.key)}>
                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          {group.book_cover ? (
                            <img 
                              src={group.book_cover} 
                              alt={group.title} 
                              className="w-12 h-16 object-cover rounded shadow border border-border/30 hover:scale-105 transition-transform duration-200" 
                            />
                          ) : (
                            <div className="w-12 h-16 bg-muted flex items-center justify-center rounded border border-border/30">
                              <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-serif font-bold text-base text-foreground leading-snug">{group.title}</div>
                          <div className="text-xs text-muted-foreground font-medium mt-0.5">{group.authorName}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-2">
                            {group.editions.map(ed => {
                              const isEbook = ed.format === 'ebook';
                              return (
                                <span 
                                  key={ed._id} 
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                    isEbook 
                                      ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  }`}
                                >
                                  {isEbook ? 'Ebook' : 'Physical'} • {formatCurrency(ed.mrp)}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-muted-foreground font-medium">
                          {group.pages ? `${group.pages} pages` : '—'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-primary gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(group.key);
                            }}
                          >
                            <span className="text-xs font-bold">{group.editions.length} format{group.editions.length > 1 ? 's' : ''}</span>
                            {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                          </Button>
                        </td>
                      </tr>

                      {/* Expanded Sub-Panel Row */}
                      {isExpanded && (
                        <tr className="bg-muted/10">
                          <td colSpan="5" className="p-0">
                            <div className="p-6 border-t border-b border-border/40 space-y-4">
                              <h4 className="text-xs font-bold tracking-widest uppercase text-muted-foreground px-1">Editions & Specifications</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {group.editions.map((ed) => {
                                  const isEbook = ed.format === 'ebook';
                                  const oppositeFormat = isEbook ? 'physical' : 'ebook';
                                  const hasAlternateFormat = group.editions.some(e => e.format === oppositeFormat);

                                  return (
                                    <div key={ed._id} className="bg-card p-5 rounded-2xl border border-border/80 shadow-sm flex flex-col justify-between space-y-4">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                            isEbook 
                                              ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                          }`}>
                                            {ed.format}
                                          </span>
                                          <h5 className="font-bold text-foreground text-lg mt-1">{formatCurrency(ed.mrp)}</h5>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex gap-1">
                                          {!hasAlternateFormat && (
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              title="Duplicate as Alternate Format" 
                                              onClick={() => handleDuplicate(ed)}
                                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 w-8 rounded-full"
                                            >
                                              <Copy className="h-4 w-4" />
                                            </Button>
                                          )}
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            title="Edit Edition"
                                            onClick={() => { setEditingBook(ed); setIsFormOpen(true); }}
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 rounded-full"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            title="Delete Edition"
                                            onClick={() => handleDelete(ed._id)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Specs */}
                                      <div className="grid grid-cols-2 gap-4 text-xs bg-muted/40 p-3.5 rounded-xl border border-border/40">
                                        <div className="space-y-1">
                                          <span className="text-muted-foreground font-medium">ISBN-13</span>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="font-mono text-foreground font-semibold">{ed.isbn || '—'}</span>
                                            {ed.isbn && (
                                              <button 
                                                type="button"
                                                onClick={() => handleCopy(ed.isbn, 'ISBN')}
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                              >
                                                {copiedText === ed.isbn ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <span className="text-muted-foreground font-medium">SKU Code</span>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="font-mono text-foreground font-semibold">{ed.sku_code || '—'}</span>
                                            {ed.sku_code && (
                                              <button 
                                                type="button"
                                                onClick={() => handleCopy(ed.sku_code, 'SKU')}
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                              >
                                                {copiedText === ed.sku_code ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        <div className="col-span-2 pt-1 border-t border-border/20 grid grid-cols-2 gap-4">
                                          <div>
                                            <span className="text-muted-foreground font-medium">Book Size</span>
                                            <div className="font-semibold text-foreground mt-0.5">{ed.book_sizes || '—'}</div>
                                          </div>
                                          {!isEbook && (
                                            <div>
                                              <span className="text-muted-foreground font-medium">Printing Cost</span>
                                              <div className="font-semibold text-foreground mt-0.5">{formatCurrency(ed.printing_cost)}</div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing {paginatedGroups.length} of {totalItems} titles</p>
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
