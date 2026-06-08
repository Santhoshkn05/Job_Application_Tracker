const mysql = require("mysql2");
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"], 
    credentials: true,
    allowedHeaders: ['Content-Type', 'user-id'] 
}));

app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        secure: false
    }
}));

function requireAuth(req, res, next) {
    const sessionUserId = req.session && req.session.userId;
    const headerUserId = req.headers['user-id'];
    console.log("Auth check - Session userId:", sessionUserId, "Header userId:", headerUserId);
    
    const userId = sessionUserId || headerUserId;

    if (!userId) {
        console.log("Auth failed - No userId found");
        return res.status(401).json({ message: "Unauthorized" });
    }
    
    req.userId = userId;
    console.log("Auth successful - userId:", userId);
    next();
}

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Password",
    database: "job_tracker"
});

db.connect((err) => {
    if (err) {
        console.log("database connection failed");
        console.log(err);
        return;
    }
    console.log("Database connected");

    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `;

    db.query(createUsersTable, (err) => {
        if (err) {
            console.log("failed to create users table");
            console.log(err);
            return;
        }

        const createApplicationsTable = `
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                company_name VARCHAR(255),
                job_role VARCHAR(255),
                location VARCHAR(255),
                salary VARCHAR(255),
                status VARCHAR(50),
                date DATE,
                interview_date DATE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;

        db.query(createApplicationsTable, (err) => {
            if (err) {
                console.log("failed to create applications table");
                console.log(err);
            }
        });
    });
});

app.get('/', (req,res)=>{
    res.send("Job Application Tracker");
});

app.get('/applications', requireAuth, (req,res)=>{
    const userId = req.userId;

    const sql = "SELECT * FROM applications WHERE user_id = ? ORDER BY id";
    db.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(result);
    });
});

app.post('/applications', requireAuth, (req,res) => {
    const userId = req.userId;
    const {
        company_name,
        job_role,
        location,
        salary,
        status,
        date,
        interview_date
    } = req.body;

    console.log("POST /applications - Request data:", { userId, company_name, job_role, location, salary, status, date, interview_date });

    // Validation
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    if (!company_name || company_name.trim() === '') {
        return res.status(400).json({ message: "Company Name is required" });
    }
    if (!job_role || job_role.trim() === '') {
        return res.status(400).json({ message: "Job Role is required" });
    }
    if (!location || location.trim() === '') {
        return res.status(400).json({ message: "Location is required" });
    }
    if (!status || status.trim() === '') {
        return res.status(400).json({ message: "Status is required" });
    }

    // Convert empty strings to NULL for date fields
    const interviewDateValue = interview_date && interview_date.trim() !== '' ? interview_date : null;
    const dateValue = date && date.trim() !== '' ? date : null;

    const sql = `INSERT INTO applications (user_id, company_name, job_role, location, salary, status, date, interview_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log("SQL Query:", sql);
    console.log("SQL Parameters:", [userId, company_name, job_role, location, salary, status, dateValue, interviewDateValue]);

    db.query(
        sql,
        [userId, company_name, job_role, location, salary, status, dateValue, interviewDateValue],
        (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json(err);
            }
            console.log("Application added successfully:", result);
            res.json({
                message: "Application Added Successfully",
                applicationId: result.insertId
            });
        }
    );
});

app.put('/applications/:id', requireAuth, (req, res) => {
    const userId = req.userId;
    const id = req.params.id;
    const {
        company_name,
        job_role,
        location,
        salary,
        status,
        date,
        interview_date
    } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    // Convert empty strings to NULL for date fields
    const interviewDateValue = interview_date && interview_date.trim() !== '' ? interview_date : null;
    const dateValue = date && date.trim() !== '' ? date : null;

    const sql = `UPDATE applications SET company_name = ?, job_role = ?, location = ?, salary = ?, status = ?, date = ?, interview_date = ? WHERE id = ? AND user_id = ?`;

    db.query(
        sql,
        [company_name, job_role, location, salary, status, dateValue, interviewDateValue, id, userId],
        (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }
            if (result.affectedRows === 0) {
                return res.status(403).json({ message: "Application not found or access denied" });
            }
            res.json({
                message: "Application Updated Successfully"
            });
        }
    );
});

app.patch('/applications/:id/status', requireAuth, (req, res) => {
    const userId = req.userId;
    const id = req.params.id;
    const {     status } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    const sql = `UPDATE applications SET status = ? WHERE id = ? AND user_id = ?`;

    db.query(
        sql,
        [status, id, userId],
        (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }
            if (result.affectedRows === 0) {
                return res.status(403).json({ message: "Application not found or access denied" });
            }
            res.json({
                message: "Application status updated successfully"
            });
        }
    );
});

app.delete('/applications/:id', requireAuth, (req, res)=> {
    const userId = req.userId;
    const id = req.params.id;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const sql = `DELETE FROM applications WHERE id = ? AND user_id = ?`;

    db.query(sql, [id, userId], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        if (result.affectedRows === 0) {
            return res.status(403).json({ message: "Application not found or access denied" });
        }
        res.json({
            message: "Application Deleted Successfully"
        });
    });
});

app.post('/register', (req, res) => {
    const {
        name,
        email, 
        password
    } = req.body;

    const check_exist = "SELECT * FROM users WHERE email=?";

    db.query(
        check_exist,
        [email],
        (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }
            if (result.length > 0) {
                return res.status(400).json({
                    message: "User already exists"
                });
            }
            
            // Hash the password
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json(err);
                }
                
                const sql = `INSERT INTO users(name, email, password)
                    VALUES(?,?,?)
                    `;

                db.query (
                    sql, 
                    [name, email, hashedPassword],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json(err);
                        }
                        res.json({
                            message: "Registration Successful",
                            userId: result.insertId
                        });
                    }
                );
            });
        });
    });

app.post('/login', (req,res) => {
    const {
        email,
        password
    } = req.body;

    const sql = "SELECT * FROM users WHERE email=?";

    db.query(
        sql, 
        [email],
        (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }

            if(result.length==0) {
                return res.status(401).json({
                    message: "Invalid Credentials"
                });
            }
            
            // Compare the password with the hashed password
            bcrypt.compare(password, result[0].password, (err, match) => {
                if (err) {
                    return res.status(500).json(err);
                }
                
                if (!match) {
                    return res.status(401).json({
                        message: "Invalid Credentials"
                    });
                }
                
                req.session.userId = result[0].id;
                res.json ({
                    message: "Login Successful",
                    user: {
                        id: result[0].id,
                        name: result[0].name,
                        email: result[0].email
                    }
                });
            });
        }
    );
});

app.get('/auth/status', requireAuth, (req, res) => {
    const sql = "SELECT id, name, email FROM users WHERE id = ?";
    db.query(sql, [req.userId], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(result[0]);
    });
});

app.post('/logout', requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logout successful" });
    });
});

app.get('/users/me', requireAuth, (req, res) => {
    const sql = "SELECT id, name, email FROM users WHERE id = ?";
    db.query(sql, [req.userId], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(result[0]);
    });
});

app.delete('/users/me', requireAuth, (req, res) => {
    const userId = req.userId;

    const deleteApps = `DELETE FROM applications WHERE user_id = ?`;
    db.query(deleteApps, [userId], (err) => {
        if (err) {
            return res.status(500).json(err);
        }

        const deleteUser = `DELETE FROM users WHERE id = ?`;
        db.query(deleteUser, [userId], (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            req.session.destroy(() => {
                res.json({ message: "Account deleted successfully" });
            });
        });
    });
});

app.get('/users/:id', requireAuth, (req, res) => {
    const requestedUserId = parseInt(req.params.id, 10);
    const userId = req.userId;

    if (requestedUserId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const sql = "SELECT id, name, email FROM users WHERE id = ?";
    db.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(result[0]);
    });
});

app.delete('/users/:id', requireAuth, (req, res) => {
    const requestedUserId = parseInt(req.params.id, 10);
    const userId = req.userId;

    if (requestedUserId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const deleteApps = `DELETE FROM applications WHERE user_id = ?`;
    
    db.query(deleteApps, [userId], (err) => {
        if (err) {
            return res.status(500).json(err);
        }

        const deleteUser = `DELETE FROM users WHERE id = ?`;
        
        db.query(deleteUser, [userId], (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            req.session.destroy(() => {
                res.json({ message: "Account deleted successfully" });
            });
        });
    });
});

app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    
    db.query(sql, [email], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        if (result.length === 0) {
            // For security, don't reveal if email exists
            return res.json({ message: "If an account exists with this email, a password reset link will be sent." });
        }

        // In a real application, you would:
        // 1. Generate a reset token
        // 2. Store it in the database with an expiration
        // 3. Send an email with the reset link
        
        // For this demo, we'll just return a success message
        res.json({ message: "If an account exists with this email, a password reset link will be sent." });
    });
});

app.put('/change-password', requireAuth, (req, res) => {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const getSql = `SELECT password FROM users WHERE id = ?`;
    db.query(getSql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        bcrypt.compare(currentPassword, result[0].password, (err, match) => {
            if (err) {
                return res.status(500).json(err);
            }
            if (!match) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }

            bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json(err);
                }

                const updateSql = `UPDATE users SET password = ? WHERE id = ?`;
                db.query(updateSql, [hashedPassword, userId], (err) => {
                    if (err) {
                        return res.status(500).json(err);
                    }
                    res.json({ message: "Password changed successfully" });
                });
            });
        });
    });
});

app.listen(3000,()=> {
    console.log("yes Backend running for Job Application Tracker")
});