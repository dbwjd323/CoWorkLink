function redirectToHome() {
    window.location.href = "/pages/index.html";
}

// 페이지 로딩 시 로그인 상태 확인
document.addEventListener('DOMContentLoaded', function() {
    fetch('/getLoginStatus')
        .then(response => response.json())
        .then(data => {
            const isLoggedIn = data.isLoggedIn;
            updateUI(isLoggedIn); // updateUI 함수를 호출하여 UI를 업데이트합니다.
        })
        .catch(error => console.error('로그인 상태를 가져오는 중 오류가 발생했습니다:', error));
});

function updateUI(isLoggedIn) {
    const loginLink = document.getElementById('login-link');
    const joinLink = document.getElementById('join-link');
    const logoutLink = document.getElementById('logoutLink');

    if (isLoggedIn) {
        loginLink.style.display = 'none';
        joinLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        loginLink.style.display = 'block';
        joinLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}