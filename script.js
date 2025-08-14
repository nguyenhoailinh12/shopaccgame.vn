// Global variables
let currentUser = null;
let accounts = [];
let users = [];
let pendingAccounts = [];
let cart = [];
let donations = [];

// Server logging functions
function logUserActivity(type, data) {
    // Try to send activity to server if running
    try {
        const activityData = {
            type: type,
            username: data.username || 'unknown',
            timestamp: new Date().toISOString(),
            ...data
        };
        
        fetch('/api/log-activity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activityData)
        }).catch(error => {
            // Silently fail if server is not running
            console.log('Server logging not available:', error.message);
        });
    } catch (error) {
        // Silently fail if fetch is not available
        console.log('Activity logging failed:', error.message);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadSampleData();
    updateNavigation();
    loadAccounts();
});

// Initialize application
function initializeApp() {
    // Load saved data from localStorage
    const savedUsers = localStorage.getItem('gameShopUsers');
    const savedAccounts = localStorage.getItem('gameShopAccounts');
    const savedPendingAccounts = localStorage.getItem('gameShopPendingAccounts');
    const savedCurrentUser = localStorage.getItem('gameShopCurrentUser');
    const savedCart = localStorage.getItem('gameShopCart');
    const savedDonations = localStorage.getItem('gameShopDonations');

    if (savedUsers) users = JSON.parse(savedUsers);
    if (savedAccounts) accounts = JSON.parse(savedAccounts);
    if (savedPendingAccounts) pendingAccounts = JSON.parse(savedPendingAccounts);
    if (savedCurrentUser) currentUser = JSON.parse(savedCurrentUser);
    if (savedCart) cart = JSON.parse(savedCart);
    if (savedDonations) donations = JSON.parse(savedDonations);

    // Set up event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('addAccountForm').addEventListener('submit', handleAddAccount);
    document.getElementById('cardDonateForm').addEventListener('submit', handleCardDonate);
    document.getElementById('bankDonateForm').addEventListener('submit', handleBankDonate);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Filters
    document.getElementById('gameFilter').addEventListener('change', filterAccounts);
    document.getElementById('priceFilter').addEventListener('change', filterAccounts);

    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('accountModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Navigation handling
function handleNavigation(e) {
    e.preventDefault();
    const href = e.target.getAttribute('href');
    
    if (href === '#admin' && (!currentUser || !currentUser.isAdmin)) {
        showAlert('Bạn không có quyền truy cập trang này!', 'error');
        return;
    }
    
    if (href.startsWith('#')) {
        const sectionId = href.substring(1);
        showSection(sectionId);
    }
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific content
        if (sectionId === 'shop') {
            loadAccounts();
        } else if (sectionId === 'admin') {
            loadAdminContent();
        } else if (sectionId === 'cart') {
            loadCart();
        } else if (sectionId === 'donate') {
            loadDonors();
        }
    }
}

// User registration
function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    // Validation
    if (password !== confirmPassword) {
        showAlert('Mật khẩu xác nhận không khớp!', 'error');
        return;
    }
    
    if (users.find(user => user.username === username)) {
        showAlert('Tên đăng nhập đã tồn tại!', 'error');
        return;
    }
    
    if (users.find(user => user.email === email)) {
        showAlert('Email đã được sử dụng!', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        username: username,
        email: email,
        password: password, // In real app, this should be hashed
        isAdmin: false,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveData();
    
    // Log registration activity to server
    logUserActivity('register', {
        username: username,
        email: email
    });
    
    showAlert('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
    document.getElementById('registerForm').reset();
    showSection('login');
}

// User login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        saveData();
        updateNavigation();
        
        // Log login activity to server
        logUserActivity('login', {
            username: user.username,
            isAdmin: user.isAdmin || false
        });
        
        showAlert(`Chào mừng ${user.username}!`, 'success');
        showSection('home');
        document.getElementById('loginForm').reset();
    } else {
        showAlert('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
    }
}

// User logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('gameShopCurrentUser');
    updateNavigation();
    showAlert('Đã đăng xuất thành công!', 'success');
    showSection('home');
}

// Update navigation based on user status
function updateNavigation() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminBtn = document.getElementById('adminBtn');
    const cartBtn = document.getElementById('cartBtn');
    
    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        cartBtn.style.display = 'block';
        
        if (currentUser.isAdmin) {
            adminBtn.style.display = 'block';
        } else {
            adminBtn.style.display = 'none';
        }
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        adminBtn.style.display = 'none';
        cartBtn.style.display = 'none';
    }
    
    updateCartCount();
}

