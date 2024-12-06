// ClinicSettings.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ClinicSettings = () => {
  const { clinic_id } = useParams();

  const settingsLinks = [
    { name: 'Employees', path: `/clinic/${clinic_id}/employees` },
    { name: 'Roles', path: `/clinic/${clinic_id}/roles` },
    { name: 'Products/Services', path: `/clinic/${clinic_id}/sellable` },
    { name: 'Schedule Settings', path: `/clinic/${clinic_id}/schedulesettings` },
    { name: 'Working Hours', path: `/clinic/${clinic_id}/workinghours` },
    { name: 'Clinic Settings', path: `/clinic/${clinic_id}/clinicinfo` },
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Clinic Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsLinks.map((link, index) => (
            <Link key={index} to={link.path}>
              <Button variant="outline" className="w-full h-20 text-lg">
                {link.name}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClinicSettings;