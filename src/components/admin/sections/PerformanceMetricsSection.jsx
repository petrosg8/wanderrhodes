
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Zap, Smartphone, Gauge, Server } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const PerformanceMetricsSection = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call for metrics
    setTimeout(() => {
      setMetrics({
        pageLoadTime: 1.8, // seconds
        firstContentfulPaint: 1.2, // seconds
        mobileResponsivenessScore: 95, // out of 100
        uptimePercentage: 99.98, // percentage
        apiResponseTime: 150, // ms
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const MetricCard = ({ title, value, unit, icon, progressValue, progressMax, isLoading }) => (
     <Card className="bg-card/80 backdrop-blur-sm hover:shadow-primary/10 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-foreground mb-1">
              {value} <span className="text-xs text-muted-foreground">{unit}</span>
            </div>
            {progressValue !== undefined && progressMax !== undefined && (
              <Progress value={(progressValue / progressMax) * 100} className="h-2 mt-2" />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

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
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Overall Site Health</CardTitle>
          <CardDescription>Key performance indicators for Wander Rhodes.</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={cardVariants} custom={0}>
              <MetricCard 
                title="Avg. Page Load Time" 
                value={metrics?.pageLoadTime} 
                unit="s" 
                icon={<Zap className="h-5 w-5 text-yellow-500" />} 
                progressValue={metrics?.pageLoadTime ? 3 - metrics.pageLoadTime : 0} 
                progressMax={3}
                isLoading={isLoading}
              />
            </motion.div>
            <motion.div variants={cardVariants} custom={1}>
              <MetricCard 
                title="First Contentful Paint (FCP)" 
                value={metrics?.firstContentfulPaint} 
                unit="s" 
                icon={<Gauge className="h-5 w-5 text-green-500" />} 
                progressValue={metrics?.firstContentfulPaint ? 2 - metrics.firstContentfulPaint : 0} 
                progressMax={2}
                isLoading={isLoading}
              />
            </motion.div>
            <motion.div variants={cardVariants} custom={2}>
              <MetricCard 
                title="Mobile Friendliness" 
                value={metrics?.mobileResponsivenessScore} 
                unit="/ 100" 
                icon={<Smartphone className="h-5 w-5 text-blue-500" />} 
                progressValue={metrics?.mobileResponsivenessScore} 
                progressMax={100}
                isLoading={isLoading}
              />
            </motion.div>
            <motion.div variants={cardVariants} custom={3}>
              <MetricCard 
                title="Server Uptime" 
                value={metrics?.uptimePercentage} 
                unit="%" 
                icon={<Server className="h-5 w-5 text-purple-500" />} 
                progressValue={metrics?.uptimePercentage} 
                progressMax={100}
                isLoading={isLoading}
              />
            </motion.div>
             <motion.div variants={cardVariants} custom={4}>
              <MetricCard 
                title="API Response Time" 
                value={metrics?.apiResponseTime} 
                unit="ms" 
                icon={<Zap className="h-5 w-5 text-teal-500" />} 
                progressValue={metrics?.apiResponseTime ? 500 - metrics.apiResponseTime : 0} 
                progressMax={500}
                isLoading={isLoading}
              />
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
       {isLoading && <p className="text-center text-muted-foreground">Loading performance metrics...</p>}
       {!isLoading && (
        <motion.div 
          className="text-sm text-center text-muted-foreground mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Note: These are simulated metrics. Real-time monitoring requires integration with performance tools.
        </motion.div>
      )}
    </div>
  );
};

export default PerformanceMetricsSection;
