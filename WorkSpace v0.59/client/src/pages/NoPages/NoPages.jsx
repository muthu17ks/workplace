import React from "react";
import "./NoPages.css";

export default function NoPages() {
  return (
    <div className="nopages-container">
      <h1 className="nopages-error-code">404</h1>
      <p className="nopages-error-message">Oops! Page Not Found</p>
      <p className="nopages-error-description">
        The page you are looking for might have been removed or is temporarily unavailable.
      </p>
      <a href="/" className="nopages-back-home-button">
        Go Back to Home
      </a>
    </div>
  );
}
