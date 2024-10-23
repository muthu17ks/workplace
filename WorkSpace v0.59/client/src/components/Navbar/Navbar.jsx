import React, { useState } from 'react';
import { NavLink } from "react-router-dom";
import logo from "../../assets/icons/logo.png";
import "./Navbar.css";

const Navbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getActiveClass = ({ isActive }) =>
    isActive ? "navbar-link active" : "navbar-link";

  return (
    <>
      <div className="navbar-container">
        <div className="navbar-logo-container">
          <img className="navbar-logo" src={logo} alt="LOGO" />
          <span className="navbar-title">Workplace</span>
        </div>

        <ul className="navbar-links">
          <li>
            <NavLink to="/" className={getActiveClass} end>
              <span className="material-symbols-rounded navbar-icon navbar-home-icon">home</span>
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/Documents" className={getActiveClass}>
              <span className="material-symbols-rounded navbar-icon navbar-document-icon">article</span>
              <span>Documents</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/Mail" className={getActiveClass}>
              <span className="material-symbols-rounded navbar-icon navbar-mail-icon">mail</span>
              <span>Mail</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/Tasks" className={getActiveClass}>
              <span className="material-symbols-rounded navbar-icon navbar-task-icon">task</span>
              <span>Tasks</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/Files" className={getActiveClass}>
              <span className="material-symbols-rounded navbar-icon navbar-files-icon">folder</span>
              <span>Drive</span>
            </NavLink>
          </li>
        </ul>

        <div className="navbar-right">
          <NavLink to="/Profile" className={getActiveClass}>
            <span className="material-symbols-rounded navbar-icon navbar-profile-icon">account_circle</span>
          </NavLink>
          <span className="material-symbols-rounded navbar-icon navbar-menu-icon" onClick={toggleSidebar}>
            menu
          </span>
        </div>
      </div>

      <div className={`navbar-sidebar ${isSidebarOpen ? "navbar-sidebar-open" : ""}`}>
        <span className="material-symbols-rounded navbar-icon navbar-sidebar-close" onClick={toggleSidebar}>
          close
        </span>
        <div className="navbar-sidebar-header">
          <NavLink to="/Profile" className={getActiveClass} onClick={toggleSidebar}>
            <span className="material-symbols-rounded navbar-icon navbar-sidebar-profile-icon">account_circle</span>
          </NavLink>
        </div>
        <ul className="navbar-sidebar-links">
          <li>
            <NavLink to="/" className={getActiveClass} onClick={toggleSidebar} end>
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/Documents" className={getActiveClass} onClick={toggleSidebar}>
              <span>Documents</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/Mail" className={getActiveClass} onClick={toggleSidebar}>
              <span>Mail</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/Tasks" className={getActiveClass} onClick={toggleSidebar}>
              <span>Tasks</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/Files" className={getActiveClass} onClick={toggleSidebar}>
              <span>Drive</span>
            </NavLink>
          </li>
        </ul>
      </div>

      {isSidebarOpen && (
        <div className="navbar-sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </>
  );
};

export default Navbar;
