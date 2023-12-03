// fetch the template content for header
fetch('/public/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            return fetch('/getLoginStatus');
        })
        .then(response => response.json())
        .then(data => {
            const isLoggedIn = data.isLoggedIn;
            updateUI(isLoggedIn);
        })
        .catch(error => console.error('로그인 상태를 가져오는 중 오류가 발생했습니다:', error));

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
            return response.text(); // JSON 대신 텍스트로 받음
        })
        .then(data => {
            if (!data) {
                console.warn('서버에서 비어있는 응답을 받았습니다.');
                return {};
            }
            try {
                return JSON.parse(data); // 텍스트를 JSON으로 파싱
            } catch (error) {
                throw new Error('JSON 파싱 중 오류 발생: ' + error.message);
            }
        });
}

// 프로젝트 정보 표시
function displayProjectInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectID');
    fetchProjectInfo(projectId)
        .then(data => {
            if (Object.keys(data).length === 0) {
                console.warn('프로젝트 정보가 비어있습니다.');
                return;
            }

            projectData = data;
            document.getElementById('projectName').textContent = projectData.projectName;
            document.getElementById('projectInfoText').textContent = projectData.projectInfo;
            const fullDeadline = new Date(projectData.deadline);
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
            
            //작업 목록 표시
            displayTasks(projectId);
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
    document.getElementById('teammateList').innerHTML = '';

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
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>${teammate}</span><button class="delete-btn" onclick="deleteTeammate('${teammate}')">삭제</button>`;
        document.getElementById('teammateList').appendChild(listItem);
    });

      // 팀원 아이디를 전역 변수에 저장합니다.
      window.projectTeammates = teammatesArray;
    })
    .catch(error => console.error('팀원 정보를 가져오는 중 오류 발생:', error.message));

    // 수정 팝업을 나타나도록 설정
    document.getElementById('edit_project_pop').style.display = 'block';
}

function deleteTeammate(teammateId) {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectID');
    
    if (!window.projectTeammates.includes(teammateId)) {
        return;
    }
    
    window.projectTeammates.splice(window.projectTeammates.indexOf(teammateId), 1);

    // 팀원 목록을 업데이트하고 정보를 서버에 전송
    const teammateElement = document.getElementById('teammateList');
    teammateElement.innerHTML = window.projectTeammates.map((teammate) => `<li><span>${teammate}</span><button class="delete-btn" onclick="deleteTeammate('${teammate}')">삭제</button></li>`).join('');
    
    // 팀원 정보를 서버에 전송
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
    // 수정 팝업을 닫을 때 URL에서 #edit_project_pop를 제거
    history.pushState("", document.title, window.location.pathname + window.location.search);

    closePopup('#edit_project_pop');  // 아이디 전달 수정
}

// 수정 내용 업데이트
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
const projectId = new URLSearchParams(window.location.search).get('projectID');
  displayProjectInfo(projectId);}
//-----------------------------------------------------------------------------------------------------------------------------------//
// 작업 추가 팝업 열기
function toggleAddTaskPopup() {
    const addTaskPopup = document.getElementById('addTaskPopup');
    if (addTaskPopup.style.display === 'none') {
        // 프로젝트 ID를 설정해줘야 함
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('projectID');
        console.log("Project ID:", projectId);

        // 사용자 목록을 먼저 불러오기
        loadUsersForTask(projectId)
            .then(() => {
                // 팝업 열기
                if (projectId) {
                    addTaskPopup.style.display = 'block';
                    // 작업 목록을 업데이트합니다.
                    displayTasks(projectId);
                } else {
                    alert('프로젝트 ID가 없습니다.');
                }
            })
            .catch(error => {
                console.error('사용자 목록을 불러오는 중 오류 발생:', error.message);
            });
    } else {
        addTaskPopup.style.display = 'none';
    }
}

// 작업 추가 함수
function addTask() {
    // assignedTo 드롭다운 메뉴에서 사용자 ID 가져오기
    const assignedTo = document.getElementById('assignedTo').value;
   // 프로젝트 ID 가져오기
   const projectId = window.location.search.substring(1).split('&')[0].split('=')[1];
  
    // loadUsersForTask() 함수를 호출하여 사용자 목록을 가져옴
    loadUsersForTask(projectId);
  
    // 나머지 작업 정보 가져오기
    const taskName = document.getElementById('taskName').value;
    const taskStatus = document.getElementById('taskStatus').value;
  
    if (taskName.trim() === '' || assignedTo.trim() === '' || taskStatus.trim() === '') {
        alert('모든 필수 항목을 입력하세요.');
        return; // 필수 입력 필드가 비어 있으면 함수를 종료합니다.
    }
    // 작업 추가
    fetch(`/addTask?projectID=${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectID: projectId,
        taskName: taskName,
        assignedTo: assignedTo,
        taskStatus: taskStatus,
      }),
    })
    .then(response => {
      if (response.status === 200) {
        alert('작업을 성공적으로 추가했습니다.');
        closePopup('#addTaskPopup');
        displayTasks(projectId);
      } else {
        console.error('작업을 추가하는 중 오류가 발생했습니다.', response.error);
        alert(`작업 추가 중 오류: ${response.error}`);
      }
    })
    .catch(error => {
      console.error('작업 추가 중 오류 발생:', error.message);
    });
  }  


