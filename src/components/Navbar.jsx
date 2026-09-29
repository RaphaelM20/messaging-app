import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        Messaging App
      </Link>
      <div className="nav-links"></div>
      {isAuthenticated ? (
        <>
          <h2>Friends</h2>
          <button onClick={() => navigate("/friends")}>All</button>
          <button onClick={() => navigate("/friends?tab=pending")}>
            Pending
          </button>
          <Link to="/users/search" className="nav-link">
            Add Friend
          </Link>
          <Link to="/users/me" aria-label="Your profile">
            {user?.picture && (
              <img src={user.picture} alt="" className="nav-avatar" />
            )}
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
