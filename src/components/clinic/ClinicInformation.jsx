import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';

const clinicInformationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  display_name: z.string().min(1, "Display name is required"),
  address_line_1: z.string().min(1, "Address line 1 is required"),
  address_line_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  pincode: z.string().regex(/^\d+$/, "Invalid pincode"),
  phone1: z.string().regex(/^\d+$/, "Invalid phone number"),
  email1: z.string().email("Invalid email address"),
  type: z.enum(["ph","mu","ot","oh","se","st","ab","ay","da","py","cd"]), 
  prefix_invoice: z.string().min(1, "Invoice prefix is required"),
  prefix_patient_id: z.string().min(1, {
    message: "Prefix Patient ID is required.",
  }),
});

const ClinicInformation = () => {
  const { clinic_id } = useParams();
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [presentImg, setPresentImg] = useState(null);
  const [isPrefixPatientEditable, setIsPrefixPatientEditable] = useState(false); // For showing button/input
  const [submitting, setSubmitting] = useState(false); // Track form submission status
  const [type,settype]=useState('');

  const form = useForm({
    resolver: zodResolver(clinicInformationSchema),
    defaultValues: {
      name: '',
      display_name: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      pincode: '',
      phone1: '',
      email1: '',
      type: 'ph',
      prefix_invoice: '',
      prefix_patient_id: null,
    },
  });

  useEffect(() => {
    fetchClinicData();
  }, []);

  const fetchClinicData = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/`);
      if (!response.ok) throw new Error('Failed to fetch clinic data');
      const data = await response.json();
      console.log(data)
      setPresentImg(data.logo_long)
      form.reset({
        name: data.name ?? '',
        display_name: data.display_name ?? '',
        address_line_1: data.address_line_1 ?? '',
        address_line_2: data.address_line_2 ?? '',
        city: data.city ?? '',
        pincode: data.pincode ?? '',
        phone1: data.phone1 ?? '',
        email1: data.email1 ?? '',
        type: data.type,
        prefix_invoice: data.prefix_invoice ?? '',
        prefix_patient_id: data.prefix_patient_id ?? null,
      });

      if (!data.prefix_patient_id) {
        setIsPrefixPatientEditable(false);
      }

      settype(data.type);
      // Check if prefix_patient_id is null to manage the button state
      setIsPrefixPatientEditable(!data.prefix_patient_id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch clinic information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values) => {

    if (submitting) return; // Prevent multiple submissions
    setSubmitting(true);

    const submitData = {
      ...values,
      address_line_2: values.address_line_2 ? values.address_line_2 : null,
    };
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) throw new Error('Failed to update clinic information');

      toast({
        title: "Success",
        description: "Clinic information updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update clinic information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false); // Re-enable form submission after completion
    }
  };

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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    // setSelectedFile(file);
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      toast({ title: "Error", description: "Please select a valid image file.", variant: "destructive" });
      event.target.value = null; // Reset the input
    }
  };
  const uploadLogo = async () => {
    if (!selectedFile) {
      toast({ title: "Error", description: "Please select a file to upload.", variant: "destructive" });
      return false;
    }
    // console.log("Requesting presigned URL...");
    const presignedUrlResponse = await fetchWithTokenHandling(
      `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/logo/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "logo_long_filename": selectedFile.name }),
      }
    );
    
    const { logo_long_filename: fileName, logo_long: presignedUrl } = presignedUrlResponse;
    
    // console.log("Uploading file...");
    const formData = new FormData();
    formData.append('file', selectedFile);
    console.log(selectedFile)
    
    // console.log("Presigned URL received:", presignedUrl);
    await axios.put(presignedUrl, selectedFile, {
      headers: {
        'Content-Type': "multipart/form-data",
        'Content-Length': selectedFile.size,
        "x-amz-acl": "public-read" 
      },
    });

    // console.log("File uploaded successfully. Marking as completed...");
    await fetchWithTokenHandling(
      `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/logo/complete/`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "logo_long_completed": true }),
      }
    );

    // console.log("File upload process completed successfully.");
    toast({ title: "Success", description: "File uploaded successfully" });
    setSelectedFile(null);
    await fetchClinicData();
    return true;

  }

  const handleEditPrefixPatientId = () => {
    setIsPrefixPatientEditable(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }


  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Clinic Information</CardTitle>
      </CardHeader>
      <CardContent>

        <p className=' font-semibold'>
          Invoice Logo
        </p>
        <div className='flex justify-center'>
          {presentImg !== null ? (
            <img src={presentImg} alt={"Invoice Logo"} className="max-w-full max-h-[80vh] object-contain" />
            ) : 
            (<>No logo Uploaded Yet</>)
          }
        </div>
        <div className='flex gap-6'>
          <Input 
            type="file"
            accept="image/*"
            onChange={handleFileChange} 
          />
          <Button onClick={() => {
            uploadLogo()}}>
            Update Logo
          </Button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
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
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
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
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_line_2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
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
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
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
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
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
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
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
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic Type</FormLabel>
                  <Select onValueChange={(value) => { 
                      field.onChange(value); 
                      settype(value); 
                  }} value={field.value || type}> 
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
                      Patient ID Prefix is set. If you need to change it, please contact support.
                    </div>
                    {!isPrefixPatientEditable && field.value ? (
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} readOnly placeholder="Prefix Patient ID set and cannot be changed" />
                      </FormControl>
                    ) : (
                      <>
                        {isPrefixPatientEditable ? (
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} placeholder="Enter Prefix Patient ID" />
                          </FormControl>
                        ) : (
                          <Button type="button" onClick={handleEditPrefixPatientId}>
                            Add Prefix Patient ID
                          </Button>
                        )}
                      </>
                    )}
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-6" disabled={submitting}>
              {submitting ? "Submitting..." : "Update Clinic Information"}
            </Button>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ClinicInformation;
