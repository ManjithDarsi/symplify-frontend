import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/components/ui/use-toast";
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import logo from "../../assets/logo_ai 2.svg";
import { LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  keepSignedIn: z.boolean().default(false)
});

const Login = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);  // Add loading state
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      keepSignedIn: false,
    },
  });

  async function onSubmit(values) {
    setIsSubmitting(true);  
    try {
      await login(values.email, values.password);
      toast({
        title: "Success",
        description: "You have successfully logged in.",
      });
      navigate('/clinic');
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);  // Reset loading state
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card className={`shadow-lg transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <CardHeader className='items-center gap-4'>
          <img src={logo} className='w-24' alt="Logo" />
          <CardTitle className="text-2xl font-semibold">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keepSignedIn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="w-full leading-none flex justify-between">
                      <FormLabel>Keep me signed in</FormLabel>
                      <p className="text-sm text-gray-600 ">
                        <Link to="/forgotpassword" className="text-blue-600 hover:underline">Forgot Password? </Link>
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <LogIn className='w-[1rem] mt-[0.5px] mr-2' />
                {isSubmitting ? 'Logging in...' : 'Login'} {/* Display loading text */}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            New user? <Link to="/signup" className="text-blue-600 hover:underline">Sign up here</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
