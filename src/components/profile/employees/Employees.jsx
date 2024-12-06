import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Progress } from "@/components/ui/progress";
import { countryCodes } from '@/lib/countryCodes';

const employeeSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters."),
  last_name: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  country_code: z.string().min(1, "Country code is required"),
  mobile: z.string().regex(/^\d{1,14}$/, "Mobile number must be between 1 and 14 digits."),
  role: z.string().uuid("Invalid role ID."),
  is_therapist: z.boolean(),
  has_app_access: z.boolean(),
  is_active: z.boolean(),
});

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { clinic_id } = useParams();
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();
  const [progress, setProgress] = useState(13);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      country_code: "+91",
      mobile: "",
      role: "",
      is_therapist: false,
      has_app_access: true,
      is_active: true,
    },
  });

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

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, [clinic_id]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const empResponse = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/employee/`);
  
      if (!empResponse.ok) {
        throw new Error('Failed to fetch employees');
      }
  
      const empData = await empResponse.json();
  
      let combinedEmployees = empData;
  
      try {
        const patResponse = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/pat/clinic/${clinic_id}/employee/`);
        if (patResponse.ok) {
          const patData = await patResponse.json();
          combinedEmployees = empData.map(emp => ({
            ...emp,
            is_patient_visible: patData.some(pat => pat.id === emp.id)
          }));
        }
      } catch (patError) {
        console.log("No access to patient data or other error occurred", patError);
        // We'll just use empData without modification
      }
  
      setEmployees(combinedEmployees);
      setProgress(100);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch employees. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/role/`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch roles. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values) => {
    try {
      const formattedValues = {
        ...values,
        mobile: `${values.country_code}${values.mobile}`
      };

      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/employee/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });
      if (!response.ok) throw new Error('Failed to add employee');
      await fetchEmployees();
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Employee added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmployeeClick = (employeeId) => {
    navigate(`/clinic/${clinic_id}/employees/${employeeId}`);
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <Progress value={progress} className="w-[60%]" />
        <p className="mt-4 text-sm text-gray-500">Loading employees... {Math.round(progress)}%</p>
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  const renderEmployeeForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex space-x-2">
          <FormField
            control={form.control}
            name="country_code"
            render={({ field }) => (
              <FormItem className="w-1/3">
                <FormLabel>Country Code</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select code" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {countryCodes.map((code) => (
                      <SelectItem key={code.code} value={code.code}>
                        {code.name} ({code.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem className="w-2/3">
                <FormLabel>Mobile</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_therapist"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Is Therapist
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="has_app_access"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Has App Access
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Is Active
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit">Add Employee</Button>
      </form>
    </Form>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Employees</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            {renderEmployeeForm()}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <div className="text-center py-4">
            <p className="mb-4">No employees found.</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Your First Employee</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                {renderEmployeeForm()}
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <ul className="space-y-4">
            {employees.map(employee => (
              <li 
                key={employee.id} 
                className="flex items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-200"
                onClick={() => handleEmployeeClick(employee.id)}
              >
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${employee.first_name} ${employee.last_name}`} />
                  <AvatarFallback>{employee.first_name} {employee.last_name}</AvatarFallback>
                </Avatar>
                <div className='w-full'>
                  <h3 className="font-semibold">{employee.first_name} {employee.last_name}</h3>
                  <p className="text-sm text-gray-500">{employee.email}</p>
                  <p className="text-xs text-gray-400">
                    {employee.is_therapist ? 'Therapist' : 'Staff'} | 
                    {employee.is_active ? ' Active' : ' Inactive'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default Employees;