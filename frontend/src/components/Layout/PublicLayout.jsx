import { useTheme } from '../../context/ThemeContext';
import PublicHeader from './PublicHeader';

const PublicLayout = ({ children }) => {
  const { isDark } = useTheme();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Ceylon Scholars Academy. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
