const API_BASE = "http://localhost:3000";

async function apiFetch(input, init = {}) {
    const url = input.startsWith("http") ? input : `${API_BASE}${input}`;
    const userId = localStorage.getItem("userId");
    
    const headers = {
        ...init.headers,
    };
    
    if (userId) {
        headers['user-id'] = userId;
    }
    
    const response = await fetch(url, {
        credentials: "include",
        ...init,
        headers
    });

    if (response.status === 401 || response.status === 403) {
        if (window.location.pathname.split("/").pop() !== "login.html") {
            window.location.replace("login.html");
        }
        throw new Error("Unauthorized");
    }

    return response;
}

function requireAuth() {
    const userId = localStorage.getItem("userId");
    const protectedPages = ["index.html", "Applications.html", "add applications.html", "Profile.html"];
    const currentPage = window.location.pathname.split("/").pop();

    if (protectedPages.includes(currentPage) && !userId) {
        window.location.replace("login.html");
    }
}

const logoutBtn = document.getElementById("logoutBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

async function logoutUser() {
    try {
        await apiFetch("/logout", { method: "POST" });
    } catch (error) {
        console.warn("Logout request failed", error);
    }
    localStorage.removeItem("userId");
    window.location.replace("login.html");
}

async function deleteAccount() {
    const confirmed = confirm("Are you sure you want to delete your account? This cannot be undone.");
    if (!confirmed) return;

    try {
        const response = await apiFetch("/users/me", {
            method: "DELETE"
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message || "Failed to delete account");
            return;
        }

        localStorage.removeItem("userId");
        alert("Account deleted successfully");
        window.location.replace("login.html");
    } catch (error) {
        console.error("Error deleting account:", error);
        alert("Error deleting account");
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => {
        event.preventDefault();

        const confirmLogout = confirm("Are you sure you want to logout?");

        if (confirmLogout) {
            logoutUser();
        }
    });
}

if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", () => {
        deleteAccount();
    });
}

requireAuth();

const navToggle = document.getElementById("navToggle");
if (navToggle) {
    const nav = document.querySelector("header nav");

    navToggle.addEventListener("click", () => {
        if (nav) {
            nav.classList.toggle("open");
        }
    });

    document.addEventListener("click", (event) => {
        if (!nav || !navToggle) return;
        if (!nav.contains(event.target) && event.target !== navToggle && !navToggle.contains(event.target)) {
            nav.classList.remove("open");
        }
    });
}

function formatDate(dateValue) {
    if (!dateValue) return "";

    if (typeof dateValue === "string") {
        const dateString = dateValue.split("T")[0].trim();
        const dateParts = dateString.split("-");

        if (dateParts.length === 3 && dateParts[0].length === 4) {
            const [year, month, day] = dateParts;
            return `${day}-${month}-${year.slice(-2)}`;
        }
    }

    // If the date is already in DD-MM-YY format, return as is
    if (typeof dateValue === "string" && dateValue.includes("-")) {
        const parts = dateValue.split("-");
        if (parts.length === 3 && parts[0].length === 2) {
            return dateValue;
        }
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    // Use local time instead of UTC to avoid timezone shifts
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);

    return `${day}-${month}-${year}`;
}

function formatStatus(status) {
    if (!status) return "";

    return status.charAt(0).toUpperCase() + status.slice(1);
}

function toDateInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    // Use local time instead of UTC to avoid timezone shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function normalizeDateValue(value) {
    if (!value) return "";
    
    // If the value is already in YYYY-MM-DD format, return as-is to avoid timezone conversion
    if (typeof value === "string") {
        const dateParts = value.split("-");
        if (dateParts.length === 3 && dateParts[0].length === 4) {
            return value;
        }
    }
    
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    // Use local time instead of UTC to avoid timezone shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function displayApplications() {
    try {
        const response = await apiFetch("/applications");
        const applications = await response.json();

        const applicationList =
            document.getElementById("applicationList");

    if (!applicationList) return;

    applicationList.innerHTML = "";

    applications.forEach((app, index) => {
        const status = app.status || "applied";
        const id = app.id || index;

        applicationList.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td>${app.company_name}</td>
            <td>${app.job_role}</td>

            <td>
                <select class="dashboard-status" data-id="${id}">
                    <option value="applied" ${status === "applied" ? "selected" : ""}>Applied</option>
                    <option value="interview" ${status === "interview" ? "selected" : ""}>Interview</option>
                    <option value="postponed" ${status === "postponed" ? "selected" : ""}>Postponed</option>
                    <option value="selected" ${status === "selected" ? "selected" : ""}>Selected</option>
                    <option value="rejected" ${status === "rejected" ? "selected" : ""}>Rejected</option>
                </select>
            </td>

            <td>${formatDate(app.date || new Date())}</td>

            <td>
                <button class="view-details-btn" data-id="${id}">View Details</button>
            </td>
        </tr>
        `;
    });
    } catch (error) {
        console.error("Error loading applications:", error);
    }
}

let statusMessageTimeout = null;

function showStatusMessage(message, isSuccess) {
    const statusMessage = document.getElementById("statusMessage");
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.classList.remove("success", "error");
    statusMessage.classList.add(isSuccess ? "success" : "error");

    if (statusMessageTimeout) {
        clearTimeout(statusMessageTimeout);
    }

    statusMessageTimeout = setTimeout(() => {
        statusMessage.textContent = "";
        statusMessage.classList.remove("success", "error");
    }, 3000);
}

async function updateApplicationStatus(id, status) {
    try {
        const response = await apiFetch(
            `/applications/${id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Status update failed", errorText);
            showStatusMessage("Status update failed", false);
            return;
        }

        showStatusMessage("Status updated", true);
    } catch (error) {
        console.error("Status update error", error);
        showStatusMessage("Status update failed", false);
        return;
    }

    await displayApplications();
    await displayMyApplications();
    await updateDashboardCards();
}

const applicationForm = document.querySelector("#application_form");

if (applicationForm) {

    applicationForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const userId = localStorage.getItem("userId");
        if (!userId) {
            alert("Please login first to add applications");
            window.location.replace("login.html");
            return;
        }

        const company_name = document.getElementById("company_name").value.trim();
        const job_role = document.getElementById("job_role").value.trim();
        const location = document.getElementById("location").value.trim();
        const salary = document.getElementById("salary").value.trim();
        const status = document.getElementById("status").value.trim();
        const dateInput = document.getElementById("date");
        const date = dateInput && dateInput.value
            ? dateInput.value
            : new Date().toISOString().split("T")[0];

        const interviewDateInput = document.getElementById("interview_date");
        const interview_date = interviewDateInput ? interviewDateInput.value : "";

        // Validation
        if (!company_name) {
            alert("Company Name is required");
            return;
        }
        if (!job_role) {
            alert("Job Role is required");
            return;
        }
        if (!location) {
            alert("Location is required");
            return;
        }
        if (!status) {
            alert("Status is required");
            return;
        }

        const application = {
            company_name,
            job_role,
            location,
            salary,
            status,
            date,
            interview_date
        };

        try {
            const response = await apiFetch(
                "/applications",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(application)
                }
            );

            if (!response.ok) {
                const error = await response.json();
                alert(error.message || "Failed to add application");
                return;
            }

            applicationForm.reset();
            alert("Application added successfully");

            await displayApplications();
            await displayMyApplications();
            await updateDashboardCards();
        } catch (error) {
            console.error("Error adding application:", error);
            alert("Error adding application");
        }
    });
}

