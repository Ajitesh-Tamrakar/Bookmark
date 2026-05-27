import { useState } from "react";

export default function SearchBar({ onSearch, hasResults }) {
    const [query, setQuery] = useState("");

    const handleSearch = () => {
        if (query.trim()) onSearch(query);
    };

    return (
        <div
            className={`
                flex flex-col items-center w-full
                transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${hasResults ? "mt-6" : "mt-[35vh]"}
            `}
        >
            <div className="relative flex items-center w-[480px] h-12 rounded-full bg-white shadow-[0_20px_80px_-16px_rgba(0,0,30,0.45)] focus-within:shadow-[0_24px_80px_-12px_rgba(0,0,30,0.55)] transition-shadow duration-200">
                
                <input
                    type="text"
                    placeholder="Search your saved content"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    style={{
                        paddingLeft: "1.25rem",
                        paddingRight: query.trim() ? "8.5rem" : "3.5rem",
                        transition: "padding-right 0.25s ease",
                    }}
                    className="absolute inset-0 w-full h-full rounded-full bg-transparent outline-none text-[#333355] placeholder:text-[#333355]/30"
                />

                <button
                    onClick={handleSearch}
                    aria-label="Search"
                    style={{
                        width: query.trim() ? "7.5rem" : "3rem",
                        transition: "width 0.25s ease",
                    }}
                    className="
                        absolute right-0
                        flex flex-row items-center justify-center gap-1.5
                        h-12 rounded-full bg-[#296ec7] border-none
                        cursor-pointer overflow-hidden
                        hover:bg-[#2060b0] transition-colors duration-200
                    "
                >
                    <span
                        style={{
                            maxWidth: query.trim() ? "5rem" : "0px",
                            opacity: query.trim() ? 1 : 0,
                            transition: "max-width 0.25s ease, opacity 0.2s ease",
                        }}
                        className="text-white text-sm whitespace-nowrap overflow-hidden"
                    >
                        search
                    </span>

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16" height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        style={{ flexShrink: 0 }}
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </button>
            </div>
        </div>
    );
}