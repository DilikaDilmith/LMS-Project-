# 📚 EduHub LMS - Learning Management System

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=java)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-6DB33F?style=flat&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

A **Production-Ready, Multi-Tenant Learning Management System** built with Spring Boot (Backend) and React (Frontend). Perfect for managing multiple educational institutes, courses, assignments, quizzes, and student progress in one unified platform.

---

## 🎯 **Project Overview**

**EduHub LMS** is a comprehensive learning management system designed to streamline the educational journey for **5 distinct user roles**:

- 🛡️ **System Admin** – Full platform control
- 🏢 **Institute Admin** – Manage individual institutes
- 👨‍🏫 **Lecturer** – Create courses, assignments, quizzes
- 🎓 **Student** – Enroll, learn, submit, and track progress
- 👨‍👩‍👦 **Parent** – Monitor child's academic performance

### 🌟 **Key Highlight: Multi-Tenancy Architecture**
- One system, **multiple independent institutes** (ABC Institute, XYZ Academy, etc.)
- **Complete data isolation** – Institute A **cannot** see Institute B's data
- Perfect for SaaS (Software as a Service) deployment

---

## 🚀 **Live Demo (Optional)**

> *Add your deployed URL here if available*

| Role | Username | Password |
|------|----------|----------|
| System Admin | `admin` | `admin123` |
| Institute Admin | `admin_inst` | `admin123` |
| Lecturer | `lecturer1` | `lecturer123` |
| Student | `newstudent` | `student123` |
| Parent | `parent1` | `parent123` |

---

## ✨ **Core Features**

### 🔐 **Authentication & Security**
- JWT (JSON Web Token) based authentication
- Password hashing with BCrypt
- Role-Based Access Control (RBAC) – 5 distinct roles
- Multi-tenancy data isolation
- Cross-Origin Resource Sharing (CORS) configuration

### 🏢 **Institute Management (System Admin)**
- Create and manage institutes
- Subscription plans: **BASIC**, **STANDARD**, **PREMIUM**
- Activate/Suspend institutes
- View platform-wide statistics

### 📚 **Course Management**
- **Lecturer** creates course → **DRAFT**
- **Submit for Approval** → **PENDING_APPROVAL**
- **Institute Admin** approves/rejects → **APPROVED** / **REJECTED**
- Add **Modules** and **Lessons** with video/PDF materials

### 📝 **Assignments**
- Create assignments with due dates and max marks
- Students submit via file URL (Google Drive, OneDrive)
- Auto-detection of **LATE** submissions
- Lecturers grade with **marks** and **feedback**
- Auto-notifications upon grading

### ❓ **Quizzes**
- Create quizzes with **MCQ**, **True/False**, **Short Answer** questions
- **Auto-grading** for MCQ and True/False
- Passing score configuration
- Instant quiz results and notifications

### 📅 **Attendance**
- Lecturers mark attendance (PRESENT, ABSENT, LATE, EXCUSED)
- Students view attendance percentage
- Parents view child's attendance

### 💰 **Fee & Payment Management**
- Auto-generate fees upon student enrollment
- Record partial or full payments
- Real-time fee status: PENDING → PARTIAL → PAID
- Parents view child's fee details

### 👨‍👩‍👦 **Parent Dashboard**
- Link multiple children to a parent account
- View child's: Attendance, Marks, Course Progress, Fees
- Real-time performance monitoring

### 🔔 **Notifications & Announcements**
- Auto-notifications for: Assignment Grading, Quiz Results, Payments, Course Approvals
- Institute Admin/Lecturer can create announcements for targeted audiences
- Mark notifications as read/unread

### 📋 **Audit Logs**
- Track all important actions: Login, Course Creation, Grading, Payments
- Log details: User, Action, IP Address, Timestamp, Status
- Viewable by System Admin and Institute Admin

---

## 🛠️ **Tech Stack**

### **Backend**
| Component | Technology |
|-----------|------------|
| Language | Java 21 |
| Framework | Spring Boot 3.3.4 |
| Security | Spring Security, JWT |
| Database | MySQL 8, JPA/Hibernate |
| Build Tool | Maven |
| Testing | JUnit 5, Mockito |

### **Frontend**
| Component | Technology |
|-----------|------------|
| Library | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM v6 |
| API Client | Axios |
| Notifications | React Hot Toast |
| State Management | React Context API |

---

## 📂 **Project Structure**

### **Backend (Spring Boot)**# 📚 EduHub LMS - Learning Management System

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=java)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-6DB33F?style=flat&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

A **Production-Ready, Multi-Tenant Learning Management System** built with Spring Boot (Backend) and React (Frontend). Perfect for managing multiple educational institutes, courses, assignments, quizzes, and student progress in one unified platform.

---

## 🎯 **Project Overview**

**EduHub LMS** is a comprehensive learning management system designed to streamline the educational journey for **5 distinct user roles**:

- 🛡️ **System Admin** – Full platform control
- 🏢 **Institute Admin** – Manage individual institutes
- 👨‍🏫 **Lecturer** – Create courses, assignments, quizzes
- 🎓 **Student** – Enroll, learn, submit, and track progress
- 👨‍👩‍👦 **Parent** – Monitor child's academic performance

