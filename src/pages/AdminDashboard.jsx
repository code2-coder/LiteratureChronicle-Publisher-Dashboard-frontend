import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header.jsx';
import AuthorForm from '@/components/AuthorForm.jsx';
import FileUploadModal from '@/components/FileUploadModal.jsx';
const BookManagementSection = React.lazy(() => import('@/features/admin/BookManagementSection.jsx'));
const AuthorManagementSection = React.lazy(() => import('@/features/admin/AuthorManagementSection.jsx'));
const PlatformManagementSection = React.lazy(() => import('@/features/admin/PlatformManagementSection.jsx'));
const UploadHistorySection = React.lazy(() => import('@/features/admin/UploadHistorySection.jsx'));
import ExcelTemplateDownloader from '@/components/ExcelTemplateDownloader.jsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, TrendingUp, DollarSign, BookOpen, Server, History, ChevronRight } from 'lucide-react';

const AdminDashboard = () => {
  const [showAuthorForm, setShowAuthorForm] = useState(false);
  const [showSalesUpload, setShowSalesUpload] = useState(false);
  const [showPaymentsUpload, setShowPaymentsUpload] = useState(false);
  const [activeTab, setActiveTab] = useState('books');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const handleAuthorCreated = () => {
    setShowAuthorForm(false);
  };

  return (
    <>
      <Helmet>
        <title>Publishing Administration - Literature Chronicle</title>
        <meta name="description" content="Administrative suite for managing authors, revenue data, and disbursements." />
      </Helmet>

      <div className="min-h-screen bg-[#fcfbf9]">
        <Header />

        <motion.div 
          className="container mx-auto px-4 py-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-12 border-b border-border/50 pb-8">
            <h1 className="text-5xl font-serif font-bold text-primary mb-3 tracking-tight">Publishing Administration</h1>
            <p className="text-muted-foreground text-xl font-light">Oversee author rosters, import revenue ledgers, and process disbursements with precision.</p>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.button
              variants={itemVariants}
              whileHover={{ y: -5 }}
              onClick={() => setShowAuthorForm(true)}
              className="glass-card rounded-2xl p-10 text-left group relative overflow-hidden transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-700"></div>
              <div className="bg-primary/10 p-4 rounded-2xl inline-block mb-6 relative z-10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-primary mb-3 relative z-10 flex items-center gap-2">
                Register Author
                <ChevronRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-muted-foreground relative z-10 leading-relaxed">Enroll a new author into the publishing platform membership.</p>
            </motion.button>

            <motion.button
              variants={itemVariants}
              whileHover={{ y: -5 }}
              onClick={() => setShowSalesUpload(true)}
              className="glass-card rounded-2xl p-10 text-left group relative overflow-hidden transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-700"></div>
              <div className="bg-secondary/10 p-4 rounded-2xl inline-block mb-6 relative z-10">
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-primary mb-3 relative z-10 flex items-center gap-2">
                Import Book Sales
                <ChevronRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-muted-foreground relative z-10 leading-relaxed">Centralize distribution data across multiple retail channels.</p>
            </motion.button>

            <motion.button
              variants={itemVariants}
              whileHover={{ y: -5 }}
              onClick={() => setShowPaymentsUpload(true)}
              className="glass-card rounded-2xl p-10 text-left group relative overflow-hidden transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-700"></div>
              <div className="bg-primary/10 p-4 rounded-2xl inline-block mb-6 relative z-10">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-primary mb-3 relative z-10 flex items-center gap-2">
                Import Royalty Data
                <ChevronRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-muted-foreground relative z-10 leading-relaxed">Execute financial settlements and verify royalty calculations.</p>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Nav & Templates (Side) */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
              <div className="glass-card rounded-2xl p-4 md:p-6 overflow-hidden">
                <h2 className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4 md:mb-6 px-2">Management</h2>
                <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 space-x-2 lg:space-x-0 lg:space-y-1 scrollbar-hide">
                  {[
                    { id: 'books', label: 'Books', icon: BookOpen },
                    { id: 'authors', label: 'Authors', icon: Users },
                    { id: 'platforms', label: 'Platforms', icon: Server },
                    { id: 'history', label: 'History', icon: History },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                          : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                      }`}
                    >
                      <tab.icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? '' : 'text-secondary'}`} />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="glass-card rounded-3xl p-6 md:p-8 bg-primary/5 border-none hidden lg:block premium-shadow border border-primary/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-6 w-1 bg-secondary rounded-full"></div>
                  <h3 className="text-xl font-serif font-bold text-primary">Data Templates</h3>
                </div>
                <p className="text-sm text-muted-foreground/80 mb-6 leading-relaxed">Standardized ledgers for seamless data migration across channels.</p>
                <div className="p-1 bg-white/40 rounded-3xl border border-primary/5">
                  <ExcelTemplateDownloader />
                </div>
              </div>
            </motion.div>

            {/* Main Content Area */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <React.Suspense fallback={
                    <div className="flex h-64 w-full items-center justify-center rounded-3xl bg-primary/5">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg"></div>
                    </div>
                  }>
                    {activeTab === 'books' && <BookManagementSection />}
                    {activeTab === 'authors' && <AuthorManagementSection />}
                    {activeTab === 'platforms' && <PlatformManagementSection />}
                    {activeTab === 'history' && <UploadHistorySection />}
                  </React.Suspense>

                  {/* Show Templates at the bottom on mobile */}
                  <div className="mt-10 lg:hidden">
                    <div className="glass-card rounded-2xl p-6 bg-primary/5 border-none">
                      <h3 className="text-lg font-serif font-bold text-primary mb-2">Data Templates</h3>
                      <p className="text-sm text-muted-foreground mb-6">Standardized ledgers for data migration.</p>
                      <ExcelTemplateDownloader />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Create Author Modal */}
      <Dialog open={showAuthorForm} onOpenChange={setShowAuthorForm}>
        <DialogContent className="sm:max-w-[500px] border-none rounded-3xl p-8 glass-card">
          <DialogHeader>
            <DialogTitle className="text-3xl font-serif font-bold text-primary">Register New Author</DialogTitle>
            <DialogDescription className="text-lg font-light">
              Enter details for enrollments into the Literature Chronicle roster.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <AuthorForm
              onSuccess={handleAuthorCreated}
              onCancel={() => setShowAuthorForm(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <FileUploadModal isOpen={showSalesUpload} onClose={() => setShowSalesUpload(false)} type="sales" />
      <FileUploadModal isOpen={showPaymentsUpload} onClose={() => setShowPaymentsUpload(false)} type="royalty" />
    </>
  );
};

export default AdminDashboard;