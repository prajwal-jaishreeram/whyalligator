"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { COUNTRY_LIST, getCountryFlag } from "@/lib/options";

interface CountryPickerProps {
  value: string;
  onChange: (country: string) => void;
  id?: string;
  name?: string;
  hasError?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function CountryPicker({
  value,
  onChange,
  id = "field-country",
  name = "country",
  hasError = false,
  disabled = false,
  placeholder = "Select country...",
}: CountryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return COUNTRY_LIST;
    return COUNTRY_LIST.filter((c) => c.toLowerCase().includes(query));
  }, [search]);

  const matchesRemote = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return "remote worldwide".includes(query);
  }, [search]);

  const displayFlag = value ? getCountryFlag(value) : "";
  const displayText = value ? value : placeholder;

  return (
    <div ref={containerRef} className="relative w-full text-left" style={{ position: "relative" }}>
      {/* Hidden input for standard form serialization */}
      <input type="hidden" name={name} value={value || ""} />

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`yc-input flex items-center justify-between gap-2 cursor-pointer w-full text-left font-normal select-none ${
          hasError ? "input-field-error" : ""
        } ${!value ? "text-[#828282]" : "text-[#222222]"}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "42px",
          width: "100%",
          padding: "8px 12px",
          backgroundColor: "#fff",
          border: hasError ? "1.5px solid #d9381e" : "1px solid #d2d2d7",
          borderRadius: "6px",
          fontSize: "14px",
          lineHeight: "20px",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate" style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ? (
            <>
              <span className="text-base select-none" style={{ fontSize: "16px", lineHeight: "1" }}>{displayFlag}</span>
              <span className="truncate font-medium text-[#111111]">{displayText}</span>
            </>
          ) : (
            <span className="text-[#888888]">{placeholder}</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-[#888888] transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{
            width: "14px",
            height: "14px",
            flexShrink: 0,
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
          }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 bg-white border border-[#d2d2d7] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 9999,
            marginTop: "4px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            maxHeight: "320px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search Input Header */}
          <div
            style={{
              padding: "8px 10px",
              borderBottom: "1px solid #f1f5f9",
              backgroundColor: "#f8fafc",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              style={{ width: "14px", height: "14px", color: "#94a3b8", flexShrink: 0 }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full text-xs bg-transparent border-0 outline-none text-[#1e293b] placeholder-[#94a3b8]"
              style={{
                width: "100%",
                fontSize: "13px",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#1e293b",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-[#94a3b8] hover:text-[#475569] px-1"
                style={{ fontSize: "11px", color: "#94a3b8", cursor: "pointer", background: "none", border: "none" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Options Scrollable Container */}
          <div
            role="listbox"
            style={{
              maxHeight: "260px",
              overflowY: "auto",
              padding: "4px 0",
            }}
          >
            {/* Remote Option */}
            {matchesRemote && (
              <div
                role="option"
                aria-selected={value === "Remote"}
                onClick={() => {
                  onChange("Remote");
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[#fff4eb] transition-colors ${
                  value === "Remote" ? "bg-[#fff0e6] font-medium text-[#ff6600]" : "text-[#333]"
                }`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  backgroundColor: value === "Remote" ? "#fff2ea" : "transparent",
                  color: value === "Remote" ? "#ff6600" : "#1e293b",
                  fontWeight: value === "Remote" ? 600 : 400,
                  borderBottom: "1px dashed #e2e8f0",
                }}
              >
                <span style={{ fontSize: "16px", lineHeight: "1" }}>🌐</span>
                <span className="flex-1 truncate">Remote / Worldwide</span>
                {value === "Remote" && <span style={{ color: "#ff6600", fontSize: "12px", fontWeight: 700 }}>✓</span>}
              </div>
            )}

            {/* Country List */}
            {filteredCountries.map((c) => {
              const isSelected = value === c;
              return (
                <div
                  key={c}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(c);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[#fff4eb] transition-colors ${
                    isSelected ? "bg-[#fff0e6] font-medium text-[#ff6600]" : "text-[#333]"
                  }`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 12px",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#fff2ea" : "transparent",
                    color: isSelected ? "#ff6600" : "#1e293b",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <span style={{ fontSize: "16px", lineHeight: "1" }}>{getCountryFlag(c)}</span>
                  <span className="flex-1 truncate">{c}</span>
                  {isSelected && <span style={{ color: "#ff6600", fontSize: "12px", fontWeight: 700 }}>✓</span>}
                </div>
              );
            })}

            {filteredCountries.length === 0 && !matchesRemote && (
              <div
                style={{
                  padding: "16px 12px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                No matching countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
