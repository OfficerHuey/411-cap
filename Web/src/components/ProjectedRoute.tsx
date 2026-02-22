import { useEffect } from 'react'
import '../App.css'
import { useNavigate } from 'react-router-dom';
import { authService } from '../Lib/Auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  if (!authService.isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
