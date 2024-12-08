import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

const scheduleSettingsSchema = z.object({
  booking_max_value: z.number().int().positive(),
  cancellation_penalty_value: z.number().int().positive(),
  penalty_money: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  penalty_money_currency: z.string().min(1),
  reschedule_times_max: z.number().int().positive(),
  collision_allow: z.boolean(),
});

const ScheduleSettings = () => {
  const { clinic_id } = useParams();
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();

  const form = useForm({
    resolver: zodResolver(scheduleSettingsSchema),
    defaultValues: {
      booking_max_value: 60,
      cancellation_penalty_value: 5,
      penalty_money: '300.00',
      penalty_money_currency: 'INR',
      reschedule_times_max: 5,
      collision_allow: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/settings/`
      );
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      form.reset(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCollisionToggle = async (value, onChange) => {
    onChange(value); // Update local form state
    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/settings/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ collision_allow: value }),
        }
      );

      if (!response.ok) throw new Error('Failed to update collision setting');

      toast({
        title: 'Success',
        description: `Collision setting updated to ${value ? 'Active' : 'Inactive'}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update collision setting. Please try again.',
        variant: 'destructive',
      });
      // Revert local change if API fails
      onChange(!value);
    }
  };

  const onSubmit = async (values) => {
    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/settings/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) throw new Error('Failed to update settings');

      toast({
        title: 'Success',
        description: 'Schedule settings updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Schedule Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="collision_allow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allow Collision</FormLabel>
                  <br />
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(value) =>
                        handleCollisionToggle(value, field.onChange)
                      }
                    />
                  </FormControl>
                  <span className="ml-2">{field.value ? 'Active' : 'Inactive'}</span>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="booking_max_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Booking allowed before (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cancellation_penalty_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation/reschedule penalty duration (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Alert>
              <AlertDescription>
                Cancellation charges will be applied to the patient if an appointment is
                cancelled/rescheduled within {form.watch('cancellation_penalty_value')} hours.
              </AlertDescription>
            </Alert>
            <FormField
              control={form.control}
              name="penalty_money"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Penalty Amount</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="penalty_money_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reschedule_times_max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reschedule allowed for (times)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="mt-6">
              Update Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ScheduleSettings;
