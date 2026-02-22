import { useEffect, useState } from "react";
import type { Course, CourseSection, ScheduleSection } from "../Lib/Types";
import { X, AlertCircle, Link2 } from "lucide-react";
import  { dataStore } from "../Lib/Store";

interface CourseDetailsModalProps {
  scheduleGroupId: string;
  courseId: string;
  dayOfWeek?: string;
  timeSlot?: string;
  dateRange?: string;
  isSemester5: boolean;
  courses: Course[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CourseDetailsModal({
  scheduleGroupId,
  courseId,
  dayOfWeek,
  timeSlot,
  dateRange,
  isSemester5,
  courses,
  onClose,
  onSuccess,
}: CourseDetailsModalProps) {
  const course = courses.find(c => c.id === courseId);
  const [formData, setFormData] = useState({
    sectionNumber: '01',
    classroom: '',
    notes: '',
    dateRange: dateRange || '',
  });

  const [existingSection, setExistingSection] = useState<CourseSection | null>(null);
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);

  useEffect(() => {
    // Check if section already exists when section number is entered
    if (formData.sectionNumber && course) {
      const existing = dataStore.findCourseSection(courseId, formData.sectionNumber);
      if (existing) {
        setExistingSection(existing);
        setShowLinkPrompt(true);
      } else {
        setExistingSection(null);
        setShowLinkPrompt(false);
      }
    }
  }, [formData.sectionNumber, courseId, course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let courseSectionId: string;

    if (existingSection) {
      // Link to existing section
      courseSectionId = existingSection.id;
    } else {
      // Create new section
      const newCourseSection: CourseSection = {
        id: `cs-${Date.now()}`,
        courseId,
        sectionNumber: formData.sectionNumber,
        dayOfWeek: isSemester5 ? undefined : dayOfWeek,
        timeSlot: isSemester5 ? undefined : timeSlot,
        dateRange: isSemester5 ? formData.dateRange : undefined,
        notes: formData.notes,
        classroom: formData.classroom,
        isShared: false,
      };
      dataStore.addCourseSection(newCourseSection);
      courseSectionId = newCourseSection.id;
    }

    // Create schedule section link
    const scheduleSection: ScheduleSection = {
      id: `ss-${Date.now()}`,
      scheduleGroupId,
      courseSectionId,
    };
    dataStore.addScheduleSection(scheduleSection);

    // Mark as shared if linking to existing
    if (existingSection) {
      dataStore.updateCourseSection(existingSection.id, { isShared: true });
    }

    onSuccess();
  };

  const handleLinkToExisting = () => {
    if (!existingSection) return;

    const scheduleSection: ScheduleSection = {
      id: `ss-${Date.now()}`,
      scheduleGroupId,
      courseSectionId: existingSection.id,
    };
    dataStore.addScheduleSection(scheduleSection);
    dataStore.updateCourseSection(existingSection.id, { isShared: true });
    onSuccess();
  };

  const handleCreateNew = () => {
    setShowLinkPrompt(false);
    setExistingSection(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Course Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                {course?.code} - {course?.name}
              </p>
              {!isSemester5 && dayOfWeek && timeSlot && (
                <p className="text-sm text-gray-500 mt-1">
                  {dayOfWeek} at {timeSlot}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {showLinkPrompt && existingSection ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-900">
                      Section Already Exists
                    </h3>
                    <p className="text-sm text-yellow-800 mt-1">
                      {course?.code}-{formData.sectionNumber} already exists at{' '}
                      {existingSection.dayOfWeek} {existingSection.timeSlot || existingSection.dateRange}.
                    </p>
                    <p className="text-sm text-yellow-800 mt-2">
                      Would you like to link to this existing section or create a new one?
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleLinkToExisting}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Link to Existing Section
                </button>
                <button
                  onClick={handleCreateNew}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Create New Section
                </button>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.sectionNumber}
                  onChange={(e) => setFormData({ ...formData, sectionNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="01"
                />
              </div>

              {isSemester5 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dateRange}
                    onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jan 13 - Feb 9"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classroom
                </label>
                <input
                  type="text"
                  value={formData.classroom}
                  onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sim Lab"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sim Lab"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}