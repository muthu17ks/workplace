import { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./TextEditor.css";

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }, { font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  ["link", "image", "video"],
];

export default function TextEditor() {
  const { id: documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [documentName, setDocumentName] = useState(
    location.state?.documentName || ""
  );
  const [name, setName] = useState("Untitled Document");
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document.data);
      quill.enable();
      const loadedName = document.name || "Untitled Document";
      setDocumentName(loadedName);
      setName(loadedName);
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  const saveDocumentName = async (docId, newName) => {
    if (socket == null) return;

    try {
      socket.emit("rename-document", { docId, newName });
      setDocumentName(newName);
    } catch (error) {
      console.error("Error renaming document:", error);
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    setIsModified(true);
  };

  const handleNameSave = (e) => {
    if (e.key === "Enter") {
      saveDocumentName(documentId, name);
      setIsModified(false);
    }
  };

  const handleSaveClick = () => {
    saveDocumentName(documentId, name);
    setIsModified(false);
  };

  const handleBackClick = () => {
    navigate("/documents");
  };

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  return (
    <>
      <nav className="texteditor-navbar">
        <div className="texteditor-nav-container">
          <span
            className="texteditor-back-icon material-symbols-rounded"
            onClick={handleBackClick}
          >
            arrow_back
          </span>
          <input
            type="text"
            className="texteditor-nav-input"
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleNameSave}
            placeholder="Untitled Document"
          />
          {isModified && (
            <button className="texteditor-save-button" onClick={handleSaveClick}>
              Save
            </button>
          )}
        </div>
      </nav>
      <div className="texteditor-container" ref={wrapperRef}></div>
    </>
  );
}
