
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, PlusCircle, Edit2, Trash2, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const initialUpdates = [
  { id: 'update_1', version: '1.0.1', date: '2025-05-10', description: 'Fixed minor UI bugs and improved performance on location pages.', type: 'Bug Fix' },
  { id: 'update_2', version: '1.1.0', date: '2025-05-01', description: 'Added 5 new hidden gems in Rhodes Old Town. Enhanced map interactions.', type: 'Feature Update' },
  { id: 'update_3', version: '1.0.0', date: '2025-04-20', description: 'Initial launch of Wander Rhodes Admin Dashboard.', type: 'Major Release' },
];

const SiteUpdatesSection = () => {
  const { toast } = useToast();
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUpdate, setCurrentUpdate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState(null);

  useEffect(() => {
    const storedUpdates = localStorage.getItem('rhodesSiteUpdates');
    if (storedUpdates) {
      setUpdates(JSON.parse(storedUpdates));
    } else {
      setUpdates(initialUpdates);
      localStorage.setItem('rhodesSiteUpdates', JSON.stringify(initialUpdates));
    }
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  useEffect(() => {
     if(!isLoading) {
      localStorage.setItem('rhodesSiteUpdates', JSON.stringify(updates));
    }
  }, [updates, isLoading]);

  const openDialog = (update = null) => {
    setCurrentUpdate(update ? { ...update } : { id: '', version: '', date: new Date().toISOString().split('T')[0], description: '', type: 'Minor Update' });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentUpdate(null);
  };

  const handleSaveUpdate = () => {
    if (!currentUpdate.version || !currentUpdate.description || !currentUpdate.date || !currentUpdate.type) {
      toast({
        title: "Validation Error",
        description: "All fields are required for an update.",
        variant: "destructive",
      });
      return;
    }

    if (currentUpdate.id) {
      setUpdates(updates.map(upd => upd.id === currentUpdate.id ? currentUpdate : upd));
      toast({ title: "Update Log Modified", description: `Version ${currentUpdate.version} details updated.`, variant: "default" });
    } else {
      const newUpdate = { ...currentUpdate, id: `update_${Date.now()}` };
      setUpdates([newUpdate, ...updates]); // Add to the beginning
      toast({ title: "Update Logged", description: `Version ${newUpdate.version} has been logged.`, variant: "default" });
    }
    closeDialog();
  };

  const confirmDelete = (updateId) => {
    setUpdateToDelete(updateId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteUpdate = () => {
    if (updateToDelete) {
      const updateInfo = updates.find(upd => upd.id === updateToDelete);
      setUpdates(updates.filter(upd => upd.id !== updateToDelete));
      toast({ title: "Update Log Removed", description: `Log for version ${updateInfo?.version} removed.`, variant: "destructive" });
      setIsConfirmDeleteDialogOpen(false);
      setUpdateToDelete(null);
    }
  };
  
  const UpdateForm = () => (
     <div className="space-y-4">
      <div>
        <Label htmlFor="version">Version (e.g., 1.2.3)</Label>
        <Input id="version" value={currentUpdate?.version || ''} onChange={(e) => setCurrentUpdate({...currentUpdate, version: e.target.value})} placeholder="1.0.0" />
      </div>
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={currentUpdate?.date || ''} onChange={(e) => setCurrentUpdate({...currentUpdate, date: e.target.value})} />
      </div>
      <div>
        <Label htmlFor="type">Update Type</Label>
         <select id="type" value={currentUpdate?.type || 'Minor Update'} onChange={(e) => setCurrentUpdate({...currentUpdate, type: e.target.value})} className="w-full p-2 border rounded-md bg-input text-foreground">
            <option value="Major Release">Major Release</option>
            <option value="Feature Update">Feature Update</option>
            <option value="Bug Fix">Bug Fix</option>
            <option value="Performance Improvement">Performance Improvement</option>
            <option value="Security Update">Security Update</option>
            <option value="Minor Update">Minor Update</option>
          </select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input as="textarea" rows={3} id="description" value={currentUpdate?.description || ''} onChange={(e) => setCurrentUpdate({...currentUpdate, description: e.target.value})} placeholder="Details of the update..." />
      </div>
    </div>
  );

  const listItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut",
      },
    }),
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-full mb-4" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Manage and log site updates, new features, and bug fixes.</p>
        <Button onClick={() => openDialog()} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity animate-button-glow">
          <PlusCircle className="mr-2 h-5 w-5" /> Log New Update
        </Button>
      </div>
      
      <div className="p-4 border border-blue-500/50 bg-blue-500/10 rounded-lg text-blue-300">
        <div className="flex items-center">
          <Info className="h-5 w-5 mr-2 text-blue-400" />
          <h3 className="font-semibold">Deployment Process</h3>
        </div>
        <p className="text-sm mt-1">
          Logging updates here helps track changes. To deploy these changes to your live site, use the "Publish" button at the top-right of the screen.
        </p>
      </div>

      {updates.length > 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Update Log</CardTitle>
            <CardDescription>History of all site updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {updates.map((update, index) => (
                <motion.li 
                  key={update.id}
                  layout
                  variants={listItemVariants}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="p-4 rounded-lg bg-muted/50 border border-border/50 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg text-primary">{update.version} - <span className="text-sm font-normal text-foreground">{update.type}</span></h4>
                      <p className="text-xs text-muted-foreground">Logged on: {new Date(update.date).toLocaleDateString()}</p>
                      <p className="mt-2 text-sm text-foreground">{update.description}</p>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0 ml-4">
                      <Button variant="outline" size="icon" onClick={() => openDialog(update)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => confirmDelete(update.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.li>
              ))}
              </AnimatePresence>
            </ul>
          </CardContent>
        </Card>
      ) : (
         <motion.p 
            className="text-center text-muted-foreground py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No updates logged yet. Click "Log New Update" to start.
          </motion.p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>{currentUpdate?.id ? 'Edit Update Log' : 'Log New Site Update'}</DialogTitle>
            <DialogDescription>
             {currentUpdate?.id ? 'Modify the details of this update log.' : 'Provide details for the new site update.'}
            </DialogDescription>
          </DialogHeader>
          <UpdateForm />
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button></DialogClose>
            <Button type="button" onClick={handleSaveUpdate} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity">
              {currentUpdate?.id ? 'Save Changes' : 'Log Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center"><AlertTriangle className="text-destructive mr-2 h-5 w-5" />Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this update log? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsConfirmDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUpdate}>Delete Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default SiteUpdatesSection;