async function updateDashboardCards() {
    const totalCountElement = document.getElementById("totalCount");

    if (!totalCountElement) return;

    const response = await apiFetch("/applications");
    const applications = await response.json();

    const totalCount = applications.length;

    const appliedCount = applications.filter(app => app.status === "applied").length;
    const interviewCount = applications.filter(app => app.status === "interview").length;
    const selectedCount = applications.filter(app => app.status === "selected").length;
    const rejectedCount = applications.filter(app => app.status === "rejected").length;

    totalCountElement.textContent = totalCount;
    document.getElementById("appliedCount").textContent = appliedCount;
    document.getElementById("interviewCount").textContent = interviewCount;
    document.getElementById("selectedCount").textContent = selectedCount;
    document.getElementById("rejectedCount").textContent = rejectedCount;
}

async function displayMyApplications() {
    const myApplicationList = document.getElementById("myApplicationList");

    if (!myApplicationList) return;

    const response = await apiFetch("/applications");
    const applications = await response.json();

    const searchBox = document.querySelector(".search-box");
    const statusFilter = document.querySelector(".appl-status");
    const searchText = searchBox ? searchBox.value.toLowerCase() : "";
    const selectedStatus = statusFilter ? statusFilter.value.toLowerCase() : "all status";
    const filteredApplications = applications.filter((app) => {
        const matchesCompany = app.company_name.toLowerCase().includes(searchText);
        const matchesStatus =
            selectedStatus === "all status" || app.status === selectedStatus;

        return matchesCompany && matchesStatus;
    });

    myApplicationList.innerHTML = "";

    filteredApplications.forEach((app, filteredIndex) => {
        const rowNumber = filteredIndex + 1;
        const id = app.id || applications.indexOf(app);
        if (!app.id) {
            console.warn("Application item missing id", app);
        }

        myApplicationList.innerHTML += `
        <tr>
            <td>${rowNumber}</td>
            <td>${app.company_name}</td>
            <td>${app.job_role}</td>
            <td>${app.location}</td>
            <td>${app.salary}</td>
            <td>${formatDate(app.date)}</td>
            <td>${formatDate(app.interview_date)}</td>
            <td>${formatStatus(app.status)}</td>
            <td>
                <button class="edit-btn" data-id="${id}">Edit</button>
                <button class="delete-btn" data-id="${id}">Delete</button>
            </td>
        </tr>`;
    });

}

async function displayProfile() {
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");

    if (!profileName || !profileEmail) return;

    try {
        const response = await apiFetch("/users/me");

        if (!response.ok) {
            profileName.textContent = "Not registered";
            profileEmail.textContent = "Not registered";
            return;
        }

        const user = await response.json();
        profileName.textContent = user.name;
        profileEmail.textContent = user.email;
    } catch (error) {
        console.error("Error fetching profile:", error);
        profileName.textContent = "Not registered";
        profileEmail.textContent = "Not registered";
    }
}

async function deleteApplication(id) {
    const confirmed = confirm("Are you sure you want to delete this application?");
    if (!confirmed) return;

    try {
        const response = await apiFetch(
            `/applications/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            const error = await response.json();
            alert(error.message || "Failed to delete application");
            return;
        }

        await displayApplications();
        await displayMyApplications();
        await updateDashboardCards();
    } catch (error) {
        console.error("Error deleting application:", error);
        alert("Error deleting application");
    }
}

async function editApplication(id) {
    console.log("editApplication called", id);
    const response = await apiFetch("/applications");
    const applications = await response.json();
    const app = applications.find((item) => String(item.id) === String(id));
    console.log("editApplication loaded app", app);
    if (!app) {
        console.error("Application not found for id", id);
        return;
    }

    // Populate the modal with current data
    document.getElementById("editCompanyName").value = app.company_name;
    document.getElementById("editJobRole").value = app.job_role;
    document.getElementById("editLocation").value = app.location;
    document.getElementById("editSalary").value = app.salary || "";
    document.getElementById("editDate").value = toDateInputValue(app.date) || "";
    document.getElementById("editInterviewDate").value = toDateInputValue(app.interview_date || "") || "";
    document.getElementById("editStatus").value = app.status;
    document.getElementById("editApplicationId").value = id;

    // Show the modal
    const editModal = document.getElementById("editModal");
    if (editModal) {
        editModal.classList.add("show");
    }
}

// Handle edit form submission
const editForm = document.getElementById("editForm");
if (editForm) {
    editForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const id = document.getElementById("editApplicationId").value;
        const company_name = document.getElementById("editCompanyName").value.trim();
        const job_role = document.getElementById("editJobRole").value.trim();
        const location = document.getElementById("editLocation").value.trim();
        const salary = document.getElementById("editSalary").value.trim();
        const date = document.getElementById("editDate").value;
        const interview_date = document.getElementById("editInterviewDate").value;
        const status = document.getElementById("editStatus").value;

        const updatedApplication = {
            company_name,
            job_role,
            location,
            salary,
            date: normalizeDateValue(date),
            interview_date: normalizeDateValue(interview_date),
            status: status.toLowerCase()
        };

        try {
            const updateResponse = await apiFetch(
                `/applications/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(updatedApplication)
                }
            );
            
            if (!updateResponse.ok) {
                const error = await updateResponse.json();
                alert(error.message || "Failed to update application");
                return;
            }

            console.log("editApplication response", updateResponse.status);
            
            // Close the modal
            const editModal = document.getElementById("editModal");
            if (editModal) {
                editModal.classList.remove("show");
            }
            
            editForm.reset();
            
            await displayApplications();
            await displayMyApplications();
            await updateDashboardCards();
        } catch (error) {
            console.error("Error updating application:", error);
            alert("Error updating application");
        }
    });
}

