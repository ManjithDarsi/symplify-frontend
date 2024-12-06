import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Switch } from "@/components/ui/switch";

import * as z from 'zod';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
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

const EmployeeSettings = () => {
  const { clinic_id, employee_id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [progress, setProgress] = useState(13);
  const { authenticatedFetch } = useAuth();
  const [isActive, setisActive]=useState(false);
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
    fetchEmployee();
    fetchRoles();
  }, [clinic_id, employee_id]);

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

  const fetchEmployee = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/employee/${employee_id}/`);
      setEmployee(data);
      const { country_code, mobile } = extractCountryCodeAndMobile(data.mobile);
      form.reset({
        ...data,
        country_code: country_code,
        mobile: mobile,
      });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const extractCountryCodeAndMobile = (fullMobile) => {
    // Remove any non-digit characters except the leading '+'
    const cleanedNumber = fullMobile.replace(/[^\d+]/g, '');
    
    // Check if the number starts with a '+'
    if (cleanedNumber.startsWith('+')) {
      // Find the country code
      for (let i = 1; i <= 4; i++) {
        const potentialCode = cleanedNumber.substring(0, i + 1);
        if (countryCodes.some(code => code.code === potentialCode)) {
          return {
            country_code: potentialCode,
            mobile: cleanedNumber.substring(i + 1)
          };
        }
      }
    }
    
    // If no valid country code found or number doesn't start with '+',
    // assume it's a local number (India in this case)
    return {
      country_code: '+91',
      mobile: cleanedNumber.startsWith('91') ? cleanedNumber.substring(2) : cleanedNumber
    };
  };

  const fetchRoles = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/role/`);
      setRoles(data);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values) => {
    try {
      const formattedValues = {
        ...values,
        mobile: `${values.country_code}${values.mobile}`,
      };
      await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/employee/${employee_id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });
      toast({
        title: "Success",
        description: "Employee updated successfully.",
      });
      setIsEditing(false);
      fetchEmployee();  // Refresh employee data
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <Progress value={progress} className="w-[60%]" />
        <p className="mt-4 text-sm text-gray-500">Loading employee details... {Math.round(progress)}%</p>
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Employee Settings</CardTitle>
        <div className="flex items-center">
        <Switch
          checked={isActive}
          onCheckedChange={(checked) => setisActive(checked)}
          disabled={!isEditing}
        />
        <h3 className="text-1xl font-bold">   Active</h3>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Cancel" : "Update Employee"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-6">
          <Avatar className="h-20 w-20 mr-4">
            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${employee.first_name} ${employee.last_name}`} />
            <AvatarFallback>{employee.first_name[0]}{employee.last_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{employee.first_name} {employee.last_name}</h2>
            <p className="text-gray-500">{employee.email}</p>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!isEditing} />
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
                    <Input {...field} disabled={!isEditing} />
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
                    <Input {...field} type="email" disabled={!isEditing} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
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
                      <Input {...field} disabled={!isEditing} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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
                      checked={isActive ? field.value : false} 
                      onCheckedChange={field.onChange}
                      disabled={!isEditing  || !isActive}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Is Therapist Active <span className="mt-4 text-sm text-gray-500"> (You will be able schedule appointments to the Employee)</span>
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
                        checked={isActive ? field.value : false} 
                      onCheckedChange={field.onChange}
                      disabled={!isEditing || !isActive}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Has App Access <span className="mt-4 text-sm text-gray-500"> (The Employee will be given access to both web and Mobile app)</span>
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {isEditing && (
              <Button type="submit">Save Changes</Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EmployeeSettings;