// Load and display accounts
function loadAccounts() {
    const accountsList = document.getElementById('accountsList');
    const activeAccounts = accounts.filter(account => account.status === 'active');
    
    if (activeAccounts.length === 0) {
        accountsList.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">Chưa có tài khoản nào để bán.</p>';
        return;
    }
    
    accountsList.innerHTML = activeAccounts.map(account => `
        <div class="account-card" onclick="showAccountDetails(${account.id})">
            <div class="account-image">
                ${account.image ? `<img src="${account.image}" alt="${account.game}">` : `<i class="fas fa-gamepad"></i>`}
            </div>
            <div class="account-info">
                <div class="account-game">${getGameName(account.game)}</div>
                <div class="account-rank">${account.rank}</div>
                <div class="account-server">Server: ${account.server}</div>
                <div class="account-price">${formatPrice(account.price)}</div>
            </div>
        </div>
    `).join('');
}

// Filter accounts
function filterAccounts() {
    const gameFilter = document.getElementById('gameFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    
    let filteredAccounts = accounts.filter(account => account.status === 'active');
    
    if (gameFilter) {
        filteredAccounts = filteredAccounts.filter(account => account.game === gameFilter);
    }
    
    if (priceFilter) {
        const [min, max] = priceFilter.split('-').map(p => p.replace('+', ''));
        filteredAccounts = filteredAccounts.filter(account => {
            if (max) {
                return account.price >= parseInt(min) && account.price <= parseInt(max);
            } else {
                return account.price >= parseInt(min);
            }
        });
    }
    
    const accountsList = document.getElementById('accountsList');
    
    if (filteredAccounts.length === 0) {
        accountsList.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">Không tìm thấy tài khoản phù hợp.</p>';
        return;
    }
    
    accountsList.innerHTML = filteredAccounts.map(account => `
        <div class="account-card" onclick="showAccountDetails(${account.id})">
            <div class="account-image">
                ${account.image ? `<img src="${account.image}" alt="${account.game}">` : `<i class="fas fa-gamepad"></i>`}
            </div>
            <div class="account-info">
                <div class="account-game">${getGameName(account.game)}</div>
                <div class="account-rank">${account.rank}</div>
                <div class="account-server">Server: ${account.server}</div>
                <div class="account-price">${formatPrice(account.price)}</div>
            </div>
        </div>
    `).join('');
}

// Show account details modal
function showAccountDetails(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
    const modal = document.getElementById('accountModal');
    const accountDetails = document.getElementById('accountDetails');
    
    accountDetails.innerHTML = `
        <h2>${getGameName(account.game)} - ${account.rank}</h2>
        <div style="display: grid; gap: 1rem; margin: 2rem 0;">
            ${account.image ? `<img src="${account.image}" style="width: 100%; max-width: 400px; border-radius: 10px;" alt="${account.game}">` : ''}
            <div><strong>Game:</strong> ${getGameName(account.game)}</div>
            <div><strong>Rank/Level:</strong> ${account.rank}</div>
            <div><strong>Server:</strong> ${account.server}</div>
            <div><strong>Giá:</strong> <span style="color: #ff6b6b; font-size: 1.5rem; font-weight: bold;">${formatPrice(account.price)}</span></div>
            <div><strong>Mô tả:</strong></div>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 10px;">${account.description}</div>
            ${currentUser ? `
                <div style="display: flex; gap: 1rem;">
                    <button class="auth-btn" onclick="addToCart(${account.id})" style="flex: 1;">
                        <i class="fas fa-cart-plus"></i> Thêm vào giỏ
                    </button>
                    <button class="auth-btn" onclick="buyAccount(${account.id})" style="flex: 1; background: linear-gradient(45deg, #ff6b6b, #feca57);">
                        <i class="fas fa-bolt"></i> Mua ngay
                    </button>
                </div>
            ` : `
                <p style="text-align: center; color: #666;">Vui lòng đăng nhập để mua tài khoản</p>
            `}
        </div>
    `;
    
    modal.style.display = 'block';
}

// Buy account
function buyAccount(accountId) {
    if (!currentUser) {
        showAlert('Vui lòng đăng nhập để mua tài khoản!', 'error');
        return;
    }
    
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
    // In a real app, this would integrate with payment processing
    if (confirm(`Bạn có chắc muốn mua tài khoản ${getGameName(account.game)} - ${account.rank} với giá ${formatPrice(account.price)}?`)) {
        account.status = 'sold';
        account.buyer = currentUser.username;
        account.soldAt = new Date().toISOString();
        
        saveData();
        closeModal();
        loadAccounts();
        showAlert('Mua tài khoản thành công! Chúng tôi sẽ liên hệ với bạn sớm.', 'success');
    }
}

// Close modal
function closeModal() {
    document.getElementById('accountModal').style.display = 'none';
}

// Admin functions
function handleAddAccount(e) {
    e.preventDefault();
    
    if (!currentUser || !currentUser.isAdmin) {
        showAlert('Bạn không có quyền thực hiện thao tác này!', 'error');
        return;
    }
    
    const game = document.getElementById('accountGame').value;
    const price = parseInt(document.getElementById('accountPrice').value);
    const rank = document.getElementById('accountRank').value;
    const server = document.getElementById('accountServer').value;
    const description = document.getElementById('accountDescription').value;
    const image = document.getElementById('accountImage').value;
    
    const newAccount = {
        id: Date.now(),
        game: game,
        price: price,
        rank: rank,
        server: server,
        description: description,
        image: image,
        status: 'active',
        createdBy: currentUser.username,
        createdAt: new Date().toISOString()
    };
    
    accounts.push(newAccount);
    saveData();
    
    showAlert('Thêm tài khoản thành công!', 'success');
    document.getElementById('addAccountForm').reset();
    loadAdminContent();
}

// Load admin content
function loadAdminContent() {
    loadAdminAccounts();
    loadPendingAccounts();
}

// Show admin tab
function showAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load tab-specific content
    if (tabName === 'accounts') {
        loadAdminAccounts();
    } else if (tabName === 'pending') {
        loadPendingAccounts();
    }
}

