// Product.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Product = () => {
  const [sellables, setSellables] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSellables, setFilteredSellables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(13);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSellable, setNewSellable] = useState({
    name: '',
    type: 's',
    unit: 'h',
    rate: '',
  });
  const navigate = useNavigate();
  const { clinic_id } = useParams();
  const { authenticatedFetch } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            clearInterval(interval);
            return 100;
          }
          const newProgress = oldProgress + Math.random() * 10;
          return Math.min(newProgress, 90);
        });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    fetchSellables();
  }, [clinic_id]);

  useEffect(() => {
    setFilteredSellables(
      sellables.filter(sellable =>
        sellable.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, sellables]);

  const fetchSellables = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/sellable/`);
      if (!response.ok) throw new Error('Failed to fetch sellables');
      const data = await response.json();
      setSellables(data);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sellables. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleAddSellable = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/sellable/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSellable),
      });
      if (!response.ok) throw new Error('Failed to add sellable');
      await fetchSellables();
      toast({
        title: "Success",
        description: "Sellable added successfully.",
      });
      setIsDialogOpen(false); // Close the dialog
      setNewSellable({ name: '', type: 's', unit: 'h', rate: '' }); // Reset the form
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add sellable. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <Progress value={progress} className="w-[60%]" />
        <p className="mt-4 text-sm text-gray-500">Loading sellables... {Math.round(progress)}%</p>
      </div>
    );
  }

  return (
    <Card className="w-full mx-auto mt-8 container p-4 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Product Management</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <Input
            type="text"
            placeholder="Search sellables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>Add New Sellable</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Sellable</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newSellable.name}
                    onChange={(e) => setNewSellable({...newSellable, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={newSellable.type}
                    onValueChange={(value) => setNewSellable({...newSellable, type: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s">Service</SelectItem>
                      <SelectItem value="p">Product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">
                    Unit
                  </Label>
                  <Select
                    value={newSellable.unit}
                    onValueChange={(value) => setNewSellable({...newSellable, unit: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h">Hour</SelectItem>
                      <SelectItem value="d">Day</SelectItem>
                      <SelectItem value="w">Week</SelectItem>
                      <SelectItem value="m">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rate" className="text-right">
                    Rate
                  </Label>
                  <Input
                    id="rate"
                    type="number"
                    value={newSellable.rate}
                    onChange={(e) => setNewSellable({...newSellable, rate: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <Button onClick={handleAddSellable}>Add Sellable</Button>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {sellables.length === 0 ? (
          <div className="text-center py-4">
            <p className="mb-4">No sellables found in this clinic.</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>Add Your First Sellable</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Sellable</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newSellable.name}
                      onChange={(e) => setNewSellable({...newSellable, name: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Type
                    </Label>
                    <Select
                      value={newSellable.type}
                      onValueChange={(value) => setNewSellable({...newSellable, type: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="s">Service</SelectItem>
                        <SelectItem value="p">Product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="unit" className="text-right">
                      Unit
                    </Label>
                    <Select
                      value={newSellable.unit}
                      onValueChange={(value) => setNewSellable({...newSellable, unit: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h">Hour</SelectItem>
                        <SelectItem value="d">Day</SelectItem>
                        <SelectItem value="w">Week</SelectItem>
                        <SelectItem value="m">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rate" className="text-right">
                      Rate
                    </Label>
                    <Input
                      id="rate"
                      type="number"
                      value={newSellable.rate}
                      onChange={(e) => setNewSellable({...newSellable, rate: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <Button onClick={handleAddSellable}>Add Sellable</Button>
              </DialogContent>
            </Dialog>
          </div>
        ) : filteredSellables.length === 0 ? (
          <div className="text-center py-4">
            <p>No sellables match your search.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-center'>Name</TableHead>
                <TableHead className='text-center'>Type</TableHead>
                <TableHead className='text-center'>Unit</TableHead>
                <TableHead className='text-center'>Rate</TableHead>
                <TableHead className='text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSellables.map(sellable => (
                <TableRow key={sellable.id}>
                  <TableCell className=''>{sellable.name}</TableCell>
                  <TableCell className=''>{sellable.type === 's' ? 'Service' : 'Product'}</TableCell>
                  <TableCell className=''>{sellable.unit}</TableCell>
                  <TableCell className=''>{sellable.rate}</TableCell>
                  <TableCell>
                    <Button variant="outline" onClick={() => navigate(`/clinic/${clinic_id}/sellable/${sellable.id}`)}>
                      View/Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default Product;