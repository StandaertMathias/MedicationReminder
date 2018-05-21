const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const index = require('./routes/index');

const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const HTTPS = require('https');
const fs = require('fs');

const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();

var io = require("socket.io");
var socket = io();


const db_config = {
    host: "localhost",
    port: 3306,
    database: "medication_reminder",   //locaal testen: remedi1q_ weglaten
    user: "mathias",                   //locaal testen: remedi1q_ weglaten
    password: "MobileWebApp"
};

const sessionConfig = {
    key: 'MedicationCookie',
    secret: 'MobileWebAppSecret',
    loggedIn: false,
    resave: true,
    saveUninitialized: true
};

const options = {
    key: fs.readFileSync('agent2-key.pem'),
    cert: fs.readFileSync('agent2-cert.cert')
};

const Q = {
    allDrugs: "SELECT * FROM drug;",
    insertUser: "INSERT INTO user(firstname, lastname, email, birthday, password) values(?,?,?,?,?)",
    getUser: "SELECT password FROM user WHERE email=?",
    getUserId: "SELECT user_id FROM user WHERE email=?",
    getUserDetails: "SELECT firstname, lastname, email, birthday FROM user where user_id = ?",
    getDrugId: "SELECT drug_id FROM drug WHERE name=?",
    getDrugByUser: "SELECT * FROM user_drug ud join drug d on ud.drug_id = d.drug_id where ud.user_id=?",
    addDrugForUser: "INSERT INTO user_drug(user_id,drug_id, dosis) VALUES(?,?,?)",
    checkForDrug: "SELECT EXISTS(SELECT * FROM drug WHERE name = ?) as existing",
    insertDrug: "insert into drug(name,producent) values(?,?)",
    addNotification: "insert into ud_notification(ud_id,notification_time) values(?,?)",
    getUserDrugId: "select ud_id from user_drug where user_id=? and drug_id=?",
    getMostRecent: "select ud.ud_id,d.name, udn.notification_time from ud_notification udn\n" +
    "join user_drug ud on udn.ud_id = ud.ud_id\n" +
    "join drug d on ud.drug_id = d.drug_id\n" +
    "where user_id = ? order by udn.notification_time",
    getDetails: "SELECT name,dosis FROM drug d\n" +
    "join user_drug ud on d.drug_id = ud.drug_id\n" +
    "where ud_id=?",
    deleteNotification: "delete from ud_notification where ud_id=?",
    deleteTaken: "delete from ud_notification where ud_id=?",
    deleteUD: "delete from user_drug where ud_id=?",
    updateUser: "update user set firstname= ? ,lastname=?,email=?,birthday=? where user_id=?",
    removeUser: "delete from user where user_id=?",
    tookMedication: "insert into ud_taken(ud_id,taken) values(?,?)",
    getTakenMedication: "select d.name, taken from ud_taken udt\n" +
    "join user_drug ud  on udt.ud_id = ud.ud_id\n" +
    "join drug d on ud.drug_id = d.drug_id\n" +
    "where ud.user_id = ?",
    getTakenMedicationDetails: "select d.name, taken from ud_taken udt\n" +
    "join user_drug ud  on udt.ud_id = ud.ud_id\n" +
    "join drug d on ud.drug_id = d.drug_id\n" +
    "where ud.ud_id = ?"
};

let connection;
let connectionState = true;
const app = express();

function createConnection() {
    connection = mysql.createConnection(db_config);

    connection.connect(function (err) {
        connectionState = true;
        if (err) {
            connectionState = false;
            console.log("trying to connect to the database...");
            //console.log('error when connecting to db:', err);
            setTimeout(createConnection, 2000);
        }
    });

    connection.on('error', function (err) {
        connectionState = false;
        console.log("trying to connect to the database...");
        //console.log('db error', err);
        setTimeout(createConnection, 2000);
    });
}

createConnection();

