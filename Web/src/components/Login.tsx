import { useState } from 'react'
import '../App.css'
import { Calendar, AlertCircle, Mail, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import  { authService } from '../Lib/Auth';
import { Lock } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = authService.login(email, password);
    
    if (user) {
      navigate('/');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  const mockCredentials = authService.getMockCredentials();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">Nursing Scheduler</h1>
          <p className="text-gray-600 mt-2">School of Nursing Scheduling System</p>
          <p className="text-sm text-gray-500 mt-1">Baton Rouge & Hammond North Shore</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 ml-2">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="professor@nursing.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </button>
          </form>

          {/* Demo Credentials Toggle */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Info className="h-4 w-4 mr-2" />
              {showCredentials ? 'Hide' : 'Show'} Demo Credentials
            </button>
            
            {showCredentials && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-3">Demo Accounts:</p>
                <div className="space-y-3">
                  {mockCredentials.map((cred, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{cred.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          cred.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : cred.role === 'professor'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {cred.role}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-mono">{cred.email}</span>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-mono">{cred.password}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Note: Only <strong>admin</strong> role can override schedules. Students have view-only access.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Need help? Contact IT Support</p>
        </div>
      </div>
    </div>
  );
}