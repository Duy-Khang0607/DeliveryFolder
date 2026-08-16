"use client";

import { ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { OptionItem } from "@/app/hooks/useCategoryUnitOptions";

type SearchableSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: OptionItem[];
    isLoading?: boolean;
    onSearchChange: (query: string) => void;
    placeholder?: string;
    disabled?: boolean;
    inputClassName?: string;
};

const SearchableSelect = ({
    value,
    onChange,
    options,
    isLoading = false,
    onSearchChange,
    placeholder = "Search...",
    disabled = false,
    inputClassName = "",
}: SearchableSelectProps) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery("");
                onSearchChange("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onSearchChange]);

    const handleOpen = () => {
        if (disabled) return;
        setOpen(true);
        setQuery("");
        onSearchChange("");
    };

    const handleSelect = (name: string) => {
        onChange(name);
        setOpen(false);
        setQuery("");
        onSearchChange("");
    };

    const displayOptions = (() => {
        if (!value) return options;
        const exists = options.some((o) => o.name === value);
        if (exists) return options;
        return [{ _id: `selected-${value}`, name: value }, ...options];
    })();

    return (
        <div ref={containerRef} className="relative">
            {open ? (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            onSearchChange(e.target.value);
                        }}
                        placeholder={placeholder}
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border border-green-400 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${inputClassName}`}
                    />
                </div>
            ) : (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={handleOpen}
                    className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-left text-sm flex items-center justify-between gap-2 transition-all
                        ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-green-400 cursor-pointer"}
                        ${!value ? "text-gray-400" : "text-gray-800"}
                        ${inputClassName}`}
                >
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
                </button>
            )}

            {open && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                        </div>
                    ) : displayOptions.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-400 text-center">No results found</p>
                    ) : (
                        displayOptions.map((option) => (
                            <button
                                key={option._id}
                                type="button"
                                onClick={() => handleSelect(option.name)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-green-50
                                    ${option.name === value ? "bg-green-50 text-green-700 font-semibold" : "text-gray-700"}`}
                            >
                                {option.name}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
