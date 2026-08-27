// ============ NearTutor PWA - App.js ============
const API_URL = window.location.origin + '/api';

// ============ State ============
const state = {
    user: JSON.parse(localStorage.getItem('nt_user') || 'null'),
    token: localStorage.getItem('nt_token') || null,
    teachers: [],
    categories: [],
    currentTeacher: null,
    currentPage: 'home',
    searchFilters: { category: '', subject: '', area: '', class_level: '', sort_by: 'rating' },
    userLocation: null,
};

// ============ Auth Helpers ============
function isLoggedIn() { return !!state.token; }
function getRole() { return state.user?.role || null; }

function setAuth(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem('nt_token', token);
    localStorage.setItem('nt_user', JSON.stringify(user));
}

function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('nt_token');
    localStorage.removeItem('nt_user');
    navigate('home');
}

function authHeaders() {
    return state.token ? { 'Authorization': `Bearer ${state.token}` } : {};
}

// ============ API Helpers ============
async function api(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
        headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
        ...options
    };
    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Something went wrong');
    return data;
}

// ============ Router ============
function navigate(page, params = {}) {
    state.currentPage = page;
    state.pageParams = params;
    window.location.hash = page;
    render();
    window.scrollTo(0, 0);
}

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || 'home';
    state.currentPage = hash;
    render();
});

// ============ Toast ============
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ============ GPS ============
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => {
                state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                resolve(state.userLocation);
            },
            err => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
}

// ============ Render Engine ============
function render() {
    const app = document.getElementById('app');
    app.innerHTML = `
        ${renderHeader()}
        <main>
            ${renderPage()}
        </main>
        ${renderBottomNav()}
        ${renderModal()}
    `;
    attachEventListeners();
}

function renderHeader() {
    return `
    <header class="top-header">
        <div class="logo">Near<span>Tutor</span></div>
        <nav class="nav-desktop">
            <a href="#home" class="nav-link ${state.currentPage==='home'?'active':''}">Home</a>
            <a href="#search" class="nav-link ${state.currentPage==='search'?'active':''}">Search</a>
            <a href="#register" class="nav-link ${state.currentPage==='register'?'active':''}">Register</a>
            ${isLoggedIn() ? `<a href="#dashboard" class="nav-link ${state.currentPage==='dashboard'?'active':''}">Dashboard</a>` : ''}
        </nav>
        <div class="header-actions">
            ${isLoggedIn() ? `
                <div class="user-avatar" onclick="navigate('dashboard')">${state.user.name.charAt(0).toUpperCase()}</div>
            ` : `
                <button class="header-btn" onclick="navigate('login')" title="Login">
                    <span class="material-icons-round">person</span>
                </button>
            `}
        </div>
    </header>`;
}

function renderBottomNav() {
    const items = [
        { icon: 'home', label: 'Home', page: 'home' },
        { icon: 'search', label: 'Search', page: 'search' },
        { icon: 'person_add', label: 'Register', page: 'register' },
        { icon: 'dashboard', label: 'Dashboard', page: isLoggedIn() ? 'dashboard' : 'login' },
    ];
    return `
    <nav class="bottom-nav">
        ${items.map(item => `
            <button class="nav-item ${state.currentPage === item.page ? 'active' : ''}" onclick="navigate('${item.page}')">
                <span class="material-icons-round">${item.icon}</span>
                <span>${item.label}</span>
            </button>
        `).join('')}
    </nav>`;
}

function renderModal() {
    return `<div class="modal-overlay" id="modalOverlay"><div class="modal-content" id="modalContent"></div></div>`;
}

// ============ Page Router ============
function renderPage() {
    switch(state.currentPage) {
        case 'home': return renderHomePage();
        case 'search': return renderSearchPage();
        case 'teacher': return renderTeacherProfilePage();
        case 'register': return renderRegisterChoicePage();
        case 'register-teacher': return renderTeacherRegisterPage();
        case 'register-student': return renderStudentRegisterPage();
        case 'login': return renderLoginPage();
        case 'dashboard': return isLoggedIn() ? renderDashboardPage() : renderLoginPage();
        case 'booking': return renderBookingPage();
        default: return renderHomePage();
    }
}

// ============ HOME PAGE ============
function renderHomePage() {
    return `
    <section class="hero-section">
        <h2>Your Next Great Teacher is Nearby</h2>
        <p>Trusted local tutors, matched to your subject and neighborhood</p>
    </section>
    <div class="search-card">
        <h3>Quick Search</h3>
        <div class="search-row">
            <div class="input-group">
                <span class="material-icons-round">menu_book</span>
                <select id="homeSubject" onchange="quickSearch()">
                    <option value="">All Subjects</option>
                </select>
            </div>
        </div>
        <div class="search-row">
            <div class="input-group">
                <span class="material-icons-round">location_on</span>
                <input type="text" id="homeArea" placeholder="Your area (e.g., Kukatpally)" onkeyup="if(event.key==='Enter')quickSearch()">
            </div>
        </div>
        <button class="gps-btn" onclick="searchNearby()">
            <span class="material-icons-round">my_location</span>
            Use my current location
        </button>
        <button class="btn btn-primary" onclick="quickSearch()">
            <span class="material-icons-round">search</span>
            Find Tutors
        </button>
    </div>
    <div class="section-header" style="margin-top:8px">
        <h3>Browse by Category</h3>
    </div>
    <div class="category-grid" id="categoryGrid">
        <div class="loading"><div class="spinner"></div></div>
    </div>
    <div class="section-header" style="margin-top:8px">
        <h3>Top Rated Tutors</h3>
        <a class="see-all" href="#search">See All</a>
    </div>
    <div class="teacher-list" id="homeTeacherList">
        <div class="loading"><div class="spinner"></div></div>
    </div>`;
}

// ============ SEARCH PAGE ============
function renderSearchPage() {
    return `
    <div style="padding:16px 16px 8px">
        <h3 style="font-size:1.1rem;font-weight:700;">Find Tutors & Trainers</h3>
    </div>
    <div style="padding:0 16px">
        <div class="search-row">
            <div class="input-group">
                <span class="material-icons-round">search</span>
                <input type="text" id="searchArea" placeholder="Area or pincode" value="${state.searchFilters.area || ''}">
            </div>
        </div>
        <div class="search-row" style="gap:6px">
            <div class="input-group">
                <span class="material-icons-round">category</span>
                <select id="searchCategory" onchange="onCategoryChange()">
                    <option value="">All Categories</option>
                </select>
            </div>
            <div class="input-group">
                <span class="material-icons-round">menu_book</span>
                <select id="searchSubject">
                    <option value="">All Subjects</option>
                </select>
            </div>
        </div>
        <div class="search-row" style="gap:6px">
            <div class="input-group">
                <span class="material-icons-round">sort</span>
                <select id="searchSort" onchange="performSearch()">
                    <option value="rating">Top Rated</option>
                    <option value="fee_low">Fee: Low to High</option>
                    <option value="fee_high">Fee: High to Low</option>
                    <option value="experience">Most Experienced</option>
                </select>
            </div>
        </div>
        <button class="btn btn-primary btn-block" onclick="performSearch()">
            <span class="material-icons-round">search</span> Search
        </button>
        <button class="gps-btn" onclick="searchNearby()" style="margin-top:10px;justify-content:center;width:100%">
            <span class="material-icons-round">my_location</span>
            Search nearby (GPS)
        </button>
    </div>
    <div class="teacher-list" id="searchTeacherList">
        <div class="loading"><div class="spinner"></div></div>
    </div>`;
}

// ============ TEACHER PROFILE PAGE ============
function renderTeacherProfilePage() {
    const t = state.currentTeacher;
    if (!t) return `<div class="loading"><div class="spinner"></div></div>`;

    const stars = '★'.repeat(Math.round(t.rating)) + '☆'.repeat(5 - Math.round(t.rating));

    return `
    <div class="profile-header">
        <button class="back-btn" onclick="history.back()" style="color:rgba(255,255,255,0.7);margin-bottom:10px">
            <span class="material-icons-round">arrow_back</span> Back
        </button>
        <div class="profile-avatar">${t.name.charAt(0)}</div>
        <div class="name">${t.name}</div>
        <div class="qualification">${t.qualification}</div>
        ${t.is_verified ? '<div style="margin-top:6px"><span class="verified-badge">✓ Verified</span></div>' : ''}
    </div>
    <div class="profile-stats">
        <div class="stat"><div class="stat-val">${t.rating}</div><div class="stat-lbl">Rating</div></div>
        <div class="stat"><div class="stat-val">${t.experience_years}yr</div><div class="stat-lbl">Exp</div></div>
        <div class="stat"><div class="stat-val">${t.total_students}</div><div class="stat-lbl">Students</div></div>
    </div>
    <div class="profile-section">
        <h4><span class="material-icons-round">info</span> About</h4>
        <p class="profile-detail">${t.bio || 'No bio available.'}</p>
    </div>
    <div class="profile-section">
        <h4><span class="material-icons-round">menu_book</span> Subjects / Courses</h4>
        <div class="subject-tags">${(t.subjects||[]).map(s => `<span class="subject-tag">${s}</span>`).join('')}</div>
    </div>
    <div class="profile-section">
        <h4><span class="material-icons-round">school</span> Levels</h4>
        <div class="subject-tags">${(t.classes||[]).map(c => `<span class="subject-tag">${c}</span>`).join('')}</div>
    </div>
    <div class="profile-section">
        <h4><span class="material-icons-round">payments</span> Fees</h4>
        <p class="profile-detail"><strong>Per Hour:</strong> ₹${t.fee_per_hour}</p>
        <p class="profile-detail"><strong>Per Month:</strong> ₹${t.fee_per_month}</p>
    </div>
    <div class="profile-section">
        <h4><span class="material-icons-round">location_on</span> Location & Availability</h4>
        <p class="profile-detail"><strong>Area:</strong> ${t.area}, ${t.city || 'Hyderabad'}</p>
        <p class="profile-detail"><strong>Mode:</strong> ${t.teaching_mode === 'both' ? 'Home Visit & Online' : t.teaching_mode === 'home_visit' ? 'Home Visit' : 'Online'}</p>
        <p class="profile-detail"><strong>Days:</strong> ${(t.available_days||[]).join(', ')}</p>
        <p class="profile-detail"><strong>Time:</strong> ${t.available_time_from} - ${t.available_time_to}</p>
    </div>
    <div class="profile-section">
        <h4><span class="material-icons-round">star</span> Reviews</h4>
        <div style="color:#f1c40f;font-size:1.2rem;margin-bottom:8px">${stars}</div>
        <div id="teacherReviews"><div class="loading"><div class="spinner"></div></div></div>
    </div>
    <div style="padding:16px">
        <button class="btn btn-primary btn-block" onclick="openBookingModal(${t.id})">
            <span class="material-icons-round">send</span> Request Tuition
        </button>
        <a href="tel:${t.phone}" class="btn btn-outline btn-block" style="margin-top:8px">
            <span class="material-icons-round">call</span> Call Teacher
        </a>
    </div>`;
}

