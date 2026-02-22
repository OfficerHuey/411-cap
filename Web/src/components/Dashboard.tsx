import { useEffect, useState } from 'react'
import '../App.css'
import { CreateSemesterModal } from './CreateSemesterModal';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { authService } from '../Lib/Auth';
import  { dataStore } from '../Lib/Store';
import type { Semester } from '../Lib/Types';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const canEdit = authService.canEdit();

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = () => {
    setSemesters(dataStore.getSemesters());
  };

  const handleDeleteSemester = (id: string) => {
    if (confirm('Are you sure you want to delete this semester? This will delete all associated schedules.')) {
      dataStore.deleteSemester(id);
      loadSemesters();
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Nursing Scheduler Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage semesters and course schedules
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Semester
          </button>
        )}
      </div>

      {/* Semester Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {semesters.map(semester => (
          <div
            key={semester.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{semester.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDateRange(semester.startDate, semester.endDate)}
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSemester(semester.id);
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mb-4">
                <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  Clinical Days: {semester.clinicalDays}
                </div>
              </div>

              <button
                onClick={() => navigate(`/semester/${semester.id}`)}
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                Open Semester
              </button>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {semesters.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Semesters Yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first semester</p>
            {canEdit && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Semester
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Semester Modal */}
      {showCreateModal && (
        <CreateSemesterModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadSemesters();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}