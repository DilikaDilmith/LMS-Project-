import React from "react";
import { Link } from "react-router-dom";

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  progress,
}) => {
  const colorStyles = {
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-100 text-blue-600",
      value: "text-blue-600",
      border: "border-blue-500",
      progress: "bg-blue-500",
    },
    green: {
      bg: "bg-green-50",
      icon: "bg-green-100 text-green-600",
      value: "text-green-600",
      border: "border-green-500",
      progress: "bg-green-500",
    },
    yellow: {
      bg: "bg-yellow-50",
      icon: "bg-yellow-100 text-yellow-600",
      value: "text-yellow-600",
      border: "border-yellow-500",
      progress: "bg-yellow-500",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "bg-purple-100 text-purple-600",
      value: "text-purple-600",
      border: "border-purple-500",
      progress: "bg-purple-500",
    },
  };

  const styles = colorStyles[color] || colorStyles.blue;

  return (
    <div
      className={`
        group relative overflow-hidden
        bg-white rounded-2xl
        border border-gray-100
        border-l-4 ${styles.border}
        p-5 sm:p-6
        shadow-sm hover:shadow-lg
        transition-all duration-300
        hover:-translate-y-1
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-bold ${styles.value}`}
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
            flex h-12 w-12 items-center justify-center
            rounded-xl ${styles.icon}
            text-xl
            transition-transform duration-300
            group-hover:scale-110
          `}
        >
          {icon}
        </div>
      </div>

      {typeof progress === "number" && (
        <div className="mt-5">
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${styles.progress} transition-all duration-700`}
              style={{
                width: `${Math.min(Math.max(progress, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const QuickAction = ({ to, icon, title, description }) => {
  return (
    <Link
      to={to}
      className="
        group flex items-center gap-4
        rounded-2xl border border-gray-100
        bg-white p-4 sm:p-5
        shadow-sm
        hover:border-blue-200
        hover:shadow-lg
        hover:-translate-y-1
        transition-all duration-300
      "
    >
      <div
        className="
          flex h-12 w-12 shrink-0
          items-center justify-center
          rounded-xl bg-blue-50
          text-xl
          transition-all duration-300
          group-hover:bg-blue-600
          group-hover:text-white
          group-hover:scale-105
        "
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-gray-800 group-hover:text-blue-600">
          {title}
        </h4>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>
      </div>

      <svg
        className="
          h-5 w-5 text-gray-300
          transition-all duration-300
          group-hover:translate-x-1
          group-hover:text-blue-500
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

const StudentDashboard = ({ data }) => {
  const dashboardData = {
    enrolledCourses: data?.enrolledCourses ?? 0,
    pendingAssignments: data?.pendingAssignments ?? 0,
    attendancePercentage: data?.attendancePercentage ?? 0,
    averageMarks: data?.averageMarks ?? 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* =========================
            Welcome Section
        ========================== */}
        <section>
          <div
            className="
              relative overflow-hidden
              rounded-2xl
              bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700
              px-6 py-8 sm:px-8
              text-white
              shadow-lg
            "
          >
            {/* Background decoration */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 right-20 h-48 w-48 rounded-full bg-white/5" />

            <div className="relative">
              <p className="text-sm font-medium text-blue-100">
                Student Dashboard
              </p>

              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Welcome back! 👋
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
                Track your courses, assignments, attendance and
                academic performance from one place.
              </p>
            </div>
          </div>
        </section>

        {/* =========================
            Academic Overview
        ========================== */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Academic Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Here's a summary of your academic progress.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="My Courses"
              value={dashboardData.enrolledCourses}
              subtitle="Currently enrolled"
              icon="📚"
              color="blue"
            />

            <StatCard
              title="Assignments"
              value={dashboardData.pendingAssignments}
              subtitle="Pending submissions"
              icon="📝"
              color="green"
            />

            <StatCard
              title="Attendance"
              value={`${dashboardData.attendancePercentage}%`}
              subtitle="Overall attendance"
              icon="📅"
              color="yellow"
              progress={dashboardData.attendancePercentage}
            />

            <StatCard
              title="Average Marks"
              value={`${dashboardData.averageMarks}%`}
              subtitle="Overall performance"
              icon="📊"
              color="purple"
              progress={dashboardData.averageMarks}
            />

          </div>
        </section>

        {/* =========================
            Quick Actions
        ========================== */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Quickly access your most important learning activities.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <QuickAction
              to="/courses"
              icon="📚"
              title="My Courses"
              description="View enrolled courses"
            />

            <QuickAction
              to="/assignments"
              icon="📝"
              title="Assignments"
              description="View and submit assignments"
            />

            <QuickAction
              to="/student/quizzes"
              icon="❓"
              title="Quizzes"
              description="Take available quizzes"
            />

            <QuickAction
              to="/student/results"
              icon="📈"
              title="Results"
              description="Check your academic results"
            />

          </div>
        </section>

        {/* =========================
            Available & Enrolled Courses Section
        ========================== */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Available Courses
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Explore approved courses available for your learning path.
              </p>
            </div>
            <Link
              to="/student/courses"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl transition"
            >
              View All Courses →
            </Link>
          </div>

          {(!data?.availableCourses || data.availableCourses.length === 0) ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-sm text-gray-500">No available courses right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.availableCourses.map((course) => {
                const enrolled = data.enrolledCoursesList?.some((c) => String(c.id) === String(course.id));

                return (
                  <div
                    key={course.id}
                    className="
                      flex flex-col justify-between
                      rounded-2xl border border-gray-100 bg-white p-6
                      shadow-sm hover:shadow-lg transition-all duration-300
                      hover:-translate-y-1 border-l-4 border-blue-500
                    "
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                          {course.durationWeeks ? `${course.durationWeeks} Weeks` : 'Self-Paced'}
                        </span>
                        {enrolled ? (
                          <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                            ✓ Enrolled
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg">
                            Available
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
                      <p className="mt-2 text-xs text-gray-500 line-clamp-3 leading-relaxed">
                        {course.description || 'Comprehensive learning module for students.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <Link
                        to={`/courses/${course.id}`}
                        className="w-full text-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-1"
                      >
                        View Course Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================
            Performance Summary
        ========================== */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Attendance */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">
                  Attendance
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Your overall attendance percentage
                </p>
              </div>

              <div className="text-2xl">📅</div>
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-gray-800">
                  {dashboardData.attendancePercentage}%
                </span>

                <span className="text-sm text-gray-500">
                  Overall
                </span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-yellow-500 transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        dashboardData.attendancePercentage,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-gray-400">
                Keep your attendance above the required percentage.
              </p>
            </div>
          </div>

          {/* Academic Performance */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">
                  Academic Performance
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Your average marks across courses
                </p>
              </div>

              <div className="text-2xl">📊</div>
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-gray-800">
                  {dashboardData.averageMarks}%
                </span>

                <span className="text-sm text-gray-500">
                  Average
                </span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        dashboardData.averageMarks,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-gray-400">
                Continue completing assignments and quizzes to improve
                your performance.
              </p>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
};

export default StudentDashboard;
