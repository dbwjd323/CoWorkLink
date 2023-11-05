var fs = require('fs');
var ejs = require('ejs');
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
const path = require('path');

var client = mysql.createConnection({
    user: 'root',
    password: '1234',
    database: 'CoWorkLink'
});

var app = express();
app.use(bodyParser.urlencoded({
    extended: false
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

  app.get('/pages/login.html', function(req, res) {
    res.sendFile(path.join(__dirname, '/pages/login.html'));
});

