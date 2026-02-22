import { useEffect, useState } from 'react'
import '../App.css'
import { ArrowLeft, Shield, Upload, Download, CalendarIcon, Users } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../Lib/Auth';
import { exportScheduleData, importScheduleData } from '../Lib/Exportimport';
import { dataStore } from '../Lib/Store';
import type { ScheduleGroup, Course, CourseSection, ScheduleSection } from '../Lib/Types';
import { CoursePalette } from './CoursePalette';
import { OverridePanel } from './OverridePanel';
import { ScheduleCanvas } from './ScheduleCanvas';
import { ScheduleViewer } from './ScheduleViewer';
import { StudentRosterView } from './StudentRosterView';

export function ScheduleBuilder() {
  const { scheduleGroupId } = useParams<{ scheduleGroupId: string }>();
  const navigate = useNavigate();
  const [scheduleGroup, setScheduleGroup] = useState<ScheduleGroup | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [scheduleSections, setScheduleSections] = useState<ScheduleSection[]>([]);
  const [view, setView] = useState<'calendar' | 'students'>('calendar');
  const [showOverridePanel, setShowOverridePanel] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const canOverride = authService.canOverride();
  const canEdit = authService.canEdit();

  useEffect(() => {
    if (!scheduleGroupId) return;

    const group = dataStore.getScheduleGroupById(scheduleGroupId);
    setScheduleGroup(group || null);

    if (group) {
      const semester = dataStore.getSemesterById(group.semesterId);
      if (semester) {
        setCourses(dataStore.getCourses(semester.id));
      }
      setScheduleSections(dataStore.getScheduleSections(scheduleGroupId));
    }
    setCourseSections(dataStore.getCourseSections());
  }, [scheduleGroupId]);

  const handleExport = () => {
    if (!scheduleGroup || !semester) return;
    
    exportScheduleData({
      scheduleGroup,
      semester,
      courses,
      courseSections,
      scheduleSections,
      students: dataStore.getStudentRoster(scheduleGroupId!),
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const success = importScheduleData(content, scheduleGroupId!);
        
        if (success) {
          setImportError(null);
          alert('Schedule data imported successfully!');
          refreshSections();
        } else {
          setImportError('Failed to import schedule data. Please check the file format.');
        }
      } catch (error) {
        setImportError('Error reading file. Please ensure it\'s a valid schedule export file.');
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCourseDropped = (courseId: string, dayOfWeek?: string, timeSlot?: string, dateRange?: string) => {
    // This will open the course details modal
    // Implementation in ScheduleCanvas component
  };

  const refreshSections = () => {
    if (!scheduleGroupId) return;
    setCourseSections(dataStore.getCourseSections());
    setScheduleSections(dataStore.getScheduleSections(scheduleGroupId));
  };

  if (!scheduleGroup) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Schedule group not found</p>
      </div>
    );
  }

  const semester = dataStore.getSemesterById(scheduleGroup.semesterId);
  const isSemester5 = scheduleGroup.level === 'Semester 5';

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/semester/${scheduleGroup.semesterId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                {scheduleGroup.name} - {scheduleGroup.level}
              </h1>
              <p className="text-gray-600 mt-1">
                {semester?.name} • {scheduleGroup.locationNote}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {canOverride && (
              <button
                onClick={() => setShowOverridePanel(!showOverridePanel)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Shield className="h-4 w-4 mr-2" />
                Override Settings
              </button>
            )}
            {canEdit && (
              <>
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Schedule
                  <input
                    type="file"
                    accept=".json,.txt,.csv"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Schedule
                </button>
              </>
            )}
            {!canEdit && (
              <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                📖 View Only Mode
              </div>
            )}
          </div>
        </div>

        {/* Import Error Message */}
        {importError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{importError}</p>
            <button
              onClick={() => setImportError(null)}
              className="text-sm text-red-600 hover:text-red-800 mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Toggle */}
        <div className="bg-white rounded-lg shadow p-2 inline-flex">
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              view === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar View
          </button>
          <button
            onClick={() => setView('students')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              view === 'students'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Student View
          </button>
        </div>

        {/* Main Content - 3 Column Layout or Student View */}
        {view === 'calendar' ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Course Palette */}
            <div className="col-span-2">
              <CoursePalette courses={courses} />
            </div>

            {/* Center Column - Schedule Canvas */}
            <div className="col-span-7">
              <ScheduleCanvas
                scheduleGroup={scheduleGroup}
                isSemester5={isSemester5}
                courses={courses}
                courseSections={courseSections}
                scheduleSections={scheduleSections}
                onRefresh={refreshSections}
              />
            </div>

            {/* Right Column - Viewer */}
            <div className="col-span-3">
              <ScheduleViewer
                semesterId={scheduleGroup.semesterId}
                currentScheduleGroupId={scheduleGroupId!}
                courses={courses}
                courseSections={courseSections}
              />
            </div>
          </div>
        ) : (
          <StudentRosterView scheduleGroupId={scheduleGroupId!} />
        )}

        {/* Override Panel */}
        {showOverridePanel && (
          <OverridePanel
            scheduleGroup={scheduleGroup}
            onClose={() => setShowOverridePanel(false)}
            onRefresh={refreshSections}
          />
        )}
      </div>
    </DndProvider>
  );
}