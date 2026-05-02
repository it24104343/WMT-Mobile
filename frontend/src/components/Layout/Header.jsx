import { useState, useEffect } from 'react';
import { Bell, Search, User as UserIcon, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUrl';
import notificationService from '../../services/notificationService';

const Header = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationService.getNotifications({ limit: 1 });
        if (response.success) {
          setUnreadCount(response.unreadCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread notifications count:', error);
      }
    };
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-800 px-6 flex items-center justify-between shadow-sm dark:shadow-lg">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 text-gray-700 dark:text-yellow-300 hover:text-gray-900 dark:hover:text-yellow-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 ring-1 ring-gray-300 dark:ring-gray-700"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-6 h-6 text-yellow-400 hover:text-yellow-300" />
          ) : (
            <Moon className="w-6 h-6 text-blue-500 hover:text-blue-600" />
          )}
        </button>

        <Link to="/notifications" className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          )}
        </Link>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-300 dark:border-gray-800">
          <Link to="/profile" className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors cursor-pointer group">
            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 rounded-full flex items-center justify-center transition-colors overflow-hidden border border-primary-300 dark:border-primary-700">
              {user?.profileImage ? (
                <img src={getImageUrl(user.profileImage)} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{user?.username || 'User'}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{user?.role || 'Guest'}</p>
            </div>
          </Link>
          <button 
            onClick={handleLogout} 
            className="ml-1 p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