// Load admin accounts
function loadAdminAccounts() {
    const adminAccountsList = document.getElementById('adminAccountsList');
    
    if (accounts.length === 0) {
        adminAccountsList.innerHTML = '<p style="text-align: center; color: #666;">Chưa có tài khoản nào.</p>';
        return;
    }
    
    adminAccountsList.innerHTML = accounts.map(account => `
        <div class="admin-account-item">
            <div class="admin-account-info">
                <h4>${getGameName(account.game)} - ${account.rank}</h4>
                <p>Server: ${account.server} | Giá: ${formatPrice(account.price)}</p>
                <p>Trạng thái: <span class="status-badge status-${account.status}">${getStatusText(account.status)}</span></p>
                <p>Tạo bởi: ${account.createdBy} | ${formatDate(account.createdAt)}</p>
            </div>
            <div class="admin-actions">
                <button class="btn-small btn-edit" onclick="editAccount(${account.id})">Sửa</button>
                <button class="btn-small btn-delete" onclick="deleteAccount(${account.id})">Xóa</button>
            </div>
        </div>
    `).join('');
}

// Load pending accounts
function loadPendingAccounts() {
    const pendingAccountsList = document.getElementById('pendingAccountsList');
    const pendingItems = accounts.filter(account => account.status === 'pending');
    
    if (pendingItems.length === 0) {
        pendingAccountsList.innerHTML = '<p style="text-align: center; color: #666;">Không có tài khoản nào chờ duyệt.</p>';
        return;
    }
    
    pendingAccountsList.innerHTML = pendingItems.map(account => `
        <div class="admin-account-item">
            <div class="admin-account-info">
                <h4>${getGameName(account.game)} - ${account.rank}</h4>
                <p>Server: ${account.server} | Giá: ${formatPrice(account.price)}</p>
                <p>Mô tả: ${account.description}</p>
                <p>Tạo bởi: ${account.createdBy} | ${formatDate(account.createdAt)}</p>
            </div>
            <div class="admin-actions">
                <button class="btn-small btn-approve" onclick="approveAccount(${account.id})">Duyệt</button>
                <button class="btn-small btn-reject" onclick="rejectAccount(${account.id})">Từ chối</button>
            </div>
        </div>
    `).join('');
}

