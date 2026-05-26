import './SearchBar.css';
import React from 'react';
import { useState } from 'react';

function SearchBar({onSearch}) {
    const [query , setQuery] = useState('');

    return (
        <div className="centered">
            <div className="search">
                <input
                    type="text"
                    id="search-input" // 1. Added ID to connect with label
                    name="search"
                    placeholder="Search something"
                    onChange = {(e) => setQuery(e.target.value)}
                />
                <button type="button" aria-label="Search" onClick={() =>
                    onSearch(query)
                }> {/* 2. Changed to submit, added aria-label */}
                    <label htmlFor="search-input">search</label> {/* 3. Connected htmlFor to input ID */}
                    <div className="search-icon" aria-hidden="true"></div> {/* 4. Hid pure CSS icon from screen readers */}
                </button>
            </div>
        </div>
    )
}

export default SearchBar;