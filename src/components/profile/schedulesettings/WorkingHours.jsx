import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from "@/components/ui/switch"
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WorkingHours = () => {
  const { clinic_id } = useParams();
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();
  const [useEverydaySchedule, setUseEverydaySchedule] = useState(true);
  const [workingHours, setWorkingHours] = useState({
    everyday: { morning: { start: '', end: '' }, afternoon: { start: '', end: '' } },
    monday: { morning: { start: '', end: '' }, afternoon: { start: '', end: '' } },
    tuesday: { morning: { start: '', end: '' }, afternoon: { start: '', end: '' } },
    wednesday: { morning: { start: '', end: '' }, afternoon: { start: '', end: '' } },
    thursday: { morning: { start: '', end: '' }, afternoon: { start: '', end: '' } },
    friday: { morning: { start: '', end: '' }, afternoon: { start: '', end: '' } },
    saturday: { morning: { start: '', end: '' }, afternoon: { start: '', end: '' } },
    sunday: { morning: { start: '', end: '' }, afternoon: { start: '', end: '' } },
  });

  const days = ['everyday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/settings/`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      if (data.working_hours) {
        const isEverydaySchedule = Object.values(data.working_hours).every(day => 
          JSON.stringify(day) === JSON.stringify(data.working_hours[0])
        );
        setUseEverydaySchedule(isEverydaySchedule);
        if (isEverydaySchedule) {
          setWorkingHours(prev => ({ ...prev, everyday: data.working_hours[0] }));
        } else {
          setWorkingHours(prev => ({
            ...prev,
            ...Object.fromEntries(days.slice(1).map((day, index) => [day, data.working_hours[index]]))
          }));
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTimeChange = (day, period, timeType, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [period]: {
          ...prev[day][period],
          [timeType]: value
        }
      }
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      let submissionData;
      if (useEverydaySchedule) {
        submissionData = Object.fromEntries(days.slice(1).map((_, index) => [index, workingHours.everyday]));
      } else {
        submissionData = Object.fromEntries(days.slice(1).map((day, index) => [index, workingHours[day]]));
      }

      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/settings/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ working_hours: submissionData }),
      });

      if (!response.ok) throw new Error('Failed to update working hours');

      toast({
        title: "Success",
        description: "Working hours updated successfully.",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update working hours. Please try again.",
        variant: "destructive",
      });
    }
  };

  const TimeSelect = ({ value, onChange }) => {
    const generateTimeOptions = () => {
      const options = [];
      for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 30) {
          const hour = i.toString().padStart(2, '0');
          const minute = j.toString().padStart(2, '0');
          const time = `${hour}:${minute}`;
          options.push(<SelectItem key={time} value={time}>{time}</SelectItem>);
        }
      }
      return options;
    };

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {generateTimeOptions()}
        </SelectContent>
      </Select>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Working Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <p className="text-sm text-gray-500">Note: Time format should be in 24:00 hours</p>

          <div className="flex items-center space-x-2">
            <Switch
              checked={useEverydaySchedule}
              onCheckedChange={setUseEverydaySchedule}
            />
            <Label>Use same schedule for every day</Label>
          </div>

          {(useEverydaySchedule ? ['everyday'] : days.slice(1)).map((day) => (
            <div key={day} className="space-y-4">
              <h3 className="font-semibold mb-2">{day}</h3>
              <div className="grid grid-cols-2 gap-4">
                {['morning', 'afternoon'].map((period) => (
                  ['start', 'end'].map((time) => (
                    <div key={`${day}-${period}-${time}`}>
                      <Label>{`${period.charAt(0).toUpperCase() + period.slice(1)} ${time}`}</Label>
                      <TimeSelect 
                        value={workingHours[day][period][time]}
                        onChange={(value) => handleTimeChange(day, period, time, value)}
                      />
                    </div>
                  ))
                ))}
              </div>
            </div>
          ))}

          <Button type="submit" className="w-full">
            Update Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WorkingHours;