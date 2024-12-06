// UpdateProduct.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const UpdateProduct = () => {
  const [sellable, setSellable] = useState(null);
  const navigate = useNavigate();
  const { clinic_id, sellable_id } = useParams();
  const { authenticatedFetch } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSellable();
  }, [clinic_id, sellable_id]);

  const fetchSellable = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/sellable/${sellable_id}/`);
      if (!response.ok) throw new Error('Failed to fetch sellable');
      const data = await response.json();
      setSellable(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sellable. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/sellable/${sellable_id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sellable),
      });
      if (!response.ok) throw new Error('Failed to update sellable');
      toast({
        title: "Success",
        description: "Sellable updated successfully.",
      });
      navigate(`/clinic/${clinic_id}/sellable`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update sellable. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!sellable) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 p-4 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Update Sellable</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={sellable.name}
              onChange={(e) => setSellable({...sellable, name: e.target.value})}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select
              value={sellable.type}
              onValueChange={(value) => setSellable({...sellable, type: value})}
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
              value={sellable.unit}
              onValueChange={(value) => setSellable({...sellable, unit: value})}
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
              value={sellable.rate}
              onChange={(e) => setSellable({...sellable, rate: e.target.value})}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleUpdate}>Update Sellable</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpdateProduct;