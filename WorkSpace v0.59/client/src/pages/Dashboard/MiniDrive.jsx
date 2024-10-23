import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './MiniDrive.css';

const Miniminidrive = () => {
    const [files, setFiles] = useState([]);
    const [displayedFiles, setDisplayedFiles] = useState([]);
    const [currentFolder, setCurrentFolder] = useState({ id: 'root', path: [] });
    const [newFolderName, setNewFolderName] = useState('');
    const [isInputVisible, setInputVisible] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, itemId: null, type: null });
    const [selectedItem, setSelectedItem] = useState(null);
    const [renamingItem, setRenamingItem] = useState(null);
    const [newName, setNewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [sortField, setSortField] = useState('name');
    const [shareLink, setShareLink] = useState('');
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [clickTimer, setClickTimer] = useState(null);

    const apiBaseUrl = 'http://localhost:3001';
    const menuRef = useRef(null);

    const searchInputRef = useRef(null);
    const newFolderInputRef = useRef(null);
    const renameInputRef = useRef(null);

    const handleItemClick = (file) => {
        if (clickTimer) {
            clearTimeout(clickTimer);
            setClickTimer(null);
            if (selectedItem && selectedItem._id === file._id) {
                if (file.type === 'folder') {
                    handleFolderOpen(file);
                } else {
                    handleFileOpen(file);
                }
            }
        } else {
            setSelectedItem(file);
            setClickTimer(setTimeout(() => {
                console.log('Selected:', file.name);
                setClickTimer(null);
            }, 300));
        }
    };

    const handleClosePopup = () => {
        setInputVisible(false);
        setRenamingItem(null);
        setNewFolderName('');
        setNewName('');
    };

    useEffect(() => {
        loadFiles(currentFolder.id);
    }, [currentFolder]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setContextMenu({ ...contextMenu, visible: false });
                setRenamingItem(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu]);

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);
    useEffect(() => {
        if (isInputVisible && newFolderInputRef.current) {
            newFolderInputRef.current.focus();
        }
    }, [isInputVisible]);

    useEffect(() => {
        if (renamingItem && renameInputRef.current) {
            renameInputRef.current.focus();
        }
    }, [renamingItem]);

    useEffect(() => {
        const searchInFolder = async (folderId) => {
            try {
                const { data } = await axios.get(`${apiBaseUrl}/files/${folderId}`);
                const filteredItems = data.filter(item =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                );

                const promises = data
                    .filter(item => item.type === 'folder')
                    .map(folder => searchInFolder(folder._id));

                const nestedResults = await Promise.all(promises);
                const allResults = filteredItems.concat(...nestedResults.flat());

                return allResults;
            } catch (err) {
                console.error('Error searching in folder:', err);
                return [];
            }
        };

        const performSearch = async () => {
            if (searchTerm.trim() === '') {
                setDisplayedFiles(files);
            } else {
                const results = await searchInFolder(currentFolder.id);
                setDisplayedFiles(results);
            }
        };

        performSearch();
    }, [searchTerm, files, currentFolder]);


    const loadFiles = async (folderId) => {
        try {
            const { data } = await axios.get(`${apiBaseUrl}/files/${folderId}`);
            const sortedData = data.sort((a, b) => {
                return sortOrder === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            });
            setFiles(sortedData);
            setDisplayedFiles(sortedData);
        } catch (err) {
            console.error('Error loading files:', err);
        }
    };

    const handleSort = (field) => {
        const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newSortOrder);

        const sortedFiles = [...displayedFiles].sort((a, b) => {
            if (field === 'name') {
                return newSortOrder === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            } else if (field === 'modified') {
                return newSortOrder === 'asc'
                    ? new Date(a.updatedAt) - new Date(b.updatedAt)
                    : new Date(b.updatedAt) - new Date(a.updatedAt);
            } else if (field === 'size') {
                return newSortOrder === 'asc'
                    ? (a.size || 0) - (b.size || 0)
                    : (b.size || 0) - (a.size || 0);
            }
            return 0;
        });

        setDisplayedFiles(sortedFiles);
    };

    const handleFolderOpen = (folder) => {
        setCurrentFolder((prev) => ({
            id: folder._id,
            path: [...prev.path, { id: folder._id, name: folder.name }]
        }));
    };

    const handleGoBack = () => {
        setCurrentFolder((prev) => {
            const newPath = prev.path.slice(0, -1);
            const parentFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : 'root';
            return { id: parentFolderId, path: newPath };
        });
    };

    const handleFileOpen = (file) => {
        const filePath = file.path.startsWith('/uploads/') ? file.path.substring(9) : file.path;
        window.open(`${apiBaseUrl}/${filePath}`, '_blank');
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            await axios.post(`${apiBaseUrl}/files`, {
                name: newFolderName,
                parent: contextMenu.type === 'root' ? currentFolder.id : selectedItem._id,
                type: 'folder'
            });
            setNewFolderName('');
            setInputVisible(false);
            loadFiles(currentFolder.id);
        } catch (err) {
            console.error('Error creating folder:', err);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleCreateFolder();
    };

    const handleDeleteItem = async (itemId) => {
        try {
            await axios.delete(`${apiBaseUrl}/files/${itemId}`);
            loadFiles(currentFolder.id);
        } catch (err) {
            console.error('Error deleting item:', err);
        }
    };

    const handleRenameItem = async () => {
        if (!newName.trim()) return;

        try {
            await axios.put(`${apiBaseUrl}/files/${renamingItem}`, { name: newName });
            setRenamingItem(null);
            setNewName('');
            loadFiles(currentFolder.id);
        } catch (err) {
            console.error('Error renaming item:', err);
        }
    };

    const handleUploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('parent', contextMenu.type === 'root' ? currentFolder.id : selectedItem._id);

        try {
            const response = await axios.post(`${apiBaseUrl}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('Uploaded file:', response.data);
            loadFiles(currentFolder.id);
        } catch (error) {
            console.error('Error during file upload:', error.response ? error.response.data : error.message);
        }
    };

    const handleContextMenu = (e, file) => {
        e.preventDefault();
        setSelectedItem(file);
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            itemId: file ? file._id : null,
            type: file ? file.type : 'root'
        });
    };

    const handleOptionClick = (action) => {
        setContextMenu({ ...contextMenu, visible: false });
        switch (action) {
            case 'create':
                setInputVisible(true);
                break;
            case 'upload':
                document.querySelector('.minidrive-upload-input').click();
                break;
            case 'rename':
                setRenamingItem(selectedItem._id);
                setNewName(selectedItem.name);
                break;
            case 'delete':
                handleDeleteItem(selectedItem._id);
                break;
            case 'info':
                const permissions = selectedItem.permissions instanceof Map
                    ? Array.from(selectedItem.permissions.entries()).reduce((acc, [key, value]) => {
                        acc[key] = value;
                        return acc;
                    }, {})
                    : selectedItem.permissions || {};

                const fileInfo = `
                    File Information:
                    Name: ${selectedItem.name}
                    Type: ${selectedItem.type}
                    Size: ${selectedItem.size ? `${(selectedItem.size / 1024).toFixed(2)} KB` : 'N/A'}
                    Description: ${selectedItem.description || 'N/A'}
                    Created By: ${selectedItem.createdBy || 'N/A'}
                    Updated By: ${selectedItem.updatedBy || 'N/A'}
                    MIME Type: ${selectedItem.mimeType || 'N/A'}
                    Tags: ${selectedItem.tags.length ? selectedItem.tags.join(', ') : 'None'}
                    Permissions: ${Object.keys(permissions).length ? JSON.stringify(permissions) : 'None'}
                    Version: ${selectedItem.version || '1'}
                    Last Accessed: ${selectedItem.lastAccessed ? format(new Date(selectedItem.lastAccessed), 'MMM dd, yyyy HH:mm:ss') : 'Never'}
                    File Extension: ${selectedItem.fileExtension || 'N/A'}
                    Last Modified: ${format(new Date(selectedItem.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                `;
                alert(fileInfo);
                break;
            case 'open':
                if (selectedItem.type === 'folder') {
                    handleFolderOpen(selectedItem);
                } else {
                    handleFileOpen(selectedItem);
                }
                break;
            case 'share':
                const link = `${apiBaseUrl}/${selectedItem.path.replace(/\\/g, '/')}`;
                setShareLink(link);
                setShowSharePopup(true);
                break;
            default:
                break;
        }
    };

    const positionContextMenu = () => {
        if (menuRef.current) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const menuWidth = menuRef.current.offsetWidth;
            const menuHeight = menuRef.current.offsetHeight;

            let { x, y } = contextMenu;

            if (x + menuWidth > viewportWidth) {
                x = viewportWidth - menuWidth - 20;
            }

            if (y + menuHeight > viewportHeight) {
                y = viewportHeight - menuHeight - 20;
            }

            menuRef.current.style.left = `${x}px`;
            menuRef.current.style.top = `${y}px`;
        }
    };

    useEffect(() => {
        if (contextMenu.visible) {
            positionContextMenu();
        }
    }, [contextMenu]);

    const renderPath = () => {
        const { path } = currentFolder;
        const maxFoldersToShow = 3;

        if (path.length <= maxFoldersToShow) {
            return path.map((folder, index) => (
                <span
                    key={folder.id}
                    onClick={() => setCurrentFolder({ id: folder.id, path: path.slice(0, index + 1) })}
                    className="minidrive-folder-path"
                >
                    {folder.name}
                </span>
            ));
        }


        const firstFolder = path[0];
        const lastFolders = path.slice(-maxFoldersToShow);
        return (
            <>
                <span onClick={() => setCurrentFolder({ id: firstFolder.id, path: [firstFolder] })} className="minidrive-folder-path">
                    {firstFolder.name}
                </span>
                <span className="minidrive-folder-ellipsis">...</span>
                {lastFolders.map((folder, index) => (
                    <span
                        key={folder.id}
                        onClick={() => setCurrentFolder({ id: folder.id, path: path.slice(0, path.indexOf(folder) + 1) })}
                        className="minidrive-folder-path"
                    >
                        {folder.name}
                    </span>
                ))}
            </>
        );

    };

    return (
        <div className='minidrive-body'>
            <div className="minidrive-container">
                {(isInputVisible || renamingItem) && <div className="dimmed-background" onClick={handleClosePopup}></div>}
                <div classname="minidrive-heading-container">
                    <h1 className="minidrive-heading">Drive</h1>
                </div>
                <div className="minidrive-header">
                    <div className="minidrive-inner-header">
                        <span
                            className={`material-symbols-rounded minidrive-back-button ${currentFolder.path.length === 0 ? 'disabled' : ''}`}
                            onClick={currentFolder.path.length > 0 ? handleGoBack : null}
                            style={{ cursor: currentFolder.path.length === 0 ? 'not-allowed' : 'pointer' }}
                        >
                            arrow_back
                        </span>
                        <span className="material-symbols-rounded minidrive-refresh-button" onClick={() => loadFiles(currentFolder.id)}>refresh</span>
                        <div className="minidrive-search-bar">
                            <span className="material-symbols-rounded minidrive-search-icon">search</span>
                            <input
                                type="text"
                                placeholder="Search files and folders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="minidrive-search-input"
                                ref={searchInputRef}
                            />
                        </div>
                    </div>
                </div>

                <div className="minidrive-path">
                    <span
                        className="minidrive-root-container"
                        onContextMenu={(e) => handleContextMenu(e, null)}
                    >
                        <span
                            onClick={() => setCurrentFolder({ id: 'root', path: [] })}
                            className="minidrive-root-button"
                        >
                            Drive
                        </span>
                    </span>
                    {renderPath()}
                </div>

                <ul
                    className="minidrive-list"
                    onContextMenu={(e) => {
                        if (e.target.closest('.minidrive-list-item') === null) {
                            handleContextMenu(e, null);
                        }
                    }}
                >
                    <li className="minidrive-list-header">
                        <span className="minidrive-list-header-name" onClick={() => handleSort('name')}>
                            Name
                            {sortField === 'name' && (
                                <span className="material-symbols-rounded up-down-arrow">
                                    {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                </span>
                            )}
                        </span>
                        <span className="minidrive-list-header-modified" onClick={() => handleSort('modified')}>
                            Date Modified
                            {sortField === 'modified' && (
                                <span className="material-symbols-rounded up-down-arrow">
                                    {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                </span>
                            )}
                        </span>
                        <span className="minidrive-list-header-size" onClick={() => handleSort('size')}>
                            Size
                            {sortField === 'size' && (
                                <span className="material-symbols-rounded up-down-arrow">
                                    {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                </span>
                            )}
                        </span>

                    </li>

                    {displayedFiles.map((file) => (
                        <li
                            key={file._id}
                            className={`drive-list-item ${selectedItem?._id === file._id ? 'selected' : ''}`}
                            onClick={() => handleItemClick(file)}
                            onContextMenu={(e) => handleContextMenu(e, file)}
                        >
                            <span className="minidrive-item-icon material-symbols-rounded">
                                {file.type === 'folder' ? 'folder' : 'description'}
                            </span>
                            <span className="minidrive-item-name">
                                {file.name}
                            </span>
                            <span className="minidrive-item-modified">
                                {file.updatedAt ? format(new Date(file.updatedAt), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                            </span>
                            <span className="minidrive-item-size">
                                {file.size === undefined || file.size === null
                                    ? '-'
                                    : file.size < 1024
                                        ? `${file.size} bytes`
                                        : file.size < 1024 * 1024
                                            ? `${(file.size / 1024).toFixed(2)} KB`
                                            : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                            </span>
                        </li>
                    ))}
                </ul>
                {contextMenu.visible && (
                    <div
                        ref={menuRef}
                        className="context-menu"
                    >
                        {contextMenu.type === 'root' && (
                            <>
                                <div onClick={() => handleOptionClick('create')}>Create Folder</div>
                                <div onClick={() => handleOptionClick('upload')}>Upload File</div>
                            </>
                        )}
                        {contextMenu.type === 'folder' && (
                            <>
                                <div onClick={() => handleOptionClick('open')}>Open Folder</div>
                                <div onClick={() => handleOptionClick('create')}>Create Folder</div>
                                <div onClick={() => handleOptionClick('upload')}>Upload File</div>
                                <div onClick={() => handleOptionClick('rename')}>Rename</div>
                                <div onClick={() => handleOptionClick('share')}>Share</div>
                                <div onClick={() => handleOptionClick('delete')}>Delete</div>
                                <div onClick={() => handleOptionClick('info')}>File Information</div>
                            </>
                        )}
                        {contextMenu.type === 'file' && (
                            <>
                                <div onClick={() => handleOptionClick('open')}>Open File</div>
                                <div onClick={() => handleOptionClick('rename')}>Rename</div>
                                <div onClick={() => handleOptionClick('share')}>Share</div>
                                <div onClick={() => handleOptionClick('delete')}>Delete</div>
                                <div onClick={() => handleOptionClick('info')}>File Information</div>
                            </>
                        )}
                    </div>
                )}
                <input
                    type="file"
                    className="minidrive-upload-input"
                    style={{ display: 'none' }}
                    onChange={handleUploadFile}
                />
                {isInputVisible && (
                    <div className="minidrive-new-folder-popup">
                        <button className="minidrive-close-button" onClick={handleClosePopup}><span className="material-symbols-rounded">close</span></button>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="New folder name"
                            className="minidrive-new-folder-input"
                            ref={newFolderInputRef}
                        />
                    </div>
                )}
                {renamingItem && (
                    <div className="minidrive-rename-container">
                        <button className="minidrive-close-button" onClick={handleClosePopup}><span className="material-symbols-rounded">close</span></button>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameItem();
                            }}
                            placeholder="New name"
                            className="minidrive-rename-input"
                            ref={renameInputRef}
                        />
                    </div>
                )}
                {showSharePopup && (
                    <div className="minidrive-share-popup">
                        <button className="minidrive-close-button" onClick={() => setShowSharePopup(false)}><span className="material-symbols-rounded">close</span></button>
                        <h3>Share</h3>
                        <input
                            type="text"
                            value={shareLink}
                            readOnly
                            className="minidrive-share-link-input"
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(shareLink);
                                setShowSharePopup(false)
                            }}
                            className="minidrive-copy-button"
                        >
                            Copy Link
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default Miniminidrive;
