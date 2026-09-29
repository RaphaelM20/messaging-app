import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, isAbortError } from "../lib/api";
import PersonRow from "../components/PersonRow";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import Icon from "../components/ui/Icon";
import Spinner from "../components/ui/Spinner";

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

function RelationshipAction({ relationship, sending, disabled, onAdd }) {
  if (relationship === "incoming") {
    return (
      <Link
        to="/friends?tab=pending"
        className="button button--secondary button--sm"
      >
        View request
      </Link>
    );
  }
  if (relationship === "friends" || relationship === "sent") {
    return (
      <button
        type="button"
        className="button button--secondary button--sm"
        disabled
      >
        {relationship === "friends" ? "Friends" : "Request sent"}
      </button>
    );
  }
  return (
    <button
      type="button"
      className="button button--primary button--sm"
      onClick={onAdd}
      disabled={disabled}
    >
      {sending && <Spinner />}
      {sending ? "Sending…" : "Add friend"}
    </button>
  );
}

function AddFriendPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searchedTerm, setSearchedTerm] = useState("");
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
      setSearchedTerm(term);
    } catch (err) {
      if (isAbortError(err)) return;
      setSearchError("Search failed. Please try again.");
    }
    setSearching(false);
  };

  const sendFriendRequest = async (id, name) => {
    if (sendingId !== null) return;
    setSendingId(id);
    setNotice(null);
    try {
      await apiFetch("/friends", { method: "POST", body: { buddyId: id } });
      setSentIds((ids) => [...ids, id]);
      setNotice({ type: "success", text: `Friend request sent to ${name}.` });
    } catch (err) {
      setNotice({
        type: "error",
        text:
          err.detail ?? "Couldn't send the friend request. Please try again.",
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Add Friend</h1>
          <p className="page__subtitle">
            Search by username to send a friend request.
          </p>
        </div>
      </div>

      <form role="search" className="search-form" onSubmit={handleSearch}>
        <label htmlFor="friend-search" className="visually-hidden">
          Username
        </label>
        <input
          id="friend-search"
          type="search"
          className={`input${notice?.type === "success" ? " input--success" : ""}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a username"
          autoComplete="off"
        />
        <button
          type="submit"
          className="button button--primary"
          disabled={searching || !query.trim()}
        >
          {searching ? <Spinner /> : <Icon name="search" />}
          Search
        </button>
      </form>

      {(notice || searchError) && (
        <div className="search-feedback">
          {notice && <Alert variant={notice.type}>{notice.text}</Alert>}
          {searchError && <Alert>{searchError}</Alert>}
        </div>
      )}

      {results?.length === 0 && (
        <EmptyState icon="search" title="No users found">
          Nobody matches “{searchedTerm}”. Check the spelling and try again.
        </EmptyState>
      )}

      {results?.length > 0 && (
        <ul className="row-list" aria-label="Search results">
          {results.map((result) => (
            <PersonRow
              key={result.id}
              person={result}
              actions={
                <RelationshipAction
                  relationship={getRelationship(result, sentIds)}
                  sending={sendingId === result.id}
                  disabled={sendingId !== null}
                  onAdd={() => sendFriendRequest(result.id, result.name)}
                />
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddFriendPage;
