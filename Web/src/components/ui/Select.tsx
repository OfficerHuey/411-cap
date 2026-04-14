import { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  errorText?: string;
  fullWidth?: boolean;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "Select\u2026",
  searchable = false,
  disabled = false,
  errorText,
  fullWidth = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const listboxId = `${id}-listbox`;
  const labelId = `${id}-label`;

  const selected = options.find((o) => o.value === value);
  const filtered = searchable && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  //calculate dropdown position relative to trigger
  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  //open dropdown
  const openDropdown = useCallback(() => {
    if (disabled) return;
    updatePos();
    setOpen(true);
    setSearch("");
    //set active to currently selected
    const idx = filtered.findIndex((o) => o.value === value);
    setActiveIdx(idx >= 0 ? idx : 0);
  }, [disabled, updatePos, filtered, value]);

  //close dropdown
  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearch("");
    setActiveIdx(-1);
    triggerRef.current?.focus();
  }, []);

  //select an option
  const selectOption = useCallback(
    (opt: SelectOption) => {
      if (opt.disabled) return;
      onChange(opt.value);
      closeDropdown();
    },
    [onChange, closeDropdown],
  );

  //click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        listRef.current?.contains(e.target as Node)
      )
        return;
      closeDropdown();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeDropdown]);

  //focus search input when opening
  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  //scroll active option into view
  useEffect(() => {
    if (!open || activeIdx < 0) return;
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  //keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDropdown();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIdx((prev) => {
            let next = prev + 1;
            while (next < filtered.length && filtered[next].disabled) next++;
            return next < filtered.length ? next : prev;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIdx((prev) => {
            let next = prev - 1;
            while (next >= 0 && filtered[next].disabled) next--;
            return next >= 0 ? next : prev;
          });
          break;
        case "Enter":
          e.preventDefault();
          if (activeIdx >= 0 && activeIdx < filtered.length) {
            selectOption(filtered[activeIdx]);
          }
          break;
        case "Escape":
          e.preventDefault();
          closeDropdown();
          break;
        case "Tab":
          closeDropdown();
          break;
      }
    },
    [open, openDropdown, closeDropdown, selectOption, activeIdx, filtered],
  );

  const activeDescendant =
    open && activeIdx >= 0 ? `${id}-option-${activeIdx}` : undefined;

  return (
    <div
      className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ""}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label id={labelId} className={styles.label}>
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-labelledby={label ? labelId : undefined}
        aria-activedescendant={activeDescendant}
        className={`${styles.trigger} ${errorText ? styles.triggerError : ""} ${open ? styles.triggerOpen : ""}`}
        onClick={() => (open ? closeDropdown() : openDropdown())}
        disabled={disabled}
      >
        <span className={selected ? styles.triggerValue : styles.triggerPlaceholder}>
          {selected?.icon && <span className={styles.optionIcon}>{selected.icon}</span>}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
        />
      </button>
      {errorText && <span className={styles.error}>{errorText}</span>}

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={listRef}
              className={styles.dropdown}
              style={{
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {searchable && (
                <div className={styles.searchWrap}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    ref={searchRef}
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search\u2026"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setActiveIdx(0);
                    }}
                    aria-label="Search options"
                  />
                </div>
              )}
              <div
                id={listboxId}
                role="listbox"
                className={styles.listbox}
                aria-labelledby={label ? labelId : undefined}
              >
                {filtered.length === 0 && (
                  <div className={styles.noResults}>No results</div>
                )}
                {filtered.map((opt, i) => (
                  <div
                    key={opt.value}
                    id={`${id}-option-${i}`}
                    role="option"
                    data-idx={i}
                    aria-selected={opt.value === value}
                    aria-disabled={opt.disabled || undefined}
                    className={[
                      styles.option,
                      opt.value === value ? styles.optionSelected : "",
                      i === activeIdx ? styles.optionActive : "",
                      opt.disabled ? styles.optionDisabled : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onMouseEnter={() => !opt.disabled && setActiveIdx(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOption(opt);
                    }}
                  >
                    {opt.icon && <span className={styles.optionIcon}>{opt.icon}</span>}
                    <span className={styles.optionLabel}>{opt.label}</span>
                    {opt.value === value && <Check size={14} className={styles.checkIcon} />}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
