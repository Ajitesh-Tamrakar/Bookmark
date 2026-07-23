import { useState, useEffect } from 'react';

// Dev-mode guard — redirects away if setup_status says dev_mode is false
export default function useDevModeGuard() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'allowed' | 'denied'

  useEffect(() => {
    fetch('/setup/status/')
      .then((res) => res.json())
      .then((data) => setStatus(data.dev_mode ? 'allowed' : 'denied'))
      .catch(() => setStatus('denied'));
  }, []);

  return status;
}