// Admin actions
function editAccount(accountId) {
    // This would open an edit form - simplified for demo
    showAlert('Chức năng chỉnh sửa sẽ được phát triển trong phiên bản tiếp theo.', 'warning');
}

function deleteAccount(accountId) {
    if (confirm('Bạn có chắc muốn xóa tài khoản này?')) {
        accounts = accounts.filter(account => account.id !== accountId);
        saveData();
        loadAdminAccounts();
        showAlert('Xóa tài khoản thành công!', 'success');
    }
}

function approveAccount(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
        account.status = 'active';
        account.approvedBy = currentUser.username;
        account.approvedAt = new Date().toISOString();
        saveData();
        loadPendingAccounts();
        loadAdminAccounts();
        showAlert('Đã duyệt tài khoản thành công!', 'success');
    }
}

function rejectAccount(accountId) {
    if (confirm('Bạn có chắc muốn từ chối tài khoản này?')) {
        accounts = accounts.filter(account => account.id !== accountId);
        saveData();
        loadPendingAccounts();
        showAlert('Đã từ chối tài khoản!', 'success');
    }
}

// Utility functions
function getGameName(gameCode) {
    const games = {
        'lol': 'League of Legends',
        'valorant': 'Valorant',
        'pubg': 'PUBG',
        'fifa': 'FIFA'
    };
    return games[gameCode] || gameCode;
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN');
}

function getStatusText(status) {
    const statusTexts = {
        'active': 'Đang bán',
        'pending': 'Chờ duyệt',
        'sold': 'Đã bán'
    };
    return statusTexts[status] || status;
}

