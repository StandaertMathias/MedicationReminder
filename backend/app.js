var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var mysql = require('mysql');
var session = require('express-session');
var bcrypt = require('bcrypt');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    database: "medication_reminder",
    user: "mathias",
    password: "MobileWebApp"
});
var sessionConfig = {
    key: 'MedicationCookie',
    secret: 'MobileWebAppSecret',
    loggedIn: false
};

connection.connect();
var Q = {
    allDrugs: "SELECT * FROM drug;",
    insertUser: "INSERT INTO user(firstname, lastname, email, birthday, password) values(?,?,?,?,?)",
    getUser: "SELECT password FROM user WHERE email=?",
    getUserId: "SELECT user_id FROM user WHERE email=?",
    getDrugId: "SELECT drug_id FROM drug WHERE name=?",
    getDrugByUser: "SELECT * FROM user_drug ud join drug d on ud.drug_id = d.drug_id where ud.user_id=?",
    addDrugForUser: "INSERT INTO user_drug(user_id,drug_id, dosis) VALUES(?,?,?)"
};

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use(session(sessionConfig));

app.get("/index",function (req,res) {
    loggedIn(req,res,function () {
        res.render("index.ejs", {});
    });
});
app.get("/newmedication",function (req,res) {
    loggedIn(req,res,function () {
        connection.query(Q.getUserId,[req.session.user], function (err, result) {
            connection.query(Q.allDrugs, function (err, result) {
                res.render("newmedication.ejs", {
                    drugs: result
                });
            });
        });
    });
});
app.post("/addUser", function (req,res) {
    var email = req.body.email;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var password = req.body.password;
    var password2 = req.body.password2;
    var birthday = req.body.birthday;
    if(password === password2){
        //todo encrypt password
        //add to database
        connection.query(Q.insertUser,[firstname,lastname,email,birthday,password], function (err, result) {
        });
        req.session.loggedIn = true;
        req.session.user = email;
        res.render("index.ejs", {});
    }
});
app.post("/getUser",function (req,res) {
    var email = req.body.email;
    var password = req.body.password;
    connection.query(Q.getUser,[email], function (err, result) {
        if(result[0].password === password){
            req.session.loggedIn = true;
            req.session.user = email;
            res.render("index.ejs", {});
        }else{
            //todo afhandelen fout wachtwoord
            res.render("management.ejs", {});
        }
    });
});
app.get("/management", function (req, res) {
    connection.query(Q.getUserId,[req.session.user], function (err, result) {
        connection.query(Q.getDrugByUser,[result[0].user_id], function (err, result) {
            res.render("management.ejs", {
                drugs: result
            });
        });
    });
});

app.post("/addMedication",function (req,res) {
    var name = req.body.name;
    var dose = req.body.dose;
    var unit = req.body.unit;

    connection.query(Q.getUserId,[req.session.user], function (err, result) {
        var userid = result[0].user_id;
        connection.query(Q.getDrugId,[name],function (err,result) {
            connection.query(Q.addDrugForUser,[userid,result[0].drug_id, dose + ' ' +unit], function (err, result) {
                console.log(err);
                connection.query(Q.getDrugByUser,[userid], function (err, result) {
                    res.render("management.ejs", {
                        drugs: result
                    });
                });
            });
        });

    });
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

//functions
function loggedIn(req,res,next) {
    var loggedIn = req.session.loggedIn;
    if (loggedIn) {
        next();
    }else{
        res.render("account.ejs", {});
    }
}