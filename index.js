var fs = require('fs');
var ejs = require('ejs');
var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
const path = require('path');

var client = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'CoWorkLink',
    multipleStatements: true
});

var app = express();
app.use(express.urlencoded({
    extended: false
}));
app.use(express.json());
// express-session 미들웨어 설정
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', ejs);
app.set('views', './views');
app.use("/public", express.static(path.join(__dirname,"public")));
app.use("/pages", express.static(path.join(__dirname,"pages")));

app.listen(3001, function(){
    console.log('Server running at http://127.0.0.1:3001');
});

// 라우트 실행
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/index.html'));
});

app.get('/join', function(req, res) {
    res.sendFile(path.join(__dirname, '/pages/join.html'));
});

app.post('/join', function(req, res) {
    var username = req.body.username;
    var userID = req.body.userID;   
    var password = req.body.password;
    var passwordConfirm = req.body.passwordConfirm;
    var email = req.body.email;

    if (password !== passwordConfirm) {
        return res.redirect('/join?error=비밀번호가 일치하지 않습니다. 다시 시도해주세요.&username=' + username + '&userID=' + userID + '&email=' + email);
    }

    // 비밀번호 확인이 일치할 경우에만 회원가입을 처리합니다.
    var sql = "INSERT INTO users (username, userID, password, passwordConfirm, email) VALUES (?, ?, ?, ?, ?)";
    client.query(sql, [username, userID, password, passwordConfirm, email], function(error, results, fields) {
        if (error) {
            console.log(error);
            res.send('회원가입에 실패했습니다.');
        } else {
            var alertMessage = "회원가입이 완료되었습니다!";
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.write('<script>alert("' + alertMessage + '");</script>');
            res.write('<script>window.location.href="/login";</script>');
            res.end();
        }
    });
}); 

app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname, '/pages/login.html'));
});

