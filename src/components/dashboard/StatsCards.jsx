import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Award, BookOpen, Package, ArrowDownRight } from 'lucide-react';

const StatsCards = ({ stats, formatCurrency }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="glass-card rounded-[2rem] p-8 premium-shadow lg:col-span-2 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex justify-between items-start mb-6 relative z-10">
          <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">Available Settlement</span>
          <div className="bg-primary/10 p-3 rounded-2xl"><Wallet className="h-6 w-6 text-primary" /></div>
        </div>
        <p className="text-5xl lg:text-6xl font-serif font-bold text-primary tracking-tight mt-2 relative z-10">{formatCurrency(stats.balanceRoyalty)}</p>
        <div className="mt-8 flex items-center gap-2 relative z-10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-muted-foreground italic">Ready for immediate disbursement</span>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card rounded-[2rem] p-8 premium-shadow lg:col-span-2 relative overflow-hidden group border-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex justify-between items-start mb-6 relative z-10">
          <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">Lifetime Earnings</span>
          <div className="bg-secondary/10 p-3 rounded-2xl"><Award className="h-6 w-6 text-secondary" /></div>
        </div>
        <p className="text-5xl lg:text-6xl font-serif font-bold text-primary tracking-tight mt-2 relative z-10">{formatCurrency(stats.totalRoyalty)}</p>
        <p className="text-sm text-muted-foreground mt-8 font-light italic relative z-10">Total publishing revenue accumulated</p>
      </motion.div>

      <div className="lg:col-span-1 grid grid-cols-1 gap-4">
        {[
          { label: 'Paid', value: formatCurrency(stats.paidRoyalty), icon: ArrowDownRight, color: 'text-green-600' },
          { label: 'Works', value: stats.publishedWorks, icon: BookOpen, color: 'text-primary' },
          { label: 'Sales', value: stats.totalQuantitySold, icon: Package, color: 'text-secondary' },
        ].map((smallStat, idx) => (
          <motion.div key={idx} variants={item} className="glass-card rounded-2xl p-5 flex flex-col justify-between border-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{smallStat.label}</span>
              <smallStat.icon className={`h-4 w-4 ${smallStat.color}`} />
            </div>
            <p className="text-xl font-serif font-bold text-primary">{smallStat.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default StatsCards;

