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

client.connect((err) => {
    if (err) {
      console.error('Error connecting: ' + err.stack);
      return;
    }
    console.log('Connected as id ' + client.threadId);
  });

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

app.use("/public", express.static(path.join(__dirname,"public")));
app.use("/pages", express.static(path.join(__dirname,"pages")));


app.listen(3001, function(){
    console.log('Server running at http://127.0.0.1:3001');
});

//라우트 실행
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
        // 비밀번호가 일치하지 않을 경우 에러 메시지와 함께 다시 회원가입 페이지로 리다이렉트합니다.
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
            // Display the alert message and then redirect to the login page
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.write('<script>alert("' + alertMessage + '");</script>');
            res.write('<script>window.location.href="/login";</script>');
            res.end();
        }
    });
});

app.get('/login', function(req, res) {
    // 로그인 페이지에 접속할 때 세션을 확인하여 로그인 상태를 파악합니다.
    if (req.session.isLoggedIn) {
        res.redirect('/pages/index.html'); // 이미 로그인되어 있다면 인덱스 페이지로 이동합니다.
    } else {
        res.sendFile(path.join(__dirname, '/pages/login.html')); // 그렇지 않으면 로그인 페이지를 렌더링합니다.
    }
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
                res.redirect('/pages/index.html');
            } else {
                res.send('아이디 또는 비밀번호가 맞지 않습니다');
            }
        }
    });
});

// 클라이언트로부터 로그아웃 요청을 받아 로그아웃 처리를 합니다.
app.get('/logout', (req, res) => {
    req.session.isLoggedIn = false; // 로그아웃 시 세션에서 로그인 상태를 false로 변경합니다.
    res.redirect('/'); // 로그아웃 후 홈페이지로 리다이렉트합니다.
});

// 클라이언트로 로그인 상태를 JSON 형식으로 응답합니다.
app.get('/getLoginStatus', (req, res) => {
    res.json({ isLoggedIn: req.session.isLoggedIn });
});
