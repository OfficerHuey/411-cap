import { useState } from "react";
import { Plus, Search, Mail, ArrowRight, Trash2, Download, Eye, Calendar, BookOpen, Users } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Card } from "./Card";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { Tooltip } from "./Tooltip";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { Badge } from "./Badge";
import { Avatar } from "./Avatar";
import { Select } from "./Select";
import { NumberBadge } from "./NumberBadge";
import { HairlineRule } from "./HairlineRule";
import { StatTile } from "./StatTile";
import { SectionHeading } from "./SectionHeading";
import { Breadcrumbs } from "./Breadcrumbs";
import { loadingBar } from "./LoadingBar";

const sectionStyle: React.CSSProperties = { marginBottom: "4rem" };
const h2Style: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "var(--display-xs)", color: "var(--text-on-paper)", marginBottom: "0.25rem" };
const h3Style: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-widest)", color: "var(--gold-600)", textTransform: "uppercase" as const, marginBottom: "1rem", marginTop: "1.5rem" };
const rowStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "2rem" };
const hrStyle: React.CSSProperties = { border: "none", height: "1px", background: "var(--gold-400)", marginBottom: "2rem" };

const selectOptions = [
  { value: "nurs-3140", label: "NURS 3140 — Health Assessment" },
  { value: "nurs-3240", label: "NURS 3240 — Pharmacology" },
  { value: "nurs-3340", label: "NURS 3340 — Pathophysiology" },
  { value: "nurs-4140", label: "NURS 4140 — Med-Surg I" },
  { value: "nurs-4240", label: "NURS 4240 — Med-Surg II" },
  { value: "nurs-4340", label: "NURS 4340 — Pediatrics" },
  { value: "nurs-4440", label: "NURS 4440 — OB Nursing" },
  { value: "nurs-4540", label: "NURS 4540 — Mental Health" },
  { value: "nurs-4640", label: "NURS 4640 — Community Health" },
  { value: "nurs-4740", label: "NURS 4740 — Leadership" },
  { value: "nurs-4840", label: "NURS 4840 — Capstone", disabled: true },
];

