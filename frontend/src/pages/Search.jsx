import SearchBar from "../components/SearchBar"
import BasicCard from "../components/Card"
import {useState} from 'react'
function Search() {
    
    const [results, setResults] = useState([]);
    function handleSearch(query) {

        fetch(`http://localhost:8000/retrieve/search/?q=${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
            .then(async (response) => {
                const data = await response.json();
                setResults(data.results);

                if (response.ok) {
                    console.log("Search successful");
                    console.log("Server response:", data);
                } else {
                    console.error("Search failed:");
                    console.error("Status:", response.status);
                    console.error("Response:", data);
                }
            })

    }
    return (
        <div>
            <SearchBar onSearch={handleSearch} />
            {results.map((item) => (
                <BasicCard
                key={item.url}
                title={item.title} 
                date={item.saved_at}
                imageUrl={item.url} />
            ))}

        </div>


    )
}

export default Search;