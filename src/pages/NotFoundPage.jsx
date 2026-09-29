import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="container">
      <h2>Page not found</h2>
      <p>
        The page you're looking for doesn't exist. <Link to="/">Go home</Link>
      </p>
    </div>
  );
}

export default NotFoundPage;
