// import dependencies you will use
const express = require('express');
const path = require('path');
//setting up Express Validator
const {check, validationResult} = require('express-validator'); // ES6 standard for destructuring an object
// set up the DB connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/awesomestore', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// get expression session
const session = require('express-session');

// set up the model for the order
const Order = mongoose.model('Order',{
    name: String,
    email: String,
    phone: String,
    postcode: String,
    lunch: String,
    tickets: Number,
    campus: String,
    subTotal : Number,
    tax : Number,
    total : Number
} );

// set up the model for the Admin
const Admin = mongoose.model('Admin',{
    username: String,
    password: String
} );


// set up variables to use packages
var myApp = express();
myApp.use(express.urlencoded({extended:false}));

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
// set up different routes (pages) of the website

//home page
myApp.get('/', function(req, res){
    res.render('form'); // no need to add .ejs to the file name
});


//defining regular expressions
var phoneRegex = /^[0-9]{3}\-[0-9]{3}\-[0-9]{4}$/;
var positiveNum = /^[1-9][0-9]*$/;

//function to check a value using regular expression
function checkRegex(userInput, regex){
    if(regex.test(userInput)){
        return true;
    }
    else{
        return false;
    }
}
// Custom phone validation function
function customPhoneValidation(value){
    if(!checkRegex(value, phoneRegex)){
        throw new Error('Phone should be in the format xxx-xxx-xxxx');
    }
    return true;
}
// Valiation rules for tickets and lunch:
// 1. Tickets should be a number
// 2. User has to buy lunch if they buy less than 3 tickets
function customLunchAndTicketsValidation(value, {req}){
    var tickets = req.body.tickets;
    if(!checkRegex(tickets, positiveNum)){
        throw new Error('Please select tickets. Tickets should be a number');
    }
    else{
        tickets = parseInt(tickets);
        if(tickets < 3 && value != 'yes'){
            throw new Error('Lunch is required if you buy less than 3 tickets');
        }
    }
    return true;
}

myApp.post('/', [
    check('name', 'Must have a name').not().isEmpty(),
    check('email', 'Must have email').isEmail(),
    check('phone').custom(customPhoneValidation),
    check('lunch').custom(customLunchAndTicketsValidation)
    
],function(req, res){

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        //console.log(errors); // check what is the structure of errors
        res.render('form', {
            errors:errors.array()
        });
    }
    else{
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var postcode = req.body.postcode;
        var tickets = req.body.tickets;
        var lunch = req.body.lunch;
        var campus = req.body.campus;

        var subTotal = tickets * 20;
        if(lunch == 'yes'){
            subTotal += 15;
        }
        var tax = subTotal * 0.13;
        var total = subTotal + tax;

        var pageData = {
            name : name,
            email : email,
            phone : phone, 
            postcode : postcode,
            lunch : lunch,
            tickets : tickets,
            campus : campus,
            subTotal : subTotal,
            tax : tax,
            total : total
        }
        // create an object for the model Order
        var myOrder = new Order(pageData);
        // save the order
        myOrder.save().then(function(){
            console.log('New order created');
        });
        // display receipt
        res.render('form', pageData);
    }
});

// All orders page
myApp.get('/allorders',function(req, res){
    // check if the user is logged in
    if(req.session.userLoggedIn){
        Order.find({}).exec(function(err, orders){
            res.render('allorders', {orders:orders});
        });
    }
    else{ // otherwise send the user to the login page
        res.redirect('/login');
    }
});

// Register login page
myApp.get('/register', function(req, res){
    res.render('register');
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
    newAdmin.save().then(() => console.log('New Login Account Registered') ); 
    res.redirect('/allorders');

});



// login page
myApp.get('/login', function(req, res){
    res.render('login');
});

// login form post
myApp.post('/login', function(req, res){
    var user = req.body.username;
    var pass = req.body.password;

    //console.log(username);
    //console.log(password);

    Admin.findOne({username: user, password: pass}).exec(function(err, admin){
        // log any errors
        console.log('Error: ' + err);
        console.log('Admin: ' + admin);
        if(admin){
            //store username in session and set logged in true
            req.session.username = admin.username;
            req.session.userLoggedIn = true;
            // redirect to the dashboard
            res.redirect('/allorders');
        }
        else{
            res.render('login', {error: 'Sorry, cannot login!'});
        }
        
    });

});

myApp.get('/logout', function(req, res){
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('login', {error: 'Successfully logged out'});
});

myApp.get('/delete/:orderid', function(req, res){
    // check if the user is logged in
    if(req.session.userLoggedIn){
        //delete
        var orderid = req.params.orderid;
        console.log(orderid);
        Order.findByIdAndDelete({_id: orderid}).exec(function(err, order){
            console.log('Error: ' + err);
            console.log('Order: ' + order);
            if(order){
                res.render('delete', {message: 'Successfully deleted!'});
            }
            else{
                res.render('delete', {message: 'Sorry, could not delete!'});
            }
        });
    }
    else{
        res.redirect('/login');
    }
});


myApp.get('/edit/:orderid', function(req, res){
    // check if the user is logged in
    if(req.session.userLoggedIn){
        var orderid = req.params.orderid;
        console.log(orderid);
        Order.findOne({_id: orderid}).exec(function(err, order){
            console.log('Error: ' + err);
            console.log('Order: ' + order);
            if(order){
                res.render('edit', {order:order});
            }
            else{
                res.send('No order found with that id...');
            }
        });
    }
    else{
        res.redirect('/login');
    }
});


myApp.post('/edit/:id', [
    check('name', 'Must have a name').not().isEmpty(),
    check('email', 'Must have email').isEmail(),
    check('phone').custom(customPhoneValidation),
    check('lunch').custom(customLunchAndTicketsValidation)
    
],function(req, res){

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        //console.log(errors); // check what is the structure of errors

        var orderid = req.params.id;
        Order.findOne({_id: orderid}).exec(function(err, order){
            console.log('Error: ' + err);
            console.log('Order: ' + order);
            if(order){
                res.render('edit', {order:order, errors:errors.array()});
            }
            else{
                res.send('No order found with that id...');
            }
        });

    }
    else{
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var postcode = req.body.postcode;
        var tickets = req.body.tickets;
        var lunch = req.body.lunch;
        var campus = req.body.campus;

        var subTotal = tickets * 20;
        if(lunch == 'yes'){
            subTotal += 15;
        }
        var tax = subTotal * 0.13;
        var total = subTotal + tax;

        var pageData = {
            name : name,
            email : email,
            phone : phone, 
            postcode : postcode,
            lunch : lunch,
            tickets : tickets,
            campus : campus,
            subTotal : subTotal,
            tax : tax,
            total : total
        }
        var id = req.params.id;
        Order.findOne({_id:id}, function(err, order){
            order.name = name;
            order.email = email;
            order.phone = phone;
            order.postcode = postcode;
            order.lunch = lunch;
            order.tickets = tickets;
            order.campus = campus;
            order.subTotal = subTotal;
            order.tax = tax;
            order.total = total;   
            order.save();     
        });
        res.render('editsuccess', pageData);
    }
});



//author page
myApp.get('/author',function(req,res){
    res.render('author',{
        name : 'Davneet Chawla',
        studentNumber : '123123'
    }); 
});

// start the server and listen at a port
myApp.listen(8080);

//tell everything was ok
console.log('Everything executed fine.. website at port 8080....');


