// Import necessary modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const { check, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const myApp = express(); 
const session = require('express-session');
// Connect to MongoDB database
mongoose.connect('mongodb://localhost:27017/adminpanel', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
// Use session middleware
myApp.use(express.urlencoded({ extended: false }));
myApp.use(
  session({
    secret: 'superrandomsecret',
    resave: false,
    saveUninitialized: true
  })
);
// Set the paths for views and static files
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');// Set the view engine to ejs
myApp.use(fileUpload());// Use file upload middleware
myApp.use(bodyParser.urlencoded({ extended: false }));
myApp.use(bodyParser.json());
myApp.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Define the Admin model with a username and password, both of type String
const Admin = mongoose.model('Admin', {
  username: String,
  password: String
});
// Define the NavLink model with name, url, page of type String and order of type Number
const NavLink = mongoose.model('NavLink', {
  name: String,
  url: String,
  page: String,
  order: Number
});
// Define the Page model with nav, title, content, imagePath all of type String
const Page = mongoose.model('Page', {
  nav: String,
  title: String,
  content: String,
  imagePath: String
});

// This function initializes the database and server
async function initializeDatabaseAndServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/adminpanel', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
// Fetch all pages from the database
    const pages = await Page.find({});
    // If there are no pages, create default pages
    if (pages.length === 0) {
      const defaultPages = [
        { title: 'Home', nav: 'Home',content: 'Welcome to Travel Bloom blog, your ultimate guide to exploring the world! Discover hidden gems, cultural insights, and travel tips to make your next adventure unforgettable. Stay tuned for our latest stories and breathtaking photography from around the globe',imagePath: '/images/home.jpg' },
        { title: 'About', nav: 'About',content: "Welcome to Travel Bloom blog, a haven for travel enthusiasts and adventure seekers! Created by Travel Bloom blog, this blog is a chronicle of extraordinary journeys across the globe. Here, we delve into the heart of diverse cultures, uncover hidden natural wonders, and share practical tips for both seasoned and aspiring travelers. Our mission is to inspire you to explore the beauty and diversity of our world. Join us as we embark on unforgettable adventures, from the bustling streets of iconic cities to the serene solitude of untouched landscapes. Travel Bloom blog isn't just a blog; it's a community where stories are shared, travel dreams are nurtured, and the spirit of exploration thrives.", imagePath: '/images/about.jpg' },
        { title: 'Team', nav:'Team', content:'Meet the team behind Travel Bloom blog! We are a group of travel enthusiasts, photographers, and writers dedicated to bringing you the best in travel journalism. Each team member brings a unique perspective and expertise, ensuring diverse and comprehensive travel content.', imagePath: '/images/team.jpg' },
        { title: 'Contact', nav:'Contact', content:"Got questions, suggestions, or just want to share your travel stories with us? We'd love to hear from you! Reach out to us via email at mli0752@conestogac.on.ca, follow us on social media, or simply fill out the contact form on this page. Let's connect and inspire each other's travel journeys.", imagePath: '/images/contact.jpg' }
      ];
     // Save each default page to the database
      for (const pageData of defaultPages) {
        const newPage = new Page(pageData);
        await newPage.save();
      }
    }
    // Fetch all navigation links from the database
    const navlinks = await NavLink.find({});
     // If there are no navigation links, create default navigation links
    if (navlinks.length === 0) {
      // Fetch all pages from the database again after potentially creating new ones
      const updatedPages = await Page.find({});
      // Create a new navigation link for each page
      for (const [index, page] of updatedPages.entries()) {
        const newNavLink = new NavLink({
          name: page.nav,
          url: `/page/${page._id}`,
          page: page._id,
          order: index
        });
        // Save the new navigation link to the database
        await newNavLink.save();
      }
    }
  } catch (err) {
    console.log('Error initializing database and server: ' + err);
  }
}
// This function fetches navigation links from the database and passes them to a callback
async function getNavLinks(callback) {
  try {
    const navLinks = await NavLink.find({}).sort({ order: 1 });
    callback(navLinks);
  } catch (err) {
    console.error('Error getting navLinks:', err);
    callback([]);
  }
}

myApp.get('/', (req, res) => {
  Page.findOne({ title: 'Home' }).then((page) => {
    getNavLinks((navLinks) => {
      res.render('home', { page, navLinks });
    });
  });
});


// Route for the registration page
myApp.get('/register', function(req, res){
  getNavLinks((navLinks) => {
    // Render the registration page with the navigation links and any error message from the session
    res.render('register', { page: { title: 'Register Page' }, navLinks: navLinks, errorMessage: req.session.errorMessage });
    // Clear the error message from the session
    req.session.errorMessage = null;
  });
});

