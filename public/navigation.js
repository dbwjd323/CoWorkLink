const createProjectButton = document.getElementById('create-project-button');

createProjectButton.addEventListener('click', function (e) {
    e.preventDefault();

    // AJAX를 사용하여 세션 상태 확인
    fetch('/getLoginStatus')
        .then(response => response.json())
        .then(data => {
            if (data.isLoggedIn) {
                // 로그인된 경우
                window.location.href = '/create';
            } else {
                // 로그인되지 않은 경우
                window.location.href = '/login';
            }
        })
        .catch(error => console.error('세션 상태를 가져오는 중 오류가 발생했습니다:', error));
});
