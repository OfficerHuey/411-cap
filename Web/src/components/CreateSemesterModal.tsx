
import '../App.css'
import { X } from 'lucide-react';
import { dataStore } from '../Lib/Store';
import type { ClinicalDays, Semester } from '../Lib/Types';
import { useState } from 'react';

interface CreateSemesterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSemesterModal({ onClose, onSuccess }: CreateSemesterModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    clinicalDays: 'Thurs/Fri' as ClinicalDays,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newSemester: Semester = {
      id: `sem-${Date.now()}`,
      ...formData,
    };

    dataStore.addSemester(newSemester);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Create New Semester</h2>
              <p className="text-sm text-gray-600 mt-1">Add a new semester to the system</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Fall 2027"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinical Days
              </label>
              <select
                value={formData.clinicalDays}
                onChange={(e) => setFormData({ ...formData, clinicalDays: e.target.value as ClinicalDays })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Thurs/Fri">Thursday / Friday</option>
                <option value="Tues/Wed">Tuesday / Wednesday</option>
              </select>
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
                Create Semester
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
