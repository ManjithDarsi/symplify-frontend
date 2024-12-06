// forgotPassword.jsx
import { useForm } from 'react-hook-form';
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import logo from "../../assets/logo_ai 2.svg"; // Adjust the path as needed
import { Link } from 'react-router-dom'; // Assuming you're using react-router for navigation
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const ForgotPassword = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const navigate = useNavigate();
  const { toast } = useToast()

  async function onSubmit(values) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/accounts/password/forgot/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({"username": values.email}),
      });
  
      if (!response.ok) {
        throw new Error('Password reset request failed');
      }
  
      const data = await response.json();
      console.log(data);
      toast({
        title: "Success",
        description: "Password reset link has been sent to your email.",
      });
      // Navigate to the reset password page
      navigate('/reset-password');
    } catch (error) {
      console.error('Password reset request failed:', error);
      toast({
        title: "Error",
        description: "Password reset request failed. Please try again.",
        variant: "destructive",
      });
    }
  }

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card className={`shadow-lg transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <CardHeader className='items-center gap-4'>
          <img src={logo} className='w-24' alt="Symplify Logo" />
          <CardTitle className="text-2xl font-semibold text-center">Symplify</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Enter the email address linked to your account and we will send you a link to reset your password
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full ">
                SEND LINK
              </Button>
            </form>
          </Form>
          <Button variant="link" className="w-full text-gray-500 hover:text-gray-700">
            Resend link
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            New user? <Link to="/signup" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;