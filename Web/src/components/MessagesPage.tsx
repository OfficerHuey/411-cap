import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Send, ArrowLeft, Users as UsersIcon } from "lucide-react";
import { messagingApi, profile } from "../Lib/api";
import type {
  ConversationDTO,
  MessageDTO,
  AvailableUserDTO,
} from "../Lib/Types";
import { useBreadcrumbs } from "../Lib/BreadcrumbContext";
import { useToast } from "../Lib/ToastContext";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import styles from "./MessagesPage.module.css";

//relative time helper — "2m", "3h", "Yesterday", "Apr 15"
function timeAgo(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = now - then;
    if (diff < 60_000) return "now";
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const d = new Date(then);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function formatClockTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDateHeader(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (sameDay(d, today)) return "Today";
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

function dayKey(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  } catch {
    return iso;
  }
}

//derive a display name for the conversation. groups use Title; DMs use the
//other participant's display name.
function conversationLabel(c: ConversationDTO, myUserId: number | null): string {
  if (c.title && c.title.trim()) return c.title;
  const others = c.participants.filter((p) => p.userId !== myUserId);
  if (others.length === 0) return c.participants[0]?.displayName ?? "Conversation";
  if (others.length === 1) return others[0].displayName;
  return others.map((p) => p.displayName.split(" ")[0]).join(", ");
}

export function MessagesPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const activeId = conversationId ? parseInt(conversationId, 10) : null;
  const { setItems: setBreadcrumbs } = useBreadcrumbs();
  const { addToast } = useToast();

  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [convSearch, setConvSearch] = useState("");

  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [activeConv, setActiveConv] = useState<ConversationDTO | null>(null);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);

  const [myUserId, setMyUserId] = useState<number | null>(null);

  const threadRef = useRef<HTMLDivElement | null>(null);
  //remember whether the user is pinned to the bottom so auto-scroll
  //doesn't yank them upward while they're reading back through history
  const pinnedToBottomRef = useRef(true);

  //breadcrumbs
  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard", href: "/" }, { label: "Messages" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  //get my user id once — used to distinguish own messages from others'
  useEffect(() => {
    profile.getMe()
      .then((p) => setMyUserId(p.id))
      .catch(() => {});
  }, []);

  //load conversation list
  const loadConversations = useCallback(async () => {
    try {
      const list = await messagingApi.listConversations();
      setConversations(list);
    } catch (err: any) {
      addToast("error", err?.message || "Failed to load conversations");
    } finally {
      setConvsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  //update activeConv whenever the URL id or conversations list changes
  useEffect(() => {
    if (activeId == null) {
      setActiveConv(null);
      setMessages([]);
      return;
    }
    const match = conversations.find((c) => c.id === activeId);
    if (match) setActiveConv(match);
  }, [activeId, conversations]);

  //load messages when active conversation changes. also mark as read
  useEffect(() => {
    if (activeId == null) return;
    let cancelled = false;
    (async () => {
      try {
        setMsgsLoading(true);
        const res = await messagingApi.getMessages(activeId, 1, 200);
        if (cancelled) return;
        setMessages(res.items);
        //on switch to a conversation, always snap to the bottom
        pinnedToBottomRef.current = true;
      } catch (err: any) {
        if (!cancelled) addToast("error", err?.message || "Failed to load messages");
      } finally {
        if (!cancelled) setMsgsLoading(false);
      }
      //fire-and-forget mark-as-read — refresh conversations so the badge clears
      try {
        await messagingApi.markRead(activeId);
        if (!cancelled) loadConversations();
      } catch {
        //non-blocking
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, addToast, loadConversations]);

  //polling — 5s for the active thread, 15s for conversation list.
  //pause when the browser tab is hidden to save battery + api hits
  useEffect(() => {
    if (activeId == null) return;
    const tick = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await messagingApi.getMessages(activeId, 1, 200);
        setMessages((prev) => {
          //only update state when the tail differs — prevents the list from
          //re-rendering every 5s when nothing changed and avoids scroll flicker
          if (prev.length === res.items.length) {
            const last = prev[prev.length - 1];
            const newLast = res.items[res.items.length - 1];
            if (last && newLast && last.id === newLast.id) return prev;
          }
          return res.items;
        });
      } catch {
        //transient errors get swallowed — the next tick retries
      }
    };
    const handle = setInterval(tick, 5000);
    return () => clearInterval(handle);
  }, [activeId]);

  //polls the conversation list too so sidebar badges stay fresh for threads
  //the user isn't currently viewing
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const list = await messagingApi.listConversations();
        setConversations(list);
      } catch {
        //swallow
      }
    };
    const handle = setInterval(tick, 15_000);
    return () => clearInterval(handle);
  }, []);

  //auto-scroll to bottom when messages change and the user was pinned there
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    if (pinnedToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  //detect whether the user is pinned to the bottom of the thread. runs on
  //scroll; ~80px slack so the "pinned" state is forgiving
  const handleThreadScroll = () => {
    const el = threadRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedToBottomRef.current = distanceFromBottom < 80;
  };

  //filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!convSearch.trim()) return conversations;
    const q = convSearch.trim().toLowerCase();
    return conversations.filter((c) => {
      const label = conversationLabel(c, myUserId).toLowerCase();
      return (
        label.includes(q) ||
        c.participants.some((p) => p.displayName.toLowerCase().includes(q))
      );
    });
  }, [conversations, convSearch, myUserId]);

  //group messages by day so we can inject a date divider between clusters
  const messageGroups = useMemo(() => {
    const out: { key: string; label: string; items: MessageDTO[] }[] = [];
    for (const m of messages) {
      const k = dayKey(m.sentAt);
      if (out.length === 0 || out[out.length - 1].key !== k) {
        out.push({ key: k, label: formatDateHeader(m.sentAt), items: [m] });
      } else {
        out[out.length - 1].items.push(m);
      }
    }
    return out;
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || activeId == null || sending) return;
    //optimistic: clear input immediately; append via refresh after POST
    setInput("");
    setSending(true);
    try {
      const saved = await messagingApi.sendMessage(activeId, { content: trimmed });
      setMessages((prev) => [...prev, saved]);
      pinnedToBottomRef.current = true;
      //refresh conversation list so LastMessageAt + preview update
      loadConversations();
    } catch (err: any) {
      addToast("error", err?.message || "Failed to send message");
      //restore the unsent text so the user can retry
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    //Enter sends, Shift+Enter inserts a newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectConversation = (c: ConversationDTO) => {
    navigate(`/messages/${c.id}`);
  };

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Team <em>Messages</em>
        </h1>
        <p className={styles.heroSubtitle}>
          Coordinate with other schedulers without leaving the scheduler.
        </p>
      </div>

      <div className={styles.split}>
        {/* left: conversation list */}
        <div
          className={`${styles.splitLeft} ${activeId != null ? styles.hiddenOnMobile : ""}`}
        >
          <div className={styles.convHeader}>
            <h2 className={styles.convHeaderTitle}>Conversations</h2>
            <button
              type="button"
              className={styles.convNewBtn}
              onClick={() => setShowNewModal(true)}
            >
              <Plus size={13} strokeWidth={2.5} />
              New
            </button>
          </div>
          <input
            className={styles.convSearch}
            placeholder="Search conversations…"
            value={convSearch}
            onChange={(e) => setConvSearch(e.target.value)}
          />
          <div className={styles.convList}>
            {convsLoading ? (
              <div style={{ padding: "0.5rem" }}>
                <Skeleton variant="custom" height="60px" />
                <div style={{ height: "0.3rem" }} />
                <Skeleton variant="custom" height="60px" />
                <div style={{ height: "0.3rem" }} />
                <Skeleton variant="custom" height="60px" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className={styles.convEmpty}>
                {convSearch
                  ? "No conversations match your search."
                  : "No conversations yet. Tap New to start one."}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const label = conversationLabel(c, myUserId);
                const isActive = c.id === activeId;
                return (
                  <div
                    key={c.id}
                    className={`${styles.convItem} ${isActive ? styles.convItemActive : ""}`}
                    onClick={() => handleSelectConversation(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectConversation(c);
                      }
                    }}
                  >
                    <div className={styles.msgAvatar} aria-hidden="true">
                      {c.isGroupChat ? (
                        <UsersIcon size={14} />
                      ) : (
                        c.participants.find((p) => p.userId !== myUserId)?.initials ??
                        c.participants[0]?.initials ??
                        "?"
                      )}
                    </div>
                    <div className={styles.convItemMain}>
                      <div className={styles.convItemNameRow}>
                        <span className={styles.convItemName} title={label}>{label}</span>
                        <span className={styles.convItemTime}>
                          {timeAgo(c.lastMessageAt)}
                        </span>
                      </div>
                      <span className={styles.convItemPreview}>
                        {c.lastMessagePreview ?? <em>No messages yet</em>}
                      </span>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className={styles.unreadDot} aria-label={`${c.unreadCount} unread`}>
                        {c.unreadCount > 9 ? "9+" : c.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* right: thread */}
        <div
          className={`${styles.splitRight} ${activeId == null ? styles.hiddenOnMobile : ""}`}
        >
          {activeConv == null ? (
            <div className={styles.emptyThread}>
              Select a conversation or start a new one.
            </div>
          ) : (
            <>
              <div className={styles.threadHeader}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 0 }}>
                  <h3 className={styles.threadTitle}>
                    {conversationLabel(activeConv, myUserId)}
                  </h3>
                  <div className={styles.threadParticipants}>
                    {activeConv.participants
                      .filter((p) => p.userId !== myUserId)
                      .map((p) => p.displayName)
                      .join(" · ") || "Just you"}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => navigate("/messages")}
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              </div>

              <div
                className={styles.thread}
                ref={threadRef}
                onScroll={handleThreadScroll}
              >
                {msgsLoading && messages.length === 0 ? (
                  <div className={styles.emptyThread}>Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyThread}>
                    Send the first message to get the conversation going.
                  </div>
                ) : (
                  messageGroups.map((grp) => (
                    <div
                      key={grp.key}
                      style={{ display: "contents" }}
                    >
                      <span className={styles.dayDivider}>{grp.label}</span>
                      {grp.items.map((m) => {
                        const isSelf = m.senderId === myUserId;
                        return (
                          <div
                            key={m.id}
                            className={`${styles.msgRow} ${isSelf ? styles.msgRowSelf : ""}`}
                          >
                            <div className={styles.msgAvatar} aria-hidden="true">
                              {m.senderInitials || "?"}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                              <div className={styles.msgBubble}>{m.content}</div>
                              <div className={styles.msgMeta}>
                                <span>{isSelf ? "You" : m.senderName}</span>
                                <span>·</span>
                                <span>{formatClockTime(m.sentAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className={styles.inputBar}>
                <textarea
                  className={styles.inputTextarea}
                  placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  maxLength={4000}
                  disabled={sending}
                />
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <NewConversationModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(conv) => {
          setShowNewModal(false);
          loadConversations();
          navigate(`/messages/${conv.id}`);
        }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// new conversation modal — picker + optional group title + initial msg
// ══════════════════════════════════════════════════════════════════════
interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conv: ConversationDTO) => void;
}

function NewConversationModal({ open, onClose, onCreated }: NewConversationModalProps) {
  const [users, setUsers] = useState<AvailableUserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState("");
  const [initial, setInitial] = useState("");
  const [creating, setCreating] = useState(false);
  const { addToast } = useToast();

  //debounce the search so we don't fire on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 220);
    return () => clearTimeout(t);
  }, [search]);

  //fetch the user directory when the modal opens or the search changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await messagingApi.availableUsers(debouncedSearch || undefined);
        if (!cancelled) setUsers(list);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch]);

  //reset form when the modal opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setTitle("");
      setInitial("");
      setSearch("");
    }
  }, [open]);

  const toggleUser = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isGroup = selectedIds.size > 1;

  const handleCreate = async () => {
    if (selectedIds.size === 0) {
      addToast("error", "Pick at least one participant.");
      return;
    }
    try {
      setCreating(true);
      const conv = await messagingApi.createConversation({
        participantUserIds: Array.from(selectedIds),
        title: isGroup && title.trim() ? title.trim() : undefined,
        initialMessage: initial.trim() || undefined,
      });
      onCreated(conv);
    } catch (err: any) {
      addToast("error", err?.message || "Failed to create conversation");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New conversation"
      subtitle="Pick one person for a DM or multiple for a group chat."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={creating || selectedIds.size === 0}
          >
            {creating ? "Starting…" : "Start Conversation"}
          </Button>
        </>
      }
    >
      <div className={styles.nccSection}>
        <label className={styles.nccLabel}>
          Participants
          {selectedIds.size > 0 && (
            <>
              {" · "}
              <span className={styles.nccSelectedCount}>
                {selectedIds.size} selected
              </span>
            </>
          )}
        </label>
        <input
          className={styles.nccInput}
          placeholder="Search by name or username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.nccUserList}>
          {loading ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-on-paper-muted)", fontSize: "0.85rem" }}>
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-on-paper-muted)", fontSize: "0.85rem" }}>
              No users match your search.
            </div>
          ) : (
            users.map((u) => {
              const selected = selectedIds.has(u.id);
              return (
                <label
                  key={u.id}
                  className={`${styles.nccUserItem} ${selected ? styles.nccUserItemSelected : ""}`}
                >
                  <input
                    type="checkbox"
                    className={styles.nccCheckbox}
                    checked={selected}
                    onChange={() => toggleUser(u.id)}
                  />
                  <span className={styles.nccAvatar}>{u.initials}</span>
                  <span className={styles.nccUserName} title={u.userName}>
                    {u.displayName}
                  </span>
                  <span className={styles.nccUserRole}>{u.role}</span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {isGroup && (
        <div className={`${styles.nccSection} ${styles.groupTitleWrap}`}>
          <label className={styles.nccLabel}>Group title (optional)</label>
          <input
            className={styles.nccInput}
            placeholder="eg. Spring 2026 Planning"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>
      )}

      <div className={styles.nccSection}>
        <label className={styles.nccLabel}>Initial message (optional)</label>
        <textarea
          className={styles.nccInput}
          style={{ minHeight: 72, resize: "vertical" }}
          placeholder="Say hi to kick things off…"
          value={initial}
          onChange={(e) => setInitial(e.target.value)}
          maxLength={4000}
        />
      </div>
    </Modal>
  );
}
