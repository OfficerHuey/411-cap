import { useEffect, useState } from 'react'
import '../App.css'
import { Trash2, Plus } from 'lucide-react';
import { authService } from '../Lib/Auth';
import { dataStore } from '../Lib/Store';
import type { StudentRoster } from '../Lib/Types';
interface StudentRosterViewProps {
  scheduleGroupId: string;
}

export function StudentRosterView({ scheduleGroupId }: StudentRosterViewProps) {
  const [students, setStudents] = useState<StudentRoster[]>([]);
  const [newStudent, setNewStudent] = useState({
    name: '',
    wNumber: '',
    email: '',
  });
  
  const canEdit = authService.canEdit();

  useEffect(() => {
    loadStudents();
  }, [scheduleGroupId]);

  const loadStudents = () => {
    setStudents(dataStore.getStudentRoster(scheduleGroupId));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    
    const student: StudentRoster = {
      id: `sr-${Date.now()}`,
      scheduleGroupId,
      ...newStudent,
    };

    dataStore.addStudent(student);
    setNewStudent({ name: '', wNumber: '', email: '' });
    loadStudents();
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('Are you sure you want to remove this student?')) {
      dataStore.deleteStudent(id);
      loadStudents();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">Student Roster</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage students enrolled in this schedule group
        </p>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  W Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.wNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {/* Add New Student Row */}
              {canEdit && (
                <tr className="bg-blue-50">
                  <td colSpan={4} className="px-6 py-4">
                    <form onSubmit={handleAddStudent} className="flex items-center space-x-4">
                      <input
                        type="text"
                        required
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Student Name"
                      />
                      <input
                        type="text"
                        required
                        value={newStudent.wNumber}
                        onChange={(e) => setNewStudent({ ...newStudent, wNumber: e.target.value })}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="W Number"
                      />
                      <input
                        type="email"
                        required
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Email"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </button>
                    </form>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {students.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No students enrolled yet</p>
              <p className="text-sm text-gray-400 mt-1">Add students using the form below</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}