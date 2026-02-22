import { useEffect, useState } from 'react'
import '../App.css'
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../Lib/Auth';
import { dataStore } from '../Lib/Store';
import type { SemesterLevel, Semester, ScheduleGroup } from '../Lib/Types';
import { CreateScheduleModal } from './CreateScheduleModal';

const LEVELS: SemesterLevel[] = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5'];

export function SemesterHub() {
  const { semesterId } = useParams<{ semesterId: string }>();
  const navigate = useNavigate();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [activeLevel, setActiveLevel] = useState<SemesterLevel>('Semester 1');
  const [scheduleGroups, setScheduleGroups] = useState<ScheduleGroup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const canEdit = authService.canEdit();

  useEffect(() => {
    if (!semesterId) return;
    
    const sem = dataStore.getSemesterById(semesterId);
    setSemester(sem || null);
    loadScheduleGroups();
  }, [semesterId, activeLevel]);

  const loadScheduleGroups = () => {
    if (!semesterId) return;
    const groups = dataStore.getScheduleGroups(semesterId, activeLevel);
    setScheduleGroups(groups);
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Are you sure you want to delete this schedule group?')) {
      dataStore.deleteScheduleGroup(id);
      loadScheduleGroups();
    }
  };

  if (!semester) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Semester not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">{semester.name}</h1>
            <p className="text-gray-600 mt-1">
              {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule Group
          </button>
        )}
      </div>

      {/* Level Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="flex overflow-x-auto">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeLevel === level
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scheduleGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{group.locationNote}</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleDeleteSchedule(group.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate(`/schedule-builder/${group.id}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Edit2 className="h-4 w-4 inline mr-2" />
                Edit Schedule
              </button>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {scheduleGroups.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Groups Yet</h3>
            <p className="text-gray-600 mb-4">Create a schedule group for {activeLevel}</p>
            {canEdit && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule Group
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <CreateScheduleModal
          semesterId={semesterId!}
          level={activeLevel}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadScheduleGroups();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}