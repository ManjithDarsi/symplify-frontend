import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const roleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters."),
  permissions: z.array(z.string()),
});

const RoleSettings = () => {
  const { clinic_id, role_id } = useParams();
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState(13);
  const { authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permissions: [],
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
    fetchRole();
    fetchPermissions();
  }, [clinic_id, role_id]);

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

  const fetchRole = async () => {
    if (role_id === 'new') {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/role/${role_id}/`);
      setRole(data);
      form.reset({
        name: data.name,
        permissions: data.permissions,
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

  const fetchPermissions = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/permission/`);
      setPermissions(data);
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
      const url = role_id === 'new' 
        ? `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/role/`
        : `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/role/${role_id}/`;
      
      const method = role_id === 'new' ? 'POST' : 'PATCH';

      await fetchWithTokenHandling(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      toast({
        title: "Success",
        description: role_id === 'new' ? "Role created successfully." : "Role updated successfully.",
      });
      setIsEditing(false);
      if (role_id === 'new') {
        navigate(`/clinic/${clinic_id}/roles`);
      } else {
        fetchRole();
      }
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
        <p className="mt-4 text-sm text-gray-500">Loading role... {Math.round(progress)}%</p>
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">{role_id === 'new' ? 'Create New Role' : 'Role Settings'}</CardTitle>
        {role_id !== 'new' && (
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Cancel" : "Update Role"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!isEditing && role_id !== 'new'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Permissions</FormLabel>
              {permissions.map((permission) => (
                <FormField
                  key={permission.id}
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem key={permission.id} className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, permission.id])
                              : field.onChange(field.value?.filter((value) => value !== permission.id))
                          }}
                          disabled={!isEditing && role_id !== 'new'}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {permission.name}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            {(isEditing || role_id === 'new') && (
              <Button type="submit">{role_id === 'new' ? 'Create Role' : 'Save Changes'}</Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RoleSettings;