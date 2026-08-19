import { useState } from "react";

function AddFriendPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [sent, setSent] = useState([]);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/search?search=${query}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      },
    );
    const data = await response.json();
    setResults(data);
  };

  const sendFriendRequest = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/friends`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ buddyId: id }),
    });
    setSent([...sent, id]);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch}>
        <label htmlFor="search-input">Add Friend</label>
        <input
          id="search-input"
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="Enter a username"
          className={sent.length > 0 ? "input-success" : ""}
        />
        <button type="submit">Search</button>
      </form>
      {sent.length > 0 && <p className="success-msg">Friend request sent!</p>}

      {results.map((result) => {
        const alreadySent =
          sent.includes(result.id) ||
          result.friends.length > 0 ||
          result.friendsOf.length > 0;
        return (
          <div key={result.id} className={`result-card`}>
            <img src={result?.picture} />
            <p>{result.name}</p>
            <p>{result.username}</p>
            <button
              onClick={() => sendFriendRequest(result.id)}
              disabled={alreadySent}
            >
              {result.friends.length > 0 || result.friendsOf.length > 0
                ? "Sent!"
                : "Add Friend"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default AddFriendPage;
