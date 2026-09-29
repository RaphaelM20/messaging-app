import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { apiFetch, isAbortError } from "../lib/api";
import ChatList from "../components/chats/ChatList";
import NewChatDialog from "../components/chats/NewChatDialog";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import Icon from "../components/ui/Icon";
import SkeletonList from "../components/ui/SkeletonList";

function Welcome() {
  return (
    <div className="page">
      <section className="welcome" aria-labelledby="welcome-title">
        <span className="welcome__icon" aria-hidden="true">
          <Icon name="message" />
        </span>
        <h1 id="welcome-title" className="welcome__title">
          Messaging App
        </h1>
        <p className="welcome__body">
          Chat one-on-one or in groups with your friends. Log in to see your
          conversations.
        </p>
        <div className="welcome__actions">
          <Link to="/login" className="button button--primary">
            Log in
          </Link>
          <Link to="/signup" className="button button--secondary">
            Create an account
          </Link>
        </div>
      </section>
    </div>
  );
}

function Conversations() {
  const { currentUserId } = useAuth();
  const [chats, setChats] = useState([]);
  const [status, setStatus] = useState("loading");
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/conversations", { signal: controller.signal })
      .then((data) => {
        setChats(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (!isAbortError(err)) setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const openNewChat = () => setShowNewChat(true);

  const renderChats = () => {
    if (status === "loading") {
      return <SkeletonList label="Loading conversations" />;
    }
    if (status === "error") {
      return (
        <Alert>Couldn't load your chats. Please refresh to try again.</Alert>
      );
    }
    if (chats.length === 0) {
      return (
        <EmptyState
          icon="message"
          title="No conversations yet"
          action={
            <button
              type="button"
              className="button button--primary"
              onClick={openNewChat}
            >
              Start a conversation
            </button>
          }
        >
          Message a friend or start a group chat.
        </EmptyState>
      );
    }
    return <ChatList chats={chats} currentUserId={currentUserId} />;
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Conversations</h1>
        <button
          type="button"
          className="button button--primary"
          onClick={openNewChat}
        >
          <Icon name="plus" />
          New chat
        </button>
      </div>
      {renderChats()}
      <NewChatDialog open={showNewChat} onClose={() => setShowNewChat(false)} />
    </div>
  );
}

function HomePage() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Conversations /> : <Welcome />;
}

export default HomePage;
