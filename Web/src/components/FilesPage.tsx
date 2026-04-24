import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  Eye,
  Pencil,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File as FileIcon,
  LayoutGrid,
  List,
  AlertCircle,
} from "lucide-react";
import { filesApi } from "../Lib/api";
import type { AppFileDTO } from "../Lib/Types";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useToast } from "../Lib/ToastContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { physics, cardVariants, staggerContainer } from "../Lib/motion";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { Badge } from "./ui/Badge";
import styles from "./FilesPage.module.css";

type SortBy = "uploadedAt" | "fileName" | "fileSize";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "list";

const TEXT_EXTENSIONS = new Set([".txt", ".csv"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const PDF_EXTENSIONS = new Set([".pdf"]);

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

//category decides the icon + icon-box color on cards
type FileCategory = "pdf" | "spreadsheet" | "image" | "doc" | "other";

function categorize(file: AppFileDTO): FileCategory {
  const ext = fileExt(file.originalFileName);
  if (ext === ".pdf") return "pdf";
  if (ext === ".xlsx" || ext === ".xls" || ext === ".csv") return "spreadsheet";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (ext === ".docx" || ext === ".doc" || ext === ".txt") return "doc";
  return "other";
}

function renderIcon(category: FileCategory, size = 20) {
  switch (category) {
    case "pdf": return <FileText size={size} />;
    case "spreadsheet": return <FileSpreadsheet size={size} />;
    case "image": return <ImageIcon size={size} />;
    case "doc": return <FileText size={size} />;
    default: return <FileIcon size={size} />;
  }
}

//decide how the viewer should render a file
type ViewerMode = "pdf" | "image" | "text" | "unsupported";

function viewerModeFor(file: AppFileDTO): ViewerMode {
  const ext = fileExt(file.originalFileName);
  if (PDF_EXTENSIONS.has(ext)) return "pdf";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (TEXT_EXTENSIONS.has(ext)) return "text";
  return "unsupported";
}

export function FilesPage() {
  const { addToast } = useToast();
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const reduced = useReducedMotion();

  const [files, setFiles] = useState<AppFileDTO[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("uploadedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [view, setView] = useState<ViewMode>("grid");

  //upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  //viewer modal state
  const [viewerFile, setViewerFile] = useState<AppFileDTO | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerText, setViewerText] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState("");

  //edit modal state
  const [editFile, setEditFile] = useState<AppFileDTO | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  //delete confirm state
  const [deleteFile, setDeleteFile] = useState<AppFileDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  //breadcrumbs
  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard", href: "/" }, { label: "Files" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  //debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 280);
    return () => clearTimeout(t);
  }, [searchInput]);

  //load list whenever search/sort changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await filesApi.list({
          search: debouncedSearch || undefined,
          sortBy,
          sortDir,
          page: 1,
          pageSize: 100,
        });
        if (cancelled) return;
        setFiles(res.items);
        setTotalCount(res.totalCount);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load files.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, sortBy, sortDir]);

  //clean up viewer blob url when viewer closes or file changes
  useEffect(() => {
    return () => {
      if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    };
  }, [viewerUrl]);

  //upload handlers ──────────────────────────────────────────────────────
  const handleFilePicked = (file: File) => {
    setUploadError("");
    setPendingUpload(file);
    //pre-fill title with the filename stem if empty
    if (!uploadTitle) {
      const stem = file.name.replace(/\.[^.]+$/, "");
      setUploadTitle(stem);
    }
  };

  const handleUploadSubmit = async () => {
    if (!pendingUpload) return;
    try {
      setUploadError("");
      setUploading(true);
      const created = await filesApi.upload(
        pendingUpload,
        uploadTitle.trim() || undefined,
        uploadDesc.trim() || undefined,
      );
      setFiles((prev) => [created, ...prev]);
      setTotalCount((n) => n + 1);
      addToast("success", "File uploaded");
      //reset modal state
      setUploadOpen(false);
      setPendingUpload(null);
      setUploadTitle("");
      setUploadDesc("");
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const resetUploadModal = () => {
    setUploadOpen(false);
    setPendingUpload(null);
    setUploadTitle("");
    setUploadDesc("");
    setUploadError("");
    setDragOver(false);
  };

  //viewer handlers ──────────────────────────────────────────────────────
  const openViewer = async (file: AppFileDTO) => {
    //clean up any previous viewer blob first
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    setViewerUrl(null);
    setViewerText(null);
    setViewerError("");
    setViewerFile(file);

    const mode = viewerModeFor(file);
    if (mode === "unsupported") return;

    try {
      setViewerLoading(true);
      const { url, blob } = await filesApi.previewUrl(file.id);
      //for text files, read the blob as text; for pdf/image, iframe/img
      //uses the blob url directly
      if (mode === "text") {
        const text = await blob.text();
        setViewerText(text);
        //still keep the url around for "download from viewer" paths even
        //though we don't embed it; revoke on close keeps memory tidy
        setViewerUrl(url);
      } else {
        setViewerUrl(url);
      }
    } catch (err: any) {
      setViewerError(err?.message || "Failed to load file preview.");
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    setViewerUrl(null);
    setViewerText(null);
    setViewerError("");
    setViewerFile(null);
  };

  const handleDownload = async (file: AppFileDTO) => {
    try {
      await filesApi.downloadToDisk(file.id, file.originalFileName);
    } catch (err: any) {
      addToast("error", err?.message || "Download failed");
    }
  };

  //edit handlers ────────────────────────────────────────────────────────
  const openEdit = (file: AppFileDTO) => {
    setEditFile(file);
    setEditTitle(file.title ?? "");
    setEditDesc(file.description ?? "");
  };

  const handleEditSave = async () => {
    if (!editFile) return;
    try {
      setEditSaving(true);
      const updated = await filesApi.update(editFile.id, {
        title: editTitle.trim() || null,
        description: editDesc.trim() || null,
      });
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      addToast("success", "File updated");
      setEditFile(null);
    } catch (err: any) {
      addToast("error", err?.message || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  //delete handlers ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteFile) return;
    try {
      setDeleting(true);
      await filesApi.delete(deleteFile.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteFile.id));
      setTotalCount((n) => Math.max(0, n - 1));
      addToast("success", "File deleted");
      setDeleteFile(null);
    } catch (err: any) {
      addToast("error", err?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  //derived
  const viewerMode = viewerFile ? viewerModeFor(viewerFile) : null;

  const sortOptionLabel = useMemo(() => {
    const map: Record<SortBy, string> = {
      uploadedAt: "Upload date",
      fileName: "File name",
      fileSize: "File size",
    };
    return map;
  }, []);

  return (
    <div className={styles.root}>
      {/* hero */}
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Files <em>Library</em>
          </h1>
          <p className={styles.heroSubtitle}>
            Manage your documents and resources — {totalCount} file{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
        <button className={styles.heroUploadBtn} onClick={() => setUploadOpen(true)}>
          <Upload size={16} />
          Upload File
        </button>
      </div>

      {/* toolbar */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by file name, title, or description…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className={styles.sortSelect}
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => {
            const [by, dir] = e.target.value.split(":");
            setSortBy(by as SortBy);
            setSortDir(dir as SortDir);
          }}
          aria-label="Sort files"
        >
          <option value="uploadedAt:desc">{sortOptionLabel.uploadedAt} (newest)</option>
          <option value="uploadedAt:asc">{sortOptionLabel.uploadedAt} (oldest)</option>
          <option value="fileName:asc">{sortOptionLabel.fileName} (A-Z)</option>
          <option value="fileName:desc">{sortOptionLabel.fileName} (Z-A)</option>
          <option value="fileSize:desc">{sortOptionLabel.fileSize} (largest)</option>
          <option value="fileSize:asc">{sortOptionLabel.fileSize} (smallest)</option>
        </select>
        <div className={styles.viewToggle} role="tablist" aria-label="Layout">
          <button
            type="button"
            role="tab"
            aria-selected={view === "grid"}
            className={`${styles.viewToggleBtn} ${view === "grid" ? styles.viewToggleActive : ""}`}
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "list"}
            className={`${styles.viewToggleBtn} ${view === "list" ? styles.viewToggleActive : ""}`}
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.uploadError} style={{ marginBottom: "1rem" }}>
          <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          {error}
        </div>
      )}

      {/* content */}
      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="custom" height="170px" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <FileIcon size={30} strokeWidth={2} />
          </div>
          <p className={styles.emptyTitle}>
            {debouncedSearch ? "No files match your search" : "No files yet"}
          </p>
          <p className={styles.emptyText}>
            {debouncedSearch
              ? "Try a different search term."
              : "Upload your first document to get started."}
          </p>
        </div>
      ) : view === "grid" ? (
        <motion.div
          className={styles.grid}
          variants={reduced ? undefined : staggerContainer(0.04)}
          initial="hidden"
          animate="visible"
        >
          {files.map((f) => {
            const category = categorize(f);
            return (
              <motion.div
                key={f.id}
                className={styles.card}
                variants={reduced ? undefined : cardVariants}
                whileHover={reduced ? undefined : { y: -5, scale: 1.01, transition: physics.magnetic }}
                whileTap={reduced ? undefined : { scale: 0.995, transition: physics.instant }}
              >
                <div className={styles.cardTop}>
                  <div className={`${styles.cardIcon} ${styles[category]}`}>
                    {renderIcon(category, 22)}
                  </div>
                  <div className={styles.cardHeaderText}>
                    <p className={styles.cardFileName} title={f.originalFileName}>
                      {f.originalFileName}
                    </p>
                    <p className={styles.cardMeta}>
                      {formatBytes(f.fileSizeBytes)} · {formatDate(f.uploadedAt)}
                    </p>
                  </div>
                </div>
                {f.title && <p className={styles.cardTitle}>{f.title}</p>}
                {f.description && <p className={styles.cardDescription}>{f.description}</p>}
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}
                    onClick={() => openViewer(f)}
                  >
                    <Eye size={13} />
                    View
                  </button>
                  <button
                    type="button"
                    className={styles.cardBtn}
                    onClick={() => handleDownload(f)}
                  >
                    <Download size={13} />
                    Download
                  </button>
                  <button
                    type="button"
                    className={styles.cardBtn}
                    onClick={() => openEdit(f)}
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`${styles.cardBtn} ${styles.cardBtnDanger}`}
                    onClick={() => setDeleteFile(f)}
                    aria-label={`Delete ${f.originalFileName}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded by</th>
                <th>Date</th>
                <th className={styles.rowActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => {
                const category = categorize(f);
                const ext = fileExt(f.originalFileName).replace(".", "").toUpperCase();
                return (
                  <tr key={f.id}>
                    <td>
                      <span className={styles.rowIcon}>
                        <span className={`${styles.cardIcon} ${styles[category]}`} style={{ width: 30, height: 30 }}>
                          {renderIcon(category, 16)}
                        </span>
                        <span title={f.originalFileName}>{f.originalFileName}</span>
                      </span>
                    </td>
                    <td>{f.title || <span style={{ color: "var(--text-on-paper-muted)" }}>—</span>}</td>
                    <td>
                      <Badge variant="gold" size="sm">{ext || "FILE"}</Badge>
                    </td>
                    <td>{formatBytes(f.fileSizeBytes)}</td>
                    <td>{f.uploadedByName}</td>
                    <td>{formatDate(f.uploadedAt)}</td>
                    <td className={styles.rowActions}>
                      <button
                        type="button"
                        className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}
                        onClick={() => openViewer(f)}
                      >
                        <Eye size={13} /> View
                      </button>
                      {" "}
                      <button
                        type="button"
                        className={styles.cardBtn}
                        onClick={() => handleDownload(f)}
                      >
                        <Download size={13} />
                      </button>
                      {" "}
                      <button
                        type="button"
                        className={styles.cardBtn}
                        onClick={() => openEdit(f)}
                      >
                        <Pencil size={13} />
                      </button>
                      {" "}
                      <button
                        type="button"
                        className={`${styles.cardBtn} ${styles.cardBtnDanger}`}
                        onClick={() => setDeleteFile(f)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── upload modal ── */}
      <Modal
        open={uploadOpen}
        onClose={resetUploadModal}
        title="Upload a file"
        subtitle="Accepts PDF, DOCX, XLSX, CSV, PNG, JPG, JPEG, TXT"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={resetUploadModal} disabled={uploading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadSubmit}
              disabled={!pendingUpload || uploading}
            >
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </>
        }
      >
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
          aria-label="Pick or drop a file"
        >
          <div className={styles.dropIcon}>
            <Upload size={26} strokeWidth={2} />
          </div>
          <p className={styles.dropTitle}>Drop a file here</p>
          <p className={styles.dropSub}>
            or <span className={styles.browseLink}>browse</span> to select
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg,.txt"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFilePicked(f);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        </div>

        {pendingUpload && (
          <>
            <div className={styles.pickedFile}>
              <span className={styles.pickedFileName}>{pendingUpload.name}</span>
              <span className={styles.pickedFileSize}>
                {formatBytes(pendingUpload.size)}
              </span>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Title (optional)</label>
              <input
                className={styles.formInput}
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Short display title"
                maxLength={255}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Description (optional)</label>
              <textarea
                className={styles.formTextarea}
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="What's in this file? Why was it uploaded?"
                maxLength={1000}
              />
            </div>
          </>
        )}

        {uploading && (
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: "90%" }} />
          </div>
        )}

        {uploadError && (
          <div className={styles.uploadError}>
            <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
            {uploadError}
          </div>
        )}
      </Modal>

      {/* ── viewer modal ── */}
      <Modal
        open={viewerFile != null}
        onClose={closeViewer}
        title={viewerFile?.originalFileName ?? "Preview"}
        subtitle={viewerFile ? `${formatBytes(viewerFile.fileSizeBytes)} · ${formatDate(viewerFile.uploadedAt)}` : ""}
        size="xl"
        footer={
          viewerFile ? (
            <>
              <Button variant="outline" onClick={closeViewer}>Close</Button>
              <Button variant="primary" onClick={() => handleDownload(viewerFile)}>
                <Download size={14} /> Download
              </Button>
            </>
          ) : null
        }
      >
        {viewerFile && (
          <>
            <div className={styles.viewerHeader}>
              <span className={styles.viewerFileName}>
                {viewerFile.title || viewerFile.originalFileName}
              </span>
              <span className={styles.viewerMeta}>
                {fileExt(viewerFile.originalFileName).replace(".", "").toUpperCase() || "FILE"}
                {" · "}
                {viewerFile.uploadedByName}
              </span>
            </div>
            <div className={styles.viewerBody}>
              {viewerLoading ? (
                <div className={styles.viewerFallback}>Loading preview…</div>
              ) : viewerError ? (
                <div className={styles.viewerFallback}>
                  <p>{viewerError}</p>
                  <Button variant="primary" onClick={() => handleDownload(viewerFile)}>
                    <Download size={14} /> Download instead
                  </Button>
                </div>
              ) : viewerMode === "pdf" && viewerUrl ? (
                <iframe
                  className={styles.viewerIframe}
                  src={viewerUrl}
                  title={viewerFile.originalFileName}
                />
              ) : viewerMode === "image" && viewerUrl ? (
                <img
                  className={styles.viewerImage}
                  src={viewerUrl}
                  alt={viewerFile.originalFileName}
                />
              ) : viewerMode === "text" && viewerText != null ? (
                <pre className={styles.viewerText}>{viewerText}</pre>
              ) : (
                <div className={styles.viewerFallback}>
                  <p>Preview isn't available for this file type.</p>
                  <Button variant="primary" onClick={() => handleDownload(viewerFile)}>
                    <Download size={14} /> Download to view
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* ── edit metadata modal ── */}
      <Modal
        open={editFile != null}
        onClose={() => setEditFile(null)}
        title="Edit file details"
        subtitle={editFile?.originalFileName ?? ""}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditFile(null)} disabled={editSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        {editFile && (
          <>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Title</label>
              <input
                className={styles.formInput}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={255}
                placeholder="Title"
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Description</label>
              <textarea
                className={styles.formTextarea}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                maxLength={1000}
                placeholder="Description"
              />
            </div>
          </>
        )}
      </Modal>

      {/* ── delete confirmation modal ── */}
      <Modal
        open={deleteFile != null}
        onClose={() => setDeleteFile(null)}
        title="Delete file?"
        subtitle={deleteFile?.originalFileName ?? ""}
        size="sm"
        number="ATTENTION"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteFile(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete File"}
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-on-paper-muted)", lineHeight: 1.6, margin: 0 }}>
          This will soft-delete the file. The underlying bytes stay on disk so
          an admin can restore it if needed, but it'll disappear from the
          library listing for everyone.
        </p>
      </Modal>
    </div>
  );
}
