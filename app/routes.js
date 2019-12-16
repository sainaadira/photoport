module.exports = function(app, passport, db, multer, ObjectId) {


  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();
  var date = mm + '/' + dd + '/' + yyyy;
  var hr = today.getHours()
  if (hr > 12) {
    hr = hr - 12
  } else if (hr === 0) {
    hr = 12
  } else if (hr < 10) {
    hr = '0' + hr
  }
  var mins = today.getMinutes()
  if (mins < 10) {
    mins = '0' + mins
  }
  var ampm = (today.getHours()) < 12 ? 'AM' : 'PM';
  var time = hr.toString() + ':' + mins + ampm

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  // PROFILE SECTION =========================
  app.get('/mainpage', isLoggedIn, function(req, res) {
    db.collection('posts').find({userId:req.user._id}).toArray((err, posts) => {

      if (err) return console.log(err)
        console.log(posts)
      res.render('mainpage.ejs', {
        user: req.user,
        posts: posts
      })
    })
  });

  // PROFILE PAGE =============================
  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
  //---------------------------------------
  // IMAGE CODE
  //---------------------------------------
  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/userimg/images/uploads')
    },
    filename: (req, file, cb) => {
      /* warning this code needs work: needs unique user id -- look up how to do that*/
      cb(null, file.fieldname + '-' + Date.now() + ".png")
    }

  });
  var upload = multer({
    storage: storage
  });
  app.post('/userUpload', upload.single('file-to-upload'), (req, res, next) => {
    insertDocuments(db, req, 'images/uploads/' + req.file.filename, () => {
      res.redirect('/mainpage')
    });
  });

  // main page routes ===============================================================


  var insertDocuments = function(db, req, filePath, callback) {
    var uId = ObjectId(req.session.passport.user)
    var uName
    db.collection('users').find({
      "_id": uId
    }).toArray((err, result) => {
      if (err) return console.log(err)
      db.collection('posts').insertOne({
        userId: uId,
        userPosted: result[0].local.name,
        userRating: '',
        rating: '',
        comments: '',
        starRating: '',
        lighting: '',
        compostion: '',
        content: '',
        imageURL: filePath,
        date: date
      }, (err, result) => {
        if (err) return res.send(err)
        callback(result)
      })
    })
  }


  // app.put('/messages', (req, res) => {
  //   db.collection('messages')
  //     .findOneAndUpdate({
  //       name: req.body.name,
  //       msg: req.body.msg
  //     }, {
  //       $set: {
  //         thumbUp: req.body.thumbUp + 1
  //       }
  //     }, {
  //       sort: {
  //         _id: -1
  //       },
  //       upsert: true
  //     }, (err, result) => {
  //       if (err) return res.send(err)
  //       res.send(result)
  //     })
  // })
  //
  // app.delete('/messages', (req, res) => {
  //   db.collection('messages').findOneAndDelete({
  //     name: req.body.name,
  //     msg: req.body.msg
  //   }, (err, result) => {
  //     if (err) return res.send(500, err)
  //     res.send('Message deleted!')
  //   })
  // })

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function(req, res) {
    res.render('login.ejs', {
      message: req.flash('loginMessage')
    });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/mainpage', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function(req, res) {
    res.render('signup.ejs', {
      message: req.flash('signupMessage')
    });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/mainpage', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function(req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function(err) {
      res.redirect('/mainpage');
    });
  });

};



// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}