// Route for the registration form submission
myApp.post('/register', function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  // If the username or password is missing, redirect back to the registration page
  if (!username || !password) {
    getNavLinks(function(navLinks) {
      res.render('register', { page: { title: 'Register Page' }, navLinks, errorMessage: 'Username and password cannot be empty.' });
    });
    return;
  }

  // Create a new Admin with the provided username and password
  var newAdmin = new Admin({
      username: username,
      password: password
  });

  // Save the new Admin to the database
  newAdmin.save().then(() => {
    // On success, redirect to the registration success page
    res.redirect('/registration-success');
  }).catch(error => {
    // On error, log the error and render the registration page again
    console.error(error);
    res.render('register');
  });
});

myApp.get('/registration-success', function(req, res) {
  // Get the success message from the session, or use a default message
  const message = req.session.registerSuccessMessage || 'Registration successful. You can now log in.';

  // Clear the success message from the session to avoid showing it again
  req.session.registerSuccessMessage = null;

  getNavLinks((navLinks) => {
    // Render the page and pass the navigation links and message
    res.render('registration-success', { page: { title: 'Registration Success' }, navLinks: navLinks, message: message });
  });
});


// Route for the login page
myApp.get('/login', function(req, res){
  // Fetch navigation links
  getNavLinks((navLinks) => {
    // Render the login page with the navigation links and any error message from the session
    res.render('login', { page: { title: 'Login Page' }, navLinks: navLinks , errorMessage: req.session.errorMessage });
    // Clear the error message from the session
    req.session.errorMessage = null;
  });
});

// Route for the login form submission
myApp.post('/login', function(req, res){
  // Get the username and password from the request body
  var user= req.body.username;
  var pass= req.body.password;

  // Log the username and password for debugging purposes
  console.log(user);
  console.log(pass);

  // Find an Admin with the provided username and password
  Admin.findOne({username: user, password: pass}).exec()
  .then(admin => {
    // Log the found Admin for debugging purposes
    console.log('Admin: ' + admin);
    if(admin){
        // If an Admin was found, store the username in the session and set the user as logged in
        req.session.username = admin.username;
        req.session.userLoggedIn = true;
        // Redirect to the welcome page
        res.redirect('/welcome');
    }
    else{
      // If no Admin was found, render the login page again with an error message
      getNavLinks((navLinks) => {
        res.render('login', {page: { title: 'Login Page' }, navLinks: navLinks , errorMessage: 'Invalid username or password' });
      });
    }
  })
  .catch(err => {
    // Log any errors that occur during the login process
    console.log('Error: ' + err);
  });
});

// Route for the welcome page
myApp.get('/welcome', (req, res) => {
  // Check if the user is logged in, if not, redirect to the login page
  if (!req.session.userLoggedIn) {
    return res.redirect('/login');
  }
  // Render the welcome page
  res.render('welcome', { page:{title: 'welcome'} });
});

// Route for the logout action
myApp.get('/logout', (req, res) => {
  // Destroy the session (log out the user)
  req.session.destroy(err => {
    // Fetch navigation links
    getNavLinks((navLinks) => {
      // Render the logout page and pass the navigation links
      res.render('logout', { page:{title:'log out page'}, navLinks: navLinks });
    });
  });
});

// Route for the add page form
myApp.get('/addpage', (req, res) => {
  // Check if the user is logged in, if not, redirect to the login page
  if (!req.session.userLoggedIn) {
    return res.redirect('/login');
  }
  // Render the add page form
  res.render('addpage', { page: { title: 'Add Page' } });
});

// Route for the add page form submission
myApp.post('/addpage', [
  // Validate that the 'nav' field is not empty
  check('nav').notEmpty().withMessage('Page Navigation is required'),
  // Validate that the 'title' field is not empty
  check('title').notEmpty().withMessage('Page Title is required'),
  // Validate that the 'content' field is not empty
  check('content').notEmpty().withMessage('Page Content is required'),
  // Validate that the 'image' field is not empty
  check('image').custom((value, { req }) => {
    if (!req.files || !req.files.image) {
      throw new Error('Image is required');
    }
    return true;
  }),
], (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are errors, store them in the request
    req.errors = errors.array();
  }
  // Continue to the next middleware
  next();
}, async (req, res) => {
  // If there were validation errors, render the add page form again with the errors
  if (req.errors) {
    return res.render('addpage', { errors: req.errors, page: { title: 'Add Page' }});
  }

  try {
    let imagePath = '';
    // If an image was uploaded, move it to the public directory and store its path
    if (req.files && req.files.image) {
      const image = req.files.image;
      imagePath = '/uploads/' + image.name;
      image.mv('./public' + imagePath);
    }

    // Create a new Page with the form data and the image path
    const newPage = new Page({
      nav: req.body.nav,
      title: req.body.title,
      content: req.body.content,
      imagePath: imagePath
    });
    // Save the new Page to the database
    await newPage.save();

    // Create a new NavLink for the new Page
    const newNavLink = new NavLink({
      name: newPage.nav,
      url: '/page/' + newPage._id,
      page: newPage._id,
      order: (await NavLink.countDocuments({})) + 1
    });
    // Save the new NavLink to the database
    await newNavLink.save();

    // Redirect to the add page success page
    res.redirect('/addpage-success');
  } catch (err) {
    // Log any errors that occur during the add page process
    console.error('Error adding page:', err);
    // Render an error page with a message
    res.render('error', { message: 'Error adding page' });
  }
});

