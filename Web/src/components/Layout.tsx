
import '../App.css'
import { Link, Calendar, Shield, LogOut } from 'lucide-react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import  { authService } from '../Lib/Auth';
export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <span className="ml-2 font-semibold text-xl">Nursing Scheduler</span>
              </Link>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                <div className="flex items-center justify-end">
                  {currentUser?.role === 'admin' && (
                    <Shield className="h-3 w-3 text-purple-600 mr-1" />
                  )}
                  <p className="text-xs text-gray-500">{currentUser?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}