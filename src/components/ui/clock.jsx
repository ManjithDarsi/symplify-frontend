// clock.jsx
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock as ClockIcon } from 'lucide-react'

const ClockPicker = ({value, onChange}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState('06')
  const [selectedMinute, setSelectedMinute] = useState('00')
  const [tempHour, setTempHour] = useState('06')
  const [tempMinute, setTempMinute] = useState('00')
  const [isHourSelected, setIsHourSelected] = useState(true)
  const [displayHour, setDisplayHour] = useState('12');
  const [displayMinute, setDisplayMinute] = useState('00');
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    if (typeof value === 'string' && value.includes(':')) {
      const [hours, minutes] = value.split(':').map(Number);
      updateTimeDisplay(hours, minutes);
    } else if (value instanceof Date) {
      const hours = value.getHours();
      const minutes = value.getMinutes();
      updateTimeDisplay(hours, minutes);
    }
  }, [value])

  const updateTimeDisplay = (hours, minutes) => {
    const newPeriod = hours >= 12 ? 'PM' : 'AM';
    
    setSelectedHour(hours.toString().padStart(2, '0'));
    setSelectedMinute(minutes.toString().padStart(2, '0'));
    setTempHour(hours.toString().padStart(2, '0'));
    setTempMinute(minutes.toString().padStart(2, '0'));

    // Convert 24-hour format to 12-hour format for display
    let displayHours = hours % 12;
    displayHours = displayHours === 0 ? 12 : displayHours;

    setDisplayHour(displayHours.toString());
    setDisplayMinute(minutes.toString().padStart(2, '0'));
    setPeriod(newPeriod);
  }

  const outerHours = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']
  const innerHours = ['12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

  const handleTimeClick = (value) => {
    if (isHourSelected) {
      setTempHour(value.padStart(2, '0'));
      setIsHourSelected(false);
    } else {
      setTempMinute(value.padStart(2, '0'));
      updateTime(tempHour, value);
    }
  };

  const handleCancel = () => {
    setIsOpen(false)
    setTempHour(selectedHour)
    setTempMinute(selectedMinute)
    setIsHourSelected(true)
  }

  const handleOk = () => {
    setSelectedHour(tempHour)
    setSelectedMinute(tempMinute)
    updateTime(tempHour, tempMinute)
    setIsOpen(false)
    setIsHourSelected(true)
  }

  const updateTime = (newHour, newMinute) => {
    const timeString = `${newHour.padStart(2, '0')}:${newMinute.padStart(2, '0')}`;
    onChange(timeString);
  };

  const renderTimeCircle = () => {
    const items = isHourSelected ? [...outerHours, ...innerHours] : minutes
    const selectedValue = isHourSelected ? tempHour : tempMinute

    return (
      <div className="relative w-64 h-64 rounded-full bg-gray-100">
        {items.map((item, index) => {
          const isInnerCircle = isHourSelected && index >= 12
          const angle = ((index % 12) * 30) - 90
          const radius = isInnerCircle ? 80 : 110
          const left = radius * Math.cos((angle * Math.PI) / 180) + 128
          const top = radius * Math.sin((angle * Math.PI) / 180) + 128

          return (
            <button
              key={item}
              className={`absolute z-10 w-8 h-8 flex items-center justify-center rounded-full ${
                item === selectedValue ? 'bg-blue-500 text-white' : ''
              }`}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => handleTimeClick(item)}
            >
              {item}
            </button>
          )
        })}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        </div>
        <div 
            className="absolute w-[0.2rem] bg-blue-500 origin-bottom "
            style={{
                height: '37%',
                left: '49.5%',
                bottom: '50%',
                transform: `rotate(${isHourSelected 
                ? (parseInt(tempHour) % 12) * 30 
                : parseInt(tempMinute) * 6}deg)`
            }}
            ></div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(true)}
          className="w-[180px] justify-start text-left font-normal"
        >
          <ClockIcon className="mr-2 h-4 w-4" />
          <span>{`${displayHour}:${displayMinute} ${period}`}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-4">
            <span
              className={`cursor-pointer ${isHourSelected ? 'text-blue-500' : ''}`}
              onClick={() => setIsHourSelected(true)}
            >
              {tempHour}
            </span>
            :
            <span
              className={`cursor-pointer ${!isHourSelected ? 'text-blue-500' : ''}`}
              onClick={() => setIsHourSelected(false)}
            >
              {tempMinute}
            </span>
          </div>
          {renderTimeCircle()}
          <div className="mt-4 flex justify-end w-full">
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleOk}>Ok</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ClockPicker