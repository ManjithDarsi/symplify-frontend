// dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, ArrowUpDown, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DataTable } from "@/components/ui/data-table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import employee from "../../assets/employee.svg";
import patient from "../../assets/patient.svg";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DoctorVisitCounts from './DoctorVisitsCount';
import { PlusCircle, Check, FileDownIcon } from "lucide-react";
import ExcelJS from 'exceljs';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { addDays, isBefore, isAfter } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { Clock, XCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import ExcelToApiUploader from '../ExcelUpload';


const Dashboard = () => {
  const { clinic_id } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState({
    visits: 0,
    upcomingAppointments: 0,
    canceledBookings: 0,
    receivedAppointments: 0,
  });
  const [visits, setVisits] = useState([]);
  const [dateRange, setDateRange] = useState('today');
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [sellableDetails, setSellableDetails] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [showVisitsTable, setShowVisitsTable] = useState(false);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [customDateRange, setCustomDateRange] = useState({ from: new Date(), to: new Date() });
  const { toast } = useToast();
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [upcomingAppointmentsLoading, setUpcomingAppointmentsLoading] = useState(true);
  const [receivedAppointmentsLoading, setReceivedAppointmentsLoading] = useState(true);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [rawLedgerTransactions, setRawLedgerTransactions] = useState([]);


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
      }, 50);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const fetchWithTokenHandling = async (url, options = {}) => {
    try {
      const response = await authenticatedFetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'An error occurred');
      }
      return response.json();
    } catch (error) {
      if (error.message === 'Token is blacklisted' || error.message === 'Token is invalid or expired') {
        navigate('/login');
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
  
    switch (dateRange) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { start: todayStart, end: todayEnd };
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        return { start: yesterdayStart, end: yesterdayEnd };
      case 'thisWeek':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'thisYear':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { 
          start: customDateRange.from ? new Date(customDateRange.from.setHours(0, 0, 0, 0)) : new Date(now.setHours(0, 0, 0, 0)), 
          end: customDateRange.to ? new Date(customDateRange.to.setHours(23, 59, 59, 999)) : new Date(now.setHours(23, 59, 59, 999)) 
        };
      default:
        return { start: todayStart, end: todayEnd };
    }
  };

  const fetchEmployeeDetails = async (employeeId) => {
    if (employeeDetails[employeeId]) return;

    try {
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/employee/${employeeId}/`);
      setEmployeeDetails(prev => ({ ...prev, [employeeId]: response }));
      if (response.is_therapist) {
        setDoctors(prev => [...prev, response]);
      }
    } catch (error) {
      console.error('Failed to fetch employee details:', error);
    }
  };

  const fetchSellableDetails = async (sellableId) => {
    if (sellableDetails[sellableId]) return;

    try {
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/sellable/${sellableId}/`);
      setSellableDetails(prev => ({ ...prev, [sellableId]: response }));
    } catch (error) {
      console.error('Failed to fetch sellable details:', error);
    }
  };


  const fetchVisits = async () => {
    try {
      setVisitsLoading(true);
      const { start, end } = getDateRange();
  
      if (!start || !end) {
        throw new Error('Invalid date range');
      }
  
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/visit/?date_from=${addDays(start, 1).toISOString().split('T')[0]}&date_to=${addDays(end, 0).toISOString().split('T')[0]}`);
      setVisits(response);
      setSummary(prevSummary => ({ ...prevSummary, visits: response.length }));
      
      const uniqueEmployeeIds = [...new Set(response.map(visit => visit.employee))];
      await Promise.all(uniqueEmployeeIds.map(fetchEmployeeDetails));
      
      const uniqueSellableIds = [...new Set(response.map(visit => visit.sellable))];
      await Promise.all(uniqueSellableIds.map(fetchSellableDetails));
    } catch (error) {
      console.error('Failed to fetch visits:', error);
      toast({
        title: "Error",
        description: "Failed to fetch visits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVisitsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setUpcomingAppointmentsLoading(true);
      setReceivedAppointmentsLoading(true);
      setLoading(true);
      
      const today = new Date();
      const { start, end } = getDateRange();

      // Function to format date for API
      const formatDateForAPI = (date) => {
        return date.toISOString()
          .replace(/\.\d{3}Z$/, '')
      };;

      const timeFrom = formatDateForAPI(start);
      const timeTo = formatDateForAPI(end);

      const url = new URL(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/booking/`);
      url.searchParams.append('time_from', timeFrom);
      url.searchParams.append('time_to', timeTo);
      url.searchParams.append('employee_uuid', 'all');
  
      const response = await authenticatedFetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();

      // Use a Map to store unique bookings by ID
      const bookingsMap = new Map(data.map(booking => [booking.id, booking]));

      const uniqueEmployeeIds = [...new Set(data.map(app => app.employee.id))];
      await Promise.all(uniqueEmployeeIds.map(fetchEmployeeDetails));

      // Fetch patient bookings
      // for (const patient of patients) {
      //   const patResponse = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient.id}/booking/?time_from=${formatDateForAPI(start)}&time_to=${formatDateForAPI(end)}`);
      //   if (!patResponse.ok) throw new Error('Failed to fetch patient bookings');
      //   const patientBookings = await patResponse.json();
      //   patientBookings.forEach(booking => {
      //     if (!bookingsMap.has(booking.id)) {
      //       bookingsMap.set(booking.id, booking);
      //     }
      //   });
      // }

      // Convert Map back to array
      const finalData = Array.from(bookingsMap.values());

      const formattedAppointments = finalData.map(booking => ({
        id: booking.id,
        patientName: `${booking.patient.first_name} ${booking.patient.last_name}`,
        doctorName: `${booking.employee.first_name} ${booking.employee.last_name === null ? "" : booking.employee.last_name}`,
        start: new Date(booking.start),
        end: new Date(booking.end),
        patientId: booking.patient.id,
        doctorId: booking.employee.id,
        service: booking.sellable,
        status_patient: booking.status_patient,
        status_employee: booking.status_employee,
        recurrence: booking.recurrence
      }));

      setAppointments(formattedAppointments);
      updateFilteredAppointments(formattedAppointments, selectedDoctor);
      setSummary(prevSummary => ({
        ...prevSummary,
        upcomingAppointments: formattedAppointments.filter(app => 
          (app.status_patient !== 'X' && app.status_employee !== 'X') && 
          new Date(app.start) > new Date()
        ).length,
        canceledBookings: formattedAppointments.filter(app => app.status_patient === 'X' || app.status_employee === 'X').length,
        receivedAppointments: formattedAppointments.filter(app => app.status_patient === 'P' && app.status_employee === 'P').length,
      }));
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUpcomingAppointmentsLoading(false);
      setReceivedAppointmentsLoading(false);
    }
  };

  const fetchLedgerTransactions = async () => {
    setLedgerLoading(true);
    try {
      const { start, end } = getDateRange();
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/all/ledger/?date_from=${format(start, 'yyyy-MM-dd')}&date_to=${format(end, 'yyyy-MM-dd')}`);
      setRawLedgerTransactions(response);
    } catch (error) {
      console.error('Failed to fetch ledger transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ledger transactions. Please try again.",
        variant: "destructive",
      });

    } finally {
      setLedgerLoading(false);
    }
  };

  const processLedgerTransactions = () => {
    const processedTransactions = rawLedgerTransactions.map(transaction => {
      const patient = patients.find(p => p.id === transaction.patient);
      const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown';
      return {
        ...transaction,
        amount_credit: isNaN(parseFloat(transaction.amount_credit)) ? 0 : parseFloat(transaction.amount_credit),
        amount_debit: isNaN(parseFloat(transaction.amount_debit)) ? 0 : parseFloat(transaction.amount_debit),
        patientName,
        transactionType: transaction.transaction === 'i' ? 'Invoice' : 'Payment',
        searchableContent: `${transaction.transaction === 'i' ? 'Invoice' : 'Payment'}: ${patientName}`,
      };
    });
    setLedgerTransactions(processedTransactions);
  };

  useEffect(() => {
    if (patients.length > 0 && rawLedgerTransactions.length > 0) {
      processLedgerTransactions();
    }
  }, [patients, rawLedgerTransactions]);


  const fetchInvoiceDetails = async (patientId, invoiceId) => {
    setInvoiceLoading(true);
    try {
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patientId}/invoice/${invoiceId}/`);
      setSelectedInvoice(response);
    } catch (error) {
      console.error('Failed to fetch invoice details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoice details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerTransactions();
  }, [dateRange, customDateRange]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/`);
        if (!response.ok) throw new Error('Failed to fetch patients');
        const data = await response.json();
        setPatients(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch patients. Please try again.",
          variant: "destructive",
        });
      }
    };
  
    fetchPatients();
  }, [clinic_id]);

  const updateFilteredAppointments = (appointments, doctorId) => {
    const now = new Date();
    const endOfToday = endOfDay(now);
    const filtered = appointments
      .filter(app => 
        (!doctorId || app.doctorId === doctorId) &&
        new Date(app.start) > now &&
        new Date(app.start) <= endOfToday
      )
      .sort((a, b) => new Date(a.start) - new Date(b.start));
    setFilteredAppointments(filtered);
  };

  useEffect(() => {
    updateFilteredAppointments(appointments, selectedDoctor);
  }, [selectedDoctor, appointments]);

  const refreshAppointments = async () => {
    setLoading(true);
    await fetchAppointments();
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setVisitsLoading(true);
      await Promise.all([fetchVisits(), fetchAppointments()]);
      setProgress(100);
      setLoading(false);
      setVisitsLoading(false);
      setIsVisible(true);
    };
  
    fetchData();
  }, [dateRange, selectedDoctor, customDateRange]);

  const VisitsDataTable = ({ data, appointments }) => {
    const columns = [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => format(parseISO(row.getValue("date")), 'EEEE dd MMMM yyyy'),
      },
      {
        accessorKey: "time",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Time
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => row.getValue("patientName"),
      },
      {
        accessorKey: "doctor",
        header: "Doctor",
        cell: ({ row }) => row.getValue("doctor"),
      },
      {
        accessorKey: "service",
        header: "Service",
        cell: ({ row }) => row.getValue("service"),
      },
      {
        accessorKey: "duration",
        header: "Duration",
        cell: ({ row }) => `${row.getValue("duration")} minutes`,
      },
      {
        accessorKey: "walk_in",
        header: "Walk-in",
        cell: ({ row }) => row.getValue("walk_in") ? "Yes" : "No",
      },
      {
        accessorKey: "penalty",
        header: "Penalty",
        cell: ({ row }) => row.getValue("penalty") ? "Yes" : "No",
      },
    ];
  
    const processedData = data.map(visit => {
      const patientName = visit.patient.first_name + " " + visit.patient.last_name;
      
      return {
        ...visit,
        patientName: patientName,
        doctor: employeeDetails[visit.employee] 
          ? `${employeeDetails[visit.employee].first_name} ${employeeDetails[visit.employee].last_name}`
          : 'Loading...',
        service: sellableDetails[visit.sellable]
          ? sellableDetails[visit.sellable].name
          : 'N/A',
      };
    });
  
    const doctorVisitCounts = processedData.reduce((acc, visit) => {
      const doctorName = visit.doctor;
      acc[doctorName] = (acc[doctorName] || 0) + 1;
      return acc;
    }, {});
  
    return (
      <>
        <div className="space-y-4">
          <div className="flex justify-end gap-4">
            <DoctorVisitCounts data={processedData} />
            <div className="flex justify-end mb-4">
              <Button onClick={exportVisitsToExcel}>
              <FileDownIcon className="h-4 w-4 mr-2" /> Export as Excel
              </Button>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={processedData}
            searchableColumns={[
              {
                id: "doctor",
                title: "Doctor",
              },
              {
                id: "patientName",
                title: "Patient",
              },
            ]}
            rowsPerPage={7}
          />
        </div>
      </>
    );
  };

  const LedgerTable = ({ data }) => {
    const columns = [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => format(parseISO(row.getValue("date")), 'dd/MM/yyyy'),
      },
      {
        accessorKey: "searchableContent",
        header: "Transaction",
        cell: ({ row }) => {
          if (row.original.transactionType === 'Invoice') {
            return (
              <Button
                variant="link"
                onClick={() => fetchInvoiceDetails(row.original.patient, row.original.invoice)}
              >
                {row.getValue("searchableContent")}
              </Button>
            );
          } else {
            return <span>{row.getValue("searchableContent")}</span>;
          }
        },
      },
      {
        accessorKey: "amount_credit",
        header: "Amount Paid",
        cell: ({ row }) => (
          <Badge variant={row.getValue("amount_credit") > 0 ? "success" : "default"}>
            {row.getValue("amount_credit").toFixed(2)}
          </Badge>
        ),
      },
      {
        accessorKey: "amount_debit",
        header: "Invoiced Amount",
        cell: ({ row }) => (
          <Badge variant={row.getValue("amount_debit") > 0 ? "destructive" : "default"}>
            {row.getValue("amount_debit").toFixed(2)}
          </Badge>
        ),
      },
    ];

    return (
      <>
        <div className="space-y-4">

          <div className="flex justify-end mb-4">
            <Button onClick={() => exportLedgerTransactionsToExcel(ledgerTransactions, 'patient_ledger_transactions')}>
              <FileDownIcon className="h-4 w-4 mr-2" /> Export as Excel
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={data}
            searchableColumns={[
              {
                id: "searchableContent",
                title: "Transaction",
              },
            ]}
            rowsPerPage={5}
          />
          <InvoiceDialog invoice={selectedInvoice} loading={invoiceLoading} />
        </div>
      </>
  );
};

  const InvoiceDialog = ({ invoice, loading }) => {
    if (!invoice && !loading) return null;
    const handleViewInvoiceHtml = () => {
      if (invoice && invoice.html) {
        window.open(invoice.html, '_blank');
      }
    };

    return (
      <Dialog open={!!invoice || loading} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : invoice ? (
            <div className='space-y-4'>
              <p><strong>Invoice Number:</strong> {invoice.number}</p>
              <p><strong>Date:</strong> {format(new Date(invoice.date), 'EEEE dd MMMM yyyy')}</p>
              <p><strong>Status:</strong> {invoice.status === 'd' ? 'Draft' : invoice.status === 'c' ? 'Confirmed' : 'Cancelled'}</p>
              <p><strong>Gross Amount:</strong> {invoice.gross_amount}</p>
              <p><strong>Final Amount:</strong> {invoice.final_amount}</p>
              <div className="flex space-x-2">
              <Button onClick={handleViewInvoiceHtml} disabled={!invoice.html}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Invoice
              </Button>
              {/* <Button onClick={handleDownloadInvoicePdf} disabled={!invoice.pdf}>
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </Button> */}
            </div>
              <h3 className="mt-4 font-bold">Items:</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{parseFloat(item.rate).toFixed(2)}</TableCell>
                      <TableCell>{parseFloat(item.net).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  };

// Generic export to Excel function
const exportToExcel = async (data, filename, columns) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // Add headers
  worksheet.columns = columns.map(col => ({ header: col.header, key: col.key, width: 15 }));

  // Add data
  data.forEach(row => {
    const rowData = {};
    columns.forEach(col => {
      if (col.format) {
        rowData[col.key] = col.format(row[col.key]);
      } else {
        rowData[col.key] = row[col.key];
      }
    });
    worksheet.addRow(rowData);
  });

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  link.click();
};

// Export visits to Excel
const exportVisitsToExcel = async () => {
  const columns = [
    { header: 'Date', key: 'date', format: (value) => format(parseISO(value), 'dd/MM/yyyy') },
    { header: 'Time', key: 'time' },
    { header: 'Doctor', key: 'doctor' },
    { header: 'Patient', key: 'patient' },
    { header: 'Service', key: 'service' },
    { header: 'Duration', key: 'duration', format: (value) => `${value} minutes` },
    { header: 'Walk-in', key: 'walk_in', format: (value) => value ? 'Yes' : 'No' },
    { header: 'Penalty', key: 'penalty', format: (value) => value ? 'Yes' : 'No' },
  ];

  const processedData = visits.map(visit => {
    const matchingAppointment = appointments.find(app => app.id === visit.booking)
    const matchingVisits = visits.find(app => app.id === visit.id)
    console.log(matchingVisits)
    return {
    ...visit,
    patient: matchingAppointment ? matchingAppointment.patientName : 'N/A',
    doctor: employeeDetails[visit.employee] 
    ? `${employeeDetails[visit.employee].first_name} ${employeeDetails[visit.employee].last_name}`
    : 'Unknown',
    service: sellableDetails[visit.sellable]
    ? sellableDetails[visit.sellable].name
    : 'Unknown',
  }});

  await exportToExcel(processedData, 'clinic_visits', columns);
};

// Export ledger transactions to Excel
const exportLedgerTransactionsToExcel = async () => {
  const columns = [
    { header: 'Date', key: 'date', format: (value) => format(parseISO(value), 'dd/MM/yyyy') },
    { header: 'Transaction', key: 'transactionType' },
    { header: 'Amount Paid', key: 'amount_credit', format: (value) => value.toFixed(2) },
    { header: 'Invoiced Amount', key: 'amount_debit', format: (value) => value.toFixed(2) },
    { header: 'Balance', key: 'balance', format: (value) => value },
  ];

  await exportToExcel(ledgerTransactions, 'clinic_ledger_transactions', columns);
};

  // Map dateRange values to display names
  const dateRangeOptions = {
    'today': 'Today',
    'yesterday': 'Yesterday',
    'thisWeek': 'This Week',
    'thisMonth': 'This Month',
    'thisYear': 'This Year',
    'custom': 'Custom Range',
  };
  const dateRangeDisplay = dateRangeOptions[dateRange];

  // Calculate total appointments today for the selected doctor
  const totalAppointmentsTodayForDoctor = appointments.filter(app => 
    (!selectedDoctor || app.doctorId === selectedDoctor) &&
    new Date(app.start).toDateString() === new Date().toDateString()
  ).length;

  return (
    <Card className={`mx-auto flex flex-col gap-4 p-4 w-full h-full shadow-xl transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>  
      {/* <ExcelToApiUploader /> */}
      <section className="flex h-1/2 gap-4">
          <Card className="flex-1 shadow-inner bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Today's Appointments ({totalAppointmentsTodayForDoctor}) 
                <RefreshCw size={18} onClick={refreshAppointments} className="cursor-pointer" />
              </CardTitle>
              <Select 
                value={selectedDoctor} 
                onValueChange={(value) => setSelectedDoctor(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Doctors</SelectItem>
                  {doctors.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.first_name} {doctor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-4 rounded-md">
              {upcomingAppointmentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : filteredAppointments.length === 0 ? (
                "No upcoming appointments for selected date range"
              ) : (
                <div className='overflow-y-auto' style={{ maxHeight: '165px' }}>
                  <ul className='flex flex-col gap-4'>
                    {filteredAppointments.map(appointment => (
                      <li key={appointment.id}>
                        <Button className="w-full text-left justify-start">
                          {format(appointment.start, 'EEEE dd MMM HH:mm')} - {appointment.doctorName} - {appointment.patientName}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='flex-1 shadow-inner bg-gray-50'>
            <CardHeader className='flex flex-row align-middle items-center justify-between'>
              <CardTitle className="text-lg font-bold">Summary</CardTitle>
              <div className="flex justify-end gap-6 mb-4">
              <Button variant="outline" onClick={() => navigate(`/clinic/${clinic_id}/schedule`)}>
                <Calendar className="mr-2 h-4 w-4" />
                View Schedule/Calendar
              </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">{dateRangeDisplay} <Filter className="ml-2 h-4 w-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="">
                    <Select value={dateRange}
                      onValueChange={(value) => {
                        setDateRange(value);
                        if (value !== 'custom') {
                          setCustomDateRange({ from: null, to: null });
                        }
                      }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="thisYear">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                    {dateRange === 'custom' && (
                      <div className="mt-4">
                        <DateRangePicker
                          from={customDateRange.from}
                          to={customDateRange.to}
                          onSelect={(range) => {
                            if (range?.from && range?.to) {
                              setCustomDateRange(range);
                              setDateRange('custom');
                              fetchVisits();
                              fetchAppointments();
                            }
                          }}
                        />
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'visits', icon: <Calendar className="w-6 h-6 text-blue-500" />, label: 'Total Visits' },
                  { key: 'upcomingAppointments', icon: <Clock className="w-6 h-6 text-green-500" />, label: 'Upcoming Appointments' },
                  { key: 'canceledBookings', icon: <XCircle className="w-6 h-6 text-red-500" />, label: 'Cancelled Bookings' },
                ].map(({ key, icon, label }) => (
                  <div key={key} className="border rounded-md p-4 shadow-inner bg-white flex items-center justify-center">
                    <div className="mr-4">{icon}</div>
                    <div className='flex flex-col items-center'>
                      <div className="text-sm text-gray-600">{label}</div>
                      {key === 'visits' ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="text-2xl font-bold cursor-pointer">
                              {visitsLoading ? (
                                <Skeleton className="h-8 w-16" />
                              ) : (
                                summary[key]
                              )}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl w-full max-h-[100vh] overflow-y-auto">
                            <DialogHeader className="w-full flex justify-between">
                              <DialogTitle>Visits</DialogTitle>
                            </DialogHeader>
                            {visitsLoading ? (
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                              </div>
                            ) : (
                              <VisitsDataTable data={visits} appointments={appointments} />
                            )}
                          </DialogContent>
                        </Dialog>
                      ) : key === 'upcomingAppointments' ? (
                        upcomingAppointmentsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <div className="text-2xl font-bold">{summary[key]}</div>
                        )
                      ) : (
                        <div className="text-2xl font-bold">{summary[key]}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div key="accounts" className="border rounded-md p-4 shadow-inner bg-white flex items-center justify-center">
                  <div className="mr-4"><FileDownIcon className="w-6 h-6 text-purple-500" /></div>
                  <div className='flex flex-col items-center'>
                    <div className="text-sm text-gray-600">Accounts</div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="text-2xl font-bold cursor-pointer">
                          {ledgerLoading ? (
                            <Skeleton className="h-8 w-16" />
                          ) : (
                            ledgerTransactions.length
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl w-full max-h-[100vh] overflow-y-auto">
                        <DialogHeader className="w-full flex justify-between">
                          <DialogTitle>Accounts</DialogTitle>
                        </DialogHeader>
                        {ledgerLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ) : (
                          <LedgerTable data={ledgerTransactions} />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className=" h-1/2 grid grid-cols-2 gap-4">
          <Card className="text-center h-full cursor-pointer shadow-inner bg-gray-50" onClick={() => navigate(`/clinic/${clinic_id}/employees`)}>
            <CardContent className="p-4 relative h-full flex justify-between">
              <img src={employee} alt="Employees" className="mx-auto object-fill mb-2" />
              <Button className=" absolute rounded-md py-1 bottom-6 right-[44.45%]">Employees</Button>
            </CardContent>
          </Card>
          <Card className="text-center h-full cursor-pointer shadow-inner bg-gray-50" onClick={() => navigate(`/clinic/${clinic_id}/patients`)}>
            <CardContent className="p-4 relative h-full flex justify-between">
              <img src={patient} alt="Patients" className="mx-auto object-fill mb-2" />
              <Button className=" absolute rounded-md py-1 bottom-6 right-[44.45%]">Patients</Button>
            </CardContent>
          </Card>
        </div>
    </Card>
  );
};

export default Dashboard;