export function UIDemo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState<"sm" | "md" | "lg" | "xl" | "full">("md");
  const [modalNumber, setModalNumber] = useState(true);
  const [selectVal, setSelectVal] = useState<string | null>(null);
  const [selectVal2, setSelectVal2] = useState<string | null>(null);
  const { toast } = useToast();

  return (
    <div style={{ padding: "4rem 2.5rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "var(--font-body)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--display-md)", letterSpacing: "var(--tracking-tighter)", color: "var(--text-on-paper)", marginBottom: "0.5rem" }}>
        UI Component Library
      </h1>
      <p style={{ color: "var(--text-on-paper-muted)", fontSize: "var(--text-lg)", marginBottom: "4rem" }}>
        Editorial design system components for the Nursing Scheduler
      </p>

      {/* ── section heading ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>SectionHeading</h2>
        <hr style={hrStyle} />
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          <SectionHeading
            number="01"
            title="The semesters"
            italicWord="semesters"
            subtitle="Manage your academic scheduling across all active terms"
            level="page"
            action={<Button iconLeft={<Plus size={16} />}>New Semester</Button>}
          />
          <SectionHeading
            number={2}
            title="Schedule groups"
            subtitle="Each group represents a cohort rotation"
            level="section"
          />
          <SectionHeading
            title="Clinical assignments"
            level="subsection"
            subtitle="Individual student placements"
          />
        </div>
      </section>

      {/* ── number badge ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>NumberBadge</h2>
        <hr style={hrStyle} />
        <h3 style={h3Style}>Variants</h3>
        <div style={rowStyle}>
          <NumberBadge number={1} variant="default" />
          <NumberBadge number="02" variant="gold" />
          <NumberBadge number="IV" variant="light" />
        </div>
        <h3 style={h3Style}>Sizes</h3>
        <div style={rowStyle}>
          <NumberBadge number={3} size="sm" />
          <NumberBadge number={3} size="md" />
          <NumberBadge number={3} size="lg" />
        </div>
      </section>

      {/* ── hairline rule ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>HairlineRule</h2>
        <hr style={hrStyle} />
        <p style={{ color: "var(--text-on-paper-muted)", marginBottom: "1rem" }}>Gold (default)</p>
        <HairlineRule />
        <p style={{ color: "var(--text-on-paper-muted)", marginBottom: "1rem" }}>Green</p>
        <HairlineRule color="green" />
        <p style={{ color: "var(--text-on-paper-muted)", marginBottom: "1rem" }}>Muted</p>
        <HairlineRule color="muted" />
        <p style={{ color: "var(--text-on-paper-muted)", marginBottom: "1rem" }}>50% width, tight spacing</p>
        <HairlineRule width="50%" spacing="tight" />
      </section>

      {/* ── stat tile ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>StatTile</h2>
        <hr style={hrStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <StatTile label="Active Semesters" value={2} accent="gold" trend={{ direction: "up", text: "+1 from last year" }} />
          <StatTile label="Schedules" value={6} accent="green" />
          <StatTile label="Students" value={142} trend={{ direction: "neutral", text: "Same as last term" }} />
          <StatTile label="Conflicts" value={0} accent="green" trend={{ direction: "down", text: "Resolved all" }} />
        </div>
      </section>

      {/* ── buttons ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Buttons</h2>
        <hr style={hrStyle} />

        <h3 style={h3Style}>Variants</h3>
        <div style={rowStyle}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="link">Link Button</Button>
        </div>

        <h3 style={h3Style}>Sizes</h3>
        <div style={rowStyle}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>

        <h3 style={h3Style}>With Icons</h3>
        <div style={rowStyle}>
          <Button iconLeft={<Plus size={16} />}>New Semester</Button>
          <Button variant="secondary" iconRight={<ArrowRight size={16} />}>Continue</Button>
          <Button variant="destructive" iconLeft={<Trash2 size={16} />}>Delete</Button>
          <Button variant="outline" iconLeft={<Download size={16} />}>Export</Button>
        </div>

        <h3 style={h3Style}>States</h3>
        <div style={rowStyle}>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button fullWidth>Full Width Button</Button>
        </div>
      </section>

      {/* ── inputs ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Inputs</h2>
        <hr style={hrStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", maxWidth: "700px" }}>
          <Input label="Semester Name" placeholder="e.g. Spring 2026" />
          <Input label="Email Address" placeholder="user@selu.edu" iconLeft={<Mail size={16} />} />
          <Input label="Search" placeholder="Search courses..." iconLeft={<Search size={16} />} helperText="Type at least 2 characters" />
          <Input label="W Number" placeholder="W1234567" errorText="Invalid W-Number format" />
          <Input label="Course Code" placeholder="NURS 3140" successText="Valid course code" />
          <Input label="Password" type="password" placeholder="Enter password" iconRight={<Eye size={16} />} />
        </div>
      </section>

      {/* ── select ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Select</h2>
        <hr style={hrStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", maxWidth: "700px" }}>
          <Select
            label="Course (searchable)"
            options={selectOptions}
            value={selectVal}
            onChange={setSelectVal}
            searchable
            placeholder="Search courses..."
          />
          <Select
            label="Course (standard)"
            options={selectOptions}
            value={selectVal2}
            onChange={setSelectVal2}
            placeholder="Pick a course"
          />
        </div>
      </section>

      {/* ── cards ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Cards</h2>
        <hr style={hrStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          <Card variant="flat">
            <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 0.5rem" }}>Flat Card</h3>
            <p style={{ color: "var(--text-on-paper-muted)", margin: 0, fontSize: "var(--text-sm)" }}>Subtle border, no shadow.</p>
          </Card>
          <Card variant="raised">
            <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 0.5rem" }}>Raised Card</h3>
            <p style={{ color: "var(--text-on-paper-muted)", margin: 0, fontSize: "var(--text-sm)" }}>Elevation-1 shadow. The default.</p>
          </Card>
          <Card variant="elevated">
            <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 0.5rem" }}>Elevated Card</h3>
            <p style={{ color: "var(--text-on-paper-muted)", margin: 0, fontSize: "var(--text-sm)" }}>Elevation-2 with inner highlight.</p>
          </Card>
          <Card variant="hero">
            <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 0.5rem" }}>Hero Card</h3>
            <p style={{ color: "var(--text-on-paper-muted)", margin: 0, fontSize: "var(--text-sm)" }}>Gold accent + elevation-3.</p>
          </Card>
          <Card variant="raised" accentColor="green" interactive>
            <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 0.5rem" }}>Interactive + Green</h3>
            <p style={{ color: "var(--text-on-paper-muted)", margin: 0, fontSize: "var(--text-sm)" }}>Hover to see the lift.</p>
          </Card>
          <Card variant="raised" accentColor="gold" interactive>
            <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 0.5rem" }}>Interactive + Gold</h3>
            <p style={{ color: "var(--text-on-paper-muted)", margin: 0, fontSize: "var(--text-sm)" }}>Gold accent with hover elevation.</p>
          </Card>
        </div>
      </section>

      {/* ── badge ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Badge</h2>
        <hr style={hrStyle} />
        <h3 style={h3Style}>Variants (md)</h3>
        <div style={rowStyle}>
          <Badge variant="green">Active</Badge>
          <Badge variant="gold">In Progress</Badge>
          <Badge variant="red">Conflict</Badge>
          <Badge variant="amber">Warning</Badge>
          <Badge variant="neutral">Draft</Badge>
          <Badge variant="inverse">Locked</Badge>
        </div>
        <h3 style={h3Style}>Small size</h3>
        <div style={rowStyle}>
          <Badge variant="green" size="sm">Active</Badge>
          <Badge variant="gold" size="sm">In Progress</Badge>
          <Badge variant="red" size="sm">Conflict</Badge>
          <Badge variant="amber" size="sm">Warning</Badge>
          <Badge variant="neutral" size="sm">Draft</Badge>
          <Badge variant="inverse" size="sm">Locked</Badge>
        </div>
      </section>

      {/* ── avatar ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Avatar</h2>
        <hr style={hrStyle} />
        <h3 style={h3Style}>Sizes</h3>
        <div style={rowStyle}>
          <Avatar name="Ashley Williams" size="xs" />
          <Avatar name="Ashley Williams" size="sm" />
          <Avatar name="Ashley Williams" size="md" />
          <Avatar name="Ashley Williams" size="lg" />
          <Avatar name="Ashley Williams" size="xl" />
        </div>
        <h3 style={h3Style}>Deterministic Colors</h3>
        <div style={rowStyle}>
          <Avatar name="Ashley Williams" size="lg" />
          <Avatar name="John Smith" size="lg" />
          <Avatar name="Maria Garcia" size="lg" />
          <Avatar name="Terri Crawford" size="lg" />
          <Avatar name="David Park" size="lg" />
          <Avatar name="Sarah Johnson" size="lg" />
        </div>
      </section>

      {/* ── tooltip ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Tooltip</h2>
        <hr style={hrStyle} />
        <div style={rowStyle}>
          <Tooltip content="Creates a new semester" position="top">
            <Button variant="secondary">Top tooltip</Button>
          </Tooltip>
          <Tooltip content="Navigate to the next step" position="right">
            <Button variant="secondary">Right tooltip</Button>
          </Tooltip>
          <Tooltip content="Additional information below" position="bottom">
            <Button variant="secondary">Bottom tooltip</Button>
          </Tooltip>
          <Tooltip content="Go back to previous view" position="left">
            <Button variant="secondary">Left tooltip</Button>
          </Tooltip>
        </div>
      </section>

      {/* ── skeleton ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Skeleton</h2>
        <hr style={hrStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", maxWidth: "700px" }}>
          <div>
            <h3 style={h3Style}>Text (3 lines)</h3>
            <Skeleton variant="text" count={3} />
          </div>
          <div>
            <h3 style={h3Style}>Card</h3>
            <Skeleton variant="card" />
          </div>
          <div>
            <h3 style={h3Style}>Avatar</h3>
            <Skeleton variant="avatar" />
          </div>
          <div>
            <h3 style={h3Style}>Button</h3>
            <Skeleton variant="button" />
          </div>
        </div>
      </section>

      {/* ── empty state ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>EmptyState</h2>
        <hr style={hrStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2rem" }}>
          <Card variant="flat">
            <EmptyState
              size="sm"
              icon={<Calendar size={28} />}
              title="No active semesters yet"
              description="Create your first semester to begin building schedules"
              action={<Button size="sm" iconLeft={<Plus size={14} />}>New Semester</Button>}
            />
          </Card>
          <Card variant="flat">
            <EmptyState
              size="md"
              icon={<BookOpen size={36} />}
              title="Your archive is empty"
              description="Locked semesters will appear here once the term concludes"
            />
          </Card>
          <Card variant="flat">
            <EmptyState
              size="sm"
              icon={<Users size={28} />}
              title="No students imported"
              description="Import your roster to populate schedule groups"
              action={<Button size="sm" variant="secondary">Import Roster</Button>}
            />
          </Card>
        </div>
      </section>

      {/* ── toast ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Toast</h2>
        <hr style={hrStyle} />
        <div style={rowStyle}>
          <Button variant="primary" onClick={() => toast({ type: "success", title: "Schedule saved", description: "Changes applied to Spring 2026" })}>
            Success Toast
          </Button>
          <Button variant="destructive" onClick={() => toast({ type: "error", title: "Import failed", description: "The CSV file could not be parsed" })}>
            Error Toast
          </Button>
          <Button variant="secondary" onClick={() => toast({ type: "warning", title: "Capacity exceeded", description: "Section A has 2 students over capacity" })}>
            Warning Toast
          </Button>
          <Button variant="outline" onClick={() => toast({ type: "info", title: "Semester locked", description: "Spring 2026 has been archived" })}>
            Info Toast
          </Button>
        </div>
      </section>

      {/* ── breadcrumbs ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Breadcrumbs</h2>
        <hr style={hrStyle} />
        <div style={{ border: "1px solid var(--cream-300)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <Breadcrumbs items={[
            { label: "Dashboard", href: "/" },
            { label: "Spring 2026", href: "/semester/1" },
            { label: "Schedule A" },
          ]} />
        </div>
        <div style={{ marginTop: "1rem", border: "1px solid var(--cream-300)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <Breadcrumbs items={[
            { label: "Dashboard", href: "/" },
            { label: "Rooms" },
          ]} />
        </div>
      </section>

      {/* ── loading bar ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>LoadingBar</h2>
        <hr style={hrStyle} />
        <div style={rowStyle}>
          <Button variant="secondary" onClick={() => { loadingBar.start(); setTimeout(() => loadingBar.finish(), 2000); }}>
            Trigger Loading Bar (2s)
          </Button>
        </div>
        <p style={{ color: "var(--text-on-paper-muted)", fontSize: "var(--text-sm)" }}>
          A 2px gold bar appears at the very top of the viewport.
        </p>
      </section>

      {/* ── modal ── */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Modal</h2>
        <hr style={hrStyle} />
        <div style={rowStyle}>
          {(["sm", "md", "lg", "xl"] as const).map((s) => (
            <Button
              key={s}
              variant="secondary"
              onClick={() => { setModalSize(s); setModalNumber(true); setModalOpen(true); }}
            >
              Open {s.toUpperCase()} Modal
            </Button>
          ))}
          <Button
            variant="ghost"
            onClick={() => { setModalSize("md"); setModalNumber(false); setModalOpen(true); }}
          >
            Without Number
          </Button>
        </div>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Create Semester"
          subtitle="Add a new semester to the scheduling system"
          size={modalSize}
          number={modalNumber ? "01" : undefined}
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={() => setModalOpen(false)}>Create Semester</Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <Input label="Semester Name" placeholder="e.g. Spring 2026" fullWidth />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Input label="Start Date" type="date" fullWidth />
              <Input label="End Date" type="date" fullWidth />
            </div>
            <Input label="Clinical Days" placeholder="e.g. Tues/Wed" fullWidth helperText="The clinical rotation pattern for this semester" />
          </div>
        </Modal>
      </section>
    </div>
  );
}
