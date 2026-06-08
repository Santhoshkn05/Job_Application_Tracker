# Job Application Tracker

A comprehensive web application for tracking job applications throughout the hiring process. This application helps job seekers manage their applications, track interview schedules, and monitor the status of each application in one centralized location.

## Features

### Core Functionality
- **User Authentication**: Secure login and registration system with password hashing
- **Application Management**: Add, edit, and delete job applications
- **Status Tracking**: Track application status (Applied, Interview, Postponed, Selected, Rejected)
- **Dashboard Overview**: Visual dashboard with statistics on application status
- **Interview Scheduling**: Track interview dates for scheduled interviews
- **Responsive Design**: Fully responsive interface for desktop, tablet, and mobile devices
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Forgot Password**: Password reset functionality for account recovery

### User Interface
- Modern, clean interface with intuitive navigation
- Color-coded status badges for quick visual identification
- Modal-based editing for better user experience
- Confirmation dialogs for destructive actions (delete operations)
- Real-time status updates with dropdown selection

## Tech Stack

### Frontend
- **HTML5**: Semantic markup for structure
- **CSS3**: Styling with custom CSS and responsive design
- **JavaScript (Vanilla)**: Client-side logic and API interactions
- **Bootstrap Icons**: Icon library for UI elements

### Backend
- **Node.js**: JavaScript runtime for server-side application
- **Express.js**: Web framework for RESTful API
- **MySQL**: Relational database for data persistence
- **bcrypt**: Password hashing for security
- **express-session**: Session management for user authentication
- **cors**: Cross-Origin Resource Sharing middleware

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **MySQL** (v8.0.0 or higher)
- **npm** (comes with Node.js installation)
- **Web Browser** (Chrome, Firefox, Safari, or Edge)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Job-Application-Tracker
```

### 2. Database Setup

#### Create MySQL Database

```sql
CREATE DATABASE job_tracker;
```

#### Create Users Table

```sql
USE job_tracker;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Create Applications Table

```sql
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    job_role VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    salary VARCHAR(255),
    status VARCHAR(50) DEFAULT 'applied',
    date DATE,
    interview_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Backend Configuration

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Database Connection

Edit `backend/server.js` and update the database credentials:

```javascript
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "your-password",
    database: "job_tracker"
});
```

### 4. Frontend Setup

The frontend uses plain HTML, CSS, and JavaScript with no build process required. Simply serve the static files from the backend or use a local server.

## Running the Application

### Start the Backend Server

```bash
cd backend
node server.js
```

The backend server will start on `http://localhost:3000`

### Access the Application

Open your web browser and navigate to:
- **Login Page**: `http://localhost:3000/login.html`
- **Register Page**: `http://localhost:3000/register.html`
- **Dashboard**: `http://localhost:3000/index.html` (after login)

## Project Structure

```
Job-Application-Tracker/
├── backend/
│   ├── server.js              # Main application server
│   ├── package.json           # Backend dependencies
│   └── requirements.txt       # Backend requirements list
├── frontend/
│   ├── index.html             # Dashboard page
│   ├── login.html             # Login page
│   ├── register.html          # Registration page
│   ├── forgot-password.html   # Password reset page
│   ├── add applications.html  # Add application form
│   ├── Applications.html       # Applications list page
│   ├── Profile.html           # User profile page
│   ├── style.css              # Main stylesheet
│   ├── login.css              # Login page styles
│   ├── register.css           # Registration page styles
│   ├── forgot-password.css    # Forgot password page styles
│   ├── script.js              # Main JavaScript logic
│   ├── login.js               # Login functionality
│   ├── register.js            # Registration functionality
│   ├── forgot-password.js     # Password reset functionality
│   └── theme.js               # Theme toggle functionality
├── database/
│   └── requirements.txt       # Database requirements
└── README.md                  # This file
```

## Usage Guide

### Registration

1. Navigate to the registration page
2. Fill in your name, email, and password
3. Click "Register" to create your account
4. You will be redirected to the login page

### Login

1. Enter your registered email and password
2. Click "Login" to access your dashboard
3. If you forget your password, use the "Forgot Password?" link

### Adding Applications

1. From the dashboard, click "Add Application"
2. Fill in the application details:
   - Company Name
   - Job Role
   - Location
   - Salary (optional)
   - Application Date
   - Interview Date (optional)
   - Status
3. Click "Submit" to save the application

### Managing Applications

#### Edit Application
1. Go to the Applications page
2. Click "Edit" on the application you want to modify
3. Update the details in the modal
4. Click "Update" to save changes

#### Delete Application
1. Go to the Applications page
2. Click "Delete" on the application you want to remove
3. Confirm the deletion in the confirmation dialog

#### Update Status
1. On the dashboard, use the status dropdown for each application
2. Select the new status (Applied, Interview, Postponed, Selected, Rejected)
3. The status updates automatically

### Dashboard Features

- **Statistics Cards**: View total applications and breakdown by status
- **Application List**: Quick overview of all applications with status
- **Color Coding**: Visual indicators for different statuses
- **Responsive Layout**: Adapts to different screen sizes

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /login` - Login user
- `POST /forgot-password` - Request password reset

### Applications
- `GET /applications` - Get all applications for authenticated user
- `POST /applications` - Create a new application
- `PUT /applications/:id` - Update an application
- `DELETE /applications/:id` - Delete an application

### User Management
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `DELETE /profile` - Delete user account
- `PUT /change-password` - Change user password

## Security Features

- Password hashing using bcrypt
- Session-based authentication
- Input validation and sanitization
- SQL injection prevention using parameterized queries
- CORS configuration for API security

## Browser Compatibility

- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (latest version)


## Future Enhancements

- Email notifications for application updates
- Export applications to CSV/PDF
- Advanced filtering and search
- Application notes and document attachments
- Calendar view for interview schedules
- Statistics and analytics dashboard
- Multi-language support