### 🌟 **Key Highlight: Multi-Tenancy Architecture**
- One system, **multiple independent institutes** (ABC Institute, XYZ Academy, etc.)
- **Complete data isolation** – Institute A **cannot** see Institute B's data
- Perfect for SaaS (Software as a Service) deployment

---

## 🚀 **Live Demo (Optional)**

> *Add your deployed URL here if available*

| Role | Username | Password |
|------|----------|----------|
| System Admin | `admin` | `admin123` |
| Institute Admin | `admin_inst` | `admin123` |
| Lecturer | `lecturer1` | `lecturer123` |
| Student | `newstudent` | `student123` |
| Parent | `parent1` | `parent123` |

---

## ✨ **Core Features**

### 🔐 **Authentication & Security**
- JWT (JSON Web Token) based authentication
- Password hashing with BCrypt
- Role-Based Access Control (RBAC) – 5 distinct roles
- Multi-tenancy data isolation
- Cross-Origin Resource Sharing (CORS) configuration

### 🏢 **Institute Management (System Admin)**
- Create and manage institutes
- Subscription plans: **BASIC**, **STANDARD**, **PREMIUM**
- Activate/Suspend institutes
- View platform-wide statistics

### 📚 **Course Management**
- **Lecturer** creates course → **DRAFT**
- **Submit for Approval** → **PENDING_APPROVAL**
- **Institute Admin** approves/rejects → **APPROVED** / **REJECTED**
- Add **Modules** and **Lessons** with video/PDF materials

### 📝 **Assignments**
- Create assignments with due dates and max marks
- Students submit via file URL (Google Drive, OneDrive)
- Auto-detection of **LATE** submissions
- Lecturers grade with **marks** and **feedback**
- Auto-notifications upon grading

### ❓ **Quizzes**
- Create quizzes with **MCQ**, **True/False**, **Short Answer** questions
- **Auto-grading** for MCQ and True/False
- Passing score configuration
- Instant quiz results and notifications

### 📅 **Attendance**
- Lecturers mark attendance (PRESENT, ABSENT, LATE, EXCUSED)
- Students view attendance percentage
- Parents view child's attendance

### 💰 **Fee & Payment Management**
- Auto-generate fees upon student enrollment
- Record partial or full payments
- Real-time fee status: PENDING → PARTIAL → PAID
- Parents view child's fee details

### 👨‍👩‍👦 **Parent Dashboard**
- Link multiple children to a parent account
- View child's: Attendance, Marks, Course Progress, Fees
- Real-time performance monitoring

### 🔔 **Notifications & Announcements**
- Auto-notifications for: Assignment Grading, Quiz Results, Payments, Course Approvals
- Institute Admin/Lecturer can create announcements for targeted audiences
- Mark notifications as read/unread

### 📋 **Audit Logs**
- Track all important actions: Login, Course Creation, Grading, Payments
- Log details: User, Action, IP Address, Timestamp, Status
- Viewable by System Admin and Institute Admin

---

## 🛠️ **Tech Stack**

### **Backend**
| Component | Technology |
|-----------|------------|
| Language | Java 21 |
| Framework | Spring Boot 3.3.4 |
| Security | Spring Security, JWT |
| Database | MySQL 8, JPA/Hibernate |
| Build Tool | Maven |
| Testing | JUnit 5, Mockito |

### **Frontend**
| Component | Technology |
|-----------|------------|
| Library | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM v6 |
| API Client | Axios |
| Notifications | React Hot Toast |
| State Management | React Context API |

---

## 📂 **Project Structure**

### **Backend (Spring Boot)**


```
lms-backend/
├── src/main/java/com/lms/lms_backend/
│   ├── annotation/          # Custom annotations (Auditable)
│   ├── aspect/              # AOP (Audit Logs)
│   ├── config/              # Security, JWT, CORS
│   ├── controller/          # REST APIs (20+ controllers)
│   ├── dto/                 # Data Transfer Objects
│   ├── exception/           # Global exception handling
│   ├── model/               # JPA Entities (22+ tables)
│   ├── repository/          # JPA Repositories
│   ├── security/            # JWT Utilities
│   ├── service/             # Business Logic
│   └── util/                # TenantContext (Multi-tenancy)
├── src/main/resources/
│   └── application.properties
└── pom.xml
```

