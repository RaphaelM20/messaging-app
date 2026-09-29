import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import Avatar from "./ui/Avatar";
import Icon from "./ui/Icon";

function NavItem({ to, icon, active, children }) {
  return (
    <Link
      to={to}
      className="nav-item"
      aria-current={active ? "page" : undefined}
      title={children}
    >
      <Icon name={icon} />
      <span className="nav-item__text">{children}</span>
    </Link>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const onFriendsPage = pathname === "/friends";
  const pendingTab = new URLSearchParams(search).get("tab") === "pending";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-header">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Link to="/" className="brand">
        <span className="brand__icon">
          <Icon name="message" size="1rem" />
        </span>
        <span className="brand__text">Messaging App</span>
      </Link>

      {isAuthenticated ? (
        <nav className="app-nav" aria-label="Main">
          <span className="app-nav__label" aria-hidden="true">
            Friends
          </span>
          <NavItem
            to="/friends"
            icon="users"
            active={onFriendsPage && !pendingTab}
          >
            All friends
          </NavItem>
          <NavItem
            to="/friends?tab=pending"
            icon="clock"
            active={onFriendsPage && pendingTab}
          >
            Pending
          </NavItem>
          <NavItem
            to="/users/search"
            icon="userPlus"
            active={pathname === "/users/search"}
          >
            Add Friend
          </NavItem>
          <span className="app-nav__divider" aria-hidden="true" />
          <Link
            to="/users/me"
            className="nav-avatar-link"
            aria-label="Your profile"
            aria-current={pathname === "/users/me" ? "page" : undefined}
            title="Your profile"
          >
            <Avatar src={user?.picture} name={user?.name} size="sm" />
          </Link>
          <button
            type="button"
            className="nav-item nav-item--danger"
            onClick={handleLogout}
            title="Log out"
          >
            <Icon name="logout" />
            <span className="nav-item__text">Log out</span>
          </button>
        </nav>
      ) : (
        <nav className="app-nav" aria-label="Account">
          <Link
            to="/login"
            className="nav-item"
            aria-current={pathname === "/login" ? "page" : undefined}
          >
            Log in
          </Link>
          <Link to="/signup" className="button button--primary button--sm">
            Sign up
          </Link>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
