import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function Navbar({ token, setToken, setFilter }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
  };
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/user/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setCurrentUser(data));
    }
  }, [token]);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        Messaging App
      </Link>
      <div className="nav-links"></div>
      {token ? (
        <>
          <h2>Friends</h2>
          <button
            onClick={() => {
              setFilter("all");
              navigate("/friends");
            }}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilter("pending");
              navigate("/friends");
            }}
          >
            Pending
          </button>
          <Link to="/users/search" className="nav-link">
            Add Friend
          </Link>
          <Link to="/users/me">
            <img src={currentUser?.picture} className="nav-avatar" />
          </Link>
          <button onClick={handleLogout} className="nav-logout">
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="nav-link">
            Login
          </Link>
          <Link to="/signup" className="nav-link nav-link-primary">
            Sign Up
          </Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;
