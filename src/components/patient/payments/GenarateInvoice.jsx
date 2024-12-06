import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Loader2, ExternalLink, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

// Invoice Dialog
const InvoiceDialog = ({ isOpen, onClose, onGenerate, invoiceItems, setInvoiceItems, finalAmount, setFinalAmount, sellables, isLoading }) => {
  const [selectedSellable, setSelectedSellable] = useState('');

  const handleAddInvoiceItem = () => {
    const sellable = sellables.find(s => s.id === selectedSellable);
    if (sellable) {
      const newItem = {
        sellable: sellable.id,
        name: sellable.name,
        quantity: 1,
        rate: parseFloat(sellable.rate),
        gross: parseFloat(sellable.rate),
        discount: 0,
        net: parseFloat(sellable.rate),
        tax: 0,
        add_balance: true
      };
      setInvoiceItems([...invoiceItems, newItem]);
      calculateFinalAmount([...invoiceItems, newItem]);
    }
  };


  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value;
    
    // Recalculate gross and net
    const item = updatedItems[index];
    item.gross = item.quantity * item.rate;
    item.net = item.gross - item.discount;
  
    setInvoiceItems(updatedItems);
    calculateFinalAmount(updatedItems);
  };

  const calculateFinalAmount = (items) => {
    const total = items.reduce((sum, item) => sum + item.net, 0);
    setFinalAmount(total);
  };

  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="gap-4">
            <Label htmlFor="sellable" className="text-right">
              Product/Service
            </Label>
            <Select 
              onValueChange={setSelectedSellable} 
              value={selectedSellable}
              className="col-span-3"
            >
              <SelectTrigger id="sellable">
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
          <Button onClick={handleAddInvoiceItem}>+ Add Item</Button>
          <div className="border p-2">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Product/Service</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Gross</th>
                  <th>Discount</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">No items added</td>
                  </tr>
                ) : (
                  invoiceItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          className="w-16"
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                          className="w-24"
                        />
                      </td>
                      <td>{item.gross}</td>
                      <td>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value))}
                          className="w-24"
                        />
                      </td>
                      <td>{item.net}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="finalAmount" className="text-right">
              Final Amount
            </Label>
            <Input 
              id="finalAmount" 
              value={finalAmount} 
              readOnly
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Invoice'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Invoice Status Dialog
const InvoiceStatusDialog = ({ isOpen, onClose, onUpdateStatus, isLoading }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Invoice Status</DialogTitle>
        </DialogHeader>
        <div className="flex flex-row gap-4 justify-between">
          <Button onClick={() => onUpdateStatus('d')} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save as Draft'}
          </Button>
          <Button onClick={() => onUpdateStatus('c')} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Invoice'}
          </Button>
          <Button variant="destructive" onClick={() => onUpdateStatus('x')} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Invoice'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Invoice Details Dialog
const InvoiceDetailsDialog = ({ invoice, fetchName, isOpen, onClose, onUpdateStatus, isLoading, clinicid, patientid }) => {
  const handleViewInvoiceHtml = () => {
    if (invoice && invoice.html) {
      window.open(invoice.html, '_blank');
    }
  };
  console.log(invoice)


  const handleDownloadInvoicePdf = () => {
    if (invoice && invoice.pdf) {
      window.open(invoice.pdf, '_blank');
    }
  };

  const navigate = useNavigate();

  const handlePatientClick = () => {
    navigate(`/clinic/${clinicid}/patients/${patientid}`); 
    onClose(); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>
        {invoice && (
          <div className="space-y-4">
            <p><strong>Invoice Number:</strong> {invoice.number}</p>
            <p><strong>Patient Name:</strong> <span onClick={handlePatientClick} className="text-blue-600 hover:underline cursor-pointer">{fetchName.first_name} {fetchName.last_name}</span></p>
            <p><strong>Date:</strong> {format(new Date(invoice.date), 'EEEE dd MMMM yyyy')}</p>
            <p><strong>Status:</strong> {invoice.status === 'd' ? 'Draft' : invoice.status === 'c' ? 'Confirmed' : 'Cancelled'}</p>
            <p><strong>Gross Amount:</strong> {invoice.gross_amount}</p>
            <p><strong>Final Amount:</strong> {invoice.final_amount}</p>
            
            <div className="flex space-x-2">
              <Button onClick={handleViewInvoiceHtml} disabled={!invoice.html}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Invoice
              </Button>
              {invoice.status === 'c' && (
                <div className="flex space-x-2">
                  <Button variant="destructive" onClick={() => onUpdateStatus('x')} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Invoice'
                    )}
                  </Button>
                </div>
              )}
              {/* <Button onClick={handleDownloadInvoicePdf} disabled={!invoice.pdf}>
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </Button> */}
            </div>

            <h3 className="font-semibold">Items:</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.rate}</TableCell>
                    <TableCell>{item.gross}</TableCell>
                    <TableCell>{item.net}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {invoice.status === 'd' && (
              <div className="flex space-x-2">
                <Button onClick={() => onUpdateStatus('c')} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    'Confirm Invoice'
                  )}
                </Button>
                <Button variant="destructive" onClick={() => onUpdateStatus('x')} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Invoice'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { InvoiceDialog, InvoiceStatusDialog, InvoiceDetailsDialog };