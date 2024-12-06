// AddClinic.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  display_name: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }),
  address_line_1: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  address_line_2: z.string().optional(),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  pincode: z.string().regex(/^\d{6}$/, {
    message: "Pincode must be 6 digits.",
  }),
  phone1: z.string().regex(/^\d{10}$/, {
    message: "Phone number must be 10 digits.",
  }),
  email1: z.string().email({
    message: "Please enter a valid email address.",
  }),
  type: z.enum(["ph", "cl", "ho"], {
    required_error: "Please select a clinic type.",
  }),
});

const AddClinic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      display_name: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      pincode: "",
      phone1: "",
      email1: "",
      type: "ph",
    },
  });

  const onSubmit = async (values) => {
    const submitData = {
      ...values,
      type: 'ph'
    };
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to add clinic');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Clinic added successfully.",
      });
      navigate('/clinic');  // Redirect to the clinics list
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add clinic. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl max-h-[90%] mx-auto mt-8 overflow-scroll">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Add New Clinic</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_line_1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_line_2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select clinic type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ph">Pharmacy</SelectItem>
                      <SelectItem value="cl">Clinic</SelectItem>
                      <SelectItem value="ho">Hospital</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Add Clinic</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddClinic;