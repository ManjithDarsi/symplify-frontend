// timepicker.jsx
import React, { useState, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function TimePicker({ value, onChange }) {
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    if (value instanceof Date) {
      let hours = value.getHours();
      const minutes = value.getMinutes();
      const newPeriod = hours >= 12 ? 'PM' : 'AM';
      
      // Convert 24-hour format to 12-hour format
      if (hours > 12) {
        hours -= 12;
      } else if (hours === 0) {
        hours = 12;
      }

      setHour(hours.toString());
      setMinute(minutes.toString().padStart(2, '0'));
      setPeriod(newPeriod);
    }
  }, [value]);

  const updateTime = (newHour, newMinute, newPeriod) => {
    const updatedDate = new Date(value);
    let hours = parseInt(newHour);
    if (newPeriod === 'PM' && hours !== 12) hours += 12;
    if (newPeriod === 'AM' && hours === 12) hours = 0;
    updatedDate.setHours(hours);
    updatedDate.setMinutes(parseInt(newMinute));
    onChange(updatedDate);
  };

  const handleHourChange = (newHour) => {
    setHour(newHour);
    updateTime(newHour, minute, period);
  };

  const handleMinuteChange = (newMinute) => {
    setMinute(newMinute);
    updateTime(hour, newMinute, period);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    updateTime(hour, minute, newPeriod);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
          <ClockIcon className="mr-2 h-4 w-4 -translate-x-1" />
          <span className="flex-1 truncate">{`${hour}:${minute} ${period}`}</span>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="grid grid-cols-2 gap-4 p-4">
          <Select value={hour} onValueChange={handleHourChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={minute} onValueChange={handleMinuteChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Minute" />
            </SelectTrigger>
            <SelectContent>
              {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ChevronDownIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}


function ClockIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}


function XIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}