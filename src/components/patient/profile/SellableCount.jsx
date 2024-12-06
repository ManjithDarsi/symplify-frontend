import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SellableCountsDialog = ({ isOpen, onClose, appointments, sellableDetails }) => {
  //sellable counts
  const sellableCounts = {};

  appointments.forEach((appointment) => {
    const sellableId = appointment.sellable;
    if (sellableId) {
      if (!sellableCounts[sellableId]) {
        sellableCounts[sellableId] = 0;
      }
      sellableCounts[sellableId] += 1;
    }
  });

  const sellableCountsArray = Object.keys(sellableCounts).map((sellableId) => ({
    sellableId,
    count: sellableCounts[sellableId],
    name: sellableDetails[sellableId] ? sellableDetails[sellableId].name : 'Unknown',
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sellable Appointment Counts</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sellable</TableHead>
              <TableHead>Appointment Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellableCountsArray.map((item) => (
              <TableRow key={item.sellableId}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default SellableCountsDialog;
