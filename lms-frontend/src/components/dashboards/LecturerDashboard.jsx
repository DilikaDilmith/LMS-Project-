import React from "react";
import { Link } from "react-router-dom";

/* =========================================
   Reusable Stat Card
========================================= */

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = "purple",
  alert = false,
}) => {
  const colorStyles = {
    purple: {
      border: "border-purple-500",
      icon: "bg-purple-50 text-purple-600",
      value: "text-purple-600",
    },
    blue: {
      border: "border-blue-500",
      icon: "bg-blue-50 text-blue-600",
      value: "text-blue-600",
    },
    red: {
      border: "border-red-500",
      icon: "bg-red-50 text-red-600",
      value: "text-red-600",
    },
    green: {
      border: "border-green-500",
      icon: "bg-green-50 text-green-600",
      value: "text-green-600",
    },
  };

  const styles = colorStyles[color] || colorStyles.purple;

  return (
    <div
      className={`
        group relative overflow-hidden
        rounded-2xl
        border border-gray-100
        border-l-4 ${styles.border}
        bg-white
        p-5 sm:p-6
        shadow-sm
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-lg
      `}
    >
      {/* Decorative Background */}
      <div
        className="
          absolute -right-10 -top-10
          h-28 w-28
          rounded-full
          bg-gray-50
          transition-transform duration-500
          group-hover:scale-150
        "
      />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p
            className={`
              mt-2
              text-2xl sm:text-3xl
              font-bold
              ${styles.value}
            `}
          >
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`
            flex h-12 w-12 shrink-0
            items-center justify-center
            rounded-xl
            ${styles.icon}
            text-xl
            transition-transform duration-300
            group-hover:scale-110
          `}
        >
          {icon}
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div
          className="
            relative mt-4
            flex items-center gap-2
            rounded-lg
            bg-red-50
            px-3 py-2
            text-xs font-medium
            text-red-600
          "
        >
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Requires attention
        </div>
      )}
    </div>
  );
};

/* =========================================
   Quick Action Card
========================================= */