//domainname
HTTPS.createServer(options, app).listen(8443);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session(sessionConfig));
app.get("/*", ensureLogIn);
app.get("/", function (req, res) {
    loadHomePage(req, res);
});
app.get("/index", function (req, res) {
    loadHomePage(req, res);
});
app.get("/publicKey", function (req,res) {
    socket.emit("key",vapidKeys.publicKey)
});
app.get("/newmedication", function (req, res) {
    getConnection().query(Q.getUserId, [req.session.user], function (err, result) {
        getConnection().query(Q.allDrugs, function (err, result) {
            res.render("newmedication.ejs", {
                drugs: result
            });
        });
    });
});
app.post("/addUser", function (req, res) {
    const email = req.body.email;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const password = req.body.password;
    const password2 = req.body.password2;
    const birthday = req.body.birthday;
    if (password === password2) {
        const hash = bcrypt.hashSync(password);
        getConnection().query(Q.insertUser, [firstname, lastname, email, birthday, hash], function (err, result) {
            console.log(err)
        });
        req.session.loggedIn = true;
        req.session.user = email;
        loadHomePage(req, res);
    } else {
        res.render("account.ejs", {
            foutboodschap: 'The passwords were not the same'
        });
    }
});
app.post("/getUser", function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    getConnection().query(Q.getUser, [email], function (err, result) {
        if (result[0] != null && bcrypt.compareSync(password, result[0].password)) {
            req.session.loggedIn = true;
            req.session.user = email;
            loadHomePage(req, res);
        } else {
            res.render("account.ejs", {
                foutboodschap: 'Wrong combination!'
            });
        }
    });
});
app.get("/management", function (req, res) {
    getConnection().query(Q.getUserId, [req.session.user], function (err, result) {
        getConnection().query(Q.getDrugByUser, [result[0].user_id], function (err, result) {
            res.render("management.ejs", {
                drugs: result
            });
        });
    });
});

app.post("/addMedication", function (req, res) {
    const name = req.body.name;
    const dose = req.body.dose;
    const unit = req.body.unit;
    let times = [];
    for (let fieldName in req.body) {
        if (fieldName.startsWith("time")) {
            times.push(req.body[fieldName])
        }
    }

    getConnection().query(Q.getUserId, [req.session.user], function (err, result) {
        const userid = result[0].user_id;
        getConnection().query(Q.checkForDrug, [name], function (err, result) {
            if (result[0].existing === 0) {
                getConnection().query(Q.insertDrug, [name, 'todo'], function (err, result) {
                    console.log(err);
                })
            }
            getConnection().query(Q.getDrugId, [name], function (err, result) {
                const drugid = result[0].drug_id;
                getConnection().query(Q.addDrugForUser, [userid, drugid, dose + ' ' + unit], function (err, result) {

                    getConnection().query(Q.getDrugByUser, [userid], function (err, result) {
                        res.render("management.ejs", {
                            drugs: result
                        });
                    });
                    //add times
                    console.log(`userid: ${userid}, drugid: ${drugid}`);
                    for (let i = 0; i < times.length; i++) {
                        let time = times[i].split(':');
                        let date = new Date(new Date().toDateString() + ' ' + (Number(time[0])) + ':' + time[1]);
                        getConnection().query(Q.getUserDrugId, [userid, drugid], function (err, result) {
                            getConnection().query(Q.addNotification, [result[0].ud_id, date], function (err, result) {
                                console.log(err);
                                console.log(result)
                            });
                        });
                    }

                });
            });

        });
    });
});
app.get("/details", function (req, res) {
    const ud_id = req.query.drug;
    getConnection().query(Q.getDetails, [ud_id], function (err, result) {
        const name = result[0].name;
        const dose = result[0].dosis;
        getConnection().query(Q.getTakenMedicationDetails, [ud_id], function (err, result) {
            res.render("details.ejs", {
                name: name,
                dose: dose,
                id: ud_id,
                taken: convertToTaken(result)
            });
        });
    });
});

