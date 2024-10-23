import React, { useEffect, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./Documents.css";

let socket;

const Documents = () => {
  const navigate = useNavigate();
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, docId: null });
  const [renameInputVisible, setRenameInputVisible] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [documentToRename, setDocumentToRename] = useState(null);

  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:3001");
    }

    socket.emit("get-recent-documents", { page: 0 });

    socket.on("recent-documents", ({ docs, more }) => {
      setRecentDocuments(docs);
      setFilteredDocuments(docs);
      setHasMore(more);
    });

    return () => {
      socket.off("recent-documents");
    };
  }, []);

  const createNewDocument = () => {
    const docId = uuidV4();
    const documentName = 'Untitled Document';
    const createdBy = 'User ID or Name'; // Replace with actual user ID or name

    socket.emit("create-new-document", { docId, name: documentName, createdBy });
    navigate(`/documents/${docId}`);
  };

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  const handleRefresh = () => {
    socket.emit("get-recent-documents", { page: 0 });
    setPage(0);
  };

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = recentDocuments.filter(doc =>
      doc.name.toLowerCase().includes(query)
    );
    setFilteredDocuments(filtered);
  };

  const handleBack = () => {
    const prevPage = Math.max(page - 1, 0);
    setPage(prevPage);
    socket.emit("get-recent-documents", { page: prevPage });
  };

  const handleForward = () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    socket.emit("get-recent-documents", { page: nextPage });
    setPage(nextPage);
  };

  const handleDeleteDocument = (docId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      socket.emit("delete-document", { docId });
      setContextMenu({ visible: false, x: 0, y: 0, docId: null }); // Hide menu after deletion
    }
  };

  const handleContextMenu = (event, docId) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.pageX,
      y: event.pageY - 40,
      docId: docId
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, docId: null });
  };

  const handleClickOutside = (event) => {
    if (contextMenu.visible && !event.target.closest('.context-menu')) {
      closeContextMenu();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible]);

  const handleRenameDocument = (docId) => {
    const document = recentDocuments.find((doc) => doc._id === docId);
    setNewDocumentName(document.name);
    setDocumentToRename(docId);
    setRenameInputVisible(true);
  };

  const handleRenameSubmit = () => {
    if (documentToRename && newDocumentName) {
      socket.emit("rename-document", { docId: documentToRename, newName: newDocumentName });
      setRenameInputVisible(false);
      setDocumentToRename(null);
      setNewDocumentName("");
    }
  };

  const handleRenameCancel = () => {
    setRenameInputVisible(false);
    setDocumentToRename(null);
    setNewDocumentName("");
  };

  return (
    <div className="docs-container">
      <div className="docs-content-wrapper">
        <div className="docs-header">
          <span className="docs-back-arrow material-symbols-rounded" onClick={handleBack}>
            arrow_back
          </span>
          <span className="docs-forward-button material-symbols-rounded" onClick={handleForward}>
            arrow_forward
          </span>
          <span className="docs-refresh-button material-symbols-rounded" onClick={handleRefresh}>
            refresh
          </span>
          <div className="docs-search-actions">
            <div className="docs-search-container">
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search documents"
                className="docs-search-input"
              />
              <span className="docs-search-icon material-symbols-rounded">search</span>
            </div>
          </div>
          <button className="docs-new-doc-button" onClick={createNewDocument}>
            {/* SVG for the button */}
            New
          </button>
        </div>

        <h2 className="docs-recent-doc-title">Recent Documents</h2>

        <div className="docs-list-header">
          <span className="docs-list-header-item">Name</span>
          <span className="docs-list-header-item">Date Modified</span>
        </div>

        <ul className="docs-recent-doc-list">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <li key={doc._id} className="docs-recent-doc-item" onContextMenu={(event) => handleContextMenu(event, doc._id)}>
                <a href={`/documents/${doc._id}`} className="docs-recent-doc-link">
                  <div className="docs-doc-info">
                    <span className="docs-doc-name">{doc.name || 'Untitled Document'}</span>
                    <span className="docs-doc-timestamp">{formatDate(doc.updatedAt)}</span>
                  </div>
                </a>
              </li>
            ))
          ) : (
            <li className="docs-no-docs-item">No recent documents found.</li>
          )}
        </ul>

        {contextMenu.visible && (
          <div className="docs-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
            <ul>
              <li onClick={() => handleRenameDocument(contextMenu.docId)}>Rename</li>
              <li onClick={() => handleDeleteDocument(contextMenu.docId)}>Delete</li>
            </ul>
          </div>
        )}

        {renameInputVisible && (
          <div className="rename-input-container">
            <input
              type="text"
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              placeholder="Enter new document name"
            />
            <button onClick={handleRenameSubmit}>Rename</button>
            <button onClick={handleRenameCancel}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );  
};

export default Documents;
