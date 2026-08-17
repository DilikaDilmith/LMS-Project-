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
  color = "blue",
  alert = false,
}) => {
  const colorStyles = {
    blue: {
      border: "border-blue-600",
      icon: "bg-blue-50 text-blue-600",
      value: "text-blue-600",
    },
    indigo: {
      border: "border-indigo-500",
      icon: "bg-indigo-50 text-indigo-600",
      value: "text-indigo-600",
    },
    green: {
      border: "border-green-600",
      icon: "bg-green-50 text-green-600",
      value: "text-green-600",
    },
    red: {
      border: "border-red-500",
      icon: "bg-red-50 text-red-600",
      value: "text-red-600",
    },
  };

  const styles = colorStyles[color] || colorStyles.blue;

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
              break-words
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
   Management Action
========================================= */

const ManagementAction = ({
  to,
  icon,
  title,
  description,
  color = "blue",
}) => {
  const colorStyles = {
    blue: {
      bg: "bg-blue-50",
      hover: "group-hover:bg-blue-600",
    },
    indigo: {
      bg: "bg-indigo-50",
      hover: "group-hover:bg-indigo-600",
    },
    green: {
      bg: "bg-green-50",
      hover: "group-hover:bg-green-600",
    },
    purple: {
      bg: "bg-purple-50",
      hover: "group-hover:bg-purple-600",
    },
  };

  const styles = colorStyles[color] || colorStyles.blue;

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

      {/* Text */}
      <div className="min-w-0 flex-1">
        <h4
          className="
            font-semibold
            text-gray-800
            transition-colors
            group-hover:text-blue-600
          "
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

/* =========================================
   System Admin Dashboard
========================================= */

const SystemAdminDashboard = ({ data }) => {
  const totalInstitutes = data?.totalInstitutes ?? 0;
  const totalUsers = data?.totalUsers ?? 0;
  const revenue = data?.revenue ?? 0;
  const pendingRequests = data?.pendingRequests ?? 0;

  const formattedRevenue = Number(revenue).toLocaleString();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* =====================================
            Welcome / Header
        ====================================== */}
        <section>
          <div
            className="
              relative overflow-hidden
              rounded-2xl
              bg-gradient-to-r
              from-slate-800
              via-blue-800
              to-indigo-800
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
                  ⚙️
                </div>

                <p className="text-sm font-medium text-blue-100">
                  System Administration
                </p>
              </div>

              <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
                Platform Overview 👋
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
                Monitor institutes, users, subscriptions, revenue
                and system-wide activities from one central dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================
            Platform Overview
        ====================================== */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              Platform Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              A quick summary of your LMS platform.
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
              title="Institutes"
              value={totalInstitutes}
              subtitle="Registered institutes"
              icon="🏢"
              color="blue"
            />

            <StatCard
              title="Total Users"
              value={totalUsers}
              subtitle="All platform users"
              icon="👥"
              color="indigo"
            />

            <StatCard
              title="Revenue"
              value={`LKR ${formattedRevenue}`}
              subtitle="Total platform revenue"
              icon="💰"
              color="green"
            />

            <StatCard
              title="Pending Requests"
              value={pendingRequests}
              subtitle="Requests waiting for review"
              icon="🔔"
              color="red"
              alert={pendingRequests > 0}
            />
          </div>
        </section>

        {/* =====================================
            System Management
        ====================================== */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              System Management
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage the major components of the LMS platform.
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
            <ManagementAction
              to="/system/institutes"
              icon="🏢"
              title="Institutes"
              description="Manage registered institutes"
              color="blue"
            />

            <ManagementAction
              to="/system/subscriptions"
              icon="💳"
              title="Subscriptions"
              description="Manage plans and subscriptions"
              color="indigo"
            />

            <ManagementAction
              to="/system/users"
              icon="👥"
              title="Users"
              description="Manage platform users"
              color="green"
            />

            <ManagementAction
              to="/system/reports"
              icon="📊"
              title="Reports"
              description="View platform reports"
              color="purple"
            />
          </div>
        </section>

        {/* =====================================
            Platform Health / Summary
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
                  System Summary
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Current platform activity overview.
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
                System Active
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

              {/* Institutes */}
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
                    🏢
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Active Institutes
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-800">
                      {totalInstitutes}
                    </p>
                  </div>
                </div>
              </div>

              {/* Users */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-10 w-10
                      items-center justify-center
                      rounded-lg
                      bg-indigo-100
                      text-indigo-600
                    "
                  >
                    👥
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Platform Users
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-800">
                      {totalUsers}
                    </p>
                  </div>
                </div>
              </div>

              {/* Requests */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-10 w-10
                      items-center justify-center
                      rounded-lg
                      bg-red-100
                      text-red-600
                    "
                  >
                    🔔
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Pending Requests
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-800">
                      {pendingRequests}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =====================================
            Pending Requests Alert
        ====================================== */}
        {pendingRequests > 0 && (
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
                  ⚠️
                </div>

                <div>
                  <h3 className="font-bold text-red-800">
                    Pending Requests Need Attention
                  </h3>

                  <p className="mt-1 text-sm text-red-600">
                    There are {pendingRequests} request
                    {pendingRequests !== 1 ? "s" : ""} waiting
                    for your review.
                  </p>
                </div>
              </div>

              <Link
                to="/system/requests"
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
                Review Requests
                <span>→</span>
              </Link>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default SystemAdminDashboard;