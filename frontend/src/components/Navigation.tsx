import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';
import { useTelemetry } from '../hooks/useTelemetry';

interface NavigationProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, signOut, canAccess } = useAuth();
  const { trackUserAction } = useTelemetry();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => 
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const navigation = [
    { name: 'Chat', href: '/chat', icon: '💬', current: location.pathname === '/chat' },
    { name: 'Dashboards', href: '/dashboards', icon: '📊', current: location.pathname === '/dashboards' },
    { name: 'Datasets', href: '/datasets', icon: '📈', current: location.pathname === '/datasets' },
  ];

  const adminNavigation = [
    { name: 'Admin', href: '/admin', icon: '⚙️', current: location.pathname === '/admin' },
  ];

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDarkMode);
    
    trackUserAction('toggle_theme', { theme: newDarkMode ? 'dark' : 'light' });
  };

  const handleSignOut = () => {
    trackUserAction('sign_out');
    signOut();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-dnb-green-600">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-lg">🌱</span>
          </div>
          <span className="ml-2 text-white font-semibold text-lg">
            Green Guardian
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 bg-white dark:bg-gray-800 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`
                ${item.current
                  ? 'bg-dnb-green-100 dark:bg-dnb-green-900 text-dnb-green-900 dark:text-dnb-green-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}

          {canAccess([UserRole.ADMIN]) && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    ${item.current
                      ? 'bg-dnb-green-100 dark:bg-dnb-green-900 text-dnb-green-900 dark:text-dnb-green-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-dnb-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.roles.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleDarkMode}
              className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
            >
              <span className="mr-2">{darkMode ? '☀️' : '🌙'}</span>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center">
            <div className="h-8 w-8 bg-dnb-green-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🌱</span>
            </div>
            <span className="ml-2 text-gray-900 dark:text-white font-semibold">
              Green Guardian
            </span>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700">
          {sidebarContent}
        </div>
      </div>
    </>
  );
};

export default Navigation;
