import { Link } from 'react-router-dom';
import { Menu, X, LogIn, ChevronRight, Layout as DashboardIcon, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const PublicHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-green-900/40 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-500 whitespace-nowrap">
              Ceylon Scholars
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 dark:bg-green-400 transition-all group-hover:w-full"></span>
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-gray-700 dark:text-yellow-300 hover:text-gray-900 dark:hover:text-yellow-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 ring-1 ring-gray-300 dark:ring-gray-700"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400 hover:text-yellow-300" />
              ) : (
                <Moon className="w-5 h-5 text-blue-500 hover:text-blue-600" />
              )}
            </button>
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-green-700 hover:shadow-lg hover:shadow-green-200 dark:hover:shadow-green-900/40 transition-all active:scale-95"
              >
                <DashboardIcon className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-green-700 hover:shadow-lg hover:shadow-green-200 dark:hover:shadow-green-900/40 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button and Theme Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-blue-500" />
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 px-4">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all"
                >
                  <DashboardIcon className="w-5 h-5" />
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all"
                >
                  <LogIn className="w-5 h-5" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