app.get("/accountDetails", function (req, res) {
    getConnection().query(Q.getUserId, [req.session.user], function (err, result) {
        getConnection().query(Q.getUserDetails, [result[0].user_id], function (err, result) {
            res.render("accountDetails.ejs", {
                firstname: result[0].firstname,
                lastname: result[0].lastname,
                email: result[0].email,
                birthday: `${result[0].birthday.getFullYear()}-${(result[0].birthday.getMonth() < 10) ? '0' + (result[0].birthday.getMonth() + 1) : (result[0].birthday.getMonth() + 1)}-${(result[0].birthday.getDate() < 10) ? '0' + result[0].birthday.getDate() : result[0].birthday.getDate()}`
            })
        })
    })
});
app.get("/delete", function (req, res) {
    const ud_id = req.query.drug;
    getConnection().query(Q.getUserId, [req.session.user], function (err, result) {
        const user_id = result[0].user_id;
        getConnection().query(Q.deleteNotification, [ud_id], function (err, result) {
            getConnection().query(Q.deleteTaken, [ud_id], function (err, result) {
                getConnection().query(Q.deleteUD, [ud_id], function (err, result) {
                    getConnection().query(Q.getDrugByUser, [user_id], function (err, result) {
                        res.render("management.ejs", {
                            drugs: result
                        });
                    });
                });
            });
        });
    });
});
app.get("/logout", function (req, res) {
    req.session.loggedIn = false;
    res.render("account.ejs", {
        infoboodschap: "you are now logged out"
    });
});
app.get("/edit", function (req, res) {
    getConnection().query(Q.getUserId, [req.session.user], function (err, result) {
        getConnection().query(Q.getUserDetails, [result[0].user_id], function (err, result) {
            res.render("accountDetailsEdit.ejs", {
                firstname: result[0].firstname,
                lastname: result[0].lastname,
                email: result[0].email,
                birthday: `${result[0].birthday.getFullYear()}-${(result[0].birthday.getMonth() < 10) ? '0' + (result[0].birthday.getMonth() + 1) : (result[0].birthday.getMonth() + 1)}-${(result[0].birthday.getDate() < 10) ? '0' + result[0].birthday.getDate() : result[0].birthday.getDate()}`
            })
        })
    })
});
app.post("/saveAccountDetails", function (req, res) {
    const email = req.body.email;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const birthday = req.body.birthday;
    getConnection().query(Q.getUserId, [req.session.user], function (err, result) {
        getConnection().query(Q.updateUser, [firstname, lastname, email, birthday, result[0].user_id], function (err, result) {
            loadHomePage(req, res);
        })
    })
});
app.get("/removeProfile", function (req, res) {
    req.session.loggedIn = false;
    getConnection().query(Q.getUserId, [req.session.user], function (err, result) {
        const user_id = result[0].user_id;
        getConnection().query(Q.removeUser, [user_id], function (err, result) {
            res.render("account.ejs", {
                infoboodschap: "your profile is now deleted."
            });
        })
    })
});
app.get("/tookMedication", function (req, res) {
    const drugId = req.query.drug;
    getConnection().query(Q.tookMedication, [drugId, new Date()], function (err, result) {
    })

});

app.get("/calendar", function (req, res) {
    getConnection().query(Q.getUserId, [req.session.user], function (err, result) {
        getConnection().query(Q.getTakenMedication, [result[0].user_id], function (err, result) {
            console.log(result);
            res.render("calendar.ejs", {
                taken: convertToTaken(result)
            })
        })
    })
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
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

function ensureLogIn(req, res, next) {

    const loggedIn = req.session.loggedIn;
    if (loggedIn) {
        next();
    } else {
        res.render("account.ejs", {
            // foutboodschap:"Please log in"
        });
    }
}

function loadHomePage(req, res) {
    getConnection().query(Q.getUserId, [req.session.user], function (err, result) {
        getConnection().query(Q.getMostRecent, [result[0].user_id], function (err, result) {
            console.log("error zelf: " + err);
            console.log(result);
            res.render("index.ejs", {
                toTake: result
            });
        });
    });
}

function convertToTaken(taken) {
    let result = [];
    taken.map(x => result.push({
        title: x.name,
        start: x.taken
    }));
    return result;
}

function getConnection() {
    if (connection.state === "disconnected") {
        setTimeout(getConnection, 2000);
    } else {
        return connection;
    }
}
console.log(vapidKeys.privateKey);
// webpush.setGCMAPIKey('<Your GCM API Key Here>');
// webpush.setVapidDetails(
//     'mailto:example@yourdomain.org',
//     vapidKeys.publicKey,
//     vapidKeys.privateKey
// );
//
//
// const pushSubscription = {
//     "endpoint": "https://fcm.googleapis.com/fcm/send/cybxXsNdna0:APA91bH0aq6P-LLHNVsH4JUe71ypHIapSyn7Br_lLvaC55p4eu-MZxyOotXzVJiejD13iaJHQ8kzMOo0Ej7YgE8xsnM6mBA5xMlsW8dn4DKaLXxaOqRqHaY2j_glzog17ogq8rxfWfC0",
//     "expirationTime": null,
//     "keys": {
//         "p256dh": "BGUbv4ukUuyymT93DvA_07CIw26fhNxmwYS8oZbgK9R8bAltNIYPMZXzQFIMs2DiZdoXcyMgNlUoBbc__-NPhOk",
//         "auth": "sxW9XG7m5xFUc8DJuTXa1A"
//     }
// };
//
// webpush.sendNotification(pushSubscription,'');