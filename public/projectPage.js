// fetch the template content for header
fetch('/public/header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
    });

fetch('/public/navigation.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navigation-placeholder').innerHTML = data;
    });

fetch('/public/footer.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer-placeholder').innerHTML = data;
    });

let projectData;

// 프로젝트 정보 가져오기
function fetchProjectInfo(projectId) {
    return fetch(`/getProjectInfo?projectID=${projectId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('서버 응답이 올바르지 않습니다.');
            }
            return response.json();
        });
}

// 프로젝트 정보 표시
function displayProjectInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectID');

    fetchProjectInfo(projectId)
        .then(data => {
            projectData = data;
            document.getElementById('projectName').textContent = projectData.projectName;
            document.getElementById('projectInfoText').textContent = projectData.projectInfo;
            const fullDeadline = new Date(projectData.deadline);
            const formattedDeadline = fullDeadline.toLocaleDateString();
            document.getElementById('deadline').textContent = formattedDeadline;

            return fetchProjectInfo(projectId);  // 중복된 fetch 부분을 하나로 합칩니다.
        })
        .then(data => {
            // 프로젝트 정보 표시
            document.getElementById('projectName').textContent = data.projectName;
            document.getElementById('projectInfoText').textContent = data.projectInfo;
            const fullDeadline = new Date(data.deadline);
            const formattedDeadline = fullDeadline.toLocaleDateString();
            document.getElementById('deadline').textContent = formattedDeadline;

            // 팀원 정보 가져오기
            fetch(`/getTeammates?projectID=${projectId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('서버 응답이 올바르지 않습니다.');
                    }
                    return response.text();
                })
                .then(teammates => {
                    const teammateElement = document.getElementById('teammate');
                    const teammatesArray = teammates.split('\n');
                    teammateElement.innerHTML = teammatesArray.join('<br>');
                })
                .catch(error => console.error('팀원 정보를 가져오는 중 오류 발생:', error.message));
        })
        .catch(error => console.error('프로젝트 정보를 가져오는 중 오류 발생:', error.message));
}

// 팝업 열기
function openPopup(popupId) {
    document.querySelector(popupId).style.display = 'block';
}

// 팝업 닫기
function closePopup(popupId) {
    document.querySelector(popupId).style.display = 'none';
}

// 수정 팝업 열기
function openEditProjectPopup() {
    // 수정 팝업을 열 때 전역 변수에서 프로젝트 정보를 가져와서 필드에 채웁니다.
    if (!projectData) {
        console.error('프로젝트 ID가 정의되지 않았습니다.');
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectID');
    const projectName = projectData.projectName;
    const projectInfo = projectData.projectInfo;
    const fullDeadline = new Date(projectData.deadline);
    const year = fullDeadline.getFullYear();
    const month = String(fullDeadline.getMonth() + 1).padStart(2, '0');
    const day = String(fullDeadline.getDate()).padStart(2, '0');
    const deadline = `${year}-${month}-${day}`;

    document.getElementById('editProjectName').value = projectName;
    document.getElementById('editProjectInfo').value = projectInfo;
    document.getElementById('editDeadline').value = deadline;

    fetch(`/getTeammates?projectID=${projectId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('서버 응답이 올바르지 않습니다.');
      }
      return response.text();
    })
    .then(teammates => {
      const teammateElement = document.getElementById('teammateList');
      const teammatesArray = teammates.split('\n');
      teammatesArray.forEach((teammate) => {
        teammateElement.innerHTML += `<li><span>${teammate}</span><button class="delete-btn" onclick="deleteTeammate('${teammate}')">삭제</button></li>`;
      });

      // 팀원 아이디를 전역 변수에 저장합니다.
      window.projectTeammates = teammatesArray;
    })
    .catch(error => console.error('팀원 정보를 가져오는 중 오류 발생:', error.message));

    // 수정 팝업을 나타나도록 설정
    document.getElementById('edit_project_pop').style.display = 'block';
}
function deleteTeammate(teammateId) {
    if (!window.projectTeammates.includes(teammateId)) {
        return;
     }
    
     window.projectTeammates.splice(window.projectTeammates.indexOf(teammateId), 1);
    
     // 팀원 목록을 업데이트합니다.
     const teammateElement = document.getElementById('teammateList');
     teammateElement.innerHTML = window.projectTeammates.map((teammate) => `<li><span>${teammate}</span><button class="delete-btn" onclick="deleteTeammate('${teammate}')">삭제</button></li>`).join('');
    
     // 팀원 정보를 서버에 전송합니다.
     const urlParams = new URLSearchParams(window.location.search);
     const projectId = urlParams.get('projectID');
     fetch(`/deleteTeammate?projectID=${projectId}&teammateID=${teammateId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
    if (response.status === 200) {
        alert('팀원을 성공적으로 삭제했습니다.');
    } else {
        console.error('서버에서 오류 응답:', response.status, response.statusText);
    }
    })
    .catch(error => {
        console.error('팀원 삭제 중 오류 발생:', error.message);
    });
}
 
    
// 수정 팝업 닫기
function closeEditProjectPopup() {
    const editProjectForm = document.getElementById('editProjectForm');
    if (editProjectForm) {
        editProjectForm.reset();
    }
    closePopup('#edit_project_pop');  // 아이디 전달 수정
}

//수정 내용 업데이트
function saveProject() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectID');
    const projectName = document.getElementById('editProjectName').value;
    const projectInfo = document.getElementById('editProjectInfo').value;
    const deadline = document.getElementById('editDeadline').value;
  
    const projectData = {
      projectId,
      projectName,
      projectInfo,
      deadline,
    };
  console.log(projectData);
    fetch('/editProjectInfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    })
      .then(response => {
        if (response.status === 200) {
            alert('프로젝트 정보를 성공적으로 저장했습니다.');
            closeEditProjectPopup();
            updatePageContent();
        } else {
          console.error('프로젝트 정보를 저장하는 중 오류가 발생했습니다.');
        }
      })
      .catch(error => {
        console.error('프로젝트 정보를 저장하는 중 오류가 발생했습니다.', error.message);
      });
  }
  
  function updatePageContent() {
    displayProjectInfo();
}