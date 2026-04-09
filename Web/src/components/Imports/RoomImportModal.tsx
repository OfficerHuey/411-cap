import { useRef, useState } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Loader2 } from "lucide-react";
import { importRooms } from "../../Lib/api";
import type { RoomImportResult, CommitRoom } from "../../Lib/api";

interface RoomImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "upload" | "preview" | "done";

export function RoomImportModal({ onClose, onSuccess }: RoomImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RoomImportResult | null>(null);
  const [committedResult, setCommittedResult] = useState<{ inserted: number; updated: number } | null>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx") {
      setError("Only .xlsx files are supported");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const data = await importRooms.upload(file);
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
    if (!result || result.valid.length === 0) return;
    setError("");
    setCommitting(true);

    try {
      const commitList: CommitRoom[] = result.valid.map((row) => ({
        number: row.number,
        building: row.building,
        campus: row.campus,
        capacity: row.capacity,
        type: row.type,
      }));

      const response = await importRooms.commit(commitList);
      setCommittedResult(response);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Failed to commit import");
    } finally {
      setCommitting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      await importRooms.downloadTemplate();
    } catch {
      setError("Failed to download template");
    }
  };

  return (
    <>
      <style>{`
        .rim-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 1.5rem; z-index: 9999; backdrop-filter: blur(2px); }
        .rim-box { background: #ffffff; border-radius: 12px; width: 100%; max-width: 720px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.2); font-family: 'Inter', sans-serif; }
        .rim-header { background: #00563f; padding: 1.25rem 1.5rem; display: flex; align-items: flex-start; justify-content: space-between; border-radius: 12px 12px 0 0; }
        .rim-header h2 { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 600; color: #ffffff; margin: 0 0 0.2rem 0; }
        .rim-header p { font-size: 0.8rem; color: rgba(255,255,255,0.65); margin: 0; font-weight: 300; }
        .rim-close { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #ffffff; cursor: pointer; padding: 0.3rem; display: flex; align-items: center; transition: background 0.15s; flex-shrink: 0; margin-left: 1rem; }
        .rim-close:hover { background: rgba(255,255,255,0.2); }
        .rim-body { padding: 1.5rem; }
        .rim-error { background: #fef2f2; border: 1px solid #fecaca; border-left: 3px solid #dc2626; border-radius: 6px; padding: 0.6rem 0.875rem; margin-bottom: 1rem; font-size: 0.82rem; color: #991b1b; display: flex; align-items: center; gap: 0.5rem; }
        .rim-drop-zone { border: 2px dashed #d1d5db; border-radius: 10px; padding: 3rem 2rem; text-align: center; cursor: pointer; transition: all 0.15s; background: #fafaf8; }
        .rim-drop-zone:hover, .rim-drop-zone.drag-over { border-color: #00563f; background: rgba(0,86,63,0.04); }
        .rim-drop-icon { width: 56px; height: 56px; background: #f0faf5; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
        .rim-drop-zone h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #0a1f14; margin: 0 0 0.5rem 0; }
        .rim-drop-zone p { font-size: 0.82rem; color: #9ca3af; margin: 0; font-weight: 300; }
        .rim-drop-zone .browse-link { color: #00563f; font-weight: 500; text-decoration: underline; cursor: pointer; }
        .rim-actions-top { display: flex; justify-content: center; gap: 1rem; margin-top: 1.25rem; }
        .rim-btn-template { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; background: #ffffff; color: #00563f; border: 1.5px solid #c6e8d8; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .rim-btn-template:hover { background: #f0faf5; }
        .rim-stats { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
        .rim-stat { flex: 1; padding: 0.875rem; border-radius: 8px; border: 1px solid #e5e2db; text-align: center; }
        .rim-stat-value { font-size: 1.5rem; font-weight: 600; color: #0a1f14; margin: 0; }
        .rim-stat-label { font-size: 0.72rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; color: #9ca3af; margin: 0.2rem 0 0; }
        .rim-stat.valid { background: #f0faf5; border-color: #c6e8d8; }
        .rim-stat.valid .rim-stat-value { color: #00563f; }
        .rim-stat.errors { background: #fef2f2; border-color: #fecaca; }
        .rim-stat.errors .rim-stat-value { color: #991b1b; }
        .rim-section-title { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin: 1.25rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #f3f4f6; }
        .rim-table-wrap { overflow-x: auto; border: 1px solid #e5e2db; border-radius: 8px; margin-bottom: 1rem; }
        .rim-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .rim-table thead th { padding: 0.6rem 0.75rem; text-align: left; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #ffffff; background: #00563f; border-bottom: 1px solid #004d38; white-space: nowrap; }
        .rim-table tbody tr { border-bottom: 1px solid #f3f4f6; }
        .rim-table tbody tr:last-child { border-bottom: none; }
        .rim-table tbody tr:hover { background: #fafaf8; }
        .rim-table td { padding: 0.6rem 0.75rem; color: #374151; vertical-align: middle; }
        .rim-error-row { background: #fef2f2 !important; }
        .rim-campus-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 500; white-space: nowrap; background: #f0faf5; color: #065f46; border: 1px solid #a7f3d0; }
        .rim-type-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 500; white-space: nowrap; }
        .rim-type-badge.Lecture { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
        .rim-type-badge.Lab { background: #f0faf5; color: #065f46; border: 1px solid #a7f3d0; }
        .rim-type-badge.SimLab { background: #fdf4ff; color: #7c3aed; border: 1px solid #e9d5ff; }
        .rim-type-badge.Clinical { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .rim-type-badge.Online { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
        .rim-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid #f3f4f6; margin-top: 0.5rem; }
        .rim-btn-cancel { padding: 0.6rem 1.25rem; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #ffffff; color: #6b7280; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .rim-btn-cancel:hover { background: #f9fafb; color: #374151; }
        .rim-btn-commit { padding: 0.6rem 1.5rem; background: #00563f; color: #ffffff; border: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .rim-btn-commit:hover { background: #003d2a; }
        .rim-btn-commit:disabled { background: #6b7280; cursor: not-allowed; }
        .rim-btn-commit .btn-spinner { animation: rim-spin 0.7s linear infinite; }
        @keyframes rim-spin { to { transform: rotate(360deg); } }
        .rim-success { text-align: center; padding: 2rem 1rem; }
        .rim-success-icon { width: 56px; height: 56px; background: #f0faf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
        .rim-success h3 { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: #0a1f14; margin: 0 0 0.5rem 0; }
        .rim-success p { font-size: 0.88rem; color: #6b7280; margin: 0 0 1.5rem 0; font-weight: 300; }
        .rim-uploading { text-align: center; padding: 2rem; color: #6b7280; font-size: 0.88rem; }
        .rim-uploading-spinner { width: 40px; height: 40px; border: 3px solid #e5e2db; border-top-color: #00563f; border-radius: 50%; margin: 0 auto 1rem; animation: rim-spin 0.8s linear infinite; }
      `}</style>

      <div className="rim-overlay" onClick={onClose}>
        <div className="rim-box" onClick={(e) => e.stopPropagation()}>
          <div className="rim-header">
            <div>
              <h2>
                <Upload size={16} style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
                {step === "upload" && "Import Rooms"}
                {step === "preview" && "Review Import"}
                {step === "done" && "Import Complete"}
              </h2>
              <p>
                {step === "upload" && "Upload an Excel file with the room import template format"}
                {step === "preview" && `${result?.totalParsed || 0} rows parsed — review below`}
                {step === "done" && `${committedResult?.inserted ?? 0} inserted, ${committedResult?.updated ?? 0} updated`}
              </p>
            </div>
            <button className="rim-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className="rim-body">
            {error && (
              <div className="rim-error">
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {step === "upload" && (
              <>
                {uploading ? (
                  <div className="rim-uploading">
                    <div className="rim-uploading-spinner" />
                    Uploading and processing file...
                  </div>
                ) : (
                  <>
                    <div
                      className={`rim-drop-zone ${dragOver ? "drag-over" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="rim-drop-icon">
                        <FileSpreadsheet size={26} color="#00563f" />
                      </div>
                      <h3>Drop your file here</h3>
                      <p>
                        or <span className="browse-link">browse</span> to select a file
                      </p>
                      <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
                        Accepts .xlsx — columns: Number, Building, Campus, Capacity, Type
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileInput}
                        style={{ display: "none" }}
                      />
                    </div>

                    <div className="rim-actions-top">
                      <button className="rim-btn-template" onClick={downloadTemplate}>
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
                <div className="rim-stats">
                  <div className="rim-stat">
                    <p className="rim-stat-value">{result.totalParsed}</p>
                    <p className="rim-stat-label">Total Parsed</p>
                  </div>
                  <div className="rim-stat valid">
                    <p className="rim-stat-value">{result.valid.length}</p>
                    <p className="rim-stat-label">Valid</p>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="rim-stat errors">
                      <p className="rim-stat-value">{result.errors.length}</p>
                      <p className="rim-stat-label">Errors</p>
                    </div>
                  )}
                </div>

                {result.errors.length > 0 && (
                  <>
                    <div className="rim-section-title">Validation Errors</div>
                    <div className="rim-table-wrap">
                      <table className="rim-table">
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>Field</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.errors.map((err, i) => (
                            <tr key={i} className="rim-error-row">
                              <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{err.row}</td>
                              <td>{err.field}</td>
                              <td style={{ color: "#991b1b" }}>{err.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {result.valid.length > 0 && (
                  <>
                    <div className="rim-section-title">Valid Rooms</div>
                    <div className="rim-table-wrap">
                      <table className="rim-table">
                        <thead>
                          <tr>
                            <th>Number</th>
                            <th>Building</th>
                            <th>Campus</th>
                            <th>Capacity</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.valid.map((row, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 500, color: "#0a1f14" }}>{row.number}</td>
                              <td>{row.building}</td>
                              <td>
                                <span className="rim-campus-badge">{row.campus}</span>
                              </td>
                              <td style={{ fontFamily: "monospace" }}>{row.capacity}</td>
                              <td>
                                <span className={`rim-type-badge ${row.type}`}>{row.type}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <div className="rim-footer">
                  <button className="rim-btn-cancel" onClick={() => { setStep("upload"); setResult(null); setError(""); }}>
                    Back
                  </button>
                  <button
                    className="rim-btn-commit"
                    onClick={handleCommit}
                    disabled={committing || result.valid.length === 0}
                  >
                    {committing && <Loader2 size={14} className="btn-spinner" />}
                    {committing ? "Importing..." : `Confirm Import (${result.valid.length} rooms)`}
                  </button>
                </div>
              </>
            )}

            {step === "done" && committedResult && (
              <div className="rim-success">
                <div className="rim-success-icon">
                  <CheckCircle size={28} color="#00563f" />
                </div>
                <h3>Import Successful</h3>
                <p>
                  {committedResult.inserted} new room{committedResult.inserted !== 1 ? "s" : ""} added
                  {committedResult.updated > 0 && `, ${committedResult.updated} updated`}.
                </p>
                <button className="rim-btn-commit" onClick={onSuccess}>
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
