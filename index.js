var fs = require('fs');
var ejs = require('ejs');
var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
const path = require('path');

var client = mysql.createConnection({
    user: 'root',
    password: '1234',
    database: 'CoWorkLink'
});

// client.connect((err) => {
//     if (err) {
//       console.error('Error connecting: ' + err.stack);
//       return;
//     }
//     console.log('Connected as id ' + client.threadId);
// });

var app = express();
app.use(bodyParser.urlencoded({
    extended: false
}));

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

app.post('/create', function(req, res) {
    const projectName = req.body.projectName;
    const projectInfo = req.body.projectInfo;
    const deadline = req.body.deadline;

    const sql = 'INSERT INTO projects (projectName, projectInfo, deadline) VALUES (?, ?, ?)';
    
    client.query(sql, [projectName, projectInfo, deadline], function(error, results, fields) {
        if (error) {
            console.log(error);
            res.status(500).send('Error saving project information');
        } else {
            res.redirect('/pages/myProject.html'); // 프로젝트 정보 저장 후 홈페이지로 리다이렉트
        }
    });
});