// 작업 관리 팝업이 열릴 때 사용자 목록을 서버에서 가져와 옵션으로 추가하는 함수
function loadUsersForTask(projectId) {
    const assignedToSelect = document.getElementById('assignedTo');
    // const projectId = window.location.search.substring(1).split('&')[0].split('=')[1];

    return fetch(`/getUsersForTask?projectID=${projectId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('서버 응답이 올바르지 않습니다.');
            }
            return response.json(); // JSON 데이터로 파싱
        })
        .then(users => {
            assignedToSelect.innerHTML = '';

            // 서버에서 받은 사용자 목록을 옵션으로 추가
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.userID;
                option.textContent = user.username;
                assignedToSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('사용자 목록을 불러오는 중 오류 발생:', error.message);
            throw error; // Promise 체인에서 오류를 전파합니다.
        });
}


// 작업 리스트 가져오기
function displayTasks(projectId) {
    const TaskListContainer = document.querySelector('.list-box-container');
    TaskListContainer.innerHTML = '';

    fetch(`/getTasks?projectID=${projectId}`)
        .then(response => response.json())
        .then(data => {
            data.tasks.forEach(task => {
                const taskBox = document.createElement('div');
                taskBox.classList.add('list-box');
                taskBox.setAttribute('data-task-id', task.taskID);
                taskBox.setAttribute('data-project-id', projectId);

                const taskNameConditionContainer = document.createElement('div');
                taskNameConditionContainer.classList.add('taskname-condition');

                const taskNameElement = document.createElement('h4');
                taskNameElement.classList.add('task-title');
                taskNameElement.textContent = task.taskName;

                const conditionElement = document.createElement('span');
                conditionElement.classList.add('condition');
                conditionElement.textContent = task.taskStatus;

                const assignElement = document.createElement('span');
                assignElement.classList.add('assignedTo');
                assignElement.textContent = task.assignedTo;

                taskNameConditionContainer.appendChild(taskNameElement);
                taskNameConditionContainer.appendChild(conditionElement);

                taskBox.appendChild(taskNameConditionContainer);
                taskBox.appendChild(assignElement);

                // 기존 목록 맨 위에 새 작업 추가
                TaskListContainer.appendChild(taskBox);

                taskBox.addEventListener('click', () => openEditTaskPopup(task.taskID, projectId));
                
            });
        })
        .catch(error => console.error('작업 목록을 가져오는 중 오류 발생:', error));
}

// 작업 수정 팝업 열기
function openEditTaskPopup(taskID, projectID) {
    // 작업에 할당될 사용자 목록을 불러옵니다.
    loadUsersForTask2(projectID);

    // 작업 상세 정보를 가져옵니다.
    fetch(`/getTaskDetails?taskID=${taskID}&projectID=${projectID}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`서버 응답이 올바르지 않습니다. (${response.status} ${response.statusText})`);
            }
            return response.json();
        })
        .then(taskDetails => {
            // 작업 수정 팝업의 필드를 작업 상세 정보로 채웁니다.
            document.getElementById('editTaskName').value = taskDetails.taskName;
            document.getElementById('editTaskStatus').value = taskDetails.taskStatus;
            document.getElementById('editAssignedTo').value = taskDetails.assignedTo; // 새로운 코드

            // 수정 작업 팝업을 화면에 표시합니다.
            openPopup('#edit-task-popup');
            // 수정 팝업에서 저장 버튼을 클릭할 때 saveTask 함수 호출
            document.getElementById('editButton').addEventListener('click', () => {
                // taskID와 projectID를 전달하여 saveTask 함수 호출
                saveTask(taskID, projectID);
            });
            
        })
        .catch(error => console.error('작업 정보를 가져오는 중 오류 발생:', error.message));
}

// 작업에 할당될 사용자 목록을 불러와서 assignedTo 드롭다운을 업데이트하는 함수
function loadUsersForTask2(projectID) {
    const assignedToSelect = document.getElementById('editAssignedTo');

    fetch(`/getUsersForTask?projectID=${projectID}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('서버 응답이 올바르지 않습니다.');
            }
            return response.json();
        })
        .then(users => {
            assignedToSelect.innerHTML = '';

            // 각 사용자에 대한 옵션을 추가합니다.
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.userID;
                option.textContent = user.username;
                assignedToSelect.appendChild(option);
            });
        })
        .catch(error => console.error('사용자 목록을 불러오는 중 오류 발생:', error.message));
}

function saveTask(taskID, projectID) {
    // 수정된 작업 정보를 가져오기
    const editedTaskName = document.getElementById('editTaskName').value;
    const editedTaskStatus = document.getElementById('editTaskStatus').value;
    const editedAssignedTo = document.getElementById('editAssignedTo').value;
  
    // 서버에 수정된 작업 정보 보내기
    fetch('/saveTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskID: taskID,
        projectID: projectID,
        taskName: editedTaskName,
        taskStatus: editedTaskStatus,
        assignedTo: editedAssignedTo,
      }),
    })
    .then(response => {
      if (response.status === 200) {
        // 작업이 성공적으로 수정되었습니다.
        return response.json();
      } else {
        throw new Error('서버 응답이 올바르지 않습니다.');
      }
    })
    .then(result => {
      if (result.success) {
        // 작업이 성공적으로 수정되었을 때만 알람창을 띄웁니다.
        console.log('작업이 성공적으로 수정되었습니다.');
        alert('작업이 성공적으로 수정되었습니다.');
        closePopup('#edit-task-popup');
  
        displayTasks(projectID);
      } else {
        console.error('작업을 저장하는 중 오류가 발생했습니다.', result.error);
        alert(`작업 저장 중 오류: ${result.error}`);
      }
    })
    .catch(error => console.error('작업을 저장하는 중 오류 발생:', error.message));
  }
  

