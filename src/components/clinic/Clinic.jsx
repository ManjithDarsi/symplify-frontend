// Clinic.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const Clinic = () => {
  const [patientClinics, setPatientClinics] = useState([]);
  const [employeeClinics, setEmployeeClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(13);
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 100);
    fetchClinics();
    return () => clearTimeout(timer);
  }, []);

  const fetchClinics = async () => {
    try {
      const [patResponse, empResponse] = await Promise.all([
        authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/pat/clinic/`),
        authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/`)
      ]);

      if (!patResponse.ok || !empResponse.ok) {
        throw new Error('Failed to fetch clinics');
      }

      const patData = await patResponse.json();
      const empData = await empResponse.json();

      setPatientClinics(patData);
      setEmployeeClinics(empData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch clinics. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddClinic = () => {
    navigate('/add-clinic');
  };

  const handleClinicClick = (clinic, isPatientClinic) => {
    if (clinic.joined) {
      navigate(`/clinic/${clinic.id}/`);
    } else {
      setSelectedClinic({ ...clinic, isPatientClinic });
      setJoinDialogOpen(true);
    }
  };

  const handleJoinClinic = async () => {
    try {
      const url = selectedClinic.isPatientClinic
        ? `${import.meta.env.VITE_BASE_URL}/api/pat/clinic/invited/${selectedClinic.id}/join/`
        : `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${selectedClinic.id}/join/`;

      const response = await authenticatedFetch(url, { method: 'GET' });

      if (!response.ok) {
        throw new Error('Failed to join clinic');
      }

      await response.json();

      toast({
        title: "Success",
        description: "You have successfully joined the clinic.",
      });

      // Refresh the clinics list
      await fetchClinics();

      setJoinDialogOpen(false);
      navigate(`/clinic/${selectedClinic.id}/`);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to join clinic. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <Progress value={progress} className="w-[60%]" />
        <p className="mt-4 text-sm text-gray-500">Loading clinics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  const renderClinicList = (clinics, title, isPatientClinic) => (
    <>
      <h2 className="text-xl font-semibold mt-6 mb-4">{title}</h2>
      {clinics.length === 0 ? (
        <p className="text-gray-500">No clinics found.</p>
      ) : (
        <ul className="space-y-4">
          {clinics.map(clinic => (
            <li key={clinic.id} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <div>
                <h3 className="font-semibold">{clinic.name}</h3>
                <p className="text-sm text-gray-500">{clinic.address_line_1}, {clinic.city}</p>
                <p className="text-xs text-gray-400">{clinic.joined ? 'Joined' : 'Not Joined'}</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => handleClinicClick(clinic, isPatientClinic)}
              >
                {clinic.joined ? 'Manage' : 'Join'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <>
      <Card className="w-full max-w-4xl max-h-[90%] mx-auto mt-8 overflow-scroll">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            <div className='flex justify-between items-center'>
              <p>Clinics</p>
              <Button onClick={handleAddClinic}>Add Clinic</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientClinics.length === 0 && employeeClinics.length === 0 ? (
            <div className="text-center py-4">
              <p className='mb-4'>No clinics found.</p>
              <Button onClick={handleAddClinic}>Add your first Clinic</Button>
            </div>
          ) : (
            <>
              <div className='w-full flex flex-row gap-4'>
                <div className='w-1/2'>
                  {renderClinicList(employeeClinics, "Employee Clinics", false)}
                </div>
                <div className='w-1/2'>
                  {renderClinicList(patientClinics, "Patient Clinics", true)}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Clinic</DialogTitle>
            <DialogDescription>
              Are you sure you want to join {selectedClinic?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleJoinClinic}>Join</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Clinic;