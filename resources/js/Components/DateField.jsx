import React, { useRef, useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

const MONTH_MAP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

function parseDateToISO(inputStr) {
  if (!inputStr) return "";
  const str = inputStr.trim().toLowerCase();

  // 1. "19 Nov 2026" or "19 November 2026"
  const textMatch = str.match(/^(\d{1,2})[\s\-_/]+([a-z]{3,9})[\s\-_/]+(\d{4})$/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, "0");
    const mStr = textMatch[2].substring(0, 3);
    const monthNum = MONTH_MAP[mStr];
    const year = textMatch[3];
    if (monthNum) {
      return `${year}-${String(monthNum).padStart(2, "0")}-${day}`;
    }
  }

  // 2. "YYYY-MM-DD" or "YYYY/MM/DD"
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, "0")}-${ymdMatch[3].padStart(2, "0")}`;
  }

  // 3. "DD-MM-YYYY" or "DD/MM/YYYY"
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }

  const d = new Date(inputStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return "";
}

export default function DateField({
  label,
  value,
  onChange,
  required = false,
  className = "",
  helperText = null,
  colorScheme = "blue",
}) {
  const hiddenDateInputRef = useRef(null);
  const [inputText, setInputText] = useState(value ? formatDate(value) : "");

  useEffect(() => {
    setInputText(value ? formatDate(value) : "");
  }, [value]);

  const handleTextChange = (e) => {
    setInputText(e.target.value);
    const parsed = parseDateToISO(e.target.value);
    if (parsed) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseDateToISO(inputText);
    if (parsed) {
      onChange(parsed);
      setInputText(formatDate(parsed));
    } else if (value) {
      setInputText(formatDate(value));
    } else {
      setInputText("");
    }
  };

  const handlePickerChange = (e) => {
    const newVal = e.target.value;
    if (newVal) {
      onChange(newVal);
      setInputText(formatDate(newVal));
    }
  };

  const openPicker = () => {
    try {
      if (hiddenDateInputRef.current?.showPicker) {
        hiddenDateInputRef.current.showPicker();
      } else {
        hiddenDateInputRef.current?.focus();
      }
    } catch {
      hiddenDateInputRef.current?.focus();
    }
  };

  const focusRing = colorScheme === "amber" ? "focus:ring-amber-500" : "focus:ring-blue-500";

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 block">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder="19 Nov 2026"
          required={required}
          className={`w-full px-3 py-2 pr-9 text-xs border border-slate-300 rounded-md font-mono bg-white focus:outline-hidden focus:ring-1 ${focusRing} transition`}
        />
        <input
          ref={hiddenDateInputRef}
          type="date"
          tabIndex={-1}
          value={value || ""}
          onChange={handlePickerChange}
          className="absolute right-2 bottom-2 w-1 h-1 opacity-0 pointer-events-none"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={openPicker}
          title="Open calendar picker"
          className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>
      {helperText && (
        <p className="text-[10px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
