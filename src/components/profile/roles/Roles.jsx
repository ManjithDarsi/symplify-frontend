import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(13);
  const { clinic_id } = useParams();
  const { authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            clearInterval(interval);
            return 100;
          }
          const newProgress = oldProgress + Math.random() * 10;
          return Math.min(newProgress, 90);
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    fetchRoles();
  }, [clinic_id]);

  const fetchWithTokenHandling = async (url, options = {}) => {
    try {
      const response = await authenticatedFetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'An error occurred');
      }
      return response.json();
    } catch (error) {
      if (error.message === 'Token is blacklisted' || error.message === 'Token is invalid or expired') {
        navigate('/login');
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/role/`);
      setRoles(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <Progress value={progress} className="w-[60%]" />
        <p className="mt-4 text-sm text-gray-500">Loading roles... {Math.round(progress)}%</p>
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Clinic Roles</CardTitle>
        <Button as={Link} to={`/clinic/${clinic_id}/roles/new`}>
          Create New Role
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Link key={role.id} to={`/clinic/${clinic_id}/roles/${role.id}`} className="border p-4 rounded hover:bg-gray-100">
              <h2 className="text-xl font-semibold">{role.name}</h2>
              <p>Admin: {role.is_admin ? 'Yes' : 'No'}</p>
              <p>Auto Added: {role.auto_added ? 'Yes' : 'No'}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Roles;