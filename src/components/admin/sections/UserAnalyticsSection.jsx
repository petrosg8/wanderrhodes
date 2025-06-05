
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Eye, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const UserAnalyticsSection = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalyticsData({
        totalUsers: 1258,
        activeUsers: 873,
        newUsersToday: 45,
        avgSessionDuration: '12m 34s',
        pageViews: 10250,
        bounceRate: '35%',
        topSources: [
          { source: 'Direct', percentage: 40 },
          { source: 'Google', percentage: 30 },
          { source: 'Social Media', percentage: 20 },
          { source: 'Referral', percentage: 10 },
        ],
        mostVisitedPages: [
          { page: '/locations/monolithos-castle', views: 1200 },
          { page: '/locations/kritinia-viewpoint', views: 950 },
          { page: '/pricing', views: 800 },
        ]
      });
      setIsLoading(false);
    }, 1500);
  }, []);

  const StatCard = ({ title, value, icon, unit,isLoading }) => (
    <Card className="bg-card/80 backdrop-blur-sm hover:shadow-primary/10 hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
          <div className="text-2xl font-bold text-foreground">
            {value} {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
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
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={cardVariants} custom={0}><StatCard title="Total Users" value={analyticsData?.totalUsers} icon={<Users className="h-5 w-5 text-primary" />} isLoading={isLoading} /></motion.div>
        <motion.div variants={cardVariants} custom={1}><StatCard title="Active Users (Last 7 Days)" value={analyticsData?.activeUsers} icon={<TrendingUp className="h-5 w-5 text-green-500" />} isLoading={isLoading}/></motion.div>
        <motion.div variants={cardVariants} custom={2}><StatCard title="Page Views (Last 7 Days)" value={analyticsData?.pageViews?.toLocaleString()} icon={<Eye className="h-5 w-5 text-blue-500" />} isLoading={isLoading}/></motion.div>
        <motion.div variants={cardVariants} custom={3}><StatCard title="Avg. Session Duration" value={analyticsData?.avgSessionDuration} icon={<Clock className="h-5 w-5 text-yellow-500" />} isLoading={isLoading}/></motion.div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={cardVariants} custom={4} initial="hidden" animate="visible">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : (
                analyticsData?.topSources.map((source, index) => (
                  <div key={index} className="flex justify-between items-center mb-2 text-sm">
                    <span>{source.source}</span>
                    <div className="flex items-center">
                      <div className="w-32 h-2 bg-muted rounded-full mr-2">
                        <motion.div 
                          className="h-2 bg-gradient-to-r from-secondary to-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${source.percentage}%`}}
                          transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                        />
                      </div>
                      <span className="text-foreground">{source.percentage}%</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={cardVariants} custom={5} initial="hidden" animate="visible">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Most Visited Locations</CardTitle>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : (
                <ul className="space-y-2">
                  {analyticsData?.mostVisitedPages.map((page, index) => (
                    <li key={index} className="flex justify-between text-sm text-muted-foreground">
                      <span className="truncate max-w-[70%]">{page.page}</span>
                      <span className="font-medium text-foreground">{page.views.toLocaleString()} views</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      {isLoading && <p className="text-center text-muted-foreground">Loading analytics data...</p>}
    </div>
  );
};

export default UserAnalyticsSection;