// Handle modal close buttons
const closeEditBtn = document.querySelector(".close-edit");
const cancelEditBtn = document.querySelector(".cancel-edit");
const editModal = document.getElementById("editModal");

if (closeEditBtn) {
    closeEditBtn.addEventListener("click", () => {
        if (editModal) {
            editModal.classList.remove("show");
        }
    });
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
        if (editModal) {
            editModal.classList.remove("show");
        }
    });
}

// Close modal when clicking outside
if (editModal) {
    editModal.addEventListener("click", (event) => {
        if (event.target === editModal) {
            editModal.classList.remove("show");
        }
    });
}

// Function to apply badge colors to status dropdowns
function applyStatusBadgeColor(selectElement) {
    const statusColors = {
        applied: { bg: '#e3f2fd', color: '#1976d2' },
        interview: { bg: '#fff3cd', color: '#856404' },
        selected: { bg: '#d4edda', color: '#155724' },
        rejected: { bg: '#f8d7da', color: '#721c24' },
        postponed: { bg: '#fff9c4', color: '#856404' }
    };

    const updateColor = () => {
        const value = selectElement.value;
        if (value && statusColors[value]) {
            selectElement.style.backgroundColor = statusColors[value].bg;
            selectElement.style.color = statusColors[value].color;
            selectElement.style.borderColor = statusColors[value].bg;
        } else {
            selectElement.style.backgroundColor = '';
            selectElement.style.color = '';
            selectElement.style.borderColor = '#ddd';
        }
    };

    selectElement.addEventListener('change', updateColor);
    updateColor(); // Apply initial color
}

// Apply badge colors to status dropdowns
const statusSelect = document.getElementById('status');
if (statusSelect) {
    applyStatusBadgeColor(statusSelect);
}

const editStatusSelect = document.getElementById('editStatus');
if (editStatusSelect) {
    applyStatusBadgeColor(editStatusSelect);
}

// Apply badge colors to dashboard status dropdowns
function applyDashboardStatusColors() {
    const dashboardStatusSelects = document.querySelectorAll('.dashboard-status');
    dashboardStatusSelects.forEach(select => {
        applyStatusBadgeColor(select);
    });
}

// Call this function after displaying applications
const originalDisplayApplications = displayApplications;
displayApplications = async function() {
    await originalDisplayApplications();
    applyDashboardStatusColors();
};

const applicationSearchBtn = document.querySelector(".appl-button");
const applicationSearchBox = document.querySelector(".search-box");
const applicationStatusFilter = document.querySelector(".appl-status");

if (applicationSearchBtn) {
    applicationSearchBtn.addEventListener("click", displayMyApplications);
}