function showAlert(message, type = 'success') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at the top of the current section
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        activeSection.insertBefore(alert, activeSection.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// Shopping Cart Functions
function addToCart(accountId) {
    if (!currentUser) {
        showAlert('Vui lòng đăng nhập để thêm vào giỏ hàng!', 'error');
        return;
    }
    
    const account = accounts.find(a => a.id === accountId);
    if (!account || account.status !== 'active') {
        showAlert('Tài khoản không khả dụng!', 'error');
        return;
    }
    
    // Check if already in cart
    if (cart.find(item => item.id === accountId)) {
        showAlert('Tài khoản đã có trong giỏ hàng!', 'warning');
        return;
    }
    
    cart.push({
        id: account.id,
        game: account.game,
        rank: account.rank,
        server: account.server,
        price: account.price,
        image: account.image,
        description: account.description
    });
    
    saveData();
    updateCartCount();
    showAlert('Đã thêm vào giỏ hàng!', 'success');
    closeModal();
}

function removeFromCart(accountId) {
    cart = cart.filter(item => item.id !== accountId);
    saveData();
    updateCartCount();
    loadCart();
    showAlert('Đã xóa khỏi giỏ hàng!', 'success');
}

function clearCart() {
    if (cart.length === 0) {
        showAlert('Giỏ hàng đã trống!', 'warning');
        return;
    }
    
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
        cart = [];
        saveData();
        updateCartCount();
        loadCart();
        showAlert('Đã xóa tất cả sản phẩm khỏi giỏ hàng!', 'success');
    }
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

function loadCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <h3>Giỏ hàng trống</h3>
                <p>Hãy thêm một số tài khoản vào giỏ hàng của bạn</p>
                <button class="auth-btn" onclick="showSection('shop')">
                    <i class="fas fa-store"></i> Đi mua sắm
                </button>
            </div>
        `;
        cartTotal.textContent = '0 VNĐ';
        checkoutBtn.disabled = true;
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                ${item.image ? `<img src="${item.image}" alt="${item.game}">` : `<i class="fas fa-gamepad"></i>`}
            </div>
            <div class="cart-item-info">
                <div class="cart-item-game">${getGameName(item.game)}</div>
                <div class="cart-item-rank">${item.rank}</div>
                <div class="cart-item-server">Server: ${item.server}</div>
            </div>
            <div class="cart-item-price">${formatPrice(item.price)}</div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Xóa khỏi giỏ hàng">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    cartTotal.textContent = formatPrice(total);
    checkoutBtn.disabled = false;
}

function checkout() {
    if (cart.length === 0) {
        showAlert('Giỏ hàng trống!', 'error');
        return;
    }
    
    if (!currentUser) {
        showAlert('Vui lòng đăng nhập để thanh toán!', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const itemCount = cart.length;
    
    if (confirm(`Bạn có chắc muốn thanh toán ${itemCount} tài khoản với tổng giá ${formatPrice(total)}?`)) {
        // Mark accounts as sold
        cart.forEach(cartItem => {
            const account = accounts.find(a => a.id === cartItem.id);
            if (account) {
                account.status = 'sold';
                account.buyer = currentUser.username;
                account.soldAt = new Date().toISOString();
            }
        });
        
        // Clear cart
        cart = [];
        saveData();
        updateCartCount();
        loadCart();
        loadAccounts(); // Refresh shop to remove sold items
        
        showAlert(`Thanh toán thành công ${itemCount} tài khoản! Chúng tôi sẽ liên hệ với bạn sớm.`, 'success');
    }
}

// Donation Functions
function handleCardDonate(e) {
    e.preventDefault();
    
    const cardType = document.getElementById('cardType').value;
    const cardValue = document.getElementById('cardValue').value;
    const cardSerial = document.getElementById('cardSerial').value;
    const cardCode = document.getElementById('cardCode').value;
    
    if (!cardType || !cardValue || !cardSerial || !cardCode) {
        showAlert('Vui lòng điền đầy đủ thông tin thẻ cào!', 'error');
        return;
    }
    
    // Simulate card validation (in real app, this would call an API)
    if (cardSerial.length < 10 || cardCode.length < 10) {
        showAlert('Số serial và mã thẻ phải có ít nhất 10 ký tự!', 'error');
        return;
    }
    
    const donation = {
        id: Date.now(),
        type: 'card',
        method: cardType,
        amount: parseInt(cardValue),
        serial: cardSerial,
        code: cardCode,
        donor: currentUser ? currentUser.username : 'Ẩn danh',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    donations.push(donation);
    saveData();
    
    showAlert(`Cảm ơn bạn đã ủng hộ ${formatPrice(parseInt(cardValue))} bằng thẻ ${cardType}! Chúng tôi sẽ xử lý trong vòng 24h.`, 'success');
    document.getElementById('cardDonateForm').reset();
    loadDonors();
}

function handleBankDonate(e) {
    e.preventDefault();
    
    const bankMethod = document.getElementById('bankMethod').value;
    const donateAmount = document.getElementById('donateAmount').value;
    const transferNote = document.getElementById('transferNote').value;
    const donateNote = document.getElementById('donateNote').value;
    
    if (!bankMethod || !donateAmount || !transferNote) {
        showAlert('Vui lòng điền đầy đủ thông tin chuyển khoản!', 'error');
        return;
    }
    
    if (parseInt(donateAmount) < 10000) {
        showAlert('Số tiền ủng hộ tối thiểu là 10,000 VNĐ!', 'error');
        return;
    }
    
    const donation = {
        id: Date.now(),
        type: 'bank',
        method: bankMethod,
        amount: parseInt(donateAmount),
        transferNote: transferNote,
        note: donateNote,
        donor: currentUser ? currentUser.username : 'Ẩn danh',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    donations.push(donation);
    saveData();
    
    showAlert(`Cảm ơn bạn đã ủng hộ ${formatPrice(parseInt(donateAmount))} qua ${bankMethod}! Vui lòng chuyển khoản với nội dung: "${transferNote}"`, 'success');
    document.getElementById('bankDonateForm').reset();
    loadDonors();
}

function loadDonors() {
    const donorsList = document.getElementById('donorsList');
    const approvedDonations = donations.filter(d => d.status === 'approved');
    
    if (approvedDonations.length === 0) {
        donorsList.innerHTML = '<p style="text-align: center; color: #666;">Chưa có người ủng hộ nào.</p>';
        return;
    }
    
    // Sort by amount descending
    approvedDonations.sort((a, b) => b.amount - a.amount);
    
    donorsList.innerHTML = approvedDonations.map(donation => `
        <div class="donor-item">
            <div class="donor-name">${donation.donor}</div>
            <div class="donor-amount">${formatPrice(donation.amount)}</div>
            <div class="donor-date">${formatDate(donation.createdAt)}</div>
        </div>
    `).join('');
}

function saveData() {
    localStorage.setItem('gameShopUsers', JSON.stringify(users));
    localStorage.setItem('gameShopAccounts', JSON.stringify(accounts));
    localStorage.setItem('gameShopPendingAccounts', JSON.stringify(pendingAccounts));
    localStorage.setItem('gameShopCart', JSON.stringify(cart));
    localStorage.setItem('gameShopDonations', JSON.stringify(donations));
    if (currentUser) {
        localStorage.setItem('gameShopCurrentUser', JSON.stringify(currentUser));
    }
}

function loadSampleData() {
    // Create admin user if not exists
    if (!users.find(user => user.username === 'admin')) {
        users.push({
            id: 1,
            username: 'admin',
            email: 'admin@gameshop.com',
            password: 'admin123',
            isAdmin: true,
            createdAt: new Date().toISOString()
        });
    }
    
    // Add sample accounts if none exist
    if (accounts.length === 0) {
        const sampleAccounts = [
            {
                id: 1,
                game: 'lol',
                rank: 'Diamond IV',
                server: 'VN',
                price: 500000,
                description: 'Tài khoản League of Legends rank Diamond IV, có nhiều skin đẹp, chưa bị phạt bao giờ.',
                image: '',
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                game: 'valorant',
                rank: 'Immortal',
                server: 'Asia',
                price: 800000,
                description: 'Tài khoản Valorant rank Immortal, có nhiều skin súng đẹp, thống kê tốt.',
                image: '',
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                game: 'pubg',
                rank: 'Crown',
                server: 'Asia',
                price: 300000,
                description: 'Tài khoản PUBG rank Crown, có nhiều outfit và skin weapon hiếm.',
                image: '',
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            }
        ];
        
        accounts.push(...sampleAccounts);
    }
    
    // Add sample donations if none exist
    if (donations.length === 0) {
        const sampleDonations = [
            {
                id: 1,
                type: 'bank',
                method: 'momo',
                amount: 100000,
                donor: 'Nguyễn Văn A',
                status: 'approved',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 2,
                type: 'card',
                method: 'viettel',
                amount: 50000,
                donor: 'Trần Thị B',
                status: 'approved',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 3,
                type: 'bank',
                method: 'vietcombank',
                amount: 200000,
                donor: 'Lê Văn C',
                status: 'approved',
                createdAt: new Date().toISOString()
            }
        ];
        
        donations.push(...sampleDonations);
    }
    
    saveData();
}
