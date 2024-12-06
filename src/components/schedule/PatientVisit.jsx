import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const PatientVisitDialog = ({ isOpen, onClose, onConfirm, appointment, sellables }) => {
  const [visitData, setVisitData] = useState({
    date: format(new Date(appointment.start), 'dd/MM/yyyy'),
    time: format(new Date(appointment.start), 'HH:mm'),
    sellable: appointment.sellable,
    walkIn: false,
    markPenalty: false,
    removeSessionBalance: true,
  });

  const handleConfirm = () => {
    onConfirm(visitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Patient Visit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="visitDate">Visit Date (DD/MM/YYYY)</Label>
            <Input id="visitDate" value={visitData.date} readOnly />
          </div>
          <div>
            <Label htmlFor="visitTime">Visited Time is</Label>
            <Input 
              id="visitTime" 
              value={visitData.time} 
              onChange={(e) => setVisitData({...visitData, time: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="product">Product / Service</Label>
            <Select 
              value={visitData.sellable} 
              onValueChange={(value) => setVisitData({...visitData, sellable: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product/service" />
              </SelectTrigger>
              <SelectContent>
                {sellables.map(sellable => (
                  <SelectItem key={sellable.id} value={sellable.id}>
                    {sellable.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="walkIn" 
              checked={visitData.walkIn}
              onCheckedChange={(checked) => setVisitData({...visitData, walkIn: checked})}
            />
            <Label htmlFor="walkIn">Walk In</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="markPenalty" 
              checked={visitData.markPenalty}
              onCheckedChange={(checked) => setVisitData({...visitData, markPenalty: checked})}
            />
            <Label htmlFor="markPenalty">Mark Penalty</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="removeSessionBalance" 
              checked={visitData.removeSessionBalance}
              onCheckedChange={(checked) => setVisitData({...visitData, removeSessionBalance: checked})}
            />
            <Label htmlFor="removeSessionBalance">Remove Session Balance</Label>
          </div>
          <Button onClick={handleConfirm} className="w-full">Session Completed</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientVisitDialog;