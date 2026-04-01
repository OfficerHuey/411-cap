import { useRef, useState } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Loader2 } from "lucide-react";
import { importApi, schedules as schedulesApi } from "../Lib/api";
import type { Schedule } from "../Lib/Types";

interface ImportedStudent {
  name: string;
  wNumber: string;
  email: string;
  preferredLocation: string | null;
  firstChoice: string | null;
  secondChoice: string | null;
  employedAt: string | null;
}

interface StudentAssignment {
  student: ImportedStudent;
  scheduleId: number;
  scheduleName: string;
  matchType: string;
}

interface ImportResult {
  totalParsed: number;
  assignments: StudentAssignment[];
  unassigned: ImportedStudent[];
}

interface StudentImportModalProps {
  semesterId: number;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "upload" | "preview" | "done";

export function StudentImportModal({ semesterId, onClose, onSuccess }: StudentImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [scheduleOptions, setScheduleOptions] = useState<Schedule[]>([]);
  //track manual assignments for unassigned students
  const [manualAssignments, setManualAssignments] = useState<Record<number, number>>({});
  const [committedCount, setCommittedCount] = useState(0);

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") {
      setError("Only .csv and .xlsx files are supported");
      return;
    }

    setError("");
    setUploading(true);

    try {
      //load schedule options for manual assignment dropdowns
      const scheds = await schedulesApi.getBySemester(semesterId);
      setScheduleOptions(scheds);

      const data = await importApi.uploadStudents(semesterId, file);
      setResult(data);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleCommit = async () => {
    if (!result) return;
    setError("");
    setCommitting(true);

    try {
      //build commit list from auto-assigned + manually assigned
      const commitList: { name: string; wNumber: string; email: string; scheduleId: number }[] = [];

      for (const a of result.assignments) {
        commitList.push({
          name: a.student.name,
          wNumber: a.student.wNumber,
          email: a.student.email,
          scheduleId: a.scheduleId,
        });
      }

      //add manually assigned students
      result.unassigned.forEach((student, idx) => {
        const schedId = manualAssignments[idx];
        if (schedId) {
          commitList.push({
            name: student.name,
            wNumber: student.wNumber,
            email: student.email,
            scheduleId: schedId,
          });
        }
      });

      if (commitList.length === 0) {
        setError("No students to import");
        setCommitting(false);
        return;
      }

      const response = await importApi.commitStudents(commitList);
      setCommittedCount(response.committed);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Failed to commit import");
    } finally {
      setCommitting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "First Name,Last Name,W Number,Email,Preferred Location,Phone,1st Choice,2nd Choice,Employed At";
    const blob = new Blob([headers + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        .sim-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 9999;
          backdrop-filter: blur(2px);
        }

        .sim-box {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          font-family: 'Inter', sans-serif;
        }

        .sim-header {
          background: #00563f;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-radius: 12px 12px 0 0;
        }

        .sim-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.2rem 0;
        }

        .sim-header p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.65);
          margin: 0;
          font-weight: 300;
        }

        .sim-close {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          color: #ffffff;
          cursor: pointer;
          padding: 0.3rem;
          display: flex;
          align-items: center;
          transition: background 0.15s;
          flex-shrink: 0;
          margin-left: 1rem;
        }

        .sim-close:hover { background: rgba(255,255,255,0.2); }

        .sim-body { padding: 1.5rem; }

        .sim-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 3px solid #dc2626;
          border-radius: 6px;
          padding: 0.6rem 0.875rem;
          margin-bottom: 1rem;
          font-size: 0.82rem;
          color: #991b1b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sim-drop-zone {
          border: 2px dashed #d1d5db;
          border-radius: 10px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s;
          background: #fafaf8;
        }

        .sim-drop-zone:hover, .sim-drop-zone.drag-over {
          border-color: #00563f;
          background: rgba(0, 86, 63, 0.04);
        }

        .sim-drop-icon {
          width: 56px;
          height: 56px;
          background: #f0faf5;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .sim-drop-zone h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          color: #0a1f14;
          margin: 0 0 0.5rem 0;
        }

        .sim-drop-zone p {
          font-size: 0.82rem;
          color: #9ca3af;
          margin: 0;
          font-weight: 300;
        }

        .sim-drop-zone .browse-link {
          color: #00563f;
          font-weight: 500;
          text-decoration: underline;
          cursor: pointer;
        }

        .sim-actions-top {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.25rem;
        }

        .sim-btn-template {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: #ffffff;
          color: #00563f;
          border: 1.5px solid #c6e8d8;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .sim-btn-template:hover { background: #f0faf5; }

        .sim-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .sim-stat {
          flex: 1;
          padding: 0.875rem;
          border-radius: 8px;
          border: 1px solid #e5e2db;
          text-align: center;
        }

        .sim-stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0a1f14;
          margin: 0;
        }

        .sim-stat-label {
          font-size: 0.72rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #9ca3af;
          margin: 0.2rem 0 0;
        }

        .sim-stat.assigned { background: #f0faf5; border-color: #c6e8d8; }
        .sim-stat.assigned .sim-stat-value { color: #00563f; }
        .sim-stat.unassigned { background: #fffbeb; border-color: #fde68a; }
        .sim-stat.unassigned .sim-stat-value { color: #92400e; }

        .sim-section-title {
          font-size: 0.78rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #6b7280;
          margin: 1.25rem 0 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .sim-table-wrap {
          overflow-x: auto;
          border: 1px solid #e5e2db;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .sim-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }

        .sim-table thead th {
          padding: 0.6rem 0.75rem;
          text-align: left;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #ffffff;
          background: #00563f;
          border-bottom: 1px solid #004d38;
          white-space: nowrap;
        }

        .sim-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
        }

        .sim-table tbody tr:last-child { border-bottom: none; }
        .sim-table tbody tr:hover { background: #fafaf8; }

        .sim-table td {
          padding: 0.6rem 0.75rem;
          color: #374151;
          vertical-align: middle;
        }

        .sim-match-badge {
          display: inline-block;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .sim-match-badge.first-choice {
          background: #f0faf5;
          color: #00563f;
          border: 1px solid #c6e8d8;
        }

        .sim-match-badge.auto {
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }

        .sim-select {
          padding: 0.4rem 0.6rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          color: #374151;
          outline: none;
          min-width: 160px;
          background: #ffffff;
        }

        .sim-select:focus {
          border-color: #00563f;
          box-shadow: 0 0 0 3px rgba(0, 86, 63, 0.1);
        }

        .sim-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
          margin-top: 0.5rem;
        }

        .sim-btn-cancel {
          padding: 0.6rem 1.25rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          color: #6b7280;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .sim-btn-cancel:hover { background: #f9fafb; color: #374151; }

        .sim-btn-commit {
          padding: 0.6rem 1.5rem;
          background: #00563f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .sim-btn-commit:hover { background: #003d2a; }
        .sim-btn-commit:disabled { background: #6b7280; cursor: not-allowed; }
        .sim-btn-commit .btn-spinner { animation: sim-btn-spin 0.7s linear infinite; }
        @keyframes sim-btn-spin { to { transform: rotate(360deg); } }

        .sim-success {
          text-align: center;
          padding: 2rem 1rem;
        }

        .sim-success-icon {
          width: 56px;
          height: 56px;
          background: #f0faf5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .sim-success h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          color: #0a1f14;
          margin: 0 0 0.5rem 0;
        }

        .sim-success p {
          font-size: 0.88rem;
          color: #6b7280;
          margin: 0 0 1.5rem 0;
          font-weight: 300;
        }

        .sim-uploading {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
          font-size: 0.88rem;
        }

        .sim-uploading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e2db;
          border-top-color: #00563f;
          border-radius: 50%;
          margin: 0 auto 1rem;
          animation: sim-spin 0.8s linear infinite;
        }

        @keyframes sim-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="sim-overlay" onClick={onClose}>
        <div className="sim-box" onClick={(e) => e.stopPropagation()}>
          <div className="sim-header">
            <div>
              <h2>
                <Upload size={16} style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
                {step === "upload" && "Import Students"}
                {step === "preview" && "Review Import"}
                {step === "done" && "Import Complete"}
              </h2>
              <p>
                {step === "upload" && "Upload a CSV or Excel file with student data"}
                {step === "preview" && `${result?.totalParsed || 0} students parsed — review assignments below`}
                {step === "done" && `${committedCount} students imported successfully`}
              </p>
            </div>
            <button className="sim-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className="sim-body">
            {error && (
              <div className="sim-error">
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {step === "upload" && (
              <>
                {uploading ? (
                  <div className="sim-uploading">
                    <div className="sim-uploading-spinner" />
                    Uploading and processing file...
                  </div>
                ) : (
                  <>
                    <div
                      className={`sim-drop-zone ${dragOver ? "drag-over" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="sim-drop-icon">
                        <FileSpreadsheet size={26} color="#00563f" />
                      </div>
                      <h3>Drop your file here</h3>
                      <p>
                        or <span className="browse-link">browse</span> to select a file
                      </p>
                      <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
                        Accepts .csv and .xlsx files
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileInput}
                        style={{ display: "none" }}
                      />
                    </div>

                    <div className="sim-actions-top">
                      <button className="sim-btn-template" onClick={downloadTemplate}>
                        <Download size={14} />
                        Download Template
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {step === "preview" && result && (
              <>
                <div className="sim-stats">
                  <div className="sim-stat">
                    <p className="sim-stat-value">{result.totalParsed}</p>
                    <p className="sim-stat-label">Total Parsed</p>
                  </div>
                  <div className="sim-stat assigned">
                    <p className="sim-stat-value">{result.assignments.length}</p>
                    <p className="sim-stat-label">Auto-Assigned</p>
                  </div>
                  <div className="sim-stat unassigned">
                    <p className="sim-stat-value">{result.unassigned.length}</p>
                    <p className="sim-stat-label">Unassigned</p>
                  </div>
                </div>

                {result.assignments.length > 0 && (
                  <>
                    <div className="sim-section-title">Auto-Assigned Students</div>
                    <div className="sim-table-wrap">
                      <table className="sim-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>W#</th>
                            <th>Email</th>
                            <th>Assigned To</th>
                            <th>Match</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.assignments.map((a, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 500, color: "#0a1f14" }}>{a.student.name}</td>
                              <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#6b7280" }}>
                                {a.student.wNumber}
                              </td>
                              <td style={{ color: "#6b7280" }}>{a.student.email}</td>
                              <td>{a.scheduleName}</td>
                              <td>
                                <span className={`sim-match-badge ${a.matchType.includes("1st") ? "first-choice" : "auto"}`}>
                                  {a.matchType}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {result.unassigned.length > 0 && (
                  <>
                    <div className="sim-section-title">
                      Unassigned Students — Select a schedule group
                    </div>
                    <div className="sim-table-wrap">
                      <table className="sim-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>W#</th>
                            <th>Email</th>
                            <th>Assign To</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.unassigned.map((student, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 500, color: "#0a1f14" }}>{student.name}</td>
                              <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#6b7280" }}>
                                {student.wNumber}
                              </td>
                              <td style={{ color: "#6b7280" }}>{student.email}</td>
                              <td>
                                <select
                                  className="sim-select"
                                  value={manualAssignments[idx] || ""}
                                  onChange={(e) =>
                                    setManualAssignments({
                                      ...manualAssignments,
                                      [idx]: parseInt(e.target.value) || 0,
                                    })
                                  }
                                >
                                  <option value="">Skip this student</option>
                                  {scheduleOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.students.length}/{s.capacity})
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <div className="sim-footer">
                  <button className="sim-btn-cancel" onClick={() => { setStep("upload"); setResult(null); setError(""); }}>
                    Back
                  </button>
                  <button
                    className="sim-btn-commit"
                    onClick={handleCommit}
                    disabled={committing}
                  >
                    {committing && <Loader2 size={14} className="btn-spinner" />}
                    {committing ? "Importing..." : `Confirm Import (${result.assignments.length + Object.values(manualAssignments).filter(v => v > 0).length} students)`}
                  </button>
                </div>
              </>
            )}

            {step === "done" && (
              <div className="sim-success">
                <div className="sim-success-icon">
                  <CheckCircle size={28} color="#00563f" />
                </div>
                <h3>Import Successful</h3>
                <p>{committedCount} students have been added to their schedule groups.</p>
                <button className="sim-btn-commit" onClick={onSuccess}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
