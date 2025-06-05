
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  FileText, 
  DollarSign, 
  BarChart3, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Briefcase,
  Wand2
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { name: 'Content', icon: FileText, path: '/admin/content' },
  { name: 'Users', icon: Users, path: '/admin/users' },
  { name: 'Payments', icon: DollarSign, path: '/admin/payments' },
  { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { name: 'Updates', icon: Wand2, path: '/admin/updates' },
  { name: 'Settings', icon: Settings, path: '/admin/settings' },
];

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const NavLink = ({ item }) => (
    <Link
      to={item.path}
      className={cn(
        'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out',
        location.pathname.startsWith(item.path)
          ? 'bg-primary/20 text-primary hover:bg-primary/30'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
      onClick={() => setSidebarOpen(false)}
    >
      <item.icon className="mr-3 h-5 w-5" />
      {item.name}
    </Link>
  );

  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
  };
  
  const mobileSidebarVariants = {
    open: { x: 0, transition: { type: 'tween', ease: 'easeInOut', duration: 0.3 } },
    closed: { x: '-100%', transition: { type: 'tween', ease: 'easeInOut', duration: 0.3 } },
  };


  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden md:flex md:flex-col w-64 border-r border-border bg-card p-4 space-y-2 fixed top-0 left-0 h-full z-20"
        initial={false}
      >
        <div className="flex items-center justify-center h-16 mb-4">
          <Briefcase className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-semibold">Wander Rhodes</span>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </nav>
        <Button onClick={toggleTheme} variant="ghost" size="icon" className="mt-auto self-center">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed top-0 left-0 h-full w-64 bg-card border-r border-border p-4 space-y-2 z-40 flex flex-col md:hidden"
              variants={mobileSidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="flex items-center justify-between h-16 mb-4">
                <div className="flex items-center">
                  <Briefcase className="h-8 w-8 text-primary" />
                  <span className="ml-2 text-xl font-semibold">Wander Rhodes</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </nav>
               <Button onClick={toggleTheme} variant="ghost" size="icon" className="mt-auto self-center">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b border-border bg-card md:justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Admin User</span>
            {/* Add Avatar here if available */}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
