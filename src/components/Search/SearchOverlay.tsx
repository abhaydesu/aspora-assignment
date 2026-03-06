import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useCommentSearch } from '../../hooks/useCommentSearch';
import type { Comment } from '../../hooks/useCommentSearch';
import './SearchOverlay.css';

const DEBOUNCE_MS = 300;

const PAGE_SIZE = 50;


function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let idx = lowerText.indexOf(lowerQuery, cursor);

  while (idx !== -1) {
    if (idx > cursor) {
      parts.push(text.slice(cursor, idx));
    }
    parts.push(
      <mark key={idx} className="search-overlay__highlight">
        {text.slice(idx, idx + query.length)}
      </mark>,
    );
    cursor = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

export const SearchOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [rawQuery, setRawQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  const debouncedQuery = useDebounce(rawQuery, DEBOUNCE_MS);
  const { results, isLoading, error } = useCommentSearch(debouncedQuery);

  const visibleResults = useMemo(
    () => results.slice(0, visibleCount),
    [results, visibleCount],
  );

  useEffect(() => {
    if (isOpen) {
      setRawQuery('');
      setActiveIndex(-1);
      setExpandedId(null);
      setVisibleCount(PAGE_SIZE);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(-1);
    setVisibleCount(PAGE_SIZE);
  }, [results]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const el = itemRefs.current.get(activeIndex);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleScroll = useCallback(() => {
    const ul = listRef.current;
    if (!ul) return;
    if (ul.scrollTop + ul.clientHeight >= ul.scrollHeight - 200) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, results.length));
    }
  }, [results.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const total = visibleResults.length;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = activeIndex + 1;
          if (next >= results.length) {
            setVisibleCount(PAGE_SIZE);
            setActiveIndex(0);
          } else {
            if (next >= visibleCount - 5) {
              setVisibleCount((vc) => Math.min(vc + PAGE_SIZE, results.length));
            }
            setActiveIndex(next);
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (activeIndex <= 0) {
            setVisibleCount(results.length);
            setActiveIndex(results.length - 1);
          } else {
            setActiveIndex((prev) => prev - 1);
          }
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < total) {
            const comment = visibleResults[activeIndex];
            setExpandedId((prev) => (prev === comment.id ? null : comment.id));
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onClose();
          break;
        }
      }
    },
    [visibleResults, activeIndex, visibleCount, results.length, onClose],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const setItemRef = useCallback(
    (index: number) => (el: HTMLLIElement | null) => {
      if (el) {
        itemRefs.current.set(index, el);
      } else {
        itemRefs.current.delete(index);
      }
    },
    [],
  );

  if (!isOpen) return null;

  const trimmedQuery = rawQuery.trim();
  const hasQuery = trimmedQuery.length > 0;
  const showLoading = hasQuery && isLoading;
  const showError = hasQuery && !isLoading && error !== null;
  const showEmpty = hasQuery && !isLoading && !error && results.length === 0 && debouncedQuery === trimmedQuery;
  const showResults = hasQuery && !isLoading && !error && results.length > 0;

  return (
    <div
      className="search-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Search comments"
    >
      <div className="search-overlay__panel" onKeyDown={handleKeyDown}>
        <div className="search-overlay__input-wrapper">
          <span className="search-overlay__search-icon" aria-hidden="true">
           🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            className="search-overlay__input"
            placeholder="Search comments by body text…"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            aria-label="Search comments"
            autoComplete="off"
            spellCheck={false}
          />
          {hasQuery && (
            <button
              className="search-overlay__clear-btn"
              onClick={() => setRawQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <kbd className="search-overlay__shortcut-badge">ESC</kbd>
        </div>

        <div className="search-overlay__body">
          {!hasQuery && (
            <div className="search-overlay__placeholder">
              <span className="search-overlay__placeholder-icon">💬</span>
              <p>Type to search across 500 comments…</p>
              <p className="search-overlay__placeholder-hint">
                Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to expand,{' '}
                <kbd>Esc</kbd> to close
              </p>
            </div>
          )}

          {showLoading && (
            <div className="search-overlay__loading">
              <div className="search-overlay__spinner" />
              <p>Searching…</p>
            </div>
          )}

          {showError && (
            <div className="search-overlay__error">
              <span className="search-overlay__error-icon">⚠️</span>
              <p>{error}</p>
              <button
                className="search-overlay__retry-btn"
                onClick={() => {
                  const q = rawQuery;
                  setRawQuery('');
                  requestAnimationFrame(() => setRawQuery(q));
                }}
              >
                Retry
              </button>
            </div>
          )}

          {showEmpty && (
            <div className="search-overlay__empty">
              <span className="search-overlay__empty-icon">🔎</span>
              <p>
                No comments matching "<strong>{debouncedQuery}</strong>"
              </p>
            </div>
          )}

          {showResults && (
            <>
              <div className="search-overlay__result-count">
                {results.length} {results.length === 1 ? 'RESULT' : 'RESULTS'}
              </div>
              <ul
                className="search-overlay__results"
                ref={listRef}
                role="listbox"
                aria-label="Search results"
                onScroll={handleScroll}
              >
                {visibleResults.map((comment, index) => (
                  <ResultItem
                    key={comment.id}
                    comment={comment}
                    query={debouncedQuery}
                    isActive={index === activeIndex}
                    isExpanded={expandedId === comment.id}
                    onToggle={() =>
                      setExpandedId((prev) =>
                        prev === comment.id ? null : comment.id,
                      )
                    }
                    onHover={() => setActiveIndex(index)}
                    ref={setItemRef(index)}
                  />
                ))}
                {visibleCount < results.length && (
                  <li className="search-overlay__load-more">
                    Scroll for more results ({results.length - visibleCount} remaining)
                  </li>
                )}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface ResultItemProps {
  comment: Comment;
  query: string;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onHover: () => void;
}

const ResultItem = React.memo(
  React.forwardRef<HTMLLIElement, ResultItemProps>(
    ({ comment, query, isActive, isExpanded, onToggle, onHover }, ref) => {
      const classNames = [
        'search-overlay__result-item',
        isActive ? 'search-overlay__result-item--active' : '',
        isExpanded ? 'search-overlay__result-item--expanded' : '',
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <li
          ref={ref}
          className={classNames}
          role="option"
          aria-selected={isActive}
          onClick={onToggle}
          onMouseEnter={onHover}
        >
          <div className="search-overlay__result-header">
            <span className="search-overlay__result-name">{comment.name}</span>
            <span className="search-overlay__result-email">{comment.email}</span>
          </div>
          <div className="search-overlay__result-body">
            {isExpanded
              ? highlightMatch(comment.body, query)
              : highlightMatch(
                  comment.body.length > 220
                    ? comment.body.slice(0, 220) + '…'
                    : comment.body,
                  query,
                )}
          </div>
          {isExpanded && (
            <div className="search-overlay__result-meta">
              <span>Post #{comment.postId}</span>
              <span>Comment #{comment.id}</span>
            </div>
          )}
        </li>
      );
    },
  ),
);

ResultItem.displayName = 'ResultItem';
