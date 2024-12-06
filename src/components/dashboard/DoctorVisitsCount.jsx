import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DoctorVisitCounts = ({ data }) => {
  const doctorVisitCounts = data.reduce((acc, visit) => {
    const doctorName = visit.doctor;
    acc[doctorName] = (acc[doctorName] || 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="">View Doctor Visit Counts</Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Doctor Visit Counts</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center ">Doctor</TableHead>
              <TableHead className="text-center ">Visits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(doctorVisitCounts).map(([doctor, count]) => (
              <TableRow key={doctor}>
                <TableCell className="text-center text-[1rem]">{doctor}</TableCell>
                <TableCell className="text-center text-[1rem]">{count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorVisitCounts;