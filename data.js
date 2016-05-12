var MongoClient = require('mongodb').MongoClient,
    settings = require('./config.js'),
    Guid = require('Guid'),
    bcrypt = require('bcrypt-nodejs'),
    request = require('request'),
    fs = require('fs'),
    rp = require('request-promise'),
    omdb = require('omdb');;

var fullMongoUrl = settings.mongoConfig.serverUrl + settings.mongoConfig.database;
var exports = module.exports = {};

MongoClient.connect(fullMongoUrl)
    .then(function(db) {
        db.createCollection("users");
        db.createCollection("movies");
        var userCollection = db.collection("users");
        var movieCollection = db.collection("movies");
        
        /* user system related funcs */
        exports.createUser = function(uname, pwd, cpwd, sid) {
            if (!uname) return Promise.reject("You must provide a username");
            if (!pwd) return Promise.reject("You must provide a password");
            if (!cpwd) return Promise.reject("You must provide a confirm password");
            if (!sid) return Promise.reject("You must provide a sessionId");

            if (pwd != cpwd) {
                return Promise.reject("The confirmed password does not match. Please try again.");
            }

            var hashpwd = bcrypt.hashSync(pwd);
            
            return userCollection.find({ username: uname }).limit(1).toArray().then(function(listOfUsers) {
                if (listOfUsers.length != 0) {
                    throw "This username is already in use.";
                }
                return userCollection.insertOne({ _id: Guid.create().toString(),
                                       username: uname,
                              encryptedPassword: hashpwd,
                               currentSessionId: sid,
<<<<<<< HEAD
                                           like: [],
                                        profile: {  fname: "",
                                                    lname: "",
                                                    email: "",
                                                birthYear: 0
                                                 }
                                                
=======
                                        profile: {  name: "",
                                                    like: "",
                                                     uid: "",
                                               birthYear: 0
                                                 }
>>>>>>> yuanwu
                }).then(function(newDoc) {
                    return exports.getUserById(newDoc.insertedId);
                });
            });
        };

        exports.loginUser = function(uname, pwd, sid) {
            if (!uname) return Promise.reject("You must provide a username");
            if (!pwd) return Promise.reject("You must provide a password");
            if (!sid) return Promise.reject("You must provide a sessionId");

            return userCollection.find({ username: uname }).limit(1).toArray().then(function(listOfUsers) {
                if (listOfUsers.length === 0) {
                    throw "Could not find user with name of " + uname;
                }
                if (!bcrypt.compareSync(pwd, listOfUsers[0].encryptedPassword)) {
                    throw "We are unable to match your username and password. ";
                }
                exports.updateSid(uname, sid);
                return listOfUsers[0];
            });
        };

<<<<<<< HEAD
        exports.updateProfile = function(sid, fname, lname, email, birthYear) {
            return userCollection.update({ currentSessionId: sid }, { $set: { "profile.fname": fname,
                                                                              "profile.lname": lname,
                                                                              "profile.email":email,
                                                                              "profile.birthYear":birthYear
=======
        exports.updateProfile = function(sid, fname, lname,email) {
            return userCollection.update({ currentSessionId: sid }, { $set: { profile: {       fname: fname,
                                                                                          lname: lname,
                                                                                          email:email
                                                                                       }
>>>>>>> yuanwu
                                                                            } }).then(function() {
                return exports.getUserBySessionId(sid);
            });
        };
<<<<<<< HEAD
        
        exports.likeBySid = function(sid, imdbid) {
            return userCollection.find({ currentSessionId: sid }).limit(1).toArray().then(function(listOfUsers) {
                if (listOfUsers.length === 0) {
                    throw "Could not find user with sid of " + sid;;
                }
                var array = listOfUsers[0].like;
                var index=array.indexOf(imdbid);
                
                if(index>-1)
                array.splice(index,1);
                else
                array.push(imdbid);
            
                return  userCollection.update({ currentSessionId: sid }, { $set: { 
                                                                                            like:array
                                                                                        
                                                                                } }).then(function() {
                    return exports.getUserBySessionId(sid);
                });
            }); 
        };
=======
>>>>>>> yuanwu

        exports.updateSid = function(uname, sid) {
            if (!uname) return Promise.reject("You must provide a username");
            if (!sid) return Promise.reject("You must provide a sid");
            
            return userCollection.update({ username: uname }, { $set: { currentSessionId: sid } }).then(function() {
                return exports.getUserBySessionId(sid);
            });
        };

        exports.getUserByName = function(uname) {
            if (!uname) return Promise.reject("You must provide a name");

            return userCollection.find({ username: uname }).limit(1).toArray().then(function(listOfUsers) {
                if (listOfUsers.length === 0) {
                    throw "Could not find user with name of " + uname;
                }
                return listOfUsers[0];
            });
        };

        exports.getUserById = function(id) {
            if (!id) return Promise.reject("You must provide an ID");

            return userCollection.find({ _id: id }).limit(1).toArray().then(function(listOfUsers) {
                if (listOfUsers.length === 0) {
                    throw "Could not find user with id of " + id;
                }
                return listOfUsers[0];
            });    
        };

        exports.getUserBySessionId = function(sid) {
            if (!sid) return Promise.reject("You must provide an SID");

            return userCollection.find({ currentSessionId: sid }).limit(1).toArray().then(function(listOfUsers) {
                if (listOfUsers.length === 0) {
                    throw "Could not find user with sid of " + sid;;
                }
                return listOfUsers[0];
            });    
        };

        exports.getAllUsers = function() {
            return userCollection.find().toArray();
        }
        
        /* movie related funcs */
        exports.createMovieByImdb = function(imdb) {
            if (!imdb) return Promise.reject("You must provide a imdb id");
            var preLink = "http://www.omdbapi.com/?i=",
                postShortLink = "&plot=short&r=json",
                postFullLink = "&plot=short&r=json";
            var shortLink = preLink + imdb + postShortLink;
            var fullLink = preLink + imdb + postFullLink;
            var fullObj = null, shortPlot = "", imgCurrentName = "";
            
            return rp(shortLink).then(function (htmlString) {
                shortPlot = JSON.parse(htmlString).Plot;
                return rp(fullLink).then(function (htmlString) {
                    fullObj = JSON.parse(htmlString);
                    var imgurl = fullObj.Poster;
                    var re = /(?:\.([^.]+))?$/;
                    var ext = re.exec(imgurl);
                    imgCurrentName = imdb + "." + ext[1];
                    //var poster = request(imgurl).pipe(fs.createWriteStream('static/resources/poster/' + imgCurrentName));
                    //poster.on('finish', function () { ; });
                    return movieCollection.find({ imdbId: imdb }).limit(1).toArray().then(function(listOfMovies) {
                        if (listOfMovies.length != 0) {
                            throw "Looks like this movie is already in db.";
                        }
                        return movieCollection.insertOne({ _id: Guid.create().toString(),
                                                        imdbId: imdb,
                                                         title: fullObj.Title,
                                                          year: fullObj.Year,
                                                         genre: fullObj.Genre,
                                                      director: fullObj.Director,
                                                        actors: fullObj.Actors,
                                                   description: shortPlot,
                                                       imgname: imgCurrentName,
<<<<<<< HEAD
                                                       likedby: [],
=======
                                                       likedby: "",
>>>>>>> yuanwu
                                                          json: fullObj
                        }).then(function(newDoc) {
                            console.log("successfully inserted");
                            return exports.getMovieById(newDoc.insertedId);
                        });
                    });
                });
            });
        };
        
        exports.updateMovie = function(imdb, title, year,genre, director, actors, des, imgname, likedby, jsontext) {
            var jsonObj = JSON.parse(jsontext);
            return movieCollection.update({ imdbId: imdb },
                                      { $set: { 
                                                 title: title,
                                                  year: year,
                                                 genre: genre,
                                              director: director,
                                                actors: actors,
                                           description: des,
                                               imgname: imgname,
                                               likedby: likedby,
                                                  json: jsonObj
                                              }
            }).then(function() {
                return exports.getMovieByImdb(imdb);
            });
        };

        exports.getMovieByImdb = function(imdb) {
            if (!imdb) return Promise.reject("You must provide an imdb");

            return movieCollection.find({ imdbId: imdb }).limit(1).toArray().then(function(listOfMovies) {
                if (listOfMovies.length === 0) {
                    throw "Could not find movie with imdb of " + imdb;
                }
                return listOfMovies[0];
            });
        };

        exports.getMovieById = function(id) {
            if (!id) return Promise.reject("You must provide an ID");

            return movieCollection.find({ _id: id }).limit(1).toArray().then(function(listOfMovies) {
                if (listOfMovies.length === 0) {
                    throw "Could not find movie with id of " + id;
                }
                return listOfMovies[0];
            });    
        };

        exports.getMovieByTitleAndYear = function(title, year) {
            if (!title) return Promise.reject("You must provide a title");
            if (!year) return Promise.reject("You must provide a year");

            return movieCollection.find({ title: title, year: year }).limit(1).toArray().then(function(listOfMovies) {
                if (listOfMovies.length === 0) {
                    throw "Could not find movie with title of " + title + " in " + year;
                }
                return listOfMovies[0];
            });    
        };

        exports.getAllMovies = function() {
            return movieCollection.find().toArray();
        }
        
<<<<<<< HEAD
        exports.getLikeMovieByUser = function(user) {
            likeList = user.like; 
            return movieCollection.find({imdbId:{$in:likeList}}).toArray();
        }
        
=======
>>>>>>> yuanwu
        // =================
        // Search
        // =================
        exports.getMovieByKeyWord = function (keyWord) {
            if (!keyWord) return Promise.reject("You must provide a key word!");
            
            return movieCollection.find({ $or:[ {title: {$regex: keyWord.toString(),$options: "$i" }},
                                                 {actors:{ $regex: keyWord.toString(), $options: "$i"}},
                                                  {director: {$regex: keyWord.toString(), $options: "$i"}}]}).toArray().then(function(listOfMovies) {
                                                      if (listOfMovies.length === 0) {
                                                          omdb.search(keyWord.toString(), function (err, movies) {
                                                                if(err) {
                                                                    return console.error("error");
                                                                }
<<<<<<< HEAD
                                                                if(movies.length < 1) {
                                                                    return console.log("No movies were found!");
                                                                }
=======
                                                                
                                                                if(movies.length < 1) {
                                                                    return console.log("No movies were found!");
                                                                }
                                                                
>>>>>>> yuanwu
                                                                var list = [];
                                                                for (var movie in movies) {
                                                                    exports.createMovieByImdb(movies[movie].imdb);
                                                                    list.push[movies[movie].imdb];
                                                                }
                                                                for (var i in list) {
                                                                    listOfMovies.push(exports.getMovieByImdb(list[i]));
<<<<<<< HEAD
                                                                }                                                                      
                                                          });
                                                          if (listOfMovies.length === 0) {
                                                              //console.log(listOfMovies.length);
                                                              return Promise.reject("No movies were found!");
                                                          } else {
                                                              //console.log("else");
                                                              return listOfMovies.sort(compare);
                                                          }   
                                                      } else {
                                                          return listOfMovies.sort(compare);
                                                      }
                                                  });
             
        }

=======
                                                                }
                                                                                                                                 
                                                          });
                                                          
                                                          if (listOfMovies.length === 0) {
                                                              console.log(listOfMovies.length);
                                                              return Promise.reject("No movies were found!");
                                                          } else {
                                                              console.log("else");
                                                              return listOfMovies.sort(compare);
                                                          }
                                                          
                                                          
                                                      } else {
                                                          return listOfMovies.sort(compare);
                                                      }
                                                      
                                                   
                                                  });
                                                  
            
        }
>>>>>>> yuanwu
        
        // sort by imdbRating
        function compare(a,b) {
            if (a.json.imdbRating === 'N/A') {
                return 1;
            } 
            else if (b.json.imdbRating === 'N/A'){
                return -1;
            } 
            else if (a.json.imdbRating > b.json.imdbRating) {
                return -1;
            }
            else if (a.json.imdbRating < b.json.imdbRating) {
                return 1;
            }
            else {
                return 0;
            }
        }
        
        // =================
        // Filter and Recommendation
        // =================
        // get movie by genre, also for simple recommendation.
        exports.getMovieByGenre = function(genre) {
            if (!genre) return Promise.reject("You must probide a genre!");
            
            return movieCollection.find({genre: {$regex: genre.toString(),$options: "$i" }}).toArray().then(function(listOfMovies) {
                if (listOfMovies.length === 0) {
                    throw "Could not find movie with genre of " + genre;
                }
                return listOfMovies.sort(compare);
            })
        }
        
        
        
        
<<<<<<< HEAD
    });
=======
    });
>>>>>>> yuanwu
