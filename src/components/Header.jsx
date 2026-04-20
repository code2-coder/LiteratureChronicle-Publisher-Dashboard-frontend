import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, ChevronRight } from 'lucide-react';
import NotificationBar from './NotificationBar.jsx';

const Header = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    ...(isAuthenticated && currentUser?.role === 'author' ? [{ name: 'Author Portfolio', path: '/author-dashboard' }] : []),
    ...(isAuthenticated && currentUser?.role === 'admin' ? [{ name: 'Administration', path: '/admin-dashboard' }] : []),
  ];

  return (
    <>
      <NotificationBar />
      <header className="glass-nav sticky top-0 z-50 transition-all duration-300 border-b border-primary/5">
        <div className="container mx-auto px-4 py-4 md:py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group relative z-[60]">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="Literature Chronicle Logo" 
                  className="h-9 md:h-11 w-auto object-contain transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-secondary/20 blur-xl scale-0 group-hover:scale-150 transition-transform duration-700 -z-10 rounded-full"></div>
              </div>
              <span className="text-xl md:text-2xl font-serif font-bold tracking-tight text-primary hidden xs:inline-block">
                Literature Chronicle
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className="relative text-sm font-bold tracking-wide uppercase text-foreground/70 hover:text-primary transition-all duration-300 group"
                >
                  {link.name}
                  <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}

              {isAuthenticated ? (
                <Button onClick={logout} variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full px-6 transition-all">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Link to="/login">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-5 shadow-xl shadow-primary/20 transition-all font-bold">
                    Author Portal Login
                  </Button>
                </Link>
              )}
            </nav>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden relative z-[60] p-2 text-primary hover:bg-primary/5 rounded-xl transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-primary/20 backdrop-blur-md z-[50] md:hidden"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[55] md:hidden p-8 pt-24"
              >
                <div className="flex flex-col gap-6">
                  <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">Navigation</p>
                  {navLinks.map((link) => (
                    <Link 
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between text-2xl font-serif font-bold text-primary group"
                    >
                      {link.name}
                      <ChevronRight className="h-6 w-6 text-secondary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  ))}
                  
                  <div className="h-px bg-primary/5 my-4" />
                  
                  {isAuthenticated ? (
                    <Button 
                      onClick={() => { logout(); setIsMenuOpen(false); }} 
                      variant="outline" 
                      className="w-full py-7 rounded-2xl border-primary/10 text-primary font-bold text-lg"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign Out
                    </Button>
                  ) : (
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full py-7 rounded-2xl bg-primary shadow-xl shadow-primary/10 font-bold text-lg">
                        Author Portal Login
                      </Button>
                    </Link>
                  )}
                </div>
                
                <div className="absolute bottom-10 left-8 right-8 text-center">
                  <p className="text-sm text-muted-foreground font-light mb-1 italic">Literature Chronicle</p>
                  <p className="text-[10px] font-bold tracking-widest text-primary/40 uppercase">Professional Publishing Suite</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;