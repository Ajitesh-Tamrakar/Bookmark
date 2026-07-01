import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function RootRedirect() {
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8080/setup/status/')
      .then((res) => res.json())
      .then((data) => {
        setDestination(data.setup_complete ? '/search' : '/setup');
      })
      .catch(() => {
        // Backend unreachable — send to setup as safe fallback
        setDestination('/setup');
      });
  }, []);

  if (!destination) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-border-strong border-t-text-primary animate-spin" />
      </div>
    );
  }

  return <Navigate to={destination} replace />;
}
