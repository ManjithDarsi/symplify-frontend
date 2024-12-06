// signup.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo from "../../assets/logo_ai 2.svg"
import { countryCodes } from '@/lib/countryCodes';

const signupSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters.").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters.").max(50),
  email: z.string().email("Please enter a valid email address."),
  countryCode: z.string().min(1, "Country code is required"),
  mobile: z.string().regex(/^\d{1,14}$/, "Mobile number must be between 1 and 14 digits."),
  password: z.string().min(8, "Password must be at least 8 characters.")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."),
  reEnterPassword: z.string(),
}).refine((data) => data.password === data.reEnterPassword, {
  message: "Passwords don't match",
  path: ["reEnterPassword"],
});

const verificationSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  verificationCode: z.string().min(1, "Verification code is required"),
});

const SignUp = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const form = useForm({
    resolver: zodResolver(isVerifying ? verificationSchema : signupSchema),
    defaultValues: {
      first_name: "",
      lastName: "",
      email: "",
      countryCode: "",
      mobile: "",
      password: "",
      reEnterPassword: "",
      verificationCode: "",
    },
  });
  const { preRegister, register } = useAuth();
  const { toast } = useToast()
  const navigate = useNavigate();
  const [oldValues, setOldValues] = useState(null)

  const onSubmit = async (values) => {
    try {
      if (!isVerifying) {
        await preRegister(values.email);
        setIsVerifying(true);
        setOldValues(values);
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the verification code.",
        });
        form.clearErrors();
      } else {
        const verificationCode = values.verificationCode;
        
        if (!verificationCode) {
          toast({
            title: "Error",
            description: "Please enter the verification code sent to your email.",
            variant: "destructive",
          });
          return;
        }
        
        console.log(oldValues)
        // Combine country code and mobile number before sending
        const fullMobileNumber = `${oldValues.countryCode}${oldValues.mobile}`;
        const registrationData = { ...oldValues, mobile: fullMobileNumber };
        await register(registrationData, verificationCode);

        toast({
          title: "Success",
          description: "You have successfully registered.",
        });
        navigate('/login');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card className={`shadow-lg w-full transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <CardHeader className='items-center gap-4'>
          <img src={logo} className='w-24' alt="Logo" />
          <CardTitle className="text-2xl font-semibold items-center">
            Sign up
          </CardTitle>
        </CardHeader>
        <CardContent className='w-full'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
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
                        <Input type="email" placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country Code</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country code" />
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
                    <FormItem>
                      <FormLabel>Mobile number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Mobile number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reEnterPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Re-enter password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Re-enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {isVerifying && (
                <FormField
                  control={form.control}
                  name="verificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter verification code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : isVerifying ? 'Complete Registration' : 'Sign Up'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;