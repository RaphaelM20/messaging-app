import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const token = localStorage.getItem("authToken");
  const currentUserId = token ? jwtDecode(token).id : null;
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectFriends, setSelectFriends] = useState([]);

  const toggleFriend = (id) => {
    if (selectFriends.includes(id)) {
      setSelectFriends(selectFriends.filter((f) => f !== id));
    } else {
      setSelectFriends([...selectFriends, id]);
    }
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/conversations`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setChats(data));
  }, []);

  const handleNewConvo = async (e) => {
    e.preventDefault();
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/conversations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ members: selectFriends }),
      },
    );
    const data = await response.json();

    const convoResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/conversations`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      },
    );
    const convoData = await convoResponse.json();
    setChats(convoData);
    setShowNewChat(false);
    navigate(`conversations/${data.id}`);
  };

  const handleSearch = async (e) => setQuery(e.target.value);

  const getFriends = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/friends`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    const data = await response.json();
    setFriends(data);
    setShowNewChat(true);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleDateString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="container">
      {token ? (
        <div>
          <div className="new-chat" onClick={getFriends}>
            New Chat
          </div>

          {showNewChat && (
            <div className="popup-overlay">
              <form onSubmit={handleNewConvo}>
                <div className="popup-header">
                  <label htmlFor="search-input">New Message</label>
                  <button type="button" onClick={() => setShowNewChat(false)}>
                    ✕
                  </button>
                </div>
                <p className="search-subtitle">
                  Groups can have up to 10 members
                </p>
                <input
                  id="search-input"
                  type="search"
                  value={query}
                  onChange={handleSearch}
                  placeholder="Search"
                />
                {friends.map((friend) => {
                  const yourFriend =
                    friend.user.id === currentUserId
                      ? friend.buddy
                      : friend.user;

                  return (
                    <div key={friend.id} className="friend-card">
                      <img src={yourFriend.picture} alt={yourFriend.name} />
                      <p>{yourFriend.name}</p>
                      <span className="tooltip">{yourFriend.username}</span>
                      <input
                        type="checkbox"
                        checked={selectFriends.includes(yourFriend.id)}
                        onChange={() => toggleFriend(yourFriend.id)}
                      />
                    </div>
                  );
                })}
                <button type="submit">Create Message</button>
              </form>
            </div>
          )}

          {chats.map((chat) => {
            const otherMember = chat.members.find(
              (member) => member.id !== currentUserId,
            );
            const lastMsg = chat.messages[0]?.content;
            const chatName = chat.name;
            return (
              <Link key={chat.id} to={`/conversations/${chat.id}`}>
                <div className="chat-card">
                  <img src={otherMember?.picture} />
                  <p>
                    {chatName ||
                      chat.members
                        .filter((m) => m.id !== currentUserId)
                        .map((m) => m.name)
                        .join(", ")}
                  </p>
                  <p>{lastMsg}</p>
                  <p>{formatTime(chat.lastActivity)} </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p>Please login to view your chats</p>
      )}
    </div>
  );
}

export default HomePage;
