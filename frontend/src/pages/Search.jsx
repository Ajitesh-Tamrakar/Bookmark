import { useState } from "react";
import SearchBar from "../components/SearchBar";
import BookmarkCard from "../components/Card";

export default function Search() {
    const [results, setResults] = useState([]);
    const [message, setMessage] = useState('');

    const handleSearch = async (query) => {
        const res = await fetch(`http://localhost:8080/retrieve/search/?q=${query}`);
        const data = await res.json();
        setResults(data.results);
        setMessage(data.message);
    };

    return (
        <div className="min-h-screen bg-[#f0f0ff] flex flex-col items-center px-4">
            <SearchBar onSearch={handleSearch} hasResults={results.length > 0} />
            {message && results.length === 0 && (
                <div className="flex flex-col items-center gap-3 mt-10 text-[#333355]/50">
                    <img src="/embarrassed.png" alt="No results" width={64} height={64} />
                    <p className="text-sm">No relevant results found</p>
                </div>
            )}
            {results.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                    {results.map((item, i) => (
                        <BookmarkCard key={item.id} item={item} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}