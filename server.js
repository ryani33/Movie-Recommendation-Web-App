// We first require our express package
var express = require('express');
var bodyParser = require('body-parser');
var data = require('./data.js');
var cookieParser = require('cookie-parser');
var Guid = require('Guid');
var fs = require('fs');
var xss= require("xss");

// This package exports the function to create an express instance:
var app = express();

app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/assets', express.static('static'));

app.get("/startup", function(request, response) {
    
    var obj = JSON.parse(fs.readFileSync('static/resources/data/input.json', 'utf8'));
    var array = obj.array;
    var htmltext = "successfully add ";
    var i;
    for (i in array) {
        data.createMovieByImdb(array[i]).then().then(function(movie) {
            console.log(movie.imdbId + " is saved in db.");
        }, function(errorMessage) {
            console.log(movie.imdbId + " error: " + errorMessage);
        });
    }
    response.send(htmltext + i);
});

app.get("/", function(request, response) {

    if (request.cookies.sessionId) {
        var currentSid = request.cookies.sessionId;
        data.getUserBySessionId(currentSid).then(function(user) {
            response.render('pages/profile', { data: user.profile, username: user.username,sid: user.currentSessionId, successInfo: null, updateError: "You have already logged in." });
        }, function(errorMessage) {
            response.clearCookie("sessionId");
            response.status(500).render('pages/home', { signupError: null, username: null,loginError: "No cookies found, please log in again." });
        });
    } else {
        response.render("pages/home", { signupError: null, username: null,loginError: null });
    }
});

app.post("/profile", function(request, response) {
    options={
        whiteList: [],
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
    };
    myxss= new xss.FilterXSS(options);

    var fname = myxss.process(request.body.firstname);
    var lname = myxss.process(request.body.lastname);
    var email = myxss.process(request.body.email);
    var currentSid = request.cookies.sessionId;

    data.updateProfile(currentSid, fname, lname, email).then(function(user) {
        response.render('pages/profile', { data: user.profile, username: user.username,sid: user.currentSessionId, successInfo: "Updated Successfully", updateError: null });
    }, function(errorMessage) {
        response.status(500).render('pages/profile', { data: user.profile, username: user.username,sid: user.currentSessionId, successInfo: null, updateError: errorMessage });
    });
});

app.get("/profile", function(request, response) {

    if (request.cookies.sessionId) {
        var currentSid = request.cookies.sessionId;
        data.getUserBySessionId(currentSid).then(function(user) {
            response.render('pages/profile', { data: user.profile,username: user.username, sid: user.currentSessionId, successInfo: null, updateError: null });
        }, function(errorMessage) {
            response.clearCookie("sessionId");
            response.status(500).render('pages/home', { signupError: null, username: null,loginError: "No cookies found, please log in again." });
        });
    } else {
        response.status(500).render('pages/home', { signupError: null, username: null,loginError: "Please log in first." });
    }
});

app.post("/login", function(request, response) {
     options={
        whiteList: [],
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
    };
    myxss= new xss.FilterXSS(options);

    var uname = myxss.process(request.body.loginname);
    var pwd = myxss.process(request.body.loginpwd);
    var sid = Guid.create().toString();

    var expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    data.loginUser(uname, pwd, sid).then(function(user) {
        response.cookie("sessionId", sid, { expires: expiresAt });
        response.render('pages/home', { data: user.profile, username: user.username, sid: user.currentSessionId, successInfo: null, updateError: null });
    }, function(errorMessage) {
        response.status(500).render('pages/sign', { signupError: null, username: null,loginError: errorMessage });
    });
});

app.get("/login", function(request, response) {
    if (request.cookies.sessionId) {
        var currentSid = request.cookies.sessionId;
        data.getUserBySessionId(currentSid).then(function(user) {
            response.render('pages/sign', { data: user.profile,username: user.username, sid: user.currentSessionId, successInfo: null, updateError: null, loginError: "You have already logged in!"});
        }, function(errorMessage) {
            response.clearCookie("sessionId");
            response.status(500).render('pages/home', { signupError: null, username: null,loginError: "No cookies found, please log in again." });
        });
    }
    else
    response.render('pages/sign',{ signupError: null, username: null,loginError: null });
});

app.post("/signup", function(request, response) {
    options={
        whiteList: [],
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
    };
    myxss= new xss.FilterXSS(options);

    var uname = myxss.process(request.body.signupname);
    var pwd = myxss.process(request.body.signuppwd);
    var cpwd = myxss.process(request.body.confirmpwd);
    var sid = Guid.create().toString();

    var expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    response.clearCookie("sessionId");
    response.cookie("sessionId", sid, { expires: expiresAt });
    
    data.createUser(uname, pwd, cpwd, sid).then(function(user) {
        response.render('pages/home', { data: user.profile, username: user.username,sid: sid, successInfo: null, updateError: null });
    }, function(errorMessage) {
        response.status(500).render('pages/sign', { signupError: errorMessage, username: null,loginError: null });
    });
});

app.get("/signup", function(request, response) {
response.render('pages/sign',{ signupError: null, username: null,loginError: null });
});

app.get("/logout", function(request, response) {
    if (request.cookies.sessionId) {
        response.clearCookie("sessionId");
        response.render("pages/home", { signupError: null, username: null,loginError: "Log out successfully, please log in again" });
    } else {
        response.render("pages/home", { signupError: null, username: null,loginError: "You need log in first" });
    }
});


app.get("/search", function (request, response) {
    
    data.getMovieByKeyWord("hateful").then(function(movieList) {     
        //console.log(movieList);
        response.render('pages/search', {movieList: movieList, signupError: null, loginError: null})
    });
})

app.get("/select/:genre", function (request, response) {
    //console.log(request.params.genre);
    data.getMovieByGenre(request.params.genre).then(function(movieList) {     
        //console.log(movieList);
        response.render('pages/select', {movieList: movieList, signupError: null, loginError: null})
    });
})

app.get("/select", function (request, response) {
    //console.log(request.params.genre);
    data.getAllMovies().then(function(movieList) {     
        //console.log(movieList);
        response.render('pages/select', {movieList: movieList, signupError: null, loginError: null})
    });
})

app.get("/movie/:id", function (request, response) {
    //console.log(request.params.genre);
    data.getMovieByImdb(request.params.id).then(function(movieList) {     
        //console.log(movieList);
        var majorGenre = (movieList.genre).split(", ")[0];
        //console.log(majorGenre);
        data.getMovieByGenre(majorGenre).then(function(recMovies) {
            //console.log(recMovies);
            response.render('pages/movie', {movieList: movieList,recMovies: recMovies, signupError: null, loginError: null})
        })
    });
})
// We can now navigate to localhost:3000
app.listen(3000, function() {
    console.log('Your server is now listening on port 3000! Navigate to http://localhost:3000 to access it');
});
