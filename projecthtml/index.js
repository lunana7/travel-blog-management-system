const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const{check, validationResult} = require('express-validator');  
mongoose.connect('mongodb://localhost:27017/adminpanel',{
    useNewUrlParser: true,
    useUnifiedTopology: true
})
// get expression session
const session = require('express-session');
// set up the model for the Admin
const Admin = mongoose.model('Admin',{
  username: String,
  password: String
} );
// set up the model for the nav links
const NavLink = mongoose.model('NavLink', {
  name: String,
  url: String,
  page: String,
  order: Number
});

const Page = mongoose.model('Page', {
  title: String,
  content: String,
  imagePath: String // 可用于存储图片的路径
});

var myApp = express();
myApp.use(express.urlencoded({extended:false})); // new way after Express 4.16
// set up session
myApp.use(session({
  secret: 'superrandomsecret',
  resave: false,
  saveUninitialized: true
}));

// set path to public folders and view folders

myApp.set('views', path.join(__dirname, 'views'));
//use public folder for CSS etc.
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');
myApp.use(fileUpload());


let initialNavLinks = [
  { name: 'Home', url: '/' ,order: 1 },
  { name: 'About', url: '/about',order: 2 },
  { name: 'Team', url: '/team', order: 3 },
  { name: 'Contact', url: '/contact',order: 4 },
  { name: 'Login', url: '/login' ,order: 5 },
  { name: 'Add page', url: '/addpage' ,order: 6 },
  { name: 'Edit pages', url: '/editpages' ,order: 7 },
  { name: 'Logout', url: '/logout' ,order: 8 },

];
NavLink.find({}).then(links => {
  if (links.length === 0) {
    initialNavLinks.forEach(link => {
      const newLink = new NavLink(link);
      newLink.save();
    });
  }
});
myApp.get('/', (req, res) => {
  NavLink.find({ 
    $or: [
      { name: 'Home' }, 
      { name: 'About' }, 
      { name: 'Team' }, 
      { name: 'Contact' }, 
      { name: 'Login' }, 

    ] 
  })
  .sort({ order: 1 })
  .then(navLinks => {
    res.render('home', { title: 'My Home Page', navLinks: navLinks });
  });
});
myApp.get('/about', (req, res) => {
  NavLink.find({ 
    $or: [
      { name: 'Home' }, 
      { name: 'About' }, 
      { name: 'Team' }, 
      { name: 'Contact' }, 
      { name: 'Login' }, 

    ] 
  })
  .sort({ order: 1 })
  .then(navLinks => {
    res.render('about', { title: 'About', navLinks: navLinks });
  });
});
myApp.get('/team', (req, res) => {
  NavLink.find({ 
    $or: [
      { name: 'Home' }, 
      { name: 'About' }, 
      { name: 'Team' }, 
      { name: 'Contact' }, 
      { name: 'Login' }, 

    ] 
  })
  .sort({ order: 1 })
  .then(navLinks => {
    res.render('team', { title: 'team', navLinks: navLinks });
  });
});
myApp.get('/contact', (req, res) => {
  NavLink.find({ 
    $or: [
      { name: 'Home' }, 
      { name: 'About' }, 
      { name: 'Team' }, 
      { name: 'Contact' }, 
      { name: 'Login' }, 

    ] 
  })
  .sort({ order: 1 })
  .then(navLinks => {
    res.render('contact', { title: 'contact', navLinks: navLinks });
  });
});
// Register login page
myApp.get('/register', function(req, res){

  NavLink.find({ 
    $or: [
      { name: 'Home' }, 
      { name: 'About' }, 
      { name: 'Team' }, 
      { name: 'Contact' }, 
      { name: 'Login' }, 

    ] 
  })
  .sort({ order: 1 })
  .then(navLinks => {
    res.render('register', { title: 'Register', navLinks: navLinks });
  });
});
// Register login form post
myApp.post('/register', function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  console.log(username);
  console.log(password);


  var newAdmin = new Admin({
      username: username,
      password: password
  });

  // save the Admin
  newAdmin.save().then(() => {
    // 成功处理
    res.redirect('/registration-success'); // 重定向到登录页面
  }).catch(error => {
    console.error(error);
    // 错误处理
    res.render('register');
  });
});

myApp.get('/registration-success', function(req, res) {
  // 获取会话中的注册成功消息
  const message = req.session.registerSuccessMessage || 'Registration successful. You can now log in.';

  // 清除会话中的消息以避免再次显示
  req.session.registerSuccessMessage = null;

  // 查询导航链接
  NavLink.find({
    $or: [
      { name: 'Home' }, 
      { name: 'About' }, 
      { name: 'Team' }, 
      { name: 'Contact' }, 
      { name: 'Login' }, 
    ]
  })
  .sort({ order: 1 })
  .then(navLinks => {
    // 渲染页面并传递导航链接和消息
    res.render('registration-success', { title: 'registration-success', navLinks: navLinks, message: message });
  });
});

myApp.get('/login', (req, res) => {
  NavLink.find({ 
    $or: [
      { name: 'Home' }, 
      { name: 'About' }, 
      { name: 'Team' }, 
      { name: 'Contact' }, 
      { name: 'Login' }, 

    ] 
  })
  .sort({ order: 1 })
  .then(navLinks => {
    res.render('login', { title: 'Login', navLinks: navLinks });
  });
});
//login form post
myApp.post('/login', function(req, res){
  var user= req.body.username;
  var pass= req.body.password;

  
console.log(user);
console.log(pass);

Admin.findOne({username: user, password: pass}).exec()
  .then(admin => {
    console.log('Admin: ' + admin);
    if(admin){
        //store username in session and set logged in true
        req.session.username = admin.username;
        req.session.userLoggedIn = true;
        // redirect to the dashboard
        res.redirect('/welcome');
    }
    else{
        res.render('login', {error: 'Sorry, cannot login!'});
    }
  })
  .catch(err => {
    // log any errors
    console.log('Error: ' + err);

  
});
});

myApp.get('/welcome', (req, res) => {
  // 检查用户是否已经登录，如果没有登录，可以重定向到登录页面
  if (!req.session.userLoggedIn) {
    return res.redirect('/login');
  }
  NavLink.find({
    $or: [
      { name: 'Add page' }, 
      { name: 'Edit pages' }, 
      { name: 'Logout' }, 
    ]
  })
  .sort({ order: 1 })
  .then(navLinks => {
    // 渲染页面并传递导航链接和消息
    res.render('welcome', { title: 'welcome', navLinks: navLinks });
  });
});

myApp.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      // 错误处理，例如渲染一个错误页面
      res.render('error', { message: 'Logout failed' });
    } else {
      // 注销成功，查询导航链接
      NavLink.find({
        $or: [
          { name: 'Home' }, 
          { name: 'About' }, 
          { name: 'Team' }, 
          { name: 'Contact' }, 
          { name: 'Login' }, 
        ]
      })
      .sort({ order: 1 })
      .then(navLinks => {
        // 渲染注销页面并传递导航链接
        res.render('logout', { title: 'Logout', navLinks: navLinks });
      });
    }
  });
});


myApp.get('/addpage', (req, res) => {
  NavLink.find({ 
    $or: [
      { name: 'Add page' }, 
      { name: 'Edit pages' }, 
      { name: 'Logout' }, 

    ] 
  })
  .sort({ order: 1 })
  .then(navLinks => {
    res.render('addpage', { title: 'addpage', navLinks: navLinks });
  });
});


// Handle the form submission for adding pages
myApp.post('/addpage', (req, res) => {
  // Retrieve form data from the request
  const { pageTitle, pageContent } = req.body;

  // Process the form data and save it to MongoDB (you can also handle image upload here)

  // Example: Create a new Page document and save it to the database
  const newPage = new Page({
    pageTitle,
    pageContent,
    // You can also handle the hero image here
  });

  newPage.save((err) => {
    if (err) {
      console.error('Error saving page:', err);
      // Handle the error, e.g., render an error page
      res.render('error', { error: 'Error saving page' });
    } else {
      // Page saved successfully
      res.redirect('/addpage'); // Redirect to the add page form or a success page
    }
  });
});

myApp.get('/editpages', (req, res) => {
  NavLink.find({ 
    $or: [
      { name: 'Add page' }, 
      { name: 'Edit pages' }, 
      { name: 'Logout' }, 

    ] 
  })
  .sort({ order: 1 })
  .then(navLinks => {
    res.render('editpages', { title: 'edit pages', navLinks: navLinks });
  });
});

// Edit a single page
myApp.get('/editpage/:pageName', (req, res) => {
  const pageName = req.params.pageName;
  Page.findOne({ title: pageName }).then(page => {
    res.render('editpage', { page: page });
  });
});
// Handle the form submission for editing a page
myApp.post('/editpage/:pageName', (req, res) => {
  const pageName = req.params.pageName;
  const { title, content } = req.body;
  Page.findOneAndUpdate({ title: pageName }, { title: title, content: content }).then(() => {
    res.redirect('/editpages');
  });
});
myApp.post('/deletepage/:pageName', (req, res) => {
  const pageName = req.params.pageName;
  Page.findOneAndDelete({ title: pageName }).then(() => {
    res.redirect('/editpages');
  });
});
  myApp.listen(3700);

//tell everything was ok
console.log('Everything executed fine.. website at port 3500....');