// ============ REGISTER CHOICE ============
function renderRegisterChoicePage() {
    return `
    <div class="form-page" style="text-align:center;padding-top:40px">
        <h2>Join NearTutor</h2>
        <p class="subtitle">Teach a skill or find an expert — academics, music, tech, arts & more</p>
        <div style="display:flex;flex-direction:column;gap:12px;max-width:300px;margin:30px auto">
            <button class="btn btn-primary btn-block" onclick="navigate('register-teacher')" style="padding:16px">
                <span class="material-icons-round">school</span> Register as Tutor / Trainer
            </button>
            <button class="btn btn-secondary btn-block" onclick="navigate('register-student')" style="padding:16px">
                <span class="material-icons-round">person</span> Register as Learner
            </button>
        </div>
        <p style="margin-top:20px;font-size:0.85rem;color:var(--dark-light)">
            Already registered? <a href="#login" style="color:var(--primary);font-weight:500">Login here</a>
        </p>
    </div>`;
}

// ============ TEACHER REGISTER ============
function renderTeacherRegisterPage() {
    return `
    <div class="form-page">
        <button class="back-btn" onclick="navigate('register')">
            <span class="material-icons-round">arrow_back</span> Back
        </button>
        <h2>Teacher Registration</h2>
        <p class="subtitle">Fill in your details to start getting students</p>
        <form id="teacherRegForm" onsubmit="submitTeacherRegistration(event)">
            <div class="form-row">
                <div class="form-group"><label>Full Name *</label><input type="text" id="tRegName" required></div>
                <div class="form-group"><label>Phone *</label><input type="tel" id="tRegPhone" required pattern="[0-9]{10}"></div>
            </div>
            <div class="form-group"><label>Email</label><input type="email" id="tRegEmail"></div>
            <div class="form-group"><label>Password *</label><input type="password" id="tRegPassword" required minlength="6"></div>
            <div class="form-group"><label>Qualification *</label><input type="text" id="tRegQual" placeholder="e.g., M.Sc Mathematics" required></div>
            <div class="form-group"><label>Years of Experience *</label><input type="number" id="tRegExp" min="0" required></div>
            <div class="form-group">
                <label>Category *</label>
                <select id="tRegCategory" required onchange="loadRegSubjects()">
                    <option value="">Select a category</option>
                </select>
            </div>
            <div class="form-group">
                <label>Subjects / Courses (select all that apply) *</label>
                <div class="multi-select" id="tRegSubjects">
                    <span style="font-size:0.8rem;color:var(--gray)">Select a category first</span>
                </div>
            </div>
            <div class="form-group">
                <label>Levels You Teach *</label>
                <div class="multi-select" id="tRegClasses">
                    ${['Beginner','Intermediate','Advanced','All Levels','Class 1-5','Class 6-8','Class 9-10','Class 11-12','IIT-JEE','NEET','EAMCET','College / Graduate','Working Professional'].map(c => 
                        `<div class="multi-chip" onclick="toggleChip(this)">${c}</div>`
                    ).join('')}
                </div>
            </div>
            <div class="form-group">
                <label>Teaching Mode *</label>
                <select id="tRegMode" required>
                    <option value="both">Both (Home Visit + Online)</option>
                    <option value="home_visit">Home Visit Only</option>
                    <option value="online">Online Only</option>
                </select>
            </div>
            <div class="form-group"><label>Bio / About You</label><textarea id="tRegBio" placeholder="Tell students about your teaching style..."></textarea></div>
            <div class="form-row">
                <div class="form-group"><label>Area *</label><input type="text" id="tRegArea" placeholder="e.g., Kukatpally" required></div>
                <div class="form-group"><label>Pincode</label><input type="text" id="tRegPincode" pattern="[0-9]{6}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Fee/Hour (₹) *</label><input type="number" id="tRegFeeHour" required></div>
                <div class="form-group"><label>Fee/Month (₹) *</label><input type="number" id="tRegFeeMonth" required></div>
            </div>
            <div class="form-group">
                <label>Available Days</label>
                <div class="multi-select" id="tRegDays">
                    ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => 
                        `<div class="multi-chip" onclick="toggleChip(this)">${d}</div>`
                    ).join('')}
                </div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>From Time</label><input type="time" id="tRegTimeFrom" value="06:00"></div>
                <div class="form-group"><label>To Time</label><input type="time" id="tRegTimeTo" value="21:00"></div>
            </div>
            <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px">
                <span class="material-icons-round">check_circle</span> Register
            </button>
        </form>
    </div>`;
}