if (applicationSearchBox) {
    applicationSearchBox.addEventListener("input", displayMyApplications);
}

if (applicationStatusFilter) {
    applicationStatusFilter.addEventListener("change", displayMyApplications);
}

const myApplicationList = document.getElementById("myApplicationList");

if (myApplicationList) {
    myApplicationList.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        const id = button.dataset.id;
        console.log("My applications button clicked", button.className, id);
        if (!id) {
            console.warn("No data-id found for button", button);
            return;
        }

        if (button.classList.contains("delete-btn")) {
            deleteApplication(id);
            return;
        }

        if (button.classList.contains("edit-btn")) {
            editApplication(id);
        }
    });
}

const applicationList = document.getElementById("applicationList");

if (applicationList) {
    applicationList.addEventListener("change", (event) => {
        const select = event.target.closest("select.dashboard-status");
        if (!select) return;

        const id = select.dataset.id;
        if (!id) return;
        updateApplicationStatus(id, select.value);
    });

    applicationList.addEventListener("click", (event) => {
        const button = event.target.closest("button.view-details-btn");
        if (!button) return;

        const id = button.dataset.id;
        if (!id) return;
        showDetailsModal(id);
    });
}

let lastFocusedElement = null;
let modalKeydownHandler = null;

async function showDetailsModal(id) {
    const response = await apiFetch("/applications");
    const applications = await response.json();

    const app = applications.find((item) => String(item.id) === String(id));
    if (!app) return;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || "";
    };

    setText("viewCompany", app.company_name);
    setText("viewRole", app.job_role);
    setText("viewLocation", app.location);
    setText("viewSalary", app.salary);
    setText("viewDate", formatDate(app.date));
    setText("viewInterview", formatDate(app.interview_date));
    setText("viewStatus", formatStatus(app.status));

    const detailsModal = document.getElementById("detailsview");
    if (!detailsModal) return;

    lastFocusedElement = document.activeElement;

    detailsModal.classList.add("show");
    detailsModal.setAttribute("aria-hidden", "false");

    const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
    const nodes = Array.from(detailsModal.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null);
    const firstFocusable = nodes[0] || null;
    const lastFocusable = nodes[nodes.length - 1] || null;

    if (firstFocusable) firstFocusable.focus();

    modalKeydownHandler = function(e) {
        if (e.key === 'Tab') {
            if (nodes.length === 0) {
                e.preventDefault();
                return;
            }
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    };

    document.addEventListener('keydown', modalKeydownHandler);
}

const detailsModal = document.getElementById("detailsview");
const closeDetails = document.getElementById("closeDetails");
const closeBtn = document.getElementById("closeBtn");
const goToApplications = document.getElementById("goToApplications");

if (closeDetails) 
    closeDetails.addEventListener("click", hideModal);
if (closeBtn) 
    closeBtn.addEventListener("click", hideModal);
if (goToApplications) 
    goToApplications.addEventListener("click", () => {
    window.location.href = "Applications.html";
});

function hideModal() {
    if (!detailsModal) 
        return;
    detailsModal.classList.remove("show");
    detailsModal.setAttribute("aria-hidden","true");

    if (modalKeydownHandler) {
        document.removeEventListener('keydown', modalKeydownHandler);
        modalKeydownHandler = null;
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
    lastFocusedElement = null;
}
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModal();
});

const changePasswordForm = document.getElementById("changePasswordForm");

if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("profileMessage");
        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;

        if (newPassword !== confirmNewPassword) {
            message.textContent = "New passwords do not match.";
            return;
        }

        try {
            const response = await apiFetch("/change-password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                message.textContent = data.message || "Failed to change password.";
                return;
            }

            changePasswordForm.reset();
            message.textContent = "Password updated successfully.";
        } catch (error) {
            console.error("Error changing password:", error);
            message.textContent = "Error changing password.";
        }
    });
}

displayApplications();
updateDashboardCards();
displayMyApplications();
displayProfile();