import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import GuestOnly from "./components/GuestOnly";
import AddFriendPage from "./pages/AddFriendPage";
import FriendsPage from "./pages/FriendsPage";
import ConversationPage from "./pages/ConversationPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const [filter, setFilter] = useState("all");

  return (
    <>
      <Navbar setFilter={setFilter} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <SignupPage />
            </GuestOnly>
          }
        />
        <Route
          path="/friends"
          element={
            <RequireAuth>
              <FriendsPage filter={filter} />
            </RequireAuth>
          }
        />
        <Route
          path="/users/search"
          element={
            <RequireAuth>
              <AddFriendPage />
            </RequireAuth>
          }
        />
        <Route
          path="/conversations/:conversationId"
          element={
            <RequireAuth>
              <ConversationPage />
            </RequireAuth>
          }
        />
        <Route
          path="/users/me"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