// ============ STUDENT REGISTER ============
function renderStudentRegisterPage() {
    return `
    <div class="form-page">
        <button class="back-btn" onclick="navigate('register')">
            <span class="material-icons-round">arrow_back</span> Back
        </button>
        <h2>Student Registration</h2>
        <p class="subtitle">Register to manage your tuition requests</p>
        <form id="studentRegForm" onsubmit="submitStudentRegistration(event)">
            <div class="form-group"><label>Parent/Guardian Name *</label><input type="text" id="sRegName" required></div>
            <div class="form-row">
                <div class="form-group"><label>Phone *</label><input type="tel" id="sRegPhone" required pattern="[0-9]{10}"></div>
                <div class="form-group"><label>Email</label><input type="email" id="sRegEmail"></div>
            </div>
            <div class="form-group"><label>Password *</label><input type="password" id="sRegPassword" required minlength="6"></div>
            <div class="form-group"><label>Learner Name</label><input type="text" id="sRegStudentName" placeholder="If different from above"></div>
            <div class="form-group">
                <label>Current Level *</label>
                <select id="sRegClass" required>
                    <option value="">Select level</option>
                    ${['Beginner','Intermediate','Advanced','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12','IIT-JEE Prep','NEET Prep','EAMCET Prep','College / Graduate','Working Professional'].map(c =>
                        `<option value="${c}">${c}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Subjects / Courses Needed</label>
                <div class="multi-select" id="sRegSubjects">
                    ${['Maths','Physics','Chemistry','Biology','English','Piano','Guitar','Vocals / Singing','Python','AWS Cloud','SQL Server DBA','Data Science','Yoga','Drawing & Sketching'].map(s => 
                        `<div class="multi-chip" onclick="toggleChip(this)">${s}</div>`
                    ).join('')}
                </div>
            </div>
            <div class="form-group">
                <label>Preferred Mode</label>
                <select id="sRegMode">
                    <option value="both">Both (Home Visit + Online)</option>
                    <option value="home_visit">Home Visit Only</option>
                    <option value="online">Online Only</option>
                </select>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Area *</label><input type="text" id="sRegArea" required></div>
                <div class="form-group"><label>Pincode</label><input type="text" id="sRegPincode" pattern="[0-9]{6}"></div>
            </div>
            <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px">
                <span class="material-icons-round">check_circle</span> Register
            </button>
        </form>
    </div>`;
}

// ============ LOGIN PAGE ============
function renderLoginPage() {
    return `
    <div class="login-page">
        <div class="login-card">
            <h2>Welcome Back</h2>
            <p class="subtitle">Login to your NearTutor account</p>
            <div class="login-tabs">
                <div class="login-tab active" id="tabTeacher" onclick="switchLoginTab('teacher')">Teacher</div>
                <div class="login-tab" id="tabStudent" onclick="switchLoginTab('student')">Student</div>
            </div>
            <form id="loginForm" onsubmit="submitLogin(event)">
                <div class="form-group"><label>Phone Number</label><input type="tel" id="loginPhone" required pattern="[0-9]{10}" placeholder="10-digit phone number"></div>
                <div class="form-group"><label>Password</label><input type="password" id="loginPassword" required placeholder="Your password"></div>
                <input type="hidden" id="loginRole" value="teacher">
                <button type="submit" class="btn btn-primary btn-block" style="margin-top:10px">Login</button>
            </form>
            <div class="login-footer">
                Don't have an account? <a href="#register">Register</a>
            </div>
        </div>
    </div>`;
}

// ============ DASHBOARD PAGE ============
function renderDashboardPage() {
    if (!isLoggedIn()) return renderLoginPage();
    const role = getRole();
    return role === 'teacher' ? renderTeacherDashboard() : renderStudentDashboard();
}

function renderTeacherDashboard() {
    return `
    <div class="dashboard-header">
        <div class="greeting">Welcome back,</div>
        <div class="name">${state.user.name}</div>
    </div>
    <div class="dashboard-stats" id="teacherDashStats">
        <div class="dash-stat-card"><div class="value">-</div><div class="label">Total</div></div>
        <div class="dash-stat-card"><div class="value">-</div><div class="label">Pending</div></div>
        <div class="dash-stat-card"><div class="value">-</div><div class="label">Accepted</div></div>
    </div>
    <div class="section-header"><h3>Pending Requests</h3></div>
    <div id="teacherRequests"><div class="loading"><div class="spinner"></div></div></div>
    <div class="section-header"><h3>Recent Reviews</h3></div>
    <div id="teacherReviews"><div class="loading"><div class="spinner"></div></div></div>
    <div style="padding:16px">
        <button class="btn btn-outline btn-block" onclick="logout()">
            <span class="material-icons-round">logout</span> Logout
        </button>
    </div>`;
}

function renderStudentDashboard() {
    return `
    <div class="dashboard-header">
        <div class="greeting">Hello,</div>
        <div class="name">${state.user.name}</div>
    </div>
    <div class="section-header"><h3>My Tuition Requests</h3></div>
    <div id="studentRequests"><div class="loading"><div class="spinner"></div></div></div>
    <div style="padding:16px;display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-primary btn-block" onclick="navigate('search')">
            <span class="material-icons-round">search</span> Find Tutors
        </button>
        <button class="btn btn-outline btn-block" onclick="logout()">
            <span class="material-icons-round">logout</span> Logout
        </button>
    </div>`;
}

// ============ BOOKING PAGE ============
function renderBookingPage() {
    const t = state.currentTeacher;
    return `
    <div class="form-page">
        <button class="back-btn" onclick="history.back()">
            <span class="material-icons-round">arrow_back</span> Back
        </button>
        <h2>Request Tuition</h2>
        <p class="subtitle">${t ? `Requesting from ${t.name}` : ''}</p>
        <form id="bookingForm" onsubmit="submitBooking(event)">
            <div class="form-group"><label>Your Name *</label><input type="text" id="bookName" required value="${state.user?.name || ''}"></div>
            <div class="form-group"><label>Phone Number *</label><input type="tel" id="bookPhone" required value="${state.user?.phone || ''}" pattern="[0-9]{10}"></div>
            <div class="form-group">
                <label>Subject *</label>
                <select id="bookSubject" required>
                    ${t ? t.subjects.map(s => `<option value="${s}">${s}</option>`).join('') : '<option>-</option>'}
                </select>
            </div>
            <div class="form-group"><label>Your Area *</label><input type="text" id="bookArea" required placeholder="e.g., KPHB Colony"></div>
            <div class="form-group"><label>Preferred Time</label><input type="text" id="bookTime" placeholder="e.g., Evenings 5-7 PM"></div>
            <div class="form-group"><label>Preferred Days</label><input type="text" id="bookDays" placeholder="e.g., Mon, Wed, Fri"></div>
            <div class="form-group">
                <label>Mode</label>
                <select id="bookMode">
                    <option value="home_visit">Home Visit</option>
                    <option value="online">Online</option>
                    <option value="both">Either</option>
                </select>
            </div>
            <div class="form-group"><label>Message to Teacher</label><textarea id="bookMessage" placeholder="Tell the teacher what you need help with..."></textarea></div>
            <input type="hidden" id="bookTeacherId" value="${t ? t.id : ''}">
            <button type="submit" class="btn btn-primary btn-block" style="margin-top:10px">
                <span class="material-icons-round">send</span> Send Request
            </button>
        </form>
    </div>`;
}

// ============ RENDER TEACHER CARDS ============
function renderTeacherCards(teachers, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (teachers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">search_off</span>
                <h3>No tutors found</h3>
                <p>Try a different search or area</p>
            </div>`;
        return;
    }

    container.innerHTML = teachers.map(t => `
        <div class="teacher-card" onclick="viewTeacher(${t.id})">
            <div class="teacher-card-header">
                <div class="teacher-info">
                    <div class="teacher-name">${t.name}</div>
                    <div class="teacher-meta">${t.qualification} • ${t.experience_years} yrs</div>
                </div>
                ${t.is_verified ? '<span class="verified-badge">✓ Verified</span>' : ''}
            </div>
            <p class="teacher-bio">${t.bio || ''}</p>
            <div class="subject-tags">
                ${t.subjects.map(s => `<span class="subject-tag">${s}</span>`).join('')}
            </div>
            <div class="teacher-stats-row">
                <span><span class="material-icons-round" style="color:#f1c40f">star</span> ${t.rating}/5</span>
                <span><span class="material-icons-round">people</span> ${t.total_students}</span>
                <span><span class="material-icons-round">location_on</span> ${t.area}</span>
                ${t.distance_km !== undefined ? `<span><span class="material-icons-round">near_me</span> ${t.distance_km}km</span>` : ''}
            </div>
            <div class="teacher-fee">₹${t.fee_per_hour}/hr <small>• ₹${t.fee_per_month}/mo</small></div>
            <div class="teacher-actions">
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openBookingModal(${t.id})">Request</button>
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();viewTeacher(${t.id})">View Profile</button>
            </div>
        </div>
    `).join('');
}

