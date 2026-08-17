import React from "react";
import { Link } from "react-router-dom";

const ChildCard = ({ child }) => {
  const attendance = child?.attendance ?? 0;
  const avgMarks = child?.avgMarks ?? 0;
  const progress = child?.progress ?? 0;

  return (
    <div
      className="
        group relative overflow-hidden
        rounded-2xl border border-gray-100
        border-l-4 border-violet-500
        bg-white p-5 sm:p-6
        shadow-sm
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      {/* Decorative Background */}
      <div
        className="
          absolute -right-10 -top-10
          h-24 w-24 rounded-full
          bg-violet-50
          transition-transform duration-500
          group-hover:scale-150
        "
      />

      {/* Child Header */}
      <div className="relative flex items-center gap-4">
        <div
          className="
            flex h-14 w-14 shrink-0
            items-center justify-center
            rounded-full
            bg-violet-100
            text-2xl
            text-violet-600
            ring-4 ring-violet-50
          "
        >
          👤
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-gray-800">
            {child?.name || "Unknown Student"}
          </h3>

          {child?.studentId && (
            <p className="mt-1 text-xs text-gray-500">
              Student ID: {child.studentId}
            </p>
          )}
        </div>
      </div>

      {/* Academic Statistics */}
      <div className="relative mt-6 space-y-5">

        {/* Attendance */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">📅</span>
              <span className="text-sm font-medium text-gray-600">
                Attendance
              </span>
            </div>

            <span className="text-sm font-bold text-green-600">
              {attendance}%
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{
                width: `${Math.min(Math.max(attendance, 0), 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Average Marks */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">📊</span>
              <span className="text-sm font-medium text-gray-600">
                Average Marks
              </span>
            </div>

            <span className="text-sm font-bold text-blue-600">
              {avgMarks}%
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-700"
              style={{
                width: `${Math.min(Math.max(avgMarks, 0), 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Course Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">📚</span>
              <span className="text-sm font-medium text-gray-600">
                Course Progress
              </span>
            </div>

            <span className="text-sm font-bold text-yellow-600">
              {progress}%
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-yellow-500 transition-all duration-700"
              style={{
                width: `${Math.min(Math.max(progress, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* View Details Button */}
      <Link
        to={`/parent/child/${child?.id}`}
        className="
          relative mt-6 flex w-full
          items-center justify-center
          gap-2 rounded-xl
          bg-violet-50
          px-4 py-3
          text-sm font-semibold
          text-violet-600
          transition-all duration-300
          hover:bg-violet-600
          hover:text-white
          focus:outline-none
          focus:ring-2
          focus:ring-violet-500
          focus:ring-offset-2
        "
      >
        View Student Details
        <span
          className="
            transition-transform duration-300
            group-hover:translate-x-1
          "
        >
          →
        </span>
      </Link>
    </div>
  );
};

const ParentDashboard = ({ data }) => {
  const children = data?.children ?? [];

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
              bg-gradient-to-r
              from-violet-600
              via-purple-600
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
                absolute -right-10 -top-10
                h-40 w-40
                rounded-full
                bg-white/10
              "
            />

            <div
              className="
                absolute -bottom-16 right-20
                h-48 w-48
                rounded-full
                bg-white/5
              "
            />

            <div className="relative">
              <p className="text-sm font-medium text-violet-100">
                Parent Dashboard
              </p>

              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Welcome back! 👋
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-violet-100 sm:text-base">
                Monitor your children's academic progress, attendance,
                marks and course performance from one place.
              </p>
            </div>
          </div>
        </section>

        {/* =========================
            Children Section
        ========================== */}
        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                My Children
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Monitor the academic performance of your children.
              </p>
            </div>

            {children.length > 0 && (
              <div
                className="
                  inline-flex w-fit
                  items-center gap-2
                  rounded-full
                  bg-violet-50
                  px-4 py-2
                  text-sm font-medium
                  text-violet-600
                "
              >
                <span>👨‍👩‍👧</span>
                {children.length}{" "}
                {children.length === 1 ? "Child" : "Children"}
              </div>
            )}
          </div>

          {/* =========================
              Children Cards
          ========================== */}
          {children.length > 0 ? (
            <div
              className="
                grid grid-cols-1
                gap-5
                md:grid-cols-2
                xl:grid-cols-3
              "
            >
              {children.map((child) => (
                <ChildCard
                  key={child?.id}
                  child={child}
                />
              ))}
            </div>
          ) : (
            /* =========================
                Empty State
            ========================== */
            <div
              className="
                rounded-2xl
                border-2 border-dashed
                border-gray-300
                bg-white
                px-6 py-14
                text-center
                shadow-sm
              "
            >
              <div
                className="
                  mx-auto flex
                  h-20 w-20
                  items-center justify-center
                  rounded-full
                  bg-violet-50
                  text-4xl
                "
              >
                👨‍👩‍👧
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-800">
                No Children Linked
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                There are currently no students linked to your
                parent account. Please link your child below.
              </p>

              {/* 👇 NEW: Link Child Button */}
              <div className="mt-6">
                <Link
                  to="/parent/link-child"
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-violet-600
                    px-5 py-3
                    text-sm font-semibold
                    text-white
                    shadow-sm
                    transition-all duration-300
                    hover:bg-violet-700
                    hover:shadow-md
                    focus:outline-none
                    focus:ring-2
                    focus:ring-violet-500
                    focus:ring-offset-2
                  "
                >
                  Link Child →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* =========================
            Parent Quick Actions
        ========================== */}
        {children.length > 0 && (
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Quickly access important information about your children.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <Link
                to="/parent/attendance"
                className="
                  group flex items-center gap-4
                  rounded-2xl
                  border border-gray-100
                  bg-white
                  p-5
                  shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-green-200
                  hover:shadow-lg
                "
              >
                <div
                  className="
                    flex h-12 w-12 shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-green-50
                    text-xl
                    transition-all duration-300
                    group-hover:bg-green-500
                    group-hover:text-white
                  "
                >
                  📅
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">
                    Attendance
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    Check attendance records
                  </p>
                </div>
              </Link>

              <Link
                to="/parent/results"
                className="
                  group flex items-center gap-4
                  rounded-2xl
                  border border-gray-100
                  bg-white
                  p-5
                  shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-blue-200
                  hover:shadow-lg
                "
              >
                <div
                  className="
                    flex h-12 w-12 shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-blue-50
                    text-xl
                    transition-all duration-300
                    group-hover:bg-blue-500
                    group-hover:text-white
                  "
                >
                  📊
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">
                    Results
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    View exam and course results
                  </p>
                </div>
              </Link>

              <Link
                to="/parent/payments"
                className="
                  group flex items-center gap-4
                  rounded-2xl
                  border border-gray-100
                  bg-white
                  p-5
                  shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-yellow-200
                  hover:shadow-lg
                "
              >
                <div
                  className="
                    flex h-12 w-12 shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-yellow-50
                    text-xl
                    transition-all duration-300
                    group-hover:bg-yellow-500
                    group-hover:text-white
                  "
                >
                  💳
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">
                    Payments
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    Check course fee payments
                  </p>
                </div>
              </Link>

              <Link
                to="/parent/announcements"
                className="
                  group flex items-center gap-4
                  rounded-2xl
                  border border-gray-100
                  bg-white
                  p-5
                  shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-violet-200
                  hover:shadow-lg
                "
              >
                <div
                  className="
                    flex h-12 w-12 shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-violet-50
                    text-xl
                    transition-all duration-300
                    group-hover:bg-violet-500
                    group-hover:text-white
                  "
                >
                  🔔
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">
                    Announcements
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    View institute announcements
                  </p>
                </div>
              </Link>

            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default ParentDashboard;