import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, DollarSign, Users, BarChart3, Upload, Feather, ChevronRight } from 'lucide-react';

const HomePage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Real-Time Revenue Tracking',
      description: 'Monitor your literary works\' performance across multiple distribution channels with precise, real-time analytics.',
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: 'Automated Royalty Disbursement',
      description: 'Experience seamless royalty calculations with customizable percentage rates and transparent payment histories.',
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Comprehensive Analytics',
      description: 'Visualize your publishing success with detailed breakdowns by manuscript, platform, and fiscal period.',
    },
    {
      icon: <Upload className="h-8 w-8" />,
      title: 'Streamlined Data Integration',
      description: 'Effortlessly import sales and disbursement records via CSV or Excel for centralized portfolio management.',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Author Roster Management',
      description: 'A sophisticated administrative suite to oversee multiple authors, track collective sales, and process disbursements.',
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: 'Manuscript Portfolio',
      description: 'Organize and track your entire catalog of published works with detailed historical performance metrics.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Literature Chronicle - Author Publishing Platform</title>
        <meta
          name="description"
          content="Elevating professional book publishing for distinguished authors. Track sales, manage royalties, and oversee your literary portfolio."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col font-sans bg-mesh selection:bg-secondary/30">
        <Header />

        {/* Hero Section */}
        <section className="relative flex-grow flex items-center justify-center overflow-hidden py-24 lg:py-32">
          {/* Advanced Decorative Elements */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          </div>

          <motion.div 
            className="container mx-auto px-4 z-10"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
              <motion.div 
                variants={itemVariants} 
                className="mb-10"
                animate={{ 
                  y: [0, -20, 0],
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="Literature Chronicle Logo" 
                  className="h-32 md:h-44 w-auto object-contain drop-shadow-2xl rounded-3xl"
                />
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                className="inline-flex items-center gap-2 bg-secondary/10 text-primary border border-secondary/20 px-6 py-2 rounded-full text-xs font-bold tracking-[0.2em] uppercase mb-10"
              >
                <Feather className="h-3.5 w-3.5 text-secondary" />
                <span>Professional Publishing Excellence</span>
              </motion.div>

              <motion.h1 
                variants={itemVariants}
                className="text-4xl md:text-7xl font-serif font-bold text-primary mb-8 leading-[1.1] tracking-tighter"
              >
                Elevating the Art of <br/>
                <span className="luxury-gradient italic font-normal">Literary Success</span>
              </motion.h1>

              <motion.p 
                variants={itemVariants}
                className="text-lg md:text-xl text-muted-foreground/80 mb-12 max-w-2xl mx-auto font-light leading-relaxed"
              >
                A distinguished platform designed for esteemed authors and publishers to monitor performance, automate royalties, and manage portfolios with unparalleled elegance.
              </motion.p>

              <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto"
              >
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-lg px-12 py-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl hover:-translate-y-1 transition-all rounded-full group">
                    Author Login
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-32 bg-slate-50/50">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <span className="text-secondary font-bold tracking-widest uppercase text-xs mb-4 block">Capabilities</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-6">
                Refined Tools for the Modern Author
              </h2>
              <div className="w-24 h-1 bg-secondary mx-auto mb-8 rounded-full"></div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                Sophisticated features engineered to simplify revenue tracking and portfolio management.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ 
                    y: -10, 
                    scale: 1.02,
                    boxShadow: "0 40px 80px -15px rgba(0,0,0,0.1)"
                  }}
                  viewport={{ once: true }}
                  transition={{ 
                    layout: { duration: 0.3 },
                    opacity: { duration: 0.5 },
                    y: { duration: 0.5 }
                  }}
                  className="glass-card p-10 rounded-3xl bg-white/50 backdrop-blur-sm transition-all duration-300 group premium-shadow border border-white/20"
                >
                  <div className="mb-8 p-5 bg-primary/5 rounded-2xl inline-block group-hover:bg-secondary/10 group-hover:scale-110 transition-all duration-500 text-secondary">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary mb-3 group-hover:text-secondary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-light text-base">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-32">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="bg-primary rounded-[3rem] p-16 md:p-28 text-center text-primary-foreground relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] max-w-6xl mx-auto"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] -mr-64 -mt-64 text-secondary"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -ml-64 -mb-64"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-8 leading-tight">Ready to Master Your <br/>Literary Legacy?</h2>
              <p className="text-lg md:text-xl mb-12 text-primary-foreground/70 max-w-3xl mx-auto font-light leading-relaxed">
                Trust Literature Chronicle to manage your publishing success with the precision and elegance your work deserves.
              </p>
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block"
                >
                  <Button size="lg" className="text-xl px-14 py-8 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all rounded-full shadow-2xl font-bold">
                    Access Portal
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="bg-white py-16">
          <motion.div 
            className="container mx-auto px-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 border-t border-slate-100 pt-16">
              <div className="flex items-center gap-4 group">
                <img 
                  src="https://horizons-cdn.hostinger.com/9bc70898-334e-45cd-a18a-f7cba077ad04/6021826ec5c51410d3136593cfcafc49.png" 
                  alt="Literature Chronicle Logo" 
                  className="h-10 w-auto transition-transform group-hover:rotate-12 rounded-xl"
                />
                <span className="font-serif font-bold text-2xl tracking-tight text-primary">Literature Chronicle</span>
              </div>
              
              <div className="flex gap-8 text-sm font-medium text-muted-foreground font-mono uppercase tracking-widest">
                <Link to="/" className="hover:text-primary transition-all hover:translate-y-[-2px]">Home</Link>
                <Link to="/login" className="hover:text-primary transition-all hover:translate-y-[-2px]">Portal</Link>
              </div>

              <div className="text-right">
                <p className="text-muted-foreground text-sm font-medium">
                  © {new Date().getFullYear()} Literature Chronicle Publishing.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1 uppercase tracking-widest font-bold">
                  Refining Literary Legacies.
                </p>
              </div>
            </div>
          </motion.div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;