// ============ EVENT HANDLERS ============
function attachEventListeners() {
    // Load data based on current page
    if (state.currentPage === 'home') loadHomePage();
    if (state.currentPage === 'search') loadSearchPage();
    if (state.currentPage === 'teacher') loadTeacherProfile();
    if (state.currentPage === 'dashboard') loadDashboard();
    if (state.currentPage === 'register-teacher') loadRegCategories();
}

// Load categories into the teacher registration form
async function loadRegCategories() {
    try {
        if (!state.categories || state.categories.length === 0) {
            state.categories = await api('/categories');
        }
        const sel = document.getElementById('tRegCategory');
        if (sel) {
            state.categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id; opt.textContent = c.name;
                sel.appendChild(opt);
            });
        }
    } catch(e) {}
}

// Load subjects for the selected category in registration
async function loadRegSubjects() {
    const cat = document.getElementById('tRegCategory')?.value || '';
    const container = document.getElementById('tRegSubjects');
    if (!container) return;
    if (!cat) {
        container.innerHTML = '<span style="font-size:0.8rem;color:var(--gray)">Select a category first</span>';
        return;
    }
    try {
        const subjects = await api(`/subjects?category=${cat}`);
        container.innerHTML = subjects.map(s =>
            `<div class="multi-chip" onclick="toggleChip(this)">${s}</div>`
        ).join('');
    } catch(e) {}
}

