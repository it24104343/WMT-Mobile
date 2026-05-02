import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserRound,
  UserRoundPlus,
  GraduationCap,
  BookOpen,
  Building2,
  ClipboardList,
  ClipboardCheck,
  DollarSign,
  Settings,
  FileText,
  Shield,
  Bell,
  HelpCircle,
  TrendingUp,
  UserPlus,
  UsersRound,
  History
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { path: '/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
    { path: '/teachers', label: 'Teachers', icon: UserRound, roles: ['ADMIN'] },
    { path: '/teacher-assignment', label: 'Assign Teachers', icon: UserRoundPlus, roles: ['ADMIN'] },
    { path: '/students', label: 'Students', icon: GraduationCap, roles: ['ADMIN', 'TEACHER'] },
    { path: '/service-requests', label: 'Requests', icon: HelpCircle, roles: ['ADMIN', 'STUDENT'] },
    { path: '/payments', label: 'Payments', icon: DollarSign, roles: ['ADMIN', 'STUDENT'] },
    { path: '/timetable', label: 'Timetable', icon: Calendar, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { path: '/enrollments', label: 'Enrollments', icon: ClipboardList, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { path: '/classes', label: 'Classes', icon: BookOpen, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { path: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { path: '/exams', label: 'Exams', icon: FileText, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { path: '/halls', label: 'Halls', icon: Building2, roles: ['ADMIN'] },
    { path: '/hall-availability', label: 'Availability', icon: Building2, roles: ['ADMIN', 'TEACHER'] },
    { path: '/notifications', label: 'Notifications', icon: Bell, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { path: '/reports', label: 'Reports', icon: TrendingUp, roles: ['ADMIN', 'TEACHER'] },
    { path: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN', 'STUDENT', 'TEACHER'] }
  ];

  const getNavItems = () => {
    if (user?.role === 'TEACHER') {
      const teacherItems = [
        '/dashboard',
        '/students',
        '/timetable',
        '/enrollments',
        '/classes',
        '/attendance',
        '/exams',
        '/hall-availability',
        '/notifications',
        '/reports'
      ];
      return teacherItems
        .map(path => allNavItems.find(item => item.path === path))
        .filter(Boolean);
    }

    if (user?.role === 'STUDENT') {
      const studentItems = [
        '/dashboard',
        '/service-requests',
        '/payments',
        '/timetable',
        '/enrollments',
        '/classes',
        '/attendance',
        '/exams',
        '/notifications',
        '/settings'
      ];
      return studentItems
        .map(path => allNavItems.find(item => item.path === path))
        .filter(Boolean);
    }

    return allNavItems.filter(item => !item.roles || item.roles.includes(user?.role));
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-800 min-h-screen shadow-sm dark:shadow-lg">
      <div className="p-6 border-b border-gray-300 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center hover:shadow-lg hover:from-green-700 hover:to-green-800 transition-all">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">Ceylon Scholars</h1>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border-l-4 ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium border-primary-600'
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border-transparent'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
