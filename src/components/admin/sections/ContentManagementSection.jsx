
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Edit2, Trash2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const initialLocations = [
  { id: '1', name: 'Monolithos Castle Ruins', category: 'Historical Site', status: 'Published', freeAccess: true, imageUrl: '/placeholder-castle.jpg' },
  { id: '2', name: 'Kritinia Castle Viewpoint', category: 'Scenic Route', status: 'Published', freeAccess: true, imageUrl: '/placeholder-viewpoint.jpg' },
  { id: '3', name: 'Seven Springs Waterfall', category: 'Natural Spot', status: 'Draft', freeAccess: false, imageUrl: '/placeholder-waterfall.jpg' },
  { id: '4', name: 'Old Kamiros Ancient City', category: 'Historical Site', status: 'Published', freeAccess: false, imageUrl: '/placeholder-ancient.jpg' },
  { id: '5', name: 'Hidden Gem Taverna', category: 'Dining', status: 'Published', freeAccess: false, imageUrl: '/placeholder-taverna.jpg' },
];

const ContentManagementSection = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const storedLocations = localStorage.getItem('rhodesLocations');
    if (storedLocations) {
      setLocations(JSON.parse(storedLocations));
    } else {
      setLocations(initialLocations);
      localStorage.setItem('rhodesLocations', JSON.stringify(initialLocations));
    }
    setTimeout(() => setIsLoading(false), 1000); 
  }, []);

  useEffect(() => {
    if(!isLoading) { // Avoid saving initial empty array during loading
      localStorage.setItem('rhodesLocations', JSON.stringify(locations));
    }
  }, [locations, isLoading]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDialog = (location = null) => {
    setCurrentLocation(location ? { ...location } : { id: '', name: '', category: '', status: 'Draft', freeAccess: false, imageUrl: '', description: '' });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentLocation(null);
  };

  const handleSaveLocation = () => {
    if (!currentLocation.name || !currentLocation.category) {
      toast({
        title: "Validation Error",
        description: "Name and category are required.",
        variant: "destructive",
      });
      return;
    }

    if (currentLocation.id) {
      setLocations(locations.map(loc => loc.id === currentLocation.id ? currentLocation : loc));
      toast({ title: "Location Updated", description: `${currentLocation.name} has been updated.`, variant: "default" });
    } else {
      const newLocation = { ...currentLocation, id: String(Date.now()) };
      setLocations([...locations, newLocation]);
      toast({ title: "Location Added", description: `${newLocation.name} has been added.`, variant: "default" });
    }
    closeDialog();
  };

  const handleDeleteLocation = (id) => {
    const locationToDelete = locations.find(loc => loc.id === id);
    setLocations(locations.filter(loc => loc.id !== id));
    toast({ title: "Location Deleted", description: `${locationToDelete?.name} has been deleted.`, variant: "destructive" });
  };
  
  const LocationForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={currentLocation?.name || ''} onChange={(e) => setCurrentLocation({...currentLocation, name: e.target.value})} placeholder="E.g., Hidden Beach Cove" />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" value={currentLocation?.category || ''} onChange={(e) => setCurrentLocation({...currentLocation, category: e.target.value})} placeholder="E.g., Beach, Historical Site" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" value={currentLocation?.description || ''} onChange={(e) => setCurrentLocation({...currentLocation, description: e.target.value})} placeholder="A short description of the place..." />
      </div>
      <div>
        <Label htmlFor="imageUrl">Image URL (Optional)</Label>
        <Input id="imageUrl" value={currentLocation?.imageUrl || ''} onChange={(e) => setCurrentLocation({...currentLocation, imageUrl: e.target.value})} placeholder="https://example.com/image.jpg" />
      </div>
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="freeAccess" checked={currentLocation?.freeAccess || false} onChange={(e) => setCurrentLocation({...currentLocation, freeAccess: e.target.checked})} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"/>
        <Label htmlFor="freeAccess">Free Access (visible before payment)</Label>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
         <select id="status" value={currentLocation?.status || 'Draft'} onChange={(e) => setCurrentLocation({...currentLocation, status: e.target.value})} className="w-full p-2 border rounded-md bg-input text-foreground">
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </select>
      </div>
    </div>
  );


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-auto">
          <Input
            type="search"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 w-full sm:w-64 md:w-80 bg-background"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <Button onClick={() => openDialog()} className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity animate-button-glow">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Location
        </Button>
      </div>

      <AnimatePresence>
        {filteredLocations.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredLocations.map((location) => (
              <motion.div
                key={location.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden h-full flex flex-col bg-card hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300">
                  {location.imageUrl && (
                    <div className="relative w-full h-48">
                     <img  src={location.imageUrl} alt={location.name} className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1675023112817-52b789fd2ef0" />
                      <div className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full text-white ${location.status === 'Published' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        {location.status}
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{location.name}</CardTitle>
                    <CardDescription>{location.category} {location.freeAccess && <span className="text-xs text-green-400">(Free)</span>}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground truncate">{location.description || "No description available."}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => openDialog(location)}>
                      <Edit2 className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteLocation(location.id)}>
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.p 
            className="text-center text-muted-foreground py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            No locations found. Try a different search or add a new location.
          </motion.p>
        )}
      </AnimatePresence>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>{currentLocation?.id ? 'Edit Location' : 'Add New Location'}</DialogTitle>
            <DialogDescription>
              {currentLocation?.id ? 'Update the details of this location.' : 'Enter the details for the new location.'}
            </DialogDescription>
          </DialogHeader>
          <LocationForm />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveLocation} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity">
              {currentLocation?.id ? 'Save Changes' : 'Add Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagementSection;
