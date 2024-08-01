document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (username === 'admin' && password === 'password') {
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = '../index.html';
            } else {
                alert('Invalid credentials. Please try again.');
            }
        });
    }
});

function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'html/login.html';
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'html/login.html';
}