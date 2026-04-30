import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  semesters as semestersApi,
  schedules as schedulesApi,
  rooms as roomsApi,
} from "../Lib/api";
import type {
  Semester,
  Schedule,
  Room,
  SurveyResponse,
  PlacementAssignment,
  PlacementStatus,
} from "../Lib/Types";
import styles from "./SurveyPlacementWorkspace.module.css";

//key-column detection aliases — we try a few common header strings so the
//app works with whatever shape the Google Form produced this semester
const KEY_COLUMN_ALIASES = {
  studentName: ["student name", "full name", "name"],
  studentId: ["w#", "w number", "student id", "banner id", "id number"],
  email: ["email address", "email"],
  timestamp: ["timestamp"],
  firstChoice: [
    "first choice",
    "1st choice",
    "top choice",
    "primary choice",
    "clinical preference",
    "first clinical choice",
  ],
} as const;

function uuid(): string {
  //simple id generator — we don't need rfc4122 for in-memory keys
  return `sr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function detectColumn(headers: string[], aliases: readonly string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias);
    if (idx >= 0) return headers[idx];
  }
  //partial match fallback — header CONTAINS any alias
  for (let i = 0; i < headers.length; i++) {
    for (const alias of aliases) {
      if (lower[i].includes(alias)) return headers[i];
    }
  }
  return null;
}

type SortDir = "asc" | "desc";
interface SortState {
  column: string;
  dir: SortDir;
}

//parse a csv via papaparse into row objects
async function parseCsv(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        const rows = (res.data as Record<string, string>[]).filter((r) =>
          Object.values(r).some((v) => v != null && String(v).trim() !== ""),
        );
        resolve({ headers, rows });
      },
      error: (err) => reject(err),
    });
  });
}

//parse an xlsx via sheetjs into row objects. takes the first sheet only.
async function parseXlsx(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const first = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(first, {
    defval: "",
    raw: false,
  });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const stringRows = rows.map((r) => {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) o[k] = v == null ? "" : String(v);
    return o;
  });
  return { headers, rows: stringRows };
}

//convert a parsed row + header list into a SurveyResponse with id
function rowsToResponses(headers: string[], rows: Record<string, string>[]): SurveyResponse[] {
  const nameCol = detectColumn(headers, KEY_COLUMN_ALIASES.studentName);
  const idCol = detectColumn(headers, KEY_COLUMN_ALIASES.studentId);
  const emailCol = detectColumn(headers, KEY_COLUMN_ALIASES.email);
  const timestampCol = detectColumn(headers, KEY_COLUMN_ALIASES.timestamp);

  return rows.map((row) => {
    const response: SurveyResponse = { id: uuid() };
    for (const h of headers) response[h] = row[h] ?? "";
    if (nameCol) response.studentName = row[nameCol];
    if (idCol) response.studentId = row[idCol];
    if (emailCol) response.email = row[emailCol];
    if (timestampCol) response.timestamp = row[timestampCol];
    return response;
  });
}

//format rows as csv and trigger a download
function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const csv = Papa.unparse({ fields: headers, data: rows });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

//map the Room type to a friendly facility label used in the dropdown
function facilityLabel(room: Room): string {
  const parts = [room.building, room.roomNumber, room.campus].filter(Boolean);
  return parts.join(" · ");
}

export function SurveyPlacementWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  //upload state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  //parsed data
  const [rawData, setRawData] = useState<SurveyResponse[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [assignments, setAssignments] = useState<Map<string, PlacementAssignment>>(new Map());

  //facility + group dropdown options
  const [rooms, setRooms] = useState<Room[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);

  //table state
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  //export state
  const [exportFilename, setExportFilename] = useState<string>("");

  //load facility + schedule dropdown data lazily (only when user is here)
  useEffect(() => {
    roomsApi.getAll().then(setRooms).catch(() => {});
    semestersApi.getAll().then(async (list) => {
      setSemesters(list);
      //fan out to collect schedule groups for active semesters only
      const active = list.filter((s) => !s.isLocked);
      try {
        const bundles = await Promise.all(
          active.map((s) => schedulesApi.getBySemester(s.id).catch(() => [] as Schedule[])),
        );
        setAllSchedules(bundles.flat());
      } catch {
        //non-blocking
      }
    }).catch(() => {});
  }, []);

  //seed the export filename once we know how many rows are in
  useEffect(() => {
    if (rawData.length > 0 && !exportFilename) {
      const semName = semesters.find((s) => !s.isLocked)?.name?.replace(/\s+/g, "_") ?? "Semester";
      setExportFilename(`StudentPlacements_${semName}_${todayIso()}`);
    }
  }, [rawData.length, semesters, exportFilename]);

  //column detection results, recomputed whenever columns change
  const detectedCols = useMemo(() => {
    return {
      name: detectColumn(columns, KEY_COLUMN_ALIASES.studentName),
      id: detectColumn(columns, KEY_COLUMN_ALIASES.studentId),
      email: detectColumn(columns, KEY_COLUMN_ALIASES.email),
      firstChoice: detectColumn(columns, KEY_COLUMN_ALIASES.firstChoice),
    };
  }, [columns]);

  //file handlers
  const handleFilePicked = (file: File) => {
    setParseError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") {
      setParseError("Only .csv and .xlsx files are supported.");
      return;
    }
    setPendingFile(file);
  };

  const handleProcessFile = async () => {
    if (!pendingFile) return;
    setProcessing(true);
    setParseError(null);
    try {
      const ext = pendingFile.name.split(".").pop()?.toLowerCase();
      const parsed = ext === "xlsx" ? await parseXlsx(pendingFile) : await parseCsv(pendingFile);
      if (parsed.rows.length === 0) {
        setParseError("No rows found in this file. Is it empty or in an unsupported format?");
        setProcessing(false);
        return;
      }
      const responses = rowsToResponses(parsed.headers, parsed.rows);
      //seed each response with a default unassigned placement so the map
      //is populated from frame 1 — saves null-checks further down
      const seed = new Map<string, PlacementAssignment>();
      responses.forEach((r) => {
        seed.set(r.id, {
          surveyResponseId: r.id,
          assignedFacility: null,
          assignedGroup: null,
          notes: "",
          status: "unassigned",
        });
      });
      setColumns(parsed.headers);
      setRawData(responses);
      setAssignments(seed);
      setFileName(pendingFile.name);
      setPendingFile(null);
      setSortState(null);
      setColumnFilters({});
      setSelectedIds(new Set());
    } catch (err: any) {
      setParseError(err?.message || "Failed to parse file.");
    } finally {
      setProcessing(false);
    }
  };

  const handleResetWorkspace = () => {
    if (rawData.length > 0 && !window.confirm("Discard the current survey data? This clears all placements you've made.")) {
      return;
    }
    setRawData([]);
    setColumns([]);
    setFileName("");
    setAssignments(new Map());
    setPendingFile(null);
    setSortState(null);
    setColumnFilters({});
    setSelectedIds(new Set());
    setExportFilename("");
  };

  //mutate a single assignment immutably
  const updateAssignment = (id: string, patch: Partial<PlacementAssignment>) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      const current = next.get(id) ?? {
        surveyResponseId: id,
        assignedFacility: null,
        assignedGroup: null,
        notes: "",
        status: "unassigned" as PlacementStatus,
      };
      const merged: PlacementAssignment = { ...current, ...patch };
      //status auto-derives from facility+group unless user has flagged it
      if (patch.status === undefined) {
        if (merged.status !== "flagged") {
          merged.status = merged.assignedFacility || merged.assignedGroup ? "assigned" : "unassigned";
        }
      }
      next.set(id, merged);
      return next;
    });
  };

  //smart sort — group rows by first-choice column value
  const handleSmartSort = () => {
    if (!detectedCols.firstChoice) {
      alert(
        "No first-choice column detected. Looked for headers containing: " +
          KEY_COLUMN_ALIASES.firstChoice.join(", "),
      );
      return;
    }
    setSortState({ column: detectedCols.firstChoice, dir: "asc" });
  };

  //filtered + sorted rows for display
  const displayedRows = useMemo(() => {
    let rows = rawData.slice();

    //per-column text filter
    const activeFilters = Object.entries(columnFilters).filter(([, v]) => v.trim() !== "");
    if (activeFilters.length > 0) {
      rows = rows.filter((r) =>
        activeFilters.every(([col, needle]) => {
          const val = (r[col] ?? "").toString().toLowerCase();
          return val.includes(needle.toLowerCase());
        }),
      );
    }

    //global search — any column contains
    if (globalSearch.trim() !== "") {
      const needle = globalSearch.toLowerCase();
      rows = rows.filter((r) =>
        columns.some((c) => (r[c] ?? "").toString().toLowerCase().includes(needle)),
      );
    }

    //sort
    if (sortState) {
      rows.sort((a, b) => {
        const av = (a[sortState.column] ?? "").toString();
        const bv = (b[sortState.column] ?? "").toString();
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
        return sortState.dir === "asc" ? cmp : -cmp;
      });
    }

    return rows;
  }, [rawData, columns, columnFilters, globalSearch, sortState]);

  //facility demand — count how many selected each facility as first choice
  const facilityDemand = useMemo(() => {
    if (!detectedCols.firstChoice) return [];
    const map = new Map<string, number>();
    rawData.forEach((r) => {
      const v = (r[detectedCols.firstChoice!] ?? "").toString().trim();
      if (v === "") return;
      map.set(v, (map.get(v) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12); //cap the list so the panel stays compact
  }, [rawData, detectedCols.firstChoice]);

  const counts = useMemo(() => {
    let assigned = 0;
    let flagged = 0;
    assignments.forEach((a) => {
      if (a.status === "assigned") assigned++;
      if (a.status === "flagged") flagged++;
    });
    return {
      total: rawData.length,
      assigned,
      unassigned: rawData.length - assigned - flagged,
      flagged,
    };
  }, [assignments, rawData.length]);

  //column sort helper — clicking the same column toggles direction
  const handleSortClick = (col: string) => {
    setSortState((prev) => {
      if (prev?.column !== col) return { column: col, dir: "asc" };
      if (prev.dir === "asc") return { column: col, dir: "desc" };
      return null; //third click clears
    });
  };

  //toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedRows.map((r) => r.id)));
    }
  };

  //exports ─────────────────────────────────────────────────────────────
  const handleExportForBuilder = () => {
    //target format matches the Mass Enrollment Template that the existing
    //StudentImportModal expects: Student Name, W#, Semester, Location Tag
    const headers = ["Student Name", "W#", "Semester", "Location Tag", "Schedule Group", "Notes"];
    const data: (string | number)[][] = rawData
      .map((r) => {
        const a = assignments.get(r.id);
        const name = (detectedCols.name ? r[detectedCols.name] : r.studentName) ?? "";
        const id = (detectedCols.id ? r[detectedCols.id] : r.studentId) ?? "";
        //derive a Location Tag from the assigned facility (H for Hammond, B
        //for Baton Rouge); admins can refine this in the export file
        const facility = a?.assignedFacility ?? "";
        let tag = "";
        if (/hammond/i.test(facility)) tag = "H";
        else if (/baton\s*rouge|br\b/i.test(facility)) tag = "B";
        const scheduleGroup = a?.assignedGroup ?? "";
        const notes = a?.notes ?? "";
        //synthesise a semester label from the assigned group if possible
        let semesterLabel = "";
        if (scheduleGroup) {
          const sched = allSchedules.find((s) => String(s.id) === scheduleGroup);
          if (sched) semesterLabel = `Semester ${sched.semesterLevel}`;
        }
        return [name, id, semesterLabel, tag, scheduleGroup, notes] as (string | number)[];
      })
      //only export assigned or flagged rows for the builder — unassigned
      //students shouldn't land in the import template
      .filter((_, i) => {
        const a = assignments.get(rawData[i].id);
        return a?.status === "assigned" || a?.status === "flagged";
      });
    downloadCsv(exportFilename || `StudentPlacements_${todayIso()}`, headers, data);
  };

  const handleExportFullReport = () => {
    const headers = [...columns, "Assigned Facility", "Assigned Group", "Notes", "Status"];
    const data: (string | number)[][] = rawData.map((r) => {
      const a = assignments.get(r.id);
      const base = columns.map((c) => (r[c] ?? "").toString());
      return [
        ...base,
        a?.assignedFacility ?? "",
        a?.assignedGroup ?? "",
        a?.notes ?? "",
        a?.status ?? "unassigned",
      ];
    });
    const nameWithSuffix = (exportFilename || `StudentPlacements_${todayIso()}`) + "_FullReport";
    downloadCsv(nameWithSuffix, headers, data);
  };

  //rendering ───────────────────────────────────────────────────────────
  const hasData = rawData.length > 0;

  return (
    <div className={styles.root}>
      {!hasData ? (
        <div className={styles.uploadCard}>
          <div
            className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFilePicked(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload survey CSV or XLSX"
          >
            <div className={styles.dropIcon}>
              <FileSpreadsheet size={30} strokeWidth={2} />
            </div>
            <p className={styles.dropTitle}>Drop your survey export here</p>
            <p className={styles.dropSub}>
              or <span className={styles.browseLink}>browse</span> to pick a file
            </p>
            <p className={styles.dropHint}>
              Accepts .CSV or .XLSX · parsed entirely in your browser
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFilePicked(f);
                //allow re-picking the same file
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
          </div>

          {pendingFile && (
            <div className={styles.previewRow}>
              <div>
                <span className={styles.previewFileName}>{pendingFile.name}</span>
                <span className={styles.previewMeta}>
                  {" · "}
                  {(pendingFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                type="button"
                className={`${styles.toolbarBtn} ${styles.toolbarBtnPrimary}`}
                onClick={handleProcessFile}
                disabled={processing}
              >
                {processing ? (
                  <>Processing…</>
                ) : (
                  <>
                    <Upload size={14} />
                    Process Survey
                  </>
                )}
              </button>
            </div>
          )}

          {parseError && (
            <div className={styles.parseError}>
              <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {parseError}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── summary stat strip ── */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{counts.total}</div>
              <div className={styles.summaryLabel}>Responses</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.assigned}`}>
              <div className={styles.summaryValue}>{counts.assigned}</div>
              <div className={styles.summaryLabel}>Assigned</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.unassigned}`}>
              <div className={styles.summaryValue}>{counts.unassigned}</div>
              <div className={styles.summaryLabel}>Unassigned</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.flagged}`}>
              <div className={styles.summaryValue}>{counts.flagged}</div>
              <div className={styles.summaryLabel}>Flagged</div>
            </div>
            {facilityDemand.length > 0 && (
              <div className={styles.demandCard}>
                <p className={styles.demandTitle}>First-choice demand</p>
                <div className={styles.demandList}>
                  {facilityDemand.map(([name, count]) => (
                    <div key={name} className={styles.demandItem} title={name}>
                      <span className={styles.demandItemName}>{name}</span>
                      <span className={styles.demandItemCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── toolbar ── */}
          <div className={styles.toolbar}>
            <input
              className={styles.toolbarSearch}
              placeholder="Search all columns…"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={handleSmartSort}
              title={
                detectedCols.firstChoice
                  ? `Group by: ${detectedCols.firstChoice}`
                  : "Unable to detect a first-choice column"
              }
              disabled={!detectedCols.firstChoice}
            >
              <Sparkles size={14} />
              Smart Sort
            </button>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${styles.toolbarBtnDanger}`}
              onClick={handleResetWorkspace}
            >
              <Trash2 size={14} />
              Clear survey
            </button>
          </div>

          {/* ── table ── */}
          <div className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={
                          displayedRows.length > 0 && selectedIds.size === displayedRows.length
                        }
                        onChange={toggleSelectAll}
                        aria-label="Select all visible rows"
                      />
                    </th>
                    {columns.map((c) => {
                      const active = sortState?.column === c;
                      return (
                        <th key={c} onClick={() => handleSortClick(c)}>
                          <div className={styles.headerTh}>
                            <span>{c}</span>
                            {active ? (
                              sortState.dir === "asc" ? (
                                <ArrowUp size={12} className={styles.sortArrowActive} />
                              ) : (
                                <ArrowDown size={12} className={styles.sortArrowActive} />
                              )
                            ) : (
                              <ArrowUpDown size={12} className={styles.sortArrow} />
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th>Assigned Facility</th>
                    <th>Schedule Group</th>
                    <th>Notes</th>
                    <th>Status</th>
                  </tr>
                  <tr className={styles.filterRow}>
                    <th />
                    {columns.map((c) => (
                      <th key={`filter-${c}`}>
                        <input
                          placeholder="Filter"
                          value={columnFilters[c] ?? ""}
                          onChange={(e) =>
                            setColumnFilters((prev) => ({ ...prev, [c]: e.target.value }))
                          }
                        />
                      </th>
                    ))}
                    <th />
                    <th />
                    <th />
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 5} className={styles.emptyTable}>
                        No rows match your filters.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row) => {
                      const a = assignments.get(row.id);
                      const status = a?.status ?? "unassigned";
                      const rowClass =
                        status === "assigned"
                          ? styles.rowAssigned
                          : status === "flagged"
                            ? styles.rowFlagged
                            : selectedIds.has(row.id)
                              ? styles.rowHighlighted
                              : "";
                      return (
                        <tr key={row.id} className={rowClass}>
                          <td className={styles.checkboxCell}>
                            <input
                              type="checkbox"
                              className={styles.checkbox}
                              checked={selectedIds.has(row.id)}
                              onChange={() => toggleSelect(row.id)}
                              aria-label="Select row"
                            />
                          </td>
                          {columns.map((c) => (
                            <td key={`${row.id}-${c}`} title={(row[c] ?? "").toString()}>
                              {(row[c] ?? "").toString()}
                            </td>
                          ))}
                          <td>
                            <select
                              className={styles.cellSelect}
                              value={a?.assignedFacility ?? ""}
                              onChange={(e) =>
                                updateAssignment(row.id, {
                                  assignedFacility: e.target.value || null,
                                })
                              }
                            >
                              <option value="">— Select facility —</option>
                              {rooms.map((r) => (
                                <option key={r.id} value={facilityLabel(r)}>
                                  {facilityLabel(r)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className={styles.cellSelect}
                              value={a?.assignedGroup ?? ""}
                              onChange={(e) =>
                                updateAssignment(row.id, {
                                  assignedGroup: e.target.value || null,
                                })
                              }
                            >
                              <option value="">— Select group —</option>
                              {allSchedules.map((s) => (
                                <option key={s.id} value={String(s.id)}>
                                  {s.name} (Sem {s.semesterLevel})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              className={styles.cellInput}
                              value={a?.notes ?? ""}
                              onChange={(e) =>
                                updateAssignment(row.id, { notes: e.target.value })
                              }
                              placeholder="Notes…"
                            />
                          </td>
                          <td>
                            <select
                              className={styles.cellSelect}
                              value={status}
                              onChange={(e) =>
                                updateAssignment(row.id, {
                                  status: e.target.value as PlacementStatus,
                                })
                              }
                            >
                              <option value="unassigned">Unassigned</option>
                              <option value="assigned">Assigned</option>
                              <option value="flagged">Flagged</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── export panel ── */}
          <div className={styles.exportPanel}>
            <p className={styles.exportTitle}>Export placements</p>
            <div className={styles.exportRow}>
              <input
                className={styles.exportFilename}
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                placeholder="Filename (without .csv)"
              />
              <button
                type="button"
                className={`${styles.toolbarBtn} ${styles.toolbarBtnPrimary}`}
                onClick={handleExportForBuilder}
              >
                <Download size={14} />
                Export for Schedule Builder
              </button>
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={handleExportFullReport}
              >
                <Download size={14} />
                Export Full Report
              </button>
            </div>
            <p className={styles.exportHint}>
              Source file: <strong>{fileName}</strong> · Schedule Builder export includes
              only rows marked Assigned or Flagged. Full Report includes every row with
              every original column plus your placement columns.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