// Route for the add page success page
myApp.get('/addpage-success', (req, res) => {
  // Check if the user is logged in, if not, redirect to the login page
  if (!req.session.userLoggedIn) {
    return res.redirect('/login');
  }

  // Render the add page success page
  res.render('addpage-success', { page: { title: 'Addpage Success' } });
});

// Route for the edit pages page
myApp.get('/editpages', (req, res) => {
  // Check if the user is logged in, if not, redirect to the login page
  if (!req.session.userLoggedIn) {
    return res.redirect('/login');
  }

  // Fetch all Pages from the database
  Page.find({})
    .then(pages => {
      // Render the edit pages page with the fetched Pages
      res.render('editpages', { page: {title: 'Edit Pages'}, navLinks:[], pages: pages });
    })
    .catch(err => {
      // Log any errors that occur during the fetch
      console.error('Error fetching pages:', err);
      // Render an error page with a message
      res.render('error', { message: 'Error fetching pages' });
    });
});


// Route for a specific page
myApp.get('/page/:id', async (req, res) => {
  // Fetch the Page with the ID from the URL parameters
  const page = await Page.findById(req.params.id);
  console.log(page); // Print the Page object for debugging purposes
  // Fetch all navigation links and sort them by order
  const navLinks = await NavLink.find({}).sort({ order: 1 });
  // Render the page and pass the Page object and navigation links
  res.render('page', { page, navLinks });
});

// Route for the edit page form for a specific page
myApp.get('/editpage/:id', async (req, res) => {
  // Check if the user is logged in, if not, redirect to the login page
  if (!req.session.userLoggedIn) {
    return res.redirect('/login');
  }

  try {
    // Fetch the Page with the ID from the URL parameters
    const page = await Page.findById(req.params.id);
    // Render the edit page form and pass the Page object
    res.render('editpage', { page: page });
  } catch (err) {
    // Log any errors that occur during the fetch
    console.error('Error fetching page:', err);
    // Render an error page with a message
    res.render('error', { message: 'Error fetching page' });
  }
});

// Route for the edit page success page
myApp.get('/editpage-success', (req, res) => {
  // Render the success page
  res.render('editpage-success',{ page: { title: 'Edit Page Success' }});
});

// Route for the edit page form submission
myApp.post('/editpage/:id', [
  // Validate the fields
  check('nav').notEmpty().withMessage('Page Navigation is required'),
  check('title').notEmpty().withMessage('Page Title is required'),
  check('content').notEmpty().withMessage('Page Content is required'),
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are errors, render the edit page form again with the errors
    return res.render('editpage', { errors: errors.array(), page: { title: 'Edit Page' }});
  }

  try {
    // If an image was uploaded, move it to the public directory and store its path
    if (req.files) {
      const image = req.files.image;
      const imagePath = '/uploads/' + image.name;
      image.mv('./public' + imagePath);
      req.body.imagePath = imagePath;
    }

    // Update the Page with the ID from the URL parameters and the form data
    const updatedPage = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // Update the NavLink for the Page
    await NavLink.updateOne({ page: req.params.id }, { name: updatedPage.nav });
    // Redirect to the edit page success page
    res.redirect('/editpage-success');
  } catch (err) {
    // Log any errors that occur during the update
    console.error('Error updating page:', err);
    // Render an error page with a message
    res.render('error', { message: 'Error updating page' });
  }
});
myApp.get('/deletepage/:id?', async function(req, res) {
  // Check if user is logged in
  if(req.session.userLoggedIn){
    var id = req.params.id;
    if (id) {
      // Delete the page
      try {
        const page = await Page.findByIdAndDelete({_id: id});
        if(page){
          // Delete the corresponding navlink
          await NavLink.deleteOne({ page: id });
          // Render the delete page with success message
          res.render('deletepage', { message: 'Page deleted successfully', page: { title: 'Delete Page' }});
        }
        else{
          // Render the delete page with error message
          res.render('deletepage', { message: 'Error deleting page', page: { title: 'Delete Page' }});
        }
      } catch (err) {
        // Log the error
        console.log('Error: ' + err);
      }
    } else {
      // Render the delete page with a default or provided message
      const message = req.query.message || 'Page deleted successfully';
      res.render('deletepage', { message: message, page: { title: 'Delete Page' }});
    }
  }
  else{
    // Redirect to login if user is not logged in
    res.redirect('/login');
  }
});


initializeDatabaseAndServer();

myApp.listen(3100);
console.log('Everything executed fine.. website at port 3100....');