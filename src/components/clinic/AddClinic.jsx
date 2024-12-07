import React, { useState } from 'react';
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
  type: z.enum(["ph","mu","ot","oh","se","st","ab","ay","da","py","cd"], {
    required_error: "Please select a clinic type.",
  }),
  prefix_patient_id: z.string().min(1, {
    message: "Prefix Patient ID is required.",
  }).optional().or(z.literal('')), 
  prefix_invoice: z.string().min(1, "Invoice prefix is required").optional().or(z.literal('')),

});

const AddClinic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(false); // Loading state

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
      prefix_invoice: '',
      prefix_patient_id: '', 
    },
  });

  const onSubmit = async (values) => {

    setLoading(true); // Start loading
    const submitData = {
      ...values,
      address_line_2: values.address_line_2 ? values.address_line_2 : null,
      prefix_invoice: values.prefix_invoice !== '' ? values.prefix_invoice : null,
      prefix_patient_id: values.prefix_patient_id !== '' ? values.prefix_patient_id : null,
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
    } finally {
      setLoading(false); // End loading
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
                      <SelectItem value="ph">Physiotherapy</SelectItem>
          <SelectItem value="mu">Multi</SelectItem>
          <SelectItem value="ab">ABA therapy</SelectItem>
          <SelectItem value="se">Special Education</SelectItem>
          <SelectItem value="cd">Child devlopement</SelectItem>
          <SelectItem value="ay">Ayurvedic Therapy</SelectItem>
          <SelectItem value="da">Deaddiction Center</SelectItem>
          <SelectItem value="py">Psychiology</SelectItem>
          <SelectItem value="st">Speech Therapy</SelectItem>
          <SelectItem value="ot">occupational therapy</SelectItem>
          <SelectItem value="oh">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prefix_invoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Prefix</FormLabel>
                  <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-4">
        <p className="text-sm text-gray-700">
          Once the Invoice Prefix is set, each invoice generated in your clinic will have this prefix appended to it. 
        </p>
        <p className="text-sm text-gray-700">
         Example: If your Invoice Prefix is "INV", your invoices will be labeled as INV_0001, INV_0002, and so on.
        </p>
      </div>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
  control={form.control}
  name="prefix_patient_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Prefix Patient ID</FormLabel>
      <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-4">
        <p className="text-sm text-gray-700">
          Once the Patient ID Prefix is set, each patient in your clinic will be assigned a unique serial number under this prefix. Please note, this prefix is permanent and cannot be modified after being set.
        </p>
        <p className="text-sm text-gray-700">
          Example: If your Patient ID Prefix is "ABC", your patients will have IDs like ABC_0001, ABC_0002, and so on.
        </p>
      </div>
      <FormControl>
        <Input 
          {...field} 
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding Clinic...' : 'Add Clinic'}
            </Button>
            <Button type="submit">Add Clinic</Button>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddClinic;
