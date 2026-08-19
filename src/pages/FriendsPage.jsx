import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

function FriendsPage({ filter }) {
  const token = localStorage.getItem("authToken");
  const [friends, setFriends] = useState([]);
  const currentUserId = token ? jwtDecode(token).id : null;
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/friends`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    })
      .then((res) => res.json())
      .then((data) => setFriends(data));

    fetch(`${import.meta.env.VITE_API_URL}/friends/pending`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        (setSentRequests(data.sent), setReceivedRequests(data.received));
      });
  }, []);

  const acceptRequest = async (recipientId) => {
    await fetch(`${import.meta.env.VITE_API_URL}/friends/${recipientId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    const friendsResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/friends`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      },
    );

    const friendsData = await friendsResponse.json();
    setFriends(friendsData);
    setReceivedRequests(receivedRequests.filter((r) => r.id !== recipientId));
  };

  const denyRequest = async (recipientId) => {
    await fetch(`${import.meta.env.VITE_API_URL}/friends/${recipientId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    setFriends(friends.filter((friend) => friend.id !== recipientId));
    setSentRequests(friends.filter((sent) => sent.id !== recipientId));
    setReceivedRequests(
      friends.filter((received) => received.id !== recipientId),
    );
  };

  const startConversation = async (friendUserId) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/conversations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ members: [friendUserId] }),
      },
    );
    const data = await response.json();
    navigate(`/conversations/${data.id}`);
  };

  return (
    <div className="container">
      {filter === "all" &&
        friends.map((friend) => {
          const yourFriend =
            friend.user.id === currentUserId ? friend.buddy : friend.user;

          return (
            <div key={friend.id} className="friend-card">
              <img src={yourFriend.picture} />
              <p>{yourFriend.name}</p>
              <div className="request-actions">
                <button onClick={() => startConversation(yourFriend.id)}>
                  💬
                </button>
                <button onClick={() => denyRequest(friend.id)}>✗</button>
              </div>
            </div>
          );
        })}

      {filter === "pending" && (
        <>
          <p className="received-subtitle">
            Received-{receivedRequests.length}
          </p>
          {receivedRequests.map((received) => {
            console.log("received:", received);
            return (
              <div key={received.id} className="received-card">
                <img src={received.user.picture} />
                <p>{received.user.name}</p>
                <p>{received.user.username}</p>
                <div className="request-actions">
                  <button onClick={() => acceptRequest(received.id)}>✓</button>
                  <button onClick={() => denyRequest(received.id)}>✗</button>
                </div>
              </div>
            );
          })}

          <p className="sent-subtitle">Sent-{sentRequests.length}</p>
          {sentRequests.map((sent) => (
            <div key={sent.buddy.id} className="sent-card">
              <img src={sent.buddy.picture} />
              <p>{sent.buddy.name}</p>
              <p>{sent.buddy.username}</p>
              <button onClick={() => denyRequest(sent.id)}>✗</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default FriendsPage;
