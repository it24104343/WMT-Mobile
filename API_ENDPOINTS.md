# 📡 API Endpoint Reference - Ceylon Scholars Academy

This document provides a comprehensive list of all backend API endpoints available in the Tution Management System.

| Category | Method | Endpoint | Description | Auth Required |
|:--- |:--- |:--- |:--- |:--- |
| **Authentication** | POST | `/api/auth/register` | Create a new user account | No |
| | POST | `/api/auth/login` | Sign in and receive JWT token | No |
| | GET | `/api/profile` | Get current user profile details | Yes |
| | PUT | `/api/profile` | Update profile (Name, Phone, Image) | Yes |
| | PUT | `/api/auth/password` | Change account password | Yes |
| **Dashboard** | GET | `/api/dashboard/admin` | Overall revenue, enrollment & class stats | Yes |
| | GET | `/api/dashboard/teacher` | Assigned classes, sessions & student count | Yes |
| | GET | `/api/dashboard/student` | Enrolled classes, exams & attendance % | Yes |
| **Exams** | GET | `/api/exams` | Fetch all available exams (filtered) | Yes |
| | POST | `/api/exams` | Create a new exam paper (Admin/Teacher) | Yes |
| | GET | `/api/exams/:id` | Get detailed exam info and questions | Yes |
| | PUT | `/api/exams/:id` | Update exam metadata | Yes |
| | PUT | `/api/exams/:id/publish` | Toggle exam visibility for students | Yes |
| | GET | `/api/exams/:id/results` | Fetch student attempts and analytics | Yes |
| | POST | `/api/exams/:id/questions` | Add a new question to the exam | Yes |
| **Exam Attempts** | POST | `/api/exams/:examId/attempt` | Start a new student exam attempt | Yes |
| | PUT | `/api/exams/:examId/attempt/submit` | Submit answers for grading | Yes |
| | GET | `/api/exams/:examId/attempt/:studentId` | View specific student's attempt | Yes |
| | PUT | `/api/exams/:examId/attempt/:studentId/grade` | Manually grade written submissions | Yes |
| **Classes** | GET | `/api/classes` | Fetch all available tution classes | Yes |
| | POST | `/api/classes` | Add a new class (Admin only) | Yes |
| | GET | `/api/classes/:id` | Get detailed class information | Yes |
| **Enrollments** | GET | `/api/enrollments` | Fetch all student enrollments | Yes |
| | POST | `/api/enrollments` | Enroll a student in a class | Yes |
| | GET | `/api/enrollments/class/:id` | List all students in a specific class | Yes |
| | GET | `/api/enrollments/student/:id` | List all classes for a specific student | Yes |
| **Payments** | GET | `/api/payments` | Fetch payment history and logs | Yes |
| | POST | `/api/payments` | Record a new fee payment (Admin) | Yes |
| | GET | `/api/payments/stats` | View monthly revenue collection trends | Yes |
| | PUT | `/api/payments/:id/verify` | Verify manual payment slip uploads | Yes |
| **Attendance** | GET | `/api/attendance` | Get class attendance history | Yes |
| | POST | `/api/attendance/mark` | Mark student attendance for a session | Yes |
| | GET | `/api/attendance/student/:id` | View attendance for a specific student | Yes |
| **Messaging** | GET | `/api/service-requests` | Fetch support/leave requests | Yes |
| | POST | `/api/service-requests` | Submit a new request or direct message | Yes |
| | PUT | `/api/service-requests/:id/status` | Update request (Pending/Resolved) | Yes |
| **System** | GET | `/api/announcements` | Fetch platform-wide notifications | Yes |
| | GET | `/api/status` | Check if backend is alive | No |

---
*Note: All "Yes" endpoints require the `Authorization: Bearer <token>` header.*
