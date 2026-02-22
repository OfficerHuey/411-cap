import { useEffect, useState } from 'react'
import '../App.css'
import { Shield, X, AlertTriangle, Calendar, Save } from 'lucide-react';
import  { authService } from '../Lib/Auth';
import  { dataStore } from '../Lib/Store';
import type { ScheduleGroup, Semester, Course, CourseSection, ScheduleSection, ClinicalDays } from '../Lib/Types';

interface OverridePanelProps {
  scheduleGroup: ScheduleGroup;
  onClose: () => void;
  onRefresh: () => void;
}

export function OverridePanel({ scheduleGroup, onClose, onRefresh }: OverridePanelProps) {
  const [semester, setSemester] = useState<Semester | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [scheduleSections, setScheduleSections] = useState<ScheduleSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);
  const [overrideData, setOverrideData] = useState({
    capacity: '',
    classroom: '',
    notes: '',
    dayOfWeek: '',
    timeSlot: '',
    dateRange: '',
    reason: '',
  });
  const [clinicalDaysOverride, setClinicalDaysOverride] = useState<ClinicalDays | ''>('');

  useEffect(() => {
    const sem = dataStore.getSemesterById(scheduleGroup.semesterId);
    setSemester(sem || null);
    if (sem) {
      setCourses(dataStore.getCourses(sem.id));
      setClinicalDaysOverride(sem.clinicalDays);
    }
    loadSections();
  }, [scheduleGroup]);

  const loadSections = () => {
    const ss = dataStore.getScheduleSections(scheduleGroup.id);
    setScheduleSections(ss);
    setCourseSections(dataStore.getCourseSections());
  };

  const getScheduledSections = () => {
    return scheduleSections
      .map(ss => {
        const courseSection = courseSections.find(cs => cs.id === ss.courseSectionId);
        if (!courseSection) return null;
        const course = courses.find(c => c.id === courseSection.courseId);
        return { courseSection, course };
      })
      .filter(Boolean) as { courseSection: CourseSection; course: Course }[];
  };

  const handleSelectSection = (section: CourseSection) => {
    setSelectedSection(section);
    setOverrideData({
      capacity: '',
      classroom: section.classroom || '',
      notes: section.notes || '',
      dayOfWeek: section.dayOfWeek || '',
      timeSlot: section.timeSlot || '',
      dateRange: section.dateRange || '',
      reason: '',
    });
  };

  const handleApplyClinicalDaysOverride = () => {
    if (!semester || !clinicalDaysOverride) return;

    const reason = prompt('Enter reason for changing clinical days:');
    if (!reason) return;

    // Log the override
    authService.logOverride({
      sectionId: `semester-${semester.id}`,
      changes: `Clinical Days: ${semester.clinicalDays} → ${clinicalDaysOverride}`,
      reason,
    });

    // Update semester
    const updatedSemester: Semester = {
      ...semester,
      clinicalDays: clinicalDaysOverride as ClinicalDays,
    };
    
    dataStore.deleteSemester(semester.id);
    dataStore.addSemester(updatedSemester);
    setSemester(updatedSemester);

    alert('Clinical days updated successfully');
    onRefresh();
  };

  const handleApplyOverride = () => {
    if (!selectedSection || !overrideData.reason) {
      alert('Please provide a reason for the override');
      return;
    }

    const updates: Partial<CourseSection> = {
      classroom: overrideData.classroom,
      notes: overrideData.notes,
    };

    // Add day/time overrides if changed
    if (overrideData.dayOfWeek && overrideData.dayOfWeek !== selectedSection.dayOfWeek) {
      updates.dayOfWeek = overrideData.dayOfWeek;
    }
    if (overrideData.timeSlot && overrideData.timeSlot !== selectedSection.timeSlot) {
      updates.timeSlot = overrideData.timeSlot;
    }
    if (overrideData.dateRange && overrideData.dateRange !== selectedSection.dateRange) {
      updates.dateRange = overrideData.dateRange;
    }

    const changesArray: string[] = [];
    if (updates.classroom !== selectedSection.classroom) changesArray.push(`Classroom: ${selectedSection.classroom} → ${updates.classroom}`);
    if (updates.notes !== selectedSection.notes) changesArray.push(`Notes: ${updates.notes}`);
    if (updates.dayOfWeek) changesArray.push(`Day: ${selectedSection.dayOfWeek} → ${updates.dayOfWeek}`);
    if (updates.timeSlot) changesArray.push(`Time: ${selectedSection.timeSlot} → ${updates.timeSlot}`);
    if (updates.dateRange) changesArray.push(`Date Range: ${updates.dateRange}`);
    if (overrideData.capacity) changesArray.push(`Capacity: ${overrideData.capacity}`);

    // Log the override
    authService.logOverride({
      sectionId: selectedSection.id,
      changes: changesArray.join(', '),
      reason: overrideData.reason,
    });

    dataStore.updateCourseSection(selectedSection.id, updates);
    
    alert('Override applied successfully');
    setSelectedSection(null);
    setOverrideData({ capacity: '', classroom: '', notes: '', dayOfWeek: '', timeSlot: '', dateRange: '', reason: '' });
    onRefresh();
  };

  const scheduledSections = getScheduledSections();
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const TIME_SLOTS = [
    '7:00 AM - 9:00 AM',
    '8:00 AM - 10:00 AM',
    '9:00 AM - 11:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 2:00 PM',
    '1:00 PM - 3:00 PM',
    '2:00 PM - 4:00 PM',
    '3:00 PM - 5:00 PM',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-purple-600 mr-2" />
                <h2 className="text-2xl font-semibold text-gray-900">Override Settings</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Admin controls for {scheduleGroup.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-900">
                Admin Override Mode
              </h3>
              <p className="text-sm text-yellow-800 mt-1">
                Changes made here will be logged with your admin credentials. All overrides require a reason for audit purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Clinical Days Override Section */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Clinical Days Override</h3>
              </div>
              <span className="text-sm text-gray-600">
                Current: <span className="font-medium text-purple-700">{semester?.clinicalDays}</span>
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Change the clinical days for the entire semester
            </p>
            <div className="flex items-center space-x-3">
              <select
                value={clinicalDaysOverride}
                onChange={(e) => setClinicalDaysOverride(e.target.value as ClinicalDays)}
                className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="Thurs/Fri">Thursday / Friday</option>
                <option value="Tues/Wed">Tuesday / Wednesday</option>
              </select>
              <button
                onClick={handleApplyClinicalDaysOverride}
                disabled={clinicalDaysOverride === semester?.clinicalDays}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Update Clinical Days
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Left: Section List */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Scheduled Sections</h3>
              <div className="space-y-2">
                {scheduledSections.length === 0 ? (
                  <p className="text-sm text-gray-500">No sections scheduled yet</p>
                ) : (
                  scheduledSections.map(({ courseSection, course }) => (
                    <button
                      key={courseSection.id}
                      onClick={() => handleSelectSection(courseSection)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        selectedSection?.id === courseSection.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {course.code} - Section {courseSection.sectionNumber}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {courseSection.dayOfWeek && courseSection.timeSlot
                          ? `${courseSection.dayOfWeek} ${courseSection.timeSlot}`
                          : courseSection.dateRange}
                      </div>
                      {courseSection.notes && (
                        <div className="text-xs text-gray-500 mt-1">{courseSection.notes}</div>
                      )}
                      {courseSection.isShared && (
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          Shared Section
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Override Form */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Override Details</h3>
              {selectedSection ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Selected Section:</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {courses.find(c => c.id === selectedSection.courseId)?.code} - Section {selectedSection.sectionNumber}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Classroom
                    </label>
                    <input
                      type="text"
                      value={overrideData.classroom}
                      onChange={(e) => setOverrideData({ ...overrideData, classroom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Sim Lab, Room 204, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes / Room
                    </label>
                    <input
                      type="text"
                      value={overrideData.notes}
                      onChange={(e) => setOverrideData({ ...overrideData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Sim Lab, Room 204, etc."
                    />
                  </div>

                  {/* Day/Time Override for non-Semester 5 */}
                  {selectedSection.dayOfWeek && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Override Day
                        </label>
                        <select
                          value={overrideData.dayOfWeek}
                          onChange={(e) => setOverrideData({ ...overrideData, dayOfWeek: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Keep Current ({selectedSection.dayOfWeek})</option>
                          {DAYS.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Override Time
                        </label>
                        <select
                          value={overrideData.timeSlot}
                          onChange={(e) => setOverrideData({ ...overrideData, timeSlot: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Keep Current ({selectedSection.timeSlot})</option>
                          {TIME_SLOTS.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Date Range Override for Semester 5 */}
                  {selectedSection.dateRange && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Override Date Range
                      </label>
                      <input
                        type="text"
                        value={overrideData.dateRange}
                        onChange={(e) => setOverrideData({ ...overrideData, dateRange: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Current: ${selectedSection.dateRange}"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Example: Jan 13 - Feb 9
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Capacity (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={overrideData.capacity}
                      onChange={(e) => setOverrideData({ ...overrideData, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Leave blank to use default"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Override student capacity limits for this section
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Override <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={overrideData.reason}
                      onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Explain why this override is necessary..."
                    />
                  </div>

                  <button
                    onClick={handleApplyOverride}
                    disabled={!overrideData.reason}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Apply Override
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Select a section to override</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click a section from the list to modify its settings
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close Override Panel
          </button>
        </div>
      </div>
    </div>
  );
}