async function loadHomePage() {
    // Load subjects dropdown
    try {
        const subjects = await api('/subjects');
        const select = document.getElementById('homeSubject');
        if (select) {
            subjects.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s; opt.textContent = s;
                select.appendChild(opt);
            });
        }
    } catch(e) {}

    // Load category tiles
    try {
        const categories = await api('/categories');
        state.categories = categories;
        const grid = document.getElementById('categoryGrid');
        if (grid) {
            grid.innerHTML = categories.map(c => `
                <div class="category-tile" style="--cat-color:${c.color}" onclick="browseCategory('${c.id}','${c.name}')">
                    <div class="category-icon"><span class="material-icons-round">${c.icon}</span></div>
                    <div class="category-name">${c.name}</div>
                </div>
            `).join('');
        }
    } catch(e) {}

    // Load top teachers
    try {
        const teachers = await api('/teachers?sort_by=rating');
        state.teachers = teachers;
        renderTeacherCards(teachers.slice(0, 5), 'homeTeacherList');
    } catch(e) {
        const el = document.getElementById('homeTeacherList');
        if (el) el.innerHTML = '<div class="empty-state"><p>Could not load tutors. Is the server running?</p></div>';
    }
}

function browseCategory(categoryId, categoryName) {
    state.searchFilters = { category: categoryId, categoryName: categoryName, subject: '', area: '', sort_by: 'rating' };
    navigate('search');
}

async function loadSearchPage() {
    // Load categories dropdown
    try {
        if (!state.categories || state.categories.length === 0) {
            state.categories = await api('/categories');
        }
        const catSelect = document.getElementById('searchCategory');
        if (catSelect) {
            state.categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id; opt.textContent = c.name;
                if (c.id === state.searchFilters.category) opt.selected = true;
                catSelect.appendChild(opt);
            });
        }
    } catch(e) {}

    // Load subjects (filtered by category if one is selected)
    await loadSubjectsForCategory(state.searchFilters.category || '');

    // Load results
    performSearch();
}

async function loadSubjectsForCategory(categoryId) {
    const select = document.getElementById('searchSubject');
    if (!select) return;
    select.innerHTML = '<option value="">All Subjects</option>';
    try {
        const url = categoryId ? `/subjects?category=${categoryId}` : '/subjects';
        const subjects = await api(url);
        subjects.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s; opt.textContent = s;
            if (s === state.searchFilters.subject) opt.selected = true;
            select.appendChild(opt);
        });
    } catch(e) {}
}

function onCategoryChange() {
    const cat = document.getElementById('searchCategory')?.value || '';
    state.searchFilters.category = cat;
    state.searchFilters.subject = '';
    loadSubjectsForCategory(cat);
    performSearch();
}

