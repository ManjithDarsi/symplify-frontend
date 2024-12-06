// ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast"
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
import logo from "../../assets/logo_ai 2.svg";

const resetSchema = z.object({
  username: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."),
  confirmPassword: z.string(),
  code: z.string().min(1, "Reset code is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const form = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      code: "",
    },
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/accounts/password/reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          code: values.code,
        }),
      });

      if (!response.ok) {
        throw new Error('Password reset failed');
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      });
      navigate('/login');
    } catch (error) {
      console.error('Password reset failed:', error);
      toast({
        title: "Error",
        description: "Password reset failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card className={`shadow-lg transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <CardHeader className='items-center gap-4'>
          <img src={logo} className='w-24' alt="Symplify Logo" />
          <CardTitle className="text-2xl font-semibold text-center">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="New Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm New Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reset Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter reset code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Reset Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;