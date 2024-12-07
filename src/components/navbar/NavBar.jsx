// components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom';
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useAuth } from '../../contexts/AuthContext';
import logo from "../../assets/logo_ai 2.svg";
import { Card } from '../ui/card';
import { ChevronRight, LogOut } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, authenticatedFetch } = useAuth();
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [clinicName, setClinicName] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [patientName, setPatientName] = useState('');

  const { clinic_Id } = useParams();

  useEffect(() => {
    generateBreadcrumbs();
  }, [location, clinicName, employeeName, patientName]);

  const pathName = location.pathname
  console.log(pathName)

  useEffect(() => {
    if (location.pathname.includes('/clinic/')) {
      fetchClinicName();
    }
    if (location.pathname.includes('/employees/')) {
      fetchEmployeeName();
    }
    if (location.pathname.includes('/patients/')) {
      fetchPatientName();
    }
  }, [location]);

  const fetchClinicName = async () => {
    const clinicId = location.pathname.split('/')[2];
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinicId}/`);
      if (response.ok) {
        const data = await response.json();
        setClinicName(data.name);
      }
    } catch (error) {
      console.error('Failed to fetch clinic name:', error);
    }
  };

  const clinicId = location.pathname.split('/')[2];
  const employeeId = location.pathname.includes('/employees/') ? location.pathname.split('/')[4] : null;
  const patientId = location.pathname.includes('/patients/') ? location.pathname.split('/')[4] : null;

  const fetchPatientName = async () => {
    if (!patientId) return;
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinicId}/patient/${patientId}/`);
      if (response.ok) {
        const data = await response.json();
        setPatientName(`${data.first_name} ${data.last_name}`);
      }
    } catch (error) {
      console.error('Failed to fetch patient name:', error);
    }
  }

  const fetchEmployeeName = async () => {
    if (!employeeId) return;
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinicId}/employee/${employeeId}/`);
      if (response.ok) {
        const data = await response.json();
        setEmployeeName(`${data.first_name} ${data.last_name}`);
      }
    } catch (error) {
      console.error('Failed to fetch employee name:', error);
    }
  };

  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs = pathnames.map((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      let displayName = name.charAt(0).toUpperCase() + name.slice(1);

      if (name === clinicId) {
        displayName = clinicName;
      } else if (name === patientId) {
        displayName = patientName || 'Patient';
      } else if (name === employeeId) {
        displayName = employeeName || 'Employee';
      } 

      return {
        name: displayName,
        routeTo,
        isLast: index === pathnames.length - 1
      };
    });

    setBreadcrumbs(breadcrumbs);
  };

 
  const isClinicHome = location.pathname === `/clinic` || location.pathname === `/clinic/${clinicId}`;

  const isSchedulePage = location.pathname === `/clinic/${clinicId}/schedule`;
  


  return (
    <Card className="flex flex-col p-4 bg-white shadow-md w-full mt-2">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center space-x-2" onClick={() => navigate('/clinic')} style={{cursor: 'pointer'}}>
          <img src={logo} alt="Symplify Logo" className="h-8 w-8" />
          <span className="font-bold text-xl">Symplify</span>
        </div>

        <div className="flex items-center mt-2 text-sm text-gray-500 mx-auto px-4">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.routeTo}>
              {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
              {breadcrumb.isLast ? (
                <span className="font-semibold">{breadcrumb.name}</span>
              ) : (
                <Link to={breadcrumb.routeTo} className="text-blue-600 hover:underline">
                  {breadcrumb.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {isClinicHome ? null : isSchedulePage ? (
          <Button onClick={() => navigate(`/clinic/${clinicId}`)} className="ml-4">Home</Button>
        ) : (
          <Button onClick={() => navigate(`/clinic/${clinicId}/schedule`)} className="ml-4">View/Schedule Calendar</Button>
        )}







        <div className="ml-4">
        {pathName.endsWith('/clinic') ? (
            <Button onClick={logout}> Logout <LogOut className='w-4 h-4 ml-2' /> </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 text-center text-primary">
                  <AvatarFallback>{user?.first_name[0]}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/clinic/${clinicId}/profile`)}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/clinic/${clinicId}/settings`)}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
         </div>
      </div>
    </Card>
  );
};

export default Navbar;