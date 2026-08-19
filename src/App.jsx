import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Navbar from "./components/Navbar";
import AddFriendPage from "./pages/AddFriendPage";
import FriendsPage from "./pages/FriendsPage";
import ConversationPage from "./pages/ConversationPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [filter, setFilter] = useState("all");

  return (
    <>
      <Navbar
        token={token}
        setToken={setToken}
        filter={filter}
        setFilter={setFilter}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage setToken={setToken} />} />
        <Route path="/signup" element={<SignupPage setToken={setToken} />} />
        <Route path="/friends" element={<FriendsPage filter={filter} />} />
        <Route path="/users/search" element={<AddFriendPage />} />
        <Route
          path="/conversations/:conversationId"
          element={<ConversationPage />}
        />
        <Route path="/users/me" element={<ProfilePage />} />
      </Routes>
    </>
  );
}

export default App;