app.post('/login', (req, res) => {
    const userID = req.body.userID;
    const password = req.body.password;
  
    const sql = 'SELECT * FROM users WHERE userID = ? AND password = ?';
    client.query(sql, [userID, password], (error, results, fields) => {
        if (error) {
            res.send('에러가 발생했습니다.');
        } else {
            if (results.length > 0) {
                req.session.userID = userID;
                req.session.isLoggedIn = true;
                res.redirect('/');
            } else {
                var alertMessage = "아이디 또는 비밀번호가 맞지 않습니다";
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.write('<script>alert("' + alertMessage + '");</script>');
                res.write('<script>window.location.href="/login";</script>');
                res.end();
            }
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.isLoggedIn = false; 
    res.redirect('/'); 
});

// 클라이언트로 로그인 상태를 JSON 형식으로 응답합니다.
app.get('/getLoginStatus', (req, res) => {
    res.json({ isLoggedIn: req.session.isLoggedIn });
});

app.get('/create', function(req, res){
    if (!req.session.isLoggedIn) {
        res.redirect('/login');
        return;
    } else {
        res.sendFile(path.join(__dirname, '/pages/create.html'))
    }
});
app.post('/create', (req, res) => {
    console.log('클라이언트 요청 수신:', req.body);
    const { projectName, projectInfo, invitedUserIDs, deadline } = req.body;
    const invitedUserIDsArray = Array.isArray(invitedUserIDs) ? invitedUserIDs : [invitedUserIDs];
    
    if (invitedUserIDsArray.length > 0) {
        const checkUsersQuery = 'SELECT * FROM users WHERE userID IN (?)';
        client.query(checkUsersQuery, [invitedUserIDsArray], (checkUsersErr, checkUsersResults) => {
            if (checkUsersErr) {
                console.error('사용자 확인 오류:', checkUsersErr);
                res.status(500).send('내부 서버 오류');
                return;
            }

            // 존재하지 않는 사용자 ID 필터링
            const nonExistingUserIDs = invitedUserIDsArray.filter(userID => !checkUsersResults.map(user => (user.userID || '')).includes(userID));

            if (nonExistingUserIDs.length > 0) {
            const alertMessage = `존재하지 않는 사용자 ID가 포함되어 있습니다. 다시 확인하세요: ${nonExistingUserIDs.join(', ')}`;
            res.status(400).json({ message: alertMessage, nonExistingUserIDs });
            return;
            }

            // 존재하는 사용자들에 대한 처리
            // 프로젝트 생성 로직 실행
            const projectQuery = 'INSERT INTO projects (projectName, projectInfo, deadline, userID) VALUES (?, ?, ?, ?)';
            client.query(projectQuery, [projectName, projectInfo, deadline, req.session.userID], (projectErr, projectResult) => {
                if (projectErr) {
                    console.error('프로젝트 데이터 삽입 오류:', projectErr);
                    res.status(500).send('내부 서버 오류');
                    return;
                }

                const projectId = projectResult.insertId;

                // 초대 데이터 삽입 처리
                const invitationsQuery = 'INSERT INTO invitations (projectID, userID) VALUES ?';
                const values = invitedUserIDsArray.map(userID => [projectId, userID]);

                client.query(invitationsQuery, [values], (invitationErr) => {
                    if (invitationErr) {
                        console.error('초대 데이터 삽입 오류:', invitationErr);
                    }

                    const alertMessage = "프로젝트가 성공적으로 생성되었습니다.";
                    res.status(200).json({ success: true, message: alertMessage, projectId });
                });

            });
        });
    }
});

app.get('/myProject', function(req, res){
    if (!req.session.isLoggedIn) {
        res.redirect('/login');
        return;
    } else {
        res.sendFile(path.join(__dirname, '/pages/myProject.html'))
    }
});

// 프로젝트 목록을 가져오는 엔드포인트 -- myProject.html
app.get('/getProjects', (req, res) => {
    // 세션에서 사용자 아이디를 가져옴 (세션에서 사용자 아이디를 저장하는 방법에 따라 다를 수 있음)
    const userID = req.session.userID;

    // 사용자 아이디를 기반으로 해당 사용자의 프로젝트 목록을 데이터베이스에서 가져오는 쿼리를 실행
    const getProjectsQuery = 'SELECT * FROM projects WHERE userID = ? GROUP BY projectID';

    client.query(getProjectsQuery, [userID], (error, results) => {
        if (error) {
            console.error('프로젝트 목록을 가져오는 중 오류 발생:', error);
            res.status(500).json({ error: '내부 서버 오류' });
        } else {
            // 성공적으로 가져온 경우, JSON 형태로 클라이언트에 응답
            res.json(results);
        }
    });
});

app.get('/projectPage', (req, res) => {
    if (!req.session.isLoggedIn) {
        res.redirect('/login');
        return;
    } else {
        const projectID = req.query.projectID;

        client.query(`SELECT projectName, projectInfo, deadline FROM projects WHERE projectID = ?`, [projectID], (error, projectInfo) => {
            if (error) {
                console.error('프로젝트 정보를 가져오는 중 오류 발생:', error);
                res.status(500).json({ error: '내부 서버 오류' });
            } else {
                res.sendFile(path.join(__dirname, '/pages/projectPage.html'))
            }
        });
    }
});
//프로젝트 정보 가져오기
app.get('/getProjectInfo', (req, res) => {
    const projectID = req.query.projectID;

    client.query(`SELECT projectName, projectInfo, deadline FROM projects WHERE projectID = ?`, [projectID], (error, results) => {
        if (error) {
            console.error('프로젝트 정보를 가져오는 중 오류 발생:', error);
            res.status(500).json({ error: '내부 서버 오류', message: error.message });
        } else {
            if (results.length === 0) {
                console.error('프로젝트를 찾을 수 없습니다. ID:', projectID);
                res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
            } else {
                const projectInfo = results[0]; // 결과에서 첫 번째 프로젝트 정보를 가져옴
                res.json(projectInfo);
            }
        }
    });
});

// 프로젝트에 해당하는 초대된 팀원 정보 가져오기
app.get('/getTeammates', (req, res) => {
    const projectID = req.query.projectID;
    const getTeammatesQuery = 'SELECT users.userID FROM users INNER JOIN invitations ON users.userID = invitations.userID WHERE invitations.projectID = ?';

    client.query(getTeammatesQuery, [projectID], (error, results) => {
        if (error) {
            console.error('팀원 정보를 가져오는 중 오류 발생:', error);
            res.status(500).json({ error: '내부 서버 오류' });
        } else {
            // 사용자 ID를 배열로 추출
            const teammateUserIDs = results.map(result => result.userID);

            // 배열을 한 줄씩 띄워서 클라이언트에 응답
            const formattedTeammates = teammateUserIDs.join('\n');
            res.send(formattedTeammates);
        }
    });
});

//프로젝트 페이지 프로젝트 정보 수정
app.post('/editProjectInfo', (req, res) => {
    const { projectId, projectName, projectInfo, deadline } = req.body;

    const updateProjectQuery = 'UPDATE projects SET projectName=?, projectInfo=?, deadline=? WHERE projectID=?';

    client.query(updateProjectQuery, [projectName, projectInfo, deadline, projectId], (error, results) => {
        if (error) {
            console.error('프로젝트 정보 수정 중 오류 발생:', error);
            res.status(500).json({ success: false, error: '내부 서버 오류', message: error.message });
        } else {
            // 수정이 성공적으로 이루어졌을 때 응답
            res.json({ success: true });
        }
    });
});
//팀원 삭제
app.delete('/deleteTeammate', (req, res) => {
    const { projectID, teammateID } = req.query; // req.query를 사용하여 쿼리 매개변수를 추출합니다.
    console.log('Request to delete teammate. Project ID:', projectID, 'Teammate ID:', teammateID);
    
    const deleteTeammateQuery = 'DELETE FROM invitations WHERE projectID = ? AND userID = ?';
    
    client.query(deleteTeammateQuery, [projectID, teammateID], (error, results) => {
        if (error) {
            console.error('팀원 삭제 중 오류 발생:', error);
            res.status(500).json({ success: false, error: '내부 서버 오류', message: error.message });
        } else {
            res.json({ success: true });
        }
    });
});

app.use((req, res, next) => {
    console.log('Received request:', req.method, req.url);
    next();
});

// 해당 프로젝트에 초대된 사용자 목록 가져오기
app.get('/getUsersForTask', (req, res) => {
    const projectID = req.query.projectID;
    const getUsersForTaskQuery = 'SELECT users.userID, users.username FROM users INNER JOIN invitations ON users.userID = invitations.userID WHERE invitations.projectID = ?';

    client.query(getUsersForTaskQuery, [projectID], (error, results) => {
        if (error) {
            console.error('프로젝트에 초대된 사용자 목록을 가져오는 중 오류 발생:', error);
            res.status(500).json({ error: '내부 서버 오류' });
        } else {
            // 성공적으로 가져온 경우, JSON 형태로 클라이언트에 응답
            res.json(results);
        }
    });
});
/// 작업 목록 가져오기
app.get('/getTasks', (req, res) => {
    const projectId = req.query.projectID; // 프로젝트 ID는 쿼리 파라미터로 전달됩니다.
  
    if (!projectId) {
      return res.status(400).json({ success: false, error: '프로젝트 ID가 제공되지 않았습니다.' });
    }
  
    const getTasksQuery = `
      SELECT taskID, taskName, assignedTo, taskStatus
      FROM tasks
      WHERE projectID = ?
    `;
  
    client.query(getTasksQuery, [projectId], (error, results) => {
      if (error) {
        console.error('작업 목록을 불러오는 중 오류 발생:', error);
        return res.status(500).json({ success: false, error: '내부 서버 오류', message: error.message });
      }
  
      const tasks = results.map(task => ({
        taskID: task.taskID,
        taskName: task.taskName,
        assignedTo: task.assignedTo,
        taskStatus: task.taskStatus,
      }));
  
      res.json({ success: true, tasks });
    });
});

  //작업 추가 
  app.post('/addTask', (req, res) => {
    const { projectID, taskName, assignedTo, taskStatus } = req.body;

    const insertQuery = 'INSERT INTO tasks (projectID, taskName, assignedTo, taskStatus) VALUES (?, ?, ?, ?)';
    const values = [projectID, taskName, assignedTo, taskStatus];
    // 응답
    client.query(insertQuery, values, (err, result) => {
        if (err) {
            console.error('작업 추가 중 오류:', err);
            res.status(500).send('작업 추가 중 오류가 발생했습니다.');
            return;
        }

        console.log('작업이 성공적으로 추가되었습니다.');
        res.status(200).send('작업이 성공적으로 추가되었습니다.');
    });
});

app.get('/getTaskDetails', (req, res) => {
    const taskID = req.query.taskID;
    console.log(taskID);
    const projectID = req.query.projectID;

    const taskDetailsQuery = 'SELECT taskName, taskStatus, assignedTo FROM tasks WHERE taskID = ? AND projectID = ?';
    client.query(taskDetailsQuery, [taskID, projectID], (error, results, fields) => {
        if (error) {
            console.error('작업 상세 정보를 가져오는 중 오류 발생:', error);
            res.status(500).json({ error: '내부 서버 오류' });
        } else {
            // 성공적으로 가져온 경우, JSON 형태로 클라이언트에 응답
            if (results.length > 0) {
                res.json(results[0]); // 결과가 배열이므로 첫 번째 요소를 전송
            } else {
                res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
            }
        }
    });
});

app.post('/saveTask', (req, res) => {
    const {taskID, projectID, taskName, taskStatus, assignedTo} = req.body;
console.log(taskID);
console.log(projectID);
    if (!taskID || !projectID || !taskName || !taskStatus || !assignedTo) {
        return res.status(400).json({ success: false, error: '잘못된 요청입니다. 필수 필드가 누락되었습니다.' });
    }

    const saveTaskQuery = 'UPDATE tasks SET taskName=?, taskStatus=?, assignedTo=? WHERE  taskID = ? AND projectID = ?';
    client.query(saveTaskQuery, [taskName, taskStatus, assignedTo, taskID, projectID], (error, results) => {
        if (error) {
            console.error('작업 수정 중 오류 발생: ', error);
            res.status(500).json({ success: false, error: '내부 서버 오류', message: error.message });
        } else {
            res.json({ success: true });
        }
    });
});
