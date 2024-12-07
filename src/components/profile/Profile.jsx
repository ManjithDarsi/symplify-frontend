import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "../ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { countryCodes } from '../../lib/countryCodes';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    country_code: '',
    mobile: '',
  });

  useEffect(() => {
    const { country_code, mobile } = extractCountryCodeAndMobile(user.mobile);
    setFormData(prevState => ({
      ...prevState,
      country_code,
      mobile,
    }));
  }, [user.mobile]);

  const extractCountryCodeAndMobile = (fullMobile) => {
    const cleanedNumber = fullMobile.replace(/[^\d+]/g, '');
    if (cleanedNumber.startsWith('+')) {
      for (let i = 1; i <= 4; i++) {
        const potentialCode = cleanedNumber.substring(0, i + 1);
        if (countryCodes.some(code => code.code === potentialCode)) {
          return {
            country_code: potentialCode,
            mobile: cleanedNumber.substring(i + 1)
          };
        }
      }
    }
    return {
      country_code: '+91',
      mobile: cleanedNumber.startsWith('91') ? cleanedNumber.substring(2) : cleanedNumber
    };
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handledit =()=>{
    useNavigate(`/clinic/${clinic_id}/patient/${patient_id}/update`);
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedFormData = {
        ...formData,
        mobile: `${formData.country_code}${formData.mobile}`
      };
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/accounts/profile/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFormData),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const updatedUser = await response.json();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // You'll need to implement setUser in your AuthContext
      // setUser(updatedUser);

      setIsEditing(false);
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className={`container mx-auto p-4 w-full shadow-xl transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.display_picture} alt={user.first_name} />
              <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.first_name} {user.last_name}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex space-x-2">
                <div className="w-1/3">
                  <Label htmlFor="country_code">Country Code</Label>
                  <Select
                    id="country_code"
                    name="country_code"
                    value={formData.country_code}
                    onValueChange={(value) => setFormData({ ...formData, country_code: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country code" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((code) => (
                        <SelectItem key={code.code} value={code.code}>
                          {code.name} ({code.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-2/3">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
            <Button type="button" onClick={handledit} className="mt-6">Edit Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
};
export default Profile;