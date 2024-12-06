// PatientSchedule.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';

const PatientSchedule = () => {
  const { clinic_id, patient_id } = useParams();
  const [activeTab, setActiveTab] = useState('all');
  const [isVisible, setIsVisible] = useState(false);
  const [visits, setVisits] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const { authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [sellableDetails, setSellableDetails] = useState({});

  useEffect(() => {
    fetchVisits();
    setIsVisible(true);
    fetchAppointments();
    fetchBookings();
  }, []);

  const fetchWithTokenHandling = async (url, options = {}) => {
    try {
      const response = await authenticatedFetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'An error occurred');
      }
      return response.json();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const fetchEmployeeDetails = async (employeeId) => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/employee/${employeeId}/`);
      setEmployeeDetails(prevDetails => ({
        ...prevDetails,
        [employeeId]: data
      }));
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
    }
  };
  
  const fetchSellableDetails = async (sellableId) => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/sellable/${sellableId}/`);
      setSellableDetails(prevDetails => ({
        ...prevDetails,
        [sellableId]: data
      }));
    } catch (error) {
      console.error("Failed to fetch sellable details:", error);
    }
  };

  const fetchVisits = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/visit/`);
      setVisits(data);

            
      const employeeIds = new Set();
      const sellableIds = new Set();

      data.forEach(visit => {
        if (visit.employee) {
          employeeIds.add(visit.employee);
        }
        if (visit.sellable) {
          sellableIds.add(visit.sellable);
        }
      });
  
      const fetchEmployeePromises = Array.from(employeeIds).map(id => fetchEmployeeDetails(id));
      const fetchSellablePromises = Array.from(sellableIds).map(id => fetchSellableDetails(id));
  
      await Promise.all([...fetchEmployeePromises, ...fetchSellablePromises]);
  
      console.log(employeeIds);
      console.log(sellableIds);
    } catch (error) {
      console.error("Failed to fetch visits:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/booking/`);
      setAppointments(data);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/booking/`);
      setBookings(data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'P': return 'bg-yellow-100';
      case 'C': return 'bg-green-200';
      case 'X': return 'bg-red-300';
      case 'R': return 'bg-blue-200';
      default: return 'bg-gray-300';
    }
  };

  const renderAppointmentRow = (appointment) => (
    <TableRow key={appointment.id} className={getStatusColor(appointment.status_employee)}>
      <TableCell>{format(parseISO(appointment.start), 'dd/MM/yyyy HH:mm')}</TableCell>
      <TableCell>{format(parseISO(appointment.end), 'HH:mm')}</TableCell>
      <TableCell>{`${appointment.employee.first_name} ${appointment.employee.last_name}`}</TableCell>
      <TableCell>{appointment.sellable || 'N/A'}</TableCell>
      <TableCell>{appointment.status_employee}</TableCell>
    </TableRow>
  );

  return (
    <Card className={`w-full h-[80vh] overflow-y-scroll mt-8 container mx-auto p-4 shadow-xl transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
      <CardHeader>
        <CardTitle>Patient Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Appointments</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="visited">Visited</TabsTrigger>
            <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-center'>Start Time</TableHead>
                  <TableHead className='text-center'>End Time</TableHead>
                  <TableHead className='text-center'>Employee</TableHead>
                  <TableHead className='text-center'>Service</TableHead>
                  <TableHead className='text-center'>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map(renderAppointmentRow)}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="upcoming">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-center'>Start Time</TableHead>
                  <TableHead className='text-center'>End Time</TableHead>
                  <TableHead className='text-center'>Employee</TableHead>
                  <TableHead className='text-center'>Service</TableHead>
                  <TableHead className='text-center'>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings
                  .filter(b => new Date(b.start) > new Date() && b.status_patient !== 'X' && b.status_employee !== 'X')
                  .map(renderAppointmentRow)}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="visited">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-center'>Date</TableHead>
                  <TableHead className='text-center'>Time</TableHead>
                  <TableHead className='text-center'>Doctor</TableHead>
                  <TableHead className='text-center'>Service</TableHead>
                  <TableHead className='text-center'>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map(visit => (
                  <TableRow key={visit.id}>
                    <TableCell>{format(new Date(visit.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{visit.time || 'N/A'}</TableCell>
                    <TableCell>{employeeDetails[visit.employee] 
                          ? `${employeeDetails[visit.employee].first_name} ${employeeDetails[visit.employee].last_name}`
                          : 'Loading...'}</TableCell>
                    <TableCell>{sellableDetails[visit.sellable]
                          ? sellableDetails[visit.sellable].name
                          : 'Loading...'}</TableCell>
                    <TableCell>{visit.duration ? `${visit.duration} minutes` : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="incomplete">
            <h3 className="text-lg font-semibold mb-2">Rescheduled Appointments</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-center'>Start Time</TableHead>
                  <TableHead className='text-center'>End Time</TableHead>
                  <TableHead className='text-center'>Employee</TableHead>
                  <TableHead className='text-center'>Service</TableHead>
                  <TableHead className='text-center'>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.filter(b => b.status_patient === 'R' || b.status_employee === 'R').map(renderAppointmentRow)}
              </TableBody>
            </Table>

            <h3 className="text-lg font-semibold mt-4 mb-2">Cancelled Appointments</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-center'>Start Time</TableHead>
                  <TableHead className='text-center'>End Time</TableHead>
                  <TableHead className='text-center'>Employee</TableHead>
                  <TableHead className='text-center'>Service</TableHead>
                  <TableHead className='text-center'>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.filter(b => b.status_patient === 'X' || b.status_employee === 'X').map(renderAppointmentRow)}
              </TableBody>
            </Table>

          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PatientSchedule;