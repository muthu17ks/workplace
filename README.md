# **AIO Workspace**

**AIO Workspace** is a web-based productivity platform built using the **MERN stack** (MongoDB, Express.js, React, and Node.js). It offers an all-in-one solution with features like a dashboard, document creation, file storage, email management, and task tracking, similar to Google Workspace.

---

## **Table of Contents**
- [Features](#features)  
- [Project Structure](#project-structure)  
- [Installation](#installation)  
- [Usage](#usage)  
- [Technologies Used](#technologies-used)  
- [Environment Variables](#environment-variables)  
- [Contributing](#contributing)  
- [License](#license)

---

## **Features**
- **Authentication**: User login, signup, and protected routes with **Google OAuth**.  
- **Dashboard**: Overview of tasks, recent documents, unread emails, and storage.  
- **Documents**: Create, edit, and manage documents using a built-in text editor.  
- **Drive**: Upload, organize, and manage files and folders.  
- **Mail**: Send, receive, and manage emails with an interface similar to Gmail.  
- **Tasks**: Create, manage, and track tasks with due dates and statuses.  

---

## **Project Structure**
```plaintext
workspace
│
├── client                # Frontend code
│   ├── public            # Public files
│   │   └── index.html    # Root HTML file
│   ├── src               # Source files
│       ├── assets        # Static assets (e.g., images, icons)
│       ├── components    # Reusable components (Navbar, Authentication, etc.)
│       ├── pages         # Application pages (Dashboard, Documents, etc.)
│       ├── App.jsx       # Main app component
│       └── index.jsx     # Entry point for React
│   └── .env              # Frontend environment variables
│
├── server                # Backend code
│   ├── Config            # Configuration files
│   ├── Controllers       # API controllers (taskController.js, etc.)
│   ├── middleware        # Authentication middleware
│   ├── models            # Mongoose models (Task.js, Document.js, etc.)
│   ├── routes            # API routes
│   ├── uploads           # Folder for uploaded files
│   ├── server.js         # Express server entry point
│   └── .env              # Backend environment variables
```

---

## **Installation**

### **Prerequisites**
- **Node.js** and **npm** installed  
- **MongoDB** server running locally  
- A **Google account** for OAuth and Gmail API integration  

### **Steps**

1. **Clone the repository**:  
   ```bash
   git clone https://github.com/muthu17ks/workspace.git
   cd aio-workspace
   ```

2. **Install dependencies**:  
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

3. **Configure environment variables**:  
   Create a `.env` file in both `/client` and `/server` directories with appropriate values.

4. **Start the application**:  
   - **Run the backend server**:  
     ```bash
     cd server && npm run devStart
     ```
   - **Run the frontend client**:  
     ```bash
     cd client && npm start
     ```

5. **Access the app**:  
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## **Usage**
- **Login**: Use Google OAuth or register an account.  
- **Dashboard**: View a summary of your tasks, emails, and recent documents.  
- **Documents**: Create new documents and access existing ones from the Documents page.  
- **Drive**: Manage files and folders, upload documents, and share links.  
- **Mail**: Send and receive emails, view inbox, sent mails, and archived items.  
- **Tasks**: Add new tasks, set due dates, and track your progress.  

---

## **Technologies Used**
- **Frontend**: React.js, React Router  
- **Backend**: Node.js, Express.js  
- **Database**: MongoDB with Mongoose  
- **Authentication**: Passport.js with Google OAuth2  
- **APIs**: Gmail API  
- **Styling**: CSS Modules  
- **State Management**: Context API  

---

## **Environment Variables**

### **Client (`/client/.env`)**
```plaintext
REACT_APP_GOOGLE_CLIENT_ID=<your-google-client-id>
```

### **Server (`/server/.env`)**
```plaintext
MONGODB_URI=mongodb://localhost/workspace  
JWT_SECRET=<your-jwt-secret>  
GOOGLE_CLIENT_ID=<your-google-client-id>  
GOOGLE_CLIENT_SECRET=<your-google-client-secret>  
SESSION_SECRET=<your-session-secret>  
REDIRECT_URI=http://localhost:3001/auth/google/callback  
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>  
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>  
TWILIO_VERIFY_SERVICE_SID=<your-twilio-verify-service-sid>  
```

---

## **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork** the repository.  
2. **Create a new branch**:  
   ```bash
   git checkout -b feature-branch
   ```
3. **Make changes** and **commit**:  
   ```bash
   git commit -m "Add new feature"
   ```
4. **Push** to your branch:  
   ```bash
   git push origin feature-branch
   ```
5. **Open a pull request** on GitHub.

---

## **License**
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

---

## **Acknowledgments**
- [MongoDB](https://www.mongodb.com/)  
- [React](https://reactjs.org/)  
- [Node.js](https://nodejs.org/)  
- [Google APIs](https://developers.google.com/)  

---