const QuickAction = ({
  to,
  icon,
  title,
  description,
  color = "purple",
}) => {
  const colorStyles = {
    purple: {
      bg: "bg-purple-50",
      hover: "group-hover:bg-purple-600",
      text: "group-hover:text-purple-600",
    },
    blue: {
      bg: "bg-blue-50",
      hover: "group-hover:bg-blue-600",
      text: "group-hover:text-blue-600",
    },
    green: {
      bg: "bg-green-50",
      hover: "group-hover:bg-green-600",
      text: "group-hover:text-green-600",
    },
    yellow: {
      bg: "bg-yellow-50",
      hover: "group-hover:bg-yellow-500",
      text: "group-hover:text-yellow-600",
    },
  };

  const styles = colorStyles[color] || colorStyles.purple;

  return (
    <Link
      to={to}
      className="
        group
        flex items-center gap-4
        rounded-2xl
        border border-gray-100
        bg-white
        p-4 sm:p-5
        shadow-sm
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      {/* Icon */}
      <div
        className={`
          flex h-12 w-12 shrink-0
          items-center justify-center
          rounded-xl
          ${styles.bg}
          text-xl
          transition-all duration-300
          ${styles.hover}
          group-hover:text-white
          group-hover:scale-105
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h4
          className={`
            font-semibold
            text-gray-800
            transition-colors duration-300
            ${styles.text}
          `}
        >
          {title}
        </h4>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>
      </div>

      {/* Arrow */}
      <svg
        className="
          h-5 w-5
          shrink-0
          text-gray-300
          transition-all duration-300
          group-hover:translate-x-1
          group-hover:text-purple-500
        "
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
};

/* =========================================
   Lecturer Dashboard
========================================= */

const LecturerDashboard = ({ data }) => {
  const totalCourses = data?.totalCourses ?? 0;
  const totalStudents = data?.totalStudents ?? 0;
  const pendingGrading = data?.pendingGrading ?? 0;
  const totalAssignments = data?.totalAssignments ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* =====================================
            Welcome Header
        ====================================== */}
        <section>
          <div
            className="
              relative overflow-hidden
              rounded-2xl
              bg-gradient-to-r
              from-purple-600
              via-purple-700
              to-indigo-700
              px-6 py-8
              text-white
              shadow-lg
              sm:px-8
            "
          >
            {/* Background Decorations */}
            <div
              className="
                absolute -right-12 -top-12
                h-44 w-44
                rounded-full
                bg-white/10
              "
            />

            <div
              className="
                absolute -bottom-20 right-24
                h-56 w-56
                rounded-full
                bg-white/5
              "
            />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-xl
                    bg-white/10
                    text-xl
                    backdrop-blur-sm
                  "
                >
                  👨‍🏫
                </div>

                <p className="text-sm font-medium text-purple-100">
                  Lecturer Dashboard
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Welcome back! 👋
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-purple-100 sm:text-base">
                    Manage your courses, students, assignments, grading and attendance from one place.
                  </p>
                </div>
                <Link
                  to="/lecturer/create-course"
                  className="px-5 py-2.5 bg-white text-purple-700 hover:bg-purple-50 text-sm font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5"
                >
                  + Create New Course 📤
                </Link>
              </div>
            </div>
          </div>
        </section>



        {/* =====================================
            Teaching Overview
        ====================================== */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              Teaching Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Here's a quick summary of your teaching activities.
            </p>
          </div>

          <div
            className="
              grid grid-cols-1
              gap-5
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            <StatCard
              title="My Courses"
              value={totalCourses}
              subtitle="Active teaching courses"
              icon="📚"
              color="purple"
            />

            <StatCard
              title="Students"
              value={totalStudents}
              subtitle="Students enrolled"
              icon="👨‍🎓"
              color="blue"
            />

            <StatCard
              title="Pending Grading"
              value={pendingGrading}
              subtitle="Submissions to review"
              icon="📝"
              color="red"
              alert={pendingGrading > 0}
            />

            <StatCard
              title="Assignments"
              value={totalAssignments}
              subtitle="Created assignments"
              icon="📋"
              color="green"
            />
          </div>
        </section>

        {/* =====================================
            Quick Actions
        ====================================== */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Quickly access your most important teaching tools.
            </p>
          </div>

          <div
            className="
              grid grid-cols-1
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            <QuickAction
              to="/lecturer/courses"
              icon="📚"
              title="My Courses"
              description="Manage your courses and content"
              color="purple"
            />

            <QuickAction
              to="/lecturer/assignments"
              icon="📝"
              title="Assignments"
              description="Create and manage assignments"
              color="blue"
            />

            <QuickAction
              to="/lecturer/grading"
              icon="✅"
              title="Grade Work"
              description="Review and grade submissions"
              color="green"
            />

            <QuickAction
              to="/lecturer/quizzes"
              icon="❓"
              title="Quizzes"
              description="Create and manage course quizzes"
              color="purple"
            />

            <QuickAction
              to="/lecturer/attendance"
              icon="📅"
              title="Attendance"
              description="Manage student attendance"
              color="yellow"
            />
          </div>
        </section>


        {/* =====================================
            Teaching Summary
        ====================================== */}
        <section>
          <div
            className="
              rounded-2xl
              border border-gray-100
              bg-white
              p-6
              shadow-sm
              sm:p-7
            "
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Teaching Summary
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Current overview of your teaching workload.
                </p>
              </div>

              <div
                className="
                  inline-flex w-fit
                  items-center gap-2
                  rounded-full
                  bg-green-50
                  px-4 py-2
                  text-sm font-medium
                  text-green-600
                "
              >
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Teaching Active
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

              {/* Courses */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-10 w-10
                      items-center justify-center
                      rounded-lg
                      bg-purple-100
                      text-purple-600
                    "
                  >
                    📚
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Active Courses
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-800">
                      {totalCourses}
                    </p>
                  </div>
                </div>
              </div>

              {/* Students */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-10 w-10
                      items-center justify-center
                      rounded-lg
                      bg-blue-100
                      text-blue-600
                    "
                  >
                    👨‍🎓
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Total Students
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-800">
                      {totalStudents}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-10 w-10
                      items-center justify-center
                      rounded-lg
                      bg-green-100
                      text-green-600
                    "
                  >
                    📝
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Assignments
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-800">
                      {totalAssignments}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =====================================
            Pending Grading Alert
        ====================================== */}
        {pendingGrading > 0 && (
          <section>
            <div
              className="
                flex flex-col
                gap-4
                rounded-2xl
                border border-red-100
                bg-red-50
                p-5
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div className="flex items-start gap-4">
                <div
                  className="
                    flex h-11 w-11
                    shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-red-100
                    text-xl
                  "
                >
                  📝
                </div>

                <div>
                  <h3 className="font-bold text-red-800">
                    Pending Submissions
                  </h3>

                  <p className="mt-1 text-sm text-red-600">
                    You have {pendingGrading} submission
                    {pendingGrading !== 1 ? "s" : ""} waiting
                    for grading.
                  </p>
                </div>
              </div>

              <Link
                to="/lecturer/grading"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-red-600
                  px-5 py-3
                  text-sm font-semibold
                  text-white
                  transition-all duration-300
                  hover:bg-red-700
                  hover:shadow-md
                  focus:outline-none
                  focus:ring-2
                  focus:ring-red-500
                  focus:ring-offset-2
                "
              >
                Grade Submissions
                <span>→</span>
              </Link>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default LecturerDashboard;