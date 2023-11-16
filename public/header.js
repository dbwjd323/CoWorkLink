// header.js에서 updateUI 함수를 정의
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

// 페이지 로딩 시 로그인 상태 확인 및 UI 업데이트
document.addEventListener('DOMContentLoaded', function() {
    fetch('/getLoginStatus')
        .then(response => response.json())
        .then(data => {
            const isLoggedIn = data.isLoggedIn;
            updateUI(isLoggedIn);
        })
        .catch(error => console.error('로그인 상태를 가져오는 중 오류가 발생했습니다:', error));
});
