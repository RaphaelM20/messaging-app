// Placeholder rows shaped like the list that is loading.
function SkeletonList({ label, rows = 4 }) {
  return (
    <div className="skeleton-list" role="status">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton-row" aria-hidden="true">
          <span className="skeleton skeleton--avatar" />
          <span className="skeleton-row__lines">
            <span
              className="skeleton skeleton--line"
              style={{ width: `${45 - index * 5}%` }}
            />
            <span
              className="skeleton skeleton--line"
              style={{ width: `${70 - index * 8}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

export default SkeletonList;
