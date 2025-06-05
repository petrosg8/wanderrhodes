
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const initialPayments = [
  { id: 'pay_1', userId: 'user_abc', amount: 3.49, currency: 'EUR', date: '2025-05-15', status: 'Succeeded' },
  { id: 'pay_2', userId: 'user_def', amount: 3.49, currency: 'EUR', date: '2025-05-14', status: 'Succeeded' },
  { id: 'pay_3', userId: 'user_ghi', amount: 3.49, currency: 'EUR', date: '2025-05-14', status: 'Failed' },
  { id: 'pay_4', userId: 'user_jkl', amount: 3.49, currency: 'EUR', date: '2025-05-13', status: 'Succeeded' },
  { id: 'pay_5', userId: 'user_mno', amount: 3.49, currency: 'EUR', date: '2025-05-12', status: 'Succeeded' },
];

const PaymentTrackingSection = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, successfulPayments: 0, failedPayments: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call for payments and stats
    setTimeout(() => {
      const storedPayments = localStorage.getItem('rhodesPayments');
      const currentPayments = storedPayments ? JSON.parse(storedPayments) : initialPayments;
      setPayments(currentPayments);
      
      const successful = currentPayments.filter(p => p.status === 'Succeeded');
      const failed = currentPayments.filter(p => p.status === 'Failed');
      const totalRev = successful.reduce((sum, p) => sum + p.amount, 0);

      setStats({
        totalRevenue: totalRev,
        successfulPayments: successful.length,
        failedPayments: failed.length,
      });
      setIsLoading(false);
      if(!storedPayments) {
        localStorage.setItem('rhodesPayments', JSON.stringify(initialPayments));
      }
    }, 1200);
  }, []);

  const handleStripeSetup = () => {
    toast({
      title: "Stripe Integration",
      description: "Please follow the Stripe setup guide to enable payment processing.",
    });
    // Here you would guide the user through Stripe setup steps as per requirements
  };
  
  const StatCard = ({ title, value, icon, currency, isLoading }) => (
     <Card className="bg-card/80 backdrop-blur-sm hover:shadow-primary/10 hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
      {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
        <div className="text-2xl font-bold text-foreground">
          {currency && `${currency} `}{value}
        </div>
      )}
      </CardContent>
    </Card>
  );

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut",
      },
    }),
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };


  return (
    <div className="space-y-6">
       <div className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg text-yellow-300">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
          <h3 className="font-semibold">Payment Processing Setup Required</h3>
        </div>
        <p className="text-sm mt-1">
          To enable real-time payment tracking and processing for "Wander Rhodes", you need to integrate a payment provider like Stripe.
        </p>
        <Button onClick={handleStripeSetup} size="sm" className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-black">
          Setup Stripe Payments
        </Button>
        <p className="text-xs mt-2 opacity-80">The data shown below is currently sample data for demonstration purposes.</p>
      </div>

      <motion.div 
        className="grid gap-4 md:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={cardVariants} custom={0}><StatCard title="Total Revenue" value={stats.totalRevenue.toFixed(2)} currency="€" icon={<DollarSign className="h-5 w-5 text-green-500" />} isLoading={isLoading}/></motion.div>
        <motion.div variants={cardVariants} custom={1}><StatCard title="Successful Payments" value={stats.successfulPayments} icon={<TrendingUp className="h-5 w-5 text-blue-500" />} isLoading={isLoading}/></motion.div>
        <motion.div variants={cardVariants} custom={2}><StatCard title="Failed Payments" value={stats.failedPayments} icon={<Users className="h-5 w-5 text-red-500" />} isLoading={isLoading}/></motion.div>
      </motion.div>

      <motion.div variants={cardVariants} custom={3} initial="hidden" animate="visible">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Showing the last 5 transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <ul className="space-y-3">
                {payments.slice(0, 5).map((payment, index) => (
                  <motion.li 
                    key={payment.id}
                    className="flex justify-between items-center p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    variants={listItemVariants}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                  >
                    <div>
                      <p className="font-medium text-foreground">Payment ID: {payment.id}</p>
                      <p className="text-xs text-muted-foreground">User: {payment.userId} - Date: {payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${payment.status === 'Succeeded' ? 'text-green-500' : 'text-red-500'}`}>
                        €{payment.amount.toFixed(2)}
                      </p>
                      <p className={`text-xs ${payment.status === 'Succeeded' ? 'text-green-400' : 'text-red-400'}`}>
                        {payment.status}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {isLoading && <p className="text-center text-muted-foreground">Loading payment data...</p>}
    </div>
  );
};

export default PaymentTrackingSection;
