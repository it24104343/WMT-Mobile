# 🎓 Ceylon Scholars Academy - Tution Management System

A premium, role-based educational management platform designed to streamline tution class operations. The system provides specialized interfaces for Students, Teachers, and Administrators, ensuring a seamless flow of information from class enrollment to exam performance analytics.

## ✨ Key Features

*   **📊 Unified Administrative Dashboard:** Real-time revenue tracking, student enrollment statistics, and class management with premium "Green & White" branding.
*   **📝 Comprehensive Exam Module:**
    *   **Teachers:** Create complex MCQ or written exams, manage questions, and grade submissions.
    *   **Admins:** View high-level performance summaries, attendance rates, and pass/fail analytics without technical clutter.
    *   **Students:** Take live exams, view upcoming schedules, and track historical results.
*   **✅ Smart Attendance System:** Role-based attendance tracking for both students and teachers, integrated directly with class schedules.
*   **💳 Payment & Enrollment Management:** Automated monthly fee tracking, enrollment mapping, and secure payment status indicators.
*   **✉️ Direct Service Requests:** A streamlined communication channel allowing students to send leave requests and admins to send direct messages to teachers.
*   **🔐 Secure Role-Based Access (RBAC):** Strict data isolation using JWT authentication, ensuring users only see information relevant to their role (Student, Teacher, or Admin).

## 🛠️ Technology Stack

*   **Mobile App:** React Native, Expo, Expo Router, Lucide React (Icons), Linear Gradient
*   **Frontend (Admin Web):** React.js, Tailwind CSS
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (Mongoose ODM)
*   **Authentication:** JWT (JSON Web Tokens) & bcrypt hashing

## 📁 Project Structure

```text
Tution_Class_System/
├── mobile/                   # Expo Mobile Application
│   ├── app/                  # File-based routing (Expo Router)
│   │   ├── (tabs)/           # Main dashboard and navigation
│   │   ├── exams/            # Exam management & results
│   │   ├── requests/         # Service requests & messaging
│   │   └── enrollments/      # Class enrollment views
│   └── src/                  # Core logic (API, Context, Utils)
├── backend/                  # Express.js API
│   ├── controllers/          # Business logic (Exam, User, Class)
│   ├── models/               # MongoDB Schemas
│   ├── routes/               # API Endpoint definitions
│   └── middleware/           # Auth and Error handling
├── frontend/                 # React Web Application (Admin Panel)
└── package.json              # Workspace configuration
```

## 🚀 Getting Started

To run the full suite locally, you need to start the backend services and the mobile environment:

1.  **Backend Setup**:
    *   Navigate to `/backend`
    *   Configure your `.env` (MongoDB URI, JWT Secret)
    *   Run `npm install` then `npm run dev`
2.  **Mobile Setup**:
    *   Navigate to `/mobile`
    *   Run `npm install`
    *   Launch with `npx expo start`
3.  **Frontend Setup**:
    *   Navigate to `/frontend`
    *   Run `npm install` then `npm run dev`

Refer to the internal documentation for detailed configuration steps.

## 🔒 Security Notes

*   **Data Isolation**: The system implements strict backend filtering. Students can never access other students' data, and Teachers are restricted to their assigned classes.
*   **Credential Security**: All passwords are encrypted using `bcrypt` before storage.
*   **API Security**: All protected routes require a valid JWT bearer token in the authorization header.

## 🤝 Contributing

When contributing, ensure all UI updates adhere to the academy's official primary green (`#10b981`) and dark navy (`#0f172a`) color palette. Component nesting should be strictly validated to prevent JSX bundling errors.

---
*Developed for Ceylon Scholars Academy - Empowering the next generation.*
"# WMT-Mobile" 
