import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  BriefcaseBusiness,
  Bookmark,
  ClipboardCheck,
  User,
  LogOut,
  Target,
  BotMessageSquare,
  Bell,
  Check,
  Building2,
  Users,
  Clock,
  CalendarCheck,
  Menu,
  X,
} from "lucide-react";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const isRecruiter = currentUser?.role === "recruiter";

  // Fetch current user if not in storage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/users/profile");
        if (res.data?.user) {
          setCurrentUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    if (!currentUser?.name) {
      fetchUser();
    }
  }, [currentUser?.name]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put("/api/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await api.put(`/api/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const studentNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/resume", label: "Resume", icon: FileText },
    { to: "/internships", label: "Internships", icon: BriefcaseBusiness },
    { to: "/saved-internships", label: "Saved Internships", icon: Bookmark },
    { to: "/applications", label: "Applications", icon: ClipboardCheck },
    { to: "/career", label: "Career Intelligence", icon: Target },
    { to: "/mock-interview", label: "AI Mock Interview", icon: BotMessageSquare },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const recruiterNavItems = [
    { to: "/recruiter", label: "Recruiter Hub", icon: Building2 },
    { to: "/recruiter/applications", label: "Review Candidates", icon: Users },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const navItems = isRecruiter ? recruiterNavItems : studentNavItems;

  return (
    <div className="dashboard-layout">
      {/* MOBILE BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="sidebar-header-row">
          <div className="logo">
            <Sparkles size={22} className="logo-sparkle" />
            <span>InternPilot AI</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role Badge in Sidebar */}
        <div className="sidebar-role-badge">
          <span className={`role-pill ${isRecruiter ? "role-recruiter" : "role-student"}`}>
            {isRecruiter ? "Recruiter Portal" : "Student Pilot"}
          </span>
        </div>

        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={isActive ? "active" : ""}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="layout-main">
        {/* SHARED HEADER WITH NOTIFICATIONS */}
        <header className="shared-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <span className="welcome-tag">
              {isRecruiter ? "HIRING HUB" : "PILOT DASHBOARD"} <span>✦</span>
            </span>
          </div>

          <div className="topbar-right">
            {/* Notification Bell Dropdown */}
            <div className="notification-wrapper" ref={notifRef}>
              <button
                type="button"
                className={`notification-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
                onClick={() => setShowNotifications((prev) => !prev)}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <div className="notif-header-title">
                      <h4>Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="notif-unread-count">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="mark-all-btn"
                        onClick={handleMarkAllRead}
                      >
                        <Check size={14} /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="empty-notifications">
                        <Bell size={28} className="empty-icon" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`notification-item ${!n.read ? "unread" : ""}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="notif-icon-col">
                            {n.type === "interview_scheduled" ? (
                              <CalendarCheck size={18} className="notif-icon interview" />
                            ) : n.type === "application_received" ? (
                              <Users size={18} className="notif-icon application" />
                            ) : (
                              <Clock size={18} className="notif-icon status" />
                            )}
                          </div>
                          <div className="notif-content-col">
                            <p className="notif-title">{n.title}</p>
                            <p className="notif-message">{n.message}</p>
                            <span className="notif-time">
                              {new Date(n.createdAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {!n.read && <div className="unread-dot" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="user-profile-pill">
              <div className="avatar-circle">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-info-text">
                <span className="user-name-label">
                  {currentUser?.name || "User"}
                </span>
                <span className="user-role-label">
                  {isRecruiter ? "Recruiter" : "Student"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
