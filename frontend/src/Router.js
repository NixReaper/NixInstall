import React, { useState, useEffect } from 'react';
import App from './App';
import Admin from './Admin';
import RequestApp from './RequestApp';
import HelpPage from './HelpPage';
import AboutPage from './AboutPage';

function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    window.navigateTo = (path) => {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
    };
  }, []);

  if (currentPath.startsWith('/admin')) return <Admin />;
  if (currentPath.startsWith('/request')) return <RequestApp />;
  if (currentPath.startsWith('/help')) return <HelpPage />;
  if (currentPath.startsWith('/about')) return <AboutPage />;

  return <App />;
}

export default Router;
