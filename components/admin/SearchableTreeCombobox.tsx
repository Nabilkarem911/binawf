"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, Search, X, Check, CornerDownLeft } from "lucide-react";

type TreeNode = {
  id: string;
  title: string;
  parentId: string | null;
};

type SearchableTreeComboboxProps = {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noneLabel?: string;
  disabled?: boolean;
};

/**
 * Searchable Tree Combobox — RTL-first, viewport-safe, keyboard-navigable.
 *
 * Root cause fix for the Category Select positioning problem:
 * - Uses a portal-free, anchor-relative popup (no Base UI Positioner alignment issues).
 * - Positions via getBoundingClientRect + flip logic (collision-aware).
 * - min-width = trigger width; max-width = viewport-safe.
 * - max-height = min(420px, available viewport space).
 * - Search input inside the popup for filtering 100+ categories.
 * - Tree hierarchy with indentation.
 * - Keyboard: ArrowUp/Down, Enter, Escape.
 * - Displays Arabic titles only — internal IDs never shown.
 */
export function SearchableTreeCombobox({
  nodes,
  selectedId,
  onSelect,
  placeholder = "اختر...",
  searchPlaceholder = "ابحث عن قسم...",
  noneLabel = "بدون قسم",
  disabled = false,
}: SearchableTreeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build lookup map
  const byId = useMemo(() => {
    const m = new Map<string, TreeNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  // Build tree structure
  const { roots, childrenMap, flatList } = useMemo(() => {
    const childrenMap = new Map<string | null, TreeNode[]>();
    const roots: TreeNode[] = [];

    for (const n of nodes) {
      const parentKey = n.parentId && byId.has(n.parentId) ? n.parentId : null;
      if (!childrenMap.has(parentKey)) childrenMap.set(parentKey, []);
      childrenMap.get(parentKey)!.push(n);
      if (!parentKey) roots.push(n);
    }

    // Sort by title
    const sortRecursive = (arr: TreeNode[]) => {
      arr.sort((a, b) => a.title.localeCompare(b.title, "ar"));
      for (const n of arr) {
        const children = childrenMap.get(n.id);
        if (children) sortRecursive(children);
      }
    };
    sortRecursive(roots);

    // Build flat visible list (for keyboard nav)
    const flatList: { node: TreeNode; depth: number }[] = [];
    const flatten = (items: TreeNode[], depth: number) => {
      for (const item of items) {
        flatList.push({ node: item, depth });
        const children = childrenMap.get(item.id);
        if (children) flatten(children, depth + 1);
      }
    };
    flatten(roots, 0);

    return { roots, childrenMap, flatList };
  }, [nodes, byId]);

  // Filtered flat list based on search
  const filteredFlat = useMemo(() => {
    if (!search.trim()) return flatList;
    const query = search.toLowerCase().trim();
    // Match node or any ancestor
    const matchingIds = new Set<string>();
    for (const n of nodes) {
      if (n.title.toLowerCase().includes(query)) {
        matchingIds.add(n.id);
        // Add all ancestors
        let current: TreeNode | undefined = n;
        while (current?.parentId) {
          matchingIds.add(current.parentId);
          current = byId.get(current.parentId);
        }
      }
    }
    return flatList.filter((item) => matchingIds.has(item.node.id));
  }, [flatList, search, nodes, byId]);

  const selected = selectedId ? byId.get(selectedId) : null;

  // Popup positioning — collision-aware
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom;
    const spaceAbove = rect.top;
    const popupMaxH = Math.min(420, Math.max(spaceBelow - 8, spaceAbove - 8, 200));
    const openAbove = spaceBelow < 300 && spaceAbove > spaceBelow;

    const style: React.CSSProperties = {
      position: "fixed",
      minWidth: rect.width,
      maxWidth: Math.min(rect.width + 200, window.innerWidth - 32),
      maxHeight: popupMaxH,
      zIndex: 9999,
    };

    if (openAbove) {
      style.bottom = window.innerHeight - rect.top + 4;
      style.right = window.innerWidth - rect.right;
    } else {
      style.top = rect.bottom + 4;
      style.right = window.innerWidth - rect.right;
    }

    setPopupStyle(style);
  }, []);

  // Open/close
  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setSearch("");
    setHighlightIndex(0);
    requestAnimationFrame(() => {
      updatePosition();
      searchInputRef.current?.focus();
    });
  }, [disabled, updatePosition]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch("");
    setHighlightIndex(0);
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popupRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      handleClose();
    };
    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, handleClose, updatePosition]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filteredFlat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filteredFlat[highlightIndex];
        if (item) {
          onSelect(item.node.id);
          handleClose();
          triggerRef.current?.focus();
        }
      }
    },
    [filteredFlat, highlightIndex, onSelect, handleClose]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.querySelector(`[data-idx="${highlightIndex}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, open]);

  // Render tree items recursively
  const renderItems = (items: TreeNode[], depth: number, startIndex: number): { elements: React.ReactElement[]; nextIndex: number } => {
    const elements: React.ReactElement[] = [];
    let idx = startIndex;

    for (const item of items) {
      const flatIdx = filteredFlat.findIndex((f) => f.node.id === item.id);
      const isSelected = item.id === selectedId;
      const isHighlighted = flatIdx === highlightIndex;

      elements.push(
        <button
          key={item.id}
          type="button"
          data-idx={flatIdx}
          onClick={() => {
            onSelect(item.id);
            handleClose();
            triggerRef.current?.focus();
          }}
          onMouseEnter={() => setHighlightIndex(flatIdx)}
          className={`flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 pl-1.5 text-right text-sm transition-colors ${
            isHighlighted ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-secondary/50"
          }`}
          style={{ paddingInlineStart: `${depth * 16 + 8}px` }}
        >
          {depth > 0 && <CornerDownLeft className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
          <span className="flex-1 truncate">{item.title}</span>
          {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
        </button>
      );
      idx++;

      const children = childrenMap.get(item.id);
      if (children && children.length > 0) {
        const result = renderItems(children, depth + 1, idx);
        elements.push(...result.elements);
        idx = result.nextIndex;
      }
    }

    return { elements, nextIndex: idx };
  };

  const treeElements = search.trim()
    ? filteredFlat.map((item, i) => {
        const isSelected = item.node.id === selectedId;
        const isHighlighted = i === highlightIndex;
        return (
          <button
            key={item.node.id}
            type="button"
            data-idx={i}
            onClick={() => {
              onSelect(item.node.id);
              handleClose();
              triggerRef.current?.focus();
            }}
            onMouseEnter={() => setHighlightIndex(i)}
            className={`flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 pl-1.5 text-right text-sm transition-colors ${
              isHighlighted ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-secondary/50"
            }`}
            style={{ paddingInlineStart: `${item.depth * 16 + 8}px` }}
          >
            {item.depth > 0 && <CornerDownLeft className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
            <span className="flex-1 truncate">{item.node.title}</span>
            {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
          </button>
        );
      })
    : renderItems(roots, 0, 0).elements;

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? handleClose : handleOpen}
        disabled={disabled}
        className="flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`flex-1 truncate text-right ${selected ? "text-foreground" : "text-muted-foreground"}`}>
          {selected ? selected.title : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Clear button */}
      {selected && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(null);
          }}
          className="absolute inset-inline-end-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="مسح الاختيار"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Popup */}
      {open && (
        <div
          ref={popupRef}
          style={popupStyle}
          className="flex flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10"
          onKeyDown={handleKeyDown}
        >
          {/* Search */}
          <div className="relative shrink-0 border-b border-border/60 p-2">
            <Search className="pointer-events-none absolute inset-inline-start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="h-8 w-full rounded-md border border-border bg-background px-3 ps-9 text-sm outline-none focus:border-accent"
            />
          </div>

          {/* None option */}
          <div className="shrink-0 p-1">
            <button
              type="button"
              data-idx={-1}
              onClick={() => {
                onSelect(null);
                handleClose();
                triggerRef.current?.focus();
              }}
              onMouseEnter={() => setHighlightIndex(-1)}
              className={`flex w-full items-center rounded-md py-1.5 px-2 text-right text-sm transition-colors ${
                highlightIndex === -1 ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <X className="h-3.5 w-3.5 shrink-0" />
              <span className="ms-1.5">{noneLabel}</span>
              {!selectedId && <Check className="ms-auto h-3.5 w-3.5 text-accent" />}
            </button>
          </div>

          {/* Tree list */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-1">
            {treeElements.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">لا توجد نتائج</p>
            ) : (
              treeElements
            )}
          </div>
        </div>
      )}
    </div>
  );
}
