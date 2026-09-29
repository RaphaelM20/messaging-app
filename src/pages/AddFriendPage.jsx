import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, isAbortError } from "../lib/api";

// `friendsOf` holds requests the current user sent to this person;
// `friends` holds requests this person sent to the current user.
function getRelationship(result, sentIds) {
  const outgoing = result.friendsOf[0]?.status;
  const incoming = result.friends[0]?.status;
  if (outgoing === "ACCEPTED" || incoming === "ACCEPTED") return "friends";
  if (sentIds.includes(result.id) || outgoing === "PENDING") return "sent";
  if (incoming === "PENDING") return "incoming";
  return "none";
}

function AddFriendPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [sentIds, setSentIds] = useState([]);
  const [sendingId, setSendingId] = useState(null);
  // { type: "success" | "error", text }
  const [notice, setNotice] = useState(null);
  const searchController = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;

    // Drop any slower, older search so its results can't overwrite these.
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;

    setSearching(true);
    setSearchError("");
    setNotice(null);
    try {
      const data = await apiFetch(
        `/users/search?search=${encodeURIComponent(term)}`,
        { signal: controller.signal },
      );
      setResults(data);
    } catch (err) {
      if (isAbortError(err)) return;
      setSearchError("Search failed. Please try again.");
    }
    setSearching(false);
  };

  const sendFriendRequest = async (id) => {
    if (sendingId !== null) return;
    setSendingId(id);
    setNotice(null);
    try {
      await apiFetch("/friends", { method: "POST", body: { buddyId: id } });
      setSentIds((ids) => [...ids, id]);
      setNotice({ type: "success", text: "Friend request sent!" });
    } catch {
      setNotice({
        type: "error",
        text: "Couldn't send the friend request. Please try again.",
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch}>
        <label htmlFor="search-input">Add Friend</label>
        <input
          id="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a username"
          className={notice?.type === "success" ? "input-success" : ""}
        />
        <button type="submit" disabled={searching || !query.trim()}>
          {searching ? "Searching…" : "Search"}
        </button>
      </form>
      {notice?.type === "success" && (
        <p className="success-msg" role="status">
          {notice.text}
        </p>
      )}
      {notice?.type === "error" && (
        <p className="auth-error" role="alert">
          {notice.text}
        </p>
      )}
      {searchError && (
        <p className="auth-error" role="alert">
          {searchError}
        </p>
      )}
      {results?.length === 0 && <p>No users found.</p>}

      {results?.map((result) => {
        const relationship = getRelationship(result, sentIds);
        return (
          <div key={result.id} className="result-card">
            <img src={result.picture} alt="" />
            <p>{result.name}</p>
            <p>{result.username}</p>
            {relationship === "incoming" ? (
              <button onClick={() => navigate("/friends?tab=pending")}>
                View Request
              </button>
            ) : (
              <button
                onClick={() => sendFriendRequest(result.id)}
                disabled={relationship !== "none" || sendingId !== null}
              >
                {relationship === "friends"
                  ? "Friends"
                  : relationship === "sent"
                    ? "Sent!"
                    : sendingId === result.id
                      ? "Sending…"
                      : "Add Friend"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AddFriendPage;
