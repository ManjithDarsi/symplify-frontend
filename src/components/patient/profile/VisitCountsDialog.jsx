import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const VisitCountsDialog = ({ isOpen, onClose, visits = [], employeeDetails }) => {
    const therapistCounts = visits.reduce((acc, visit) => {
      const employee = employeeDetails[visit.employee];
      const therapistName = employee 
        ? `${employee.first_name} ${employee.last_name}`
        : 'Unknown';
      acc[therapistName] = (acc[therapistName] || 0) + 1;
      return acc;
    }, {});
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Therapist Visit Counts</DialogTitle>
          </DialogHeader>
          {Object.keys(therapistCounts).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Therapist</TableHead>
                  <TableHead>Visit Count</TableHead>
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
          ) : (
            <p>No visit data available.</p>
          )}
        </DialogContent>
      </Dialog>
    );
  };

export default VisitCountsDialog;