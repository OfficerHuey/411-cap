import { useState } from "react";
import type { ScheduleGroup, SemesterLevel, StudentRoster } from "../Lib/Types";
import { Plus, Trash2, X } from "lucide-react";
import { dataStore } from "../Lib/Store";

interface CreateScheduleModalProps {
  semesterId: string;
  level: SemesterLevel;
  onClose: () => void;
  onSuccess: () => void;
}

interface StudentInput {
  id: string;
  name: string;
  wNumber: string;
  email: string;
}
export function CreateScheduleModal({ semesterId, level, onClose, onSuccess }: CreateScheduleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    locationNote: '',
  });
  const [students, setStudents] = useState<StudentInput[]>([]);
  const [showStudentSection, setShowStudentSection] = useState(false);

  const addStudentRow = () => {
    setStudents([...students, { id: `temp-${Date.now()}`, name: '', wNumber: '', email: '' }]);
  };

  const updateStudent = (id: string, field: keyof StudentInput, value: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newScheduleGroup: ScheduleGroup = {
      id: `sg-${Date.now()}`,
      semesterId,
      level,
      ...formData,
    };

    dataStore.addScheduleGroup(newScheduleGroup);

    // Add students if any were added
    students.forEach(student => {
      if (student.name && student.wNumber && student.email) {
        const newStudent: StudentRoster = {
          id: `sr-${Date.now()}-${Math.random()}`,
          scheduleGroupId: newScheduleGroup.id,
          name: student.name,
          wNumber: student.wNumber,
          email: student.email,
        };
        dataStore.addStudent(newStudent);
      }
    });

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Add Schedule Group</h2>
              <p className="text-sm text-gray-600 mt-1">Create a new schedule for {level}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Schedule Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Schedule D"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Note <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.locationNote}
                  onChange={(e) => setFormData({ ...formData, locationNote: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Hammond"
                />
              </div>
            </div>

            {/* Student Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Students (Optional)</h3>
                <button
                  type="button"
                  onClick={() => setShowStudentSection(!showStudentSection)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showStudentSection ? 'Hide' : 'Show'} Student Section
                </button>
              </div>

              {showStudentSection && (
                <div className="space-y-3">
                  {students.map((student, index) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Student Name"
                      />
                      <input
                        type="text"
                        value={student.wNumber}
                        onChange={(e) => updateStudent(student.id, 'wNumber', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="W Number"
                      />
                      <input
                        type="email"
                        value={student.email}
                        onChange={(e) => updateStudent(student.id, 'email', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Email"
                      />
                      <button
                        type="button"
                        onClick={() => removeStudent(student.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addStudentRow}
                    className="inline-flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </button>

                  {students.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {students.filter(s => s.name && s.wNumber && s.email).length} student(s) will be added
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                Create Schedule
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
