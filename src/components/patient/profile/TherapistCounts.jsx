import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const TherapistCountsDialog = ({ isOpen, onClose, appointments }) => {
    const therapistCounts = appointments.reduce((acc, appointment) => {
      const therapistName = appointment.employee.first_name + ' ' + appointment.employee.last_name;
      acc[therapistName] = (acc[therapistName] || 0) + 1;
      return acc;
    }, {});
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Therapist Appointment Counts</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Therapist</TableHead>
                <TableHead>Appointment Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(therapistCounts).map(([therapist, count]) => (
                <TableRow key={therapist}>
                  <TableCell>{therapist}</TableCell>
                  <TableCell>{count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    );
  };

export default TherapistCountsDialog