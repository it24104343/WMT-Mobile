import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import IOSDashboard from './components/IOSDashboard';
import Login from './pages/Auth/Login';
import FirstLoginReset from './pages/Auth/FirstLoginReset';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import TeacherPaymentPage from './pages/Auth/TeacherPaymentPage';

import Layout from './components/Layout/Layout';
import PublicLayout from './components/Layout/PublicLayout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';

import ClassList from './pages/Classes/ClassList';
import ClassForm from './pages/Classes/ClassForm';
import ClassDetail from './pages/Classes/ClassDetail';
import Timetable from './pages/Timetable/Timetable';
import TeacherList from './pages/Teachers/TeacherList';
import { TeacherAssignmentPage } from './pages/Teachers';
import StudentList from './pages/Students/StudentList';
import { UserList } from './pages/Users';
import { HallList, AvailabilityView } from './pages/Halls';
import { EnrollmentList } from './pages/Enrollments';
import { PaymentList } from './pages/Payments';
import { SettingsPage } from './pages/Settings';
import { AttendancePage } from './pages/Attendance';
import { ExamList, TakeExam } from './pages/Exams';
import { ClassPage } from './pages/ClassPage';
import { NotificationCenter } from './pages/Notifications';
import { ServiceRequestPage } from './pages/ServiceRequests';
import { Dashboard } from './pages/Dashboard';
import { RevenueReports } from './pages/Reports';
import { ProfilePage } from './pages/Profile';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
          {/* Public Landing Pages */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/first-reset" element={<FirstLoginReset />} />
          <Route path="/teacher-payment" element={<TeacherPaymentPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/ios-dashboard" element={<IOSDashboard />} />
                    <Route path="/classes" element={<ClassList />} />
                    <Route path="/classes/new" element={<ClassForm />} />
                    <Route path="/classes/:id" element={<ClassDetail />} />
                    <Route path="/classes/:id/edit" element={<ClassForm />} />
                    <Route path="/timetable" element={<Timetable />} />
                    <Route path="/teachers" element={<TeacherList />} />
                    <Route path="/teacher-assignment" element={<TeacherAssignmentPage />} />
                    <Route path="/students" element={<StudentList />} />
                    <Route path="/users" element={<UserList />} />
                    <Route path="/halls" element={<HallList />} />
                    <Route path="/hall-availability" element={<AvailabilityView />} />
                    <Route path="/enrollments" element={<EnrollmentList />} />
                    <Route path="/payments" element={<PaymentList />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/attendance" element={<AttendancePage />} />
                    <Route path="/exams" element={<ExamList />} />
                    <Route path="/exams/:id/take" element={<TakeExam />} />
                    <Route path="/class/:id" element={<ClassPage />} />
                    <Route path="/notifications" element={<NotificationCenter />} />
                    <Route path="/service-requests" element={<ServiceRequestPage />} />
                    <Route path="/reports" element={<RevenueReports />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </Router>
    </ThemeProvider>
  );
}

export default App;
