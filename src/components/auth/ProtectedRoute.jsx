// components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Progress } from "@/components/ui/progress"

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <Progress value={progress} className="w-[60%]" />
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;