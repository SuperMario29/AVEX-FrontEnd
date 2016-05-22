var http = require('http');
var path = require('path');
var stripe = require("stripe")("sk_test_7itp1Ch8S4JWgslVvG5qknUN");
var fs = require('fs');

//=================================================================
//get the packages we need ========================================
//=================================================================
var express 	= require('express');
var nodemailer = require('nodemailer');
var app         = express();
var bodyParser  = require('body-parser');
var passwoid = require('passwoid');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passwordHash = require('password-hash');
var Fiber = require('fibers');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file


fs.readdirSync(__dirname + '/models').forEach(function(filename) {
	if(filename.indexOf('.js')) {require(__dirname + '/models/' + filename);}
});

var routes = require('./routes/mainroute.js');
//=================================================================
//configuration ===================================================
//=================================================================
var port = process.env.PORT || 8085; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

//use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//use morgan to log requests to the console
app.use(morgan('dev'));

//---------------------------------------------------------
//get an instance of the router for api routes
//---------------------------------------------------------
var apiRoutes = express.Router(); 

var server = http.createServer(app);
var customers = mongoose.model('customers');
var settings = mongoose.model('settings');
var datastore = mongoose.model('datastore');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://pierredbush%40gmail.com:pass@smtp.gmail.com');

//basic route (http://localhost:8080)-Check To See if App is Online
app.get('/', function(req, res) {
	res.send('Hello! The API is at http://localhost:' + port + '');
});


//=================================================================
//routes ==========================================================
//=================================================================

//Submit User Registration Info
app.post('/submitRegistration', function(req, res) {

	console.log('Add Customer ' + req.body.name + ' to Database');
	var email = req.body.emailaddress.trim();
	var name = req.body.name.trim();
	var password = passwordHash.generate(req.body.password);
	
	customers.findOne({
		username: email
	}, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('Email is available.');
						
			stripe.customers.create({
				  description: 'New Customer for AVEX',
				  email: email
				}, function(err, customer) {
					console.log('Insert Customer Account Into Stripe');
					
					// create user
					var user = new customers({ 
						name: name, 
						emailaddress: email,
						password: password,
						stripeaccount: customer.id.trim(),
						recordstatusdate: new Date(),
					    recordstatus: '1',
						admin: false 
					});
					
					user.save(function(err,success) {
						if (err) {throw err;}	
							if (!success) {
								console.log('User Save Failed.');
								res.json({ success: false, message: 'User Save Failed.' });
							} else if (success) {
								console.log('Customer saved successfully');
								
								var data = new datastore({ 
									description: 'New Customer Created: ' + user.name,
						    	    actiontype: 'New Customer',
						    	    recordstatusdate: new Date(),
						    	    recordstatus: 1 
								});
									
								data.save(function(err) {
									if (err) {throw err;}	
								});
					
						    	// setup e-mail data with unicode symbols
						    	var mailOptions = {
						    	    from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
						    	    to: '' + user.email + '', // list of receivers
						    	    subject: 'Your Account Created', // Subject line
						    	    text: 'Your New Athlete Value Exchange Account Was Created Successfully', // plaintext body
						    	    html: '<b>Your New Athlete Value Exchange Account Was Created Successfully</b>' // html body
						    	};

						    	// send mail with defined transport object
						    	transporter.sendMail(mailOptions, function(error, info){
						    	    if(error){
						    	        return console.log(error);
						    	    }
						    	    console.log('Message sent: ' + info.response);
						    	});
								
								res.json({ success: true });
						}
					});		
			});			
		} else if (user) {
			res.json({ success: false, emailaddress: 'Not available' });
		}
	});
});



//---------------------------------------------------------
//authentication (no middleware necessary since this isnt authenticated)
//---------------------------------------------------------

//Get Settings for App
app.get('/getsettings', function(req,res){
	console.log('Get Settings');
	settings.findOne(function(err, setting) {
		if (err) {throw err;}
		if (!setting) {
		    console.log('Nothing was found');
			res.json({ success: false, message: 'Nothing was found.' });
		} else if (setting) {
		    console.log('Received Settings: ' + setting);
			res.json(setting);
		}		
});
});

//Log User Into Account
app.get('/userLogin', function(req, res) {

	var email = req.query.emailaddress.trim();
	
	console.log('Get Customer Authentication for Customer: ' + email);
	
	// find the user
	customers.findOne({
		emailaddress: email
	}, function(err, user) {

		if (err) {throw err;}

		if (!user) {
			console.log('Authentication failed. User not found.');
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {
			// check if password matches
			if (!passwordHash.verify(req.query.password,user.password)) {
				console.log('Authentication failed. User not found.');
				res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			} else {

				console.log('User is found and password is right!!');
				// if user is found and password is right
				// create a token
				var token = jwt.sign(user, app.get('superSecret'), {
					expiresIn: 1440 // expires in 24 hours
				});
				
				console.log('User token: ' + token);
				
				res.json({
					success: true,
					message: 'Enjoy your token!',
					name: user.name,
					emailaddress: user.emailaddress,
					recordstatus: user.recordstatus,
					recordstatusdate: user.recordstatusdate,
					token: token
				});
			}		
		}
	});
});

//Check If Email Is Available
app.get('/isEmailAvailable', function(req, res) {
	var email =  req.query.emailaddress.trim();
	console.log('Check Is ' + email + ' is Available');
	// find the user
	customers.findOne({
		emailaddress: email
	}, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('Email is available');
			res.json({ success: true, emailaddress: email});
		} else if (user) {
			console.log('Email is not available');
			res.json({ success: false });
		}
	});
});

//Reset Password By Email
app.post('/emailResetPassword', function(req, res){
	// reset user password
	var email =  req.body.emailaddress.trim();
	
    console.log('Send Email To Reset Password: ' + email);
    customers.findOne({emailaddress: email}, function (err, user) {
  	  if (err) return handleError(err);
  	  if(!user){
    	console.log('Send Email Password Reset failed');
  		res.json({ success: false, message: 'Send Email Password Reset failed' });
  	  }
  	  else if(user){
    	console.log('Send Email Password Reset Successfully');
    	user.password = passwordHash.generate(passwoid(8));
	    var newhistory = {
	    		description: 'Reset Password successfully',
	    	    actiontype: 'Password Update',
	    	    recordstatusdate: new Date(),
	    	    recordstatus: 1
	    };
	    user.listofcustomerhistory.push(newhistory);
    	
    	// setup e-mail data with unicode symbols
    	var mailOptions = {
    	    from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
    	    to: '' + email + '', // list of receivers
    	    subject: 'Your Password Reset Request', // Subject line
    	    text: 'Your New Temp Password is: ' + user.password + '', // plaintext body
    	    html: '<b>Your New Temp Password is: ' + user.password + ' </b>' // html body
    	};

    	// send mail with defined transport object
    	transporter.sendMail(mailOptions, function(error, info){
    	    if(error){
    	        return console.log(error);
    	    }
    	    console.log('Message sent: ' + info.response);
    	});
  		res.json({ success: true, message: 'Send Email Password Reset Successfully' });
  	  }
  	});
});


//---------------------------------------------------------
//route middleware to authenticate and check token
//---------------------------------------------------------
apiRoutes.use(function(req, res, next) {

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'] || req.query.token;

	// decode token
	if (token) {

		console.log('Authenticating token !!');
		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {			
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });		
			} else {
				console.log('User authenticated!!');
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		console.log('No token provided!!');
		return res.status(403).send({ 
			success: false, 
			message: 'No token provided.'
		});	
	}
});

//---------------------------------------------------------
//authenticated routes
//---------------------------------------------------------

apiRoutes.get('/getPortfolio', routes.portfolio);
apiRoutes.get('/getMarket', routes.market);
apiRoutes.get('/getSearch', routes.search);
apiRoutes.get('/getQuotes', routes.quotes);
apiRoutes.get('/getMarketTrends', routes.markettrends);
apiRoutes.get('/getNBABoxScoreStats', routes.nbaboxscorestats);
apiRoutes.get('/getNBAAdvancedStats', routes.nbaadvancedstats);
apiRoutes.get('/getOrdersByAthlete', routes.ordersbyathlete);
apiRoutes.get('/getCustomerOrders', routes.getcustomerorders);
apiRoutes.get('/getAccountBalance', routes.accountbalance);
apiRoutes.get('/getAthlete', routes.getathlete);
apiRoutes.get('/getCustomerHistory', routes.getcustomerhistory);
apiRoutes.get('/getBalanceHistory', routes.getbalancehistory);
apiRoutes.get('/getTeam', routes.getteam);
apiRoutes.get('/getCustomerCards', routes.getcustomercards);
apiRoutes.get('/validateBankAccount', routes.validatebankaccount);

apiRoutes.post('/updatePassword', routes.updatepass);
apiRoutes.post('/cancelOrder', routes.cancelorder);
apiRoutes.post('/updateOrder', routes.updateorder);
apiRoutes.post('/submitOrder', routes.submitorder);
apiRoutes.post('/updateCustomerInfo', routes.updatecustomer);
apiRoutes.post('/withdrawal', routes.withdrawal);
apiRoutes.post('/deposit', routes.deposit);
apiRoutes.post('/addAccount', routes.addaccount);
apiRoutes.post('/removeAccount', routes.removeaccount);

app.use('/api', apiRoutes);

app.listen(process.env.PORT || 8085);

module.export = apiRoutes;