async function performSearch() {
    const area = document.getElementById('searchArea')?.value || '';
    const subject = document.getElementById('searchSubject')?.value || '';
    const category = document.getElementById('searchCategory')?.value || '';
    const sort = document.getElementById('searchSort')?.value || 'rating';

    state.searchFilters = { area, subject, category, sort_by: sort };

    const list = document.getElementById('searchTeacherList');
    if (list) list.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        let url = `/teachers?sort_by=${sort}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (subject) url += `&subject=${encodeURIComponent(subject)}`;
        if (area) url += `&area=${encodeURIComponent(area)}`;
        const teachers = await api(url);
        state.teachers = teachers;
        renderTeacherCards(teachers, 'searchTeacherList');
    } catch(e) {
        if (list) list.innerHTML = '<div class="empty-state"><p>Error loading results</p></div>';
    }
}

function quickSearch() {
    const subject = document.getElementById('homeSubject')?.value || '';
    const area = document.getElementById('homeArea')?.value || '';
    state.searchFilters = { subject, area, sort_by: 'rating' };
    navigate('search');
}

async function searchNearby() {
    showToast('Getting your location...');
    try {
        const loc = await getUserLocation();
        const list = document.getElementById('searchTeacherList') || document.getElementById('homeTeacherList');
        if (list) list.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        const teachers = await api(`/teachers/nearby?lat=${loc.lat}&lon=${loc.lng}&radius_km=10`);
        state.teachers = teachers;

        if (state.currentPage === 'home') {
            renderTeacherCards(teachers.slice(0, 5), 'homeTeacherList');
        } else {
            renderTeacherCards(teachers, 'searchTeacherList');
        }
        showToast(`Found ${teachers.length} tutor(s) nearby`);
    } catch(e) {
        showToast('Could not get location. Please allow GPS access.');
    }
}

async function viewTeacher(id) {
    state.currentTeacher = state.teachers.find(t => t.id === id) || null;
    navigate('teacher');
}

async function loadTeacherProfile() {
    if (!state.currentTeacher && state.pageParams?.id) {
        try {
            state.currentTeacher = await api(`/teachers/${state.pageParams.id}`);
            render();
        } catch(e) {}
    }

    // Load reviews
    if (state.currentTeacher) {
        try {
            const reviews = await api(`/reviews/${state.currentTeacher.id}`);
            const el = document.getElementById('teacherReviews');
            if (el) {
                if (reviews.length === 0) {
                    el.innerHTML = '<p style="font-size:0.85rem;color:var(--dark-light)">No reviews yet</p>';
                } else {
                    el.innerHTML = reviews.map(r => `
                        <div class="review-card" style="margin:8px 0;box-shadow:none;border:1px solid var(--gray-light)">
                            <div class="review-header">
                                <span class="review-name">${r.student_name}</span>
                                <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                            </div>
                            <p class="review-text">${r.review_text || ''}</p>
                            <div class="review-date">${r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</div>
                        </div>
                    `).join('');
                }
            }
        } catch(e) {}
    }
}

function openBookingModal(teacherId) {
    const t = state.teachers.find(t => t.id === teacherId);
    if (t) {
        state.currentTeacher = t;
        navigate('booking');
    }
}

// ============ FORM SUBMISSIONS ============
async function submitTeacherRegistration(e) {
    e.preventDefault();
    const selectedSubjects = [...document.querySelectorAll('#tRegSubjects .multi-chip.selected')].map(el => el.textContent);
    const selectedClasses = [...document.querySelectorAll('#tRegClasses .multi-chip.selected')].map(el => el.textContent);
    const selectedDays = [...document.querySelectorAll('#tRegDays .multi-chip.selected')].map(el => el.textContent);

    if (selectedSubjects.length === 0) { showToast('Please select at least one subject'); return; }

    const data = {
        name: document.getElementById('tRegName').value,
        phone: document.getElementById('tRegPhone').value,
        email: document.getElementById('tRegEmail').value,
        password: document.getElementById('tRegPassword').value,
        qualification: document.getElementById('tRegQual').value,
        experience_years: parseInt(document.getElementById('tRegExp').value),
        category: document.getElementById('tRegCategory').value,
        subjects: selectedSubjects,
        classes: selectedClasses,
        teaching_mode: document.getElementById('tRegMode').value,
        bio: document.getElementById('tRegBio').value,
        area: document.getElementById('tRegArea').value,
        pincode: document.getElementById('tRegPincode').value,
        fee_per_hour: parseInt(document.getElementById('tRegFeeHour').value),
        fee_per_month: parseInt(document.getElementById('tRegFeeMonth').value),
        available_days: selectedDays,
        available_time_from: document.getElementById('tRegTimeFrom').value,
        available_time_to: document.getElementById('tRegTimeTo').value,
        city: "Hyderabad"
    };

    try {
        const res = await api('/teachers/register', { method: 'POST', body: data });
        setAuth(res.token, { id: res.id, name: data.name, role: 'teacher', phone: data.phone, email: data.email });
        showToast('Registration successful! Welcome aboard.');
        navigate('dashboard');
    } catch(e) {
        showToast(e.message || 'Registration failed');
    }
}

async function submitStudentRegistration(e) {
    e.preventDefault();
    const selectedSubjects = [...document.querySelectorAll('#sRegSubjects .multi-chip.selected')].map(el => el.textContent);

    const data = {
        name: document.getElementById('sRegName').value,
        phone: document.getElementById('sRegPhone').value,
        email: document.getElementById('sRegEmail').value,
        password: document.getElementById('sRegPassword').value,
        student_name: document.getElementById('sRegStudentName').value,
        current_class: document.getElementById('sRegClass').value,
        subjects_needed: selectedSubjects,
        learning_mode: document.getElementById('sRegMode').value,
        area: document.getElementById('sRegArea').value,
        pincode: document.getElementById('sRegPincode').value,
        city: "Hyderabad"
    };

    try {
        const res = await api('/students/register', { method: 'POST', body: data });
        setAuth(res.token, { id: res.id, name: data.name, role: 'student', phone: data.phone, email: data.email });
        showToast('Registration successful!');
        navigate('dashboard');
    } catch(e) {
        showToast(e.message || 'Registration failed');
    }
}

async function submitLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    try {
        const res = await api(`/auth/${role}/login`, { method: 'POST', body: { phone, password } });
        setAuth(res.token, res.user);
        showToast(`Welcome back, ${res.user.name}!`);
        navigate('dashboard');
    } catch(e) {
        showToast(e.message || 'Login failed');
    }
}

function switchLoginTab(role) {
    document.getElementById('loginRole').value = role;
    document.getElementById('tabTeacher').className = 'login-tab' + (role === 'teacher' ? ' active' : '');
    document.getElementById('tabStudent').className = 'login-tab' + (role === 'student' ? ' active' : '');
}

async function submitBooking(e) {
    e.preventDefault();
    const data = {
        teacher_id: parseInt(document.getElementById('bookTeacherId').value),
        student_name: document.getElementById('bookName').value,
        phone: document.getElementById('bookPhone').value,
        subject: document.getElementById('bookSubject').value,
        area: document.getElementById('bookArea').value,
        preferred_time: document.getElementById('bookTime').value,
        preferred_days: document.getElementById('bookDays').value,
        teaching_mode: document.getElementById('bookMode').value,
        message: document.getElementById('bookMessage').value,
    };

    try {
        const res = await api('/requests', { method: 'POST', body: data });
        showToast(`Request sent! ID: ${res.request_id}`);
        navigate('home');
    } catch(e) {
        showToast(e.message || 'Failed to send request');
    }
}

// ============ DASHBOARD DATA LOADING ============
async function loadDashboard() {
    if (!isLoggedIn()) return;
    const role = getRole();

    if (role === 'teacher') {
        try {
            const data = await api('/dashboard/teacher');
            // Stats
            const statsEl = document.getElementById('teacherDashStats');
            if (statsEl) {
                statsEl.innerHTML = `
                    <div class="dash-stat-card"><div class="value">${data.stats.total_requests}</div><div class="label">Total</div></div>
                    <div class="dash-stat-card"><div class="value">${data.stats.pending}</div><div class="label">Pending</div></div>
                    <div class="dash-stat-card"><div class="value">${data.stats.accepted}</div><div class="label">Accepted</div></div>
                `;
            }
            // Requests
            const reqEl = document.getElementById('teacherRequests');
            if (reqEl) {
                if (data.pending_requests.length === 0) {
                    reqEl.innerHTML = '<div class="empty-state"><span class="material-icons-round">inbox</span><h3>No pending requests</h3><p>You\'ll see new requests here</p></div>';
                } else {
                    reqEl.innerHTML = data.pending_requests.map(r => `
                        <div class="request-card">
                            <div class="req-header">
                                <span class="req-name">${r.student_name}</span>
                                <span class="req-status status-pending">Pending</span>
                            </div>
                            <div class="req-details">
                                <strong>${r.subject}</strong><br>
                                ${r.message ? `"${r.message}"<br>` : ''}
                                Time: ${r.preferred_time || 'Flexible'} | Days: ${r.preferred_days || 'Flexible'}<br>
                                Mode: ${r.teaching_mode} | Phone: ${r.student_phone}
                            </div>
                            <div class="req-actions">
                                <button class="btn btn-primary btn-sm" onclick="respondToRequest('${r.request_id}','accepted')">Accept</button>
                                <button class="btn btn-danger btn-sm" onclick="respondToRequest('${r.request_id}','rejected')">Decline</button>
                            </div>
                        </div>
                    `).join('');
                }
            }
            // Reviews
            const revEl = document.getElementById('teacherReviews');
            if (revEl) {
                if (data.recent_reviews.length === 0) {
                    revEl.innerHTML = '<div class="empty-state" style="padding:20px"><p>No reviews yet</p></div>';
                } else {
                    revEl.innerHTML = data.recent_reviews.map(r => `
                        <div class="review-card">
                            <div class="review-header">
                                <span class="review-name">${r.student_name}</span>
                                <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                            </div>
                            <p class="review-text">${r.review_text || ''}</p>
                        </div>
                    `).join('');
                }
            }
        } catch(e) {
            showToast('Error loading dashboard');
        }
    } else {
        try {
            const data = await api('/dashboard/student');
            const reqEl = document.getElementById('studentRequests');
            if (reqEl) {
                if (data.requests.length === 0) {
                    reqEl.innerHTML = '<div class="empty-state"><span class="material-icons-round">inbox</span><h3>No requests yet</h3><p>Search for tutors and send your first request</p></div>';
                } else {
                    reqEl.innerHTML = data.requests.map(r => `
                        <div class="request-card">
                            <div class="req-header">
                                <span class="req-name">${r.teacher_name}</span>
                                <span class="req-status status-${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
                            </div>
                            <div class="req-details">
                                <strong>${r.subject}</strong><br>
                                Status: ${r.status} | ID: ${r.request_id}<br>
                                ${r.teacher_response ? `Teacher says: "${r.teacher_response}"` : ''}
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch(e) {
            showToast('Error loading dashboard');
        }
    }
}

async function respondToRequest(requestId, status) {
    try {
        await api(`/requests/${requestId}/respond`, {
            method: 'PUT',
            body: { status, response_message: status === 'accepted' ? 'I will be happy to teach you!' : 'Sorry, I am not available at this time.' }
        });
        showToast(`Request ${status}!`);
        loadDashboard();
    } catch(e) {
        showToast(e.message || 'Error responding');
    }
}

// ============ UTILITY ============
function toggleChip(el) {
    el.classList.toggle('selected');
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.slice(1) || 'home';
    state.currentPage = hash;
    render();
});

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}
