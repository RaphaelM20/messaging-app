import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="page">
      <section className="welcome" aria-labelledby="not-found-title">
        <p className="welcome__icon" aria-hidden="true">
          ?
        </p>
        <h1 id="not-found-title" className="welcome__title">
          Page not found
        </h1>
        <p className="welcome__body">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="welcome__actions">
          <Link to="/" className="button button--primary">
            Go home
          </Link>
        </div>
      </section>
    </div>
  );
}

export default NotFoundPage;