### **Frontend (React)**
```
lms-frontend/
├── src/
│   ├── components/
│   │   └── dashboards/          # Role-specific dashboards
│   │       ├── StudentDashboard.jsx
│   │       ├── LecturerDashboard.jsx
│   │       ├── InstituteAdminDashboard.jsx
│   │       ├── SystemAdminDashboard.jsx
│   │       └── ParentDashboard.jsx
│   ├── context/
│   │   └── AuthContext.jsx      # Authentication State Management
│   ├── pages/                   # All pages (20+)
│   │   ├── admin/               # Institute Admin pages
│   │   │   ├── AdminStudents.jsx
│   │   │   ├── AdminLecturers.jsx
│   │   │   └── AdminCourses.jsx
│   │   ├── lecturer/            # Lecturer pages
│   │   │   ├── LecturerCourses.jsx
│   │   │   ├── LecturerCreateCourse.jsx
│   │   │   ├── LecturerGrading.jsx
│   │   │   └── LecturerQuizzes.jsx
│   │   ├── parent/              # Parent pages
│   │   │   ├── ParentChildDetails.jsx
│   │   │   ├── LinkChild.jsx
│   │   │   └── FeePayment.jsx
│   │   ├── student/             # Student pages
│   │   │   ├── StudentCourses.jsx
│   │   │   ├── CourseDetails.jsx
│   │   │   ├── StudentAssignments.jsx
│   │   │   ├── StudentQuizzes.jsx
│   │   │   ├── QuizAttempt.jsx
│   │   │   └── StudentResults.jsx
│   │   ├── system/              # System Admin pages
│   │   │   ├── SystemInstitutes.jsx
│   │   │   ├── SystemUsers.jsx
│   │   │   ├── SystemAuditLogs.jsx
│   │   │   ├── SystemReports.jsx
│   │   │   └── SystemSubscriptions.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Announcements.jsx
│   │   ├── CreateAnnouncement.jsx
│   │   └── Notifications.jsx
│   └── services/
│       └── api.js               # Axios API Services
├── tailwind.config.js
├── package.json
└── vite.config.js
```


---

## 📊 **Database Schema (22+ Tables)**

| Table Name | Description |
|------------|-------------|
| `users` | All users (Admin, Lecturer, Student, Parent) |
| `institutes` | Educational institutes |
| `courses` | Courses |
| `modules` | Course modules/sections |
| `lessons` | Lessons with video/PDF |
| `enrollments` | Student-Course enrollment |
| `assignments` | Assignments with due dates |
| `assignment_submissions` | Student submissions |
| `quizzes` | Quizzes |
| `quiz_questions` | MCQ/True-False questions |
| `quiz_options` | MCQ options |
| `quiz_attempts` | Student quiz attempts |
| `quiz_answers` | Student answers |
| `attendance` | Attendance records |
| `fees` | Fee records |
| `payments` | Payment records |
| `notifications` | User notifications |
| `announcements` | Announcements |
| `audit_logs` | Audit logs |
| `parent_students` | Parent-Student links |
| `student_lesson_progress` | Lesson progress |

---

## 🔄 **Complete User Flows**

### 📚 **Course Creation & Approval Flow**

```
Lecturer → Create Course (DRAFT)
         → Add Modules & Lessons
         → Submit for Approval (PENDING_APPROVAL)
         → Institute Admin Reviews
         → Approve ✅ (APPROVED) / Reject ❌ (REJECTED)
         → Students can Enroll
```

### 📝 **Assignment Flow**
```
Lecturer → Create Assignment
         → Student Submits (File URL)
         → System Checks Due Date (SUBMITTED / LATE)
         → Lecturer Grades (Marks + Feedback)
         → Auto-Notification to Student
         → Student Views Grade
```

### ❓ **Quiz Flow**
```
Lecturer → Create Quiz (MCQ/True-False/Short Answer)
         → Student Starts Quiz
         → Student Answers Questions
         → System Auto-grades MCQ/True-False
         → Score Calculated (Pass/Fail)
         → Auto-Notification with Result
```

### 👨‍👩‍👦 **Parent Flow**
```
Parent → Register → Login → Link Child → View Dashboard
         → Child's Attendance ✅
         → Child's Marks ✅
         → Child's Course Progress ✅
         → Child's Fees ✅
```

---

## 🚀 **Installation Guide**

### **Prerequisites**
- Java 21 (JDK)
- MySQL 8.0+
- Node.js 18+
- Maven (or use included mvnw wrapper)


## 🚀 **Installation Guide**

### **Prerequisites**
- Java 21 (JDK)
- MySQL 8.0+
- Node.js 18+
- Maven (or use included mvnw wrapper)

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/DilikaDilmith/LMS-Project-.git
cd LMS-Project-
```

### **Step 2: Backend Setup**
```bash
# Navigate to backend
cd lms-backend

# Update application.properties with your MySQL credentials
# spring.datasource.url=jdbc:mysql://localhost:3306/lms_db...
# spring.datasource.password=your_password

# Build and run
./mvnw clean compile
./mvnw spring-boot:run
```
> Backend runs on: `http://localhost:8080`

### **Step 3: Frontend Setup**
```bash
# Open a new terminal
cd lms-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
> Frontend runs on: `http://localhost:5173`

### **Step 4: Database Setup**
1. Create MySQL database:
```sql
CREATE DATABASE lms_db;
```
2. Run the backend once – tables auto-generate via Hibernate.

---
## 🤝 **Contributing**

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 **Developer Team**

- **Backend:** Spring Boot, Java, MySQL
- **Frontend:** React, Tailwind CSS, Vite
- **Design:** Custom UI with Tailwind CSS

---

## 🙏 **Acknowledgments**

- Spring Boot team for the amazing framework
- React community for the powerful frontend library
- All open-source libraries used in this project

---

**Built with ❤️ by Dilika Dilmith**

---

⭐ **If you find this project useful, please give it a star!**

