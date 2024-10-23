import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./RecentDocuments.css";

let socket;

const RecentDocuments = () => {
  const navigate = useNavigate();
  const [recentDocuments, setRecentDocuments] = useState([]);

  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:3001");
    }

    socket.emit("get-recent-documents", { page: 0, limit: 15 });

    socket.on("recent-documents", ({ docs }) => {
      setRecentDocuments(docs.slice(0, 15));
    });

    return () => {
      socket.off("recent-documents");
    };
  }, []);

  const formatDate = (date) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  const openDocument = (docId) => {
    navigate(`/documents/${docId}`);
  };

  return (
    <div className="recent-documents-container">
      <h2 className="recent-documents-title">Recent Documents</h2>

      <ul className="recent-documents-list">
        {recentDocuments.length > 0 ? (
          recentDocuments.map((doc) => (
            <li
              key={doc._id}
              className="recent-documents-item"
              onClick={() => openDocument(doc._id)}
            >
              <div className="recent-documents-info">
                <span className="recent-documents-name">
                  {doc.name || "Untitled Document"}
                </span>
                <span className="recent-documents-timestamp">
                  {formatDate(doc.updatedAt)}
                </span>
              </div>
            </li>
          ))
        ) : (
          <li className="recent-documents-no-item">No recent documents found.</li>
        )}
      </ul>
    </div>
  );
};

export default RecentDocuments;
