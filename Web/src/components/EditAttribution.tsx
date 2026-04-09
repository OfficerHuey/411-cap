import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { changelog } from "../Lib/api";
import { Tooltip } from "./ui/Tooltip";
import styles from "./EditAttribution.module.css";

interface EditAttributionProps {
  entityType: string;
  entityId: number;
}

interface AttrData {
  performedBy: string;
  timestamp: string;
}

export function EditAttribution({ entityType, entityId }: EditAttributionProps) {
  const [data, setData] = useState<AttrData | null>(null);

  useEffect(() => {
    if (!entityId) return;
    changelog.latest(entityType, entityId)
      .then((d) => setData(d ?? null))
      .catch(() => {});
  }, [entityType, entityId]);

  if (!data) return null;

  const relative = formatDistanceToNow(new Date(data.timestamp), { addSuffix: true });
  const full = new Date(data.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Tooltip content={full} position="top">
      <span className={styles.tag}>
        edited by {data.performedBy} &middot; {relative}
      </span>
    </Tooltip>
  );
}
