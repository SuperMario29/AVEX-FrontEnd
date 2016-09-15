var express = require('express');
var Fiber = require('fibers');
var router = express();
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var stripe = require("stripe")("sk_test_7itp1Ch8S4JWgslVvG5qknUN");
var Schema = mongoose.Schema, ObjectId = Schema.ObjectID;;
var request = require("request");

var customers = mongoose.model('customers',Schema);
var athletes = mongoose.model('athletes',Schema);
var teams = mongoose.model('teams',Schema);
var orders = mongoose.model('orders',Schema);
var markettrends = mongoose.model('markettrends',Schema);
var datastore = mongoose.model('datastore',Schema);
var settings = mongoose.model('settings',Schema);
var querystring = require('querystring');
var https = require('https');
var passwordHash = require('password-hash');
var host = 'http://api.probasketballapi.com';
var apiKey = 'o0Q26qMPmn3az74dyGLhFItWCR5ZicHj';
var username = '*****';
var password = '*****';
var sessionId = null;
//create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://pierredbush%40gmail.com:pass@smtp.gmail.com');

exports.main = function (req,res)
{
	res.json({message:'hooray!welcome to our app'});
};

//Get Order Settings
exports.ordersettings = function(req,req){
	console.log('Fetched Order Settings');
	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('User was not found');
			res.json({ success: false, message: 'User not found.' });
		} else if (user) {
			console.log('User found!');
			var counter = 0;
			var positions = user.portfolio;

			while(positions[counter] != null){										
				var position = positions[counter];
				athletes.findById(athleteid, 'currentprice', function(err, athlete) {
					if (err) {throw err;}
					if (!athlete) {
						console.log('Nothing was found');
						counter = counter + 1;
					} else if (order) {
						console.log('Received Results!!');
						position.currentprice = athlete.currentprice;
						counter = counter + 1;
					}		
				});
			}
			res.json({
				success: true,
				message: "Received Results",
				customerpositions : positions
			});		
		}
	});
};

//Get Customer's Portfolio
exports.portfolio = function(req,res){
	// find the user
	console.log('Fetched Portfolio');
	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('User was not found');
			res.json({ success: false, message: 'User not found.' });
		} else if (user) {
			console.log('User found!');
			var listofathleteids = [];
			var listofathletes = [];
			user.listofathletes.forEach (function (doc){
				if(doc.recordstatus != 3 && doc.recordstatus != 4){
					listofathleteids.push(doc.athleteid);
					listofathletes.push(doc);
				}
			});
			console.log('Athlete Array: ' + listofathleteids);
			athletes.find({ _id: { $in: listofathleteids}}, function(err, athlete) {
				if (err) {throw err;}
				if (!athlete) {
					console.log('Athletes were not found');
					res.json(listofathletes);	
				} else if (athlete) {
					console.log('Athletes were found!');
					athlete.forEach (function (a){
						listofathletes.forEach (function (doc){
							if(doc.athleteid == a._id){
								doc.currentprice = a.currentprice;
							}
						});
					});
					res.json({
						success : true,
						message : "List of Athletes Received",
						customerpositions: listofathletes
					});	
				}
			});
		};
	});
};

//Get Customer Account History
exports.getcustomerhistory = function(req,res){
	console.log('Fetched Portfolio');
	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('User was not found');
			res.json({ success: false, message: 'User not found.' });
		} else if (user) {
			console.log('User found!');
			res.json({
				success: true,
				message : "Customer History Received",
				customerhistories: user.listofcustomerhistory
			});		
		}
	});
};

//Get Customer's Balance History
exports.getbalancehistory = function(req,res){
	console.log('Fetched Portfolio');
	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('User was not found');
			res.json({ success: false, message: 'User not found.' });
		} else if (user) {
			console.log('User found!');
			console.log(user.listransactions);
			res.json({
				success: true,
				message: "Transaction History Received",
				transactions: user.listoftransactions
			});		
		}
	});
};

//Update Password
exports.updatepass =  function(req,res){
	console.log('Update Password: ' + req.decoded._doc.emailaddress);
	customers.findById(req.decoded._doc._id, function (err, user) {
		if (err) {throw err;};
		if(!user){
			console.log('Updated Password failed');
			user.listofcustomerhistory.push({
				description: 'Updated Password failed',
				actiontype: 'Password Update',
				recordstatusdate: new Date(),
				recordstatus: 1
			});
			user.save(function(err) {
				if (err) {throw err;}	
			});
			res.json({ success: false, message: 'Updated Password failed.' });
		}
		else if(user){
			console.log('Updated Password successfully');
			user.password = passwordHash.generate(req.body.password);
			user.listofcustomerhistory.push({
				description: 'Updated Password successfully',
				actiontype: 'Password Update',
				recordstatusdate: new Date(),
				recordstatus: 1
			});
			user.save(function(err) {
				if (err) {throw err;}	
			});
			res.json({ success: true, message: 'Updated Password successfully' });
		}
	});
};


//Update Customer Account
exports.updatecustomer =  function(req,res){
	console.log('Updating Customer: ' + req.decoded._doc._id);
	var email = req.body.emailaddress.trim();
	var name = req.body.name.trim();

	customers.findById(req.decoded._doc._id, function (err, user) {
		if (err) {throw err;};
		if(!user){
			console.log('Updated User Account failed');
			user.listofcustomerhistory.push({
				description: 'Account update failed',
				actiontype: 'Update Account',
				recordstatusdate: new Date(),
				recordstatus: 1
			});
			user.save(function(err) {
				if (err) {throw err;}	
			});
			res.json({ success: false, message: 'Updated User Account failed' }); 
		}
		else if(user){
			var isSameEmail = user.emailaddress == email;
			if(isSameEmail){
				console.log('Updated User Account successfully');
				user.name = name;
				user.listofcustomerhistory.push({
					description: 'Account update succeed',
					actiontype: 'Update Account',
					recordstatusdate: new Date(),
					recordstatus: 1
				});
				user.save(function(err) {
					if (err) {throw err;}	
				});
				res.json({ success: true, message: 'Updated User Account successfully' });
			}
			else{
				customers.findOne({
					emailaddress: email
				}, function(err, user) {
					if (err) {throw err;}
					if (!user) {
						console.log('Email is available');
						console.log('Updated User Account succeed');
						stripe.customers.update(user.stripeaccount, {
							email: email
						}, function(err, customer) {
							if(err){throw err;}
							if(!customer){
								user.name = name;
								user.listofcustomerhistory.push({
									description: 'Account update failed.Unable To Locate Stripe Account',
									actiontype: 'Update Account',
									recordstatusdate: new Date(),
									recordstatus: 1
								});
								user.save(function(err) {
									if (err) {throw err;}	
								});
								res.json({ success: false, message: 'Updated User Account failed' });
							}
							else if(customer){
								user.emailaddress = email;
								user.name = name;
								user.listofcustomerhistory.push({
									description: 'Account update succeed',
									actiontype: 'Update Account',
									recordstatusdate: new Date(),
									recordstatus: 1
								});
								user.save(function(err) {
									if (err) {throw err;}	
								});
								res.json({ success: true, message: 'Updated User Account successfully' });
							}
						});

					} else if (user) {
						console.log('Email is not available');
						user.listofcustomerhistory.push({
							description: 'Account update failed.Email Not Available',
							actiontype: 'Update Account',
							recordstatusdate: new Date(),
							recordstatus: 1
						});						
						user.save(function(err) {
							if (err) {throw err;}	
						});
						res.json({ success: false, emailaddress: 'Not available' });
					}
				});
			}
		}
	});
};

//Get All Available Athletes
exports.market = function(req,res){
	console.log('Get MarketPlace');
	athletes.find({'isavailable':true}, function(err, market) {
		if (err) {throw err;}
		if (!market) {
			console.log('Nothing was found');
			res.json({ success: false, message: 'Nothing was found.' });
		} else if (market) {
			console.log('Received Results!!');
			res.json({
				success: true,
				message: "Market Received",
				athletes: market
			});
		}		
	});
};

//Find Athletes That Match the Search Request
exports.search = function(req,res){
	console.log('Get Search');
	athletes.find({$or: [{name:  { $regex: new RegExp("^"+req.query.search.replace("+"," "), "i") }}, {firstname:  { $regex: new RegExp("^"+req.query.search.replace("+"," "), "i") }}, {lastname:  { $regex: new RegExp("^"+req.query.search.replace("+"," "), "i") }} ] }, function(err, athlete) {
		if (err) {throw err;}
		if (!athlete) {
			console.log('Nothing was found');
			res.json({ success: false, message: 'Nothing was found.' });
		} else if (athlete) {
			console.log('Received Results: ' + athlete);
			// create search request result
			var data = new datastore({ 
				description: 'Search request: ' + athlete,
				actiontype: 'Search',
				recordstatusdate: new Date(),
				recordstatus: 1 
			});

			data.save(function(err) {
				if (err) {throw err;}	
			});
			res.json({
				success: true,
				message: "Search Results Received",
				athletes: athlete
			});
		}		
	});
};

//Get Athlete Quotes
exports.quotes =  function(req,res){
	console.log('Get Quotes');
	athletes.find({ quote: { $ne: null }},'quote name currentprice', function(err, quotes) {
		if (err) {throw err;}
		if (!quotes) {
			console.log('Nothing was found');
			res.json({ success: false, message: 'Nothing was found.' });
		} else if (quotes) {
			console.log('Received quotes!!');
			quotes.success = true;
			quotes.message = "Search Results Received";
			res.json({
				success: true,
				message: "Search Results Received",
				quotes: quotes
			});
		}		
	});
};

//Get NBA Box Score Stats
exports.nbaboxscorestats = function(req,res){
	var athleteid = req.query.athleteid.trim();
	console.log('Get Stats for Player:' + athleteid);
	request({
		uri: host + '/boxscore/player',
		qs: {api_key: apiKey, player_id: athleteid},
		method: "POST",
		timeout: 10000,
		followRedirect: true,
		maxRedirects: 10
	}, function(err, response, body) {
		if(err){throw err;}
		if(!response){
			console.log('Nothing was found');
			res.json({ success: false, message: 'Nothing was found.' });
		}
		else if(response){
			console.log('Received Results: ' + body);
			res.json(body);
		}
	});
};

//Get NBA Advanced Score States
exports.nbaadvancedstats = function(req,res){
	var athleteid = req.query.athleteid.trim();
	var gameid = req.query.gameid.trim();
	console.log('Get Stats for Player:' + athleteid);
	request({
		uri: host + '/advanced/player',
		qs: {api_key: apiKey, player_id: athleteid,game_id:gameid},
		method: "POST",
		timeout: 10000,
		followRedirect: true,
		maxRedirects: 10
	}, function(err, response, body) {
		if(err){throw err;}
		if(!response){
			console.log('Nothing was found');
			res.json({ success: false, message: 'Nothing was found.' });
		}
		else if(response){
			console.log('Received Results: ' + body);
			res.json(body);
		}
	});
};

//Get Market Trends 
exports.markettrends = function(req,res){
	markettrends.find({}).sort({recordstatusdate: -1}).limit(1).exec(function(err, markettrend) {
		if (err) {throw err;}
		if (!markettrend) {
			console.log('Nothing was found');
			res.json({ success: false, message: 'Nothing was found.' });
		} else if (markettrend) {
			console.log('Received Results');
			res.json({
				success : true,
				message : "Returned MarketTrends",
				markettrends : markettrend
			});
		}		
	});
};

//Get All Orders By Athlete
exports.ordersbyathlete = function(req,res){
	var athleteid = req.query.athleteid.trim();
	console.log('Get Orders By Athlete; Athlete ID:' + athleteid );
	athletes.findById(athleteid, 'listorders', function(err, order) {
		if (err) {throw err;}
		if (!order) {
			console.log('Nothing was found');
			res.json({ success: false, message: 'Nothing was found.' });
		} else if (order) {
			console.log('Received Results!!');
			res.json({
				success: true,
				message: "Returned Orders",
				orders: order
			});
		}		
	});
};

//Get All Customer Orders
exports.getcustomerorders = function(req,res){
	var athleteid = req.query.athleteid.trim();
	console.log('Get Customer Orders By Athlete; Athlete ID:' + athleteid);
	orders.find({athleteid: athleteid, customerid: req.decoded._doc._id, recordstatus: {$ne : 3}, recordstatus : {$ne : 4}}, function(err, order) {
		if (err) {throw err;}
		if (!order) {
			console.log('Nothing was found');
			res.json({ success: false, message: 'Nothing was found.' });
		} else if (order) {
			console.log('Received Results!! Orders: ' + order);
			res.json({
				success: true,
				message: "Returned Orders",
				orders: order
			});
		}		
	});
};

//Update Order For Athlete
exports.updateorder =  function(req,res){
	console.log('Update Order');

	var finalcommission = 0.00;
	var finalprice = 0.00;
	var availableshares = 0.00;
	var totalshares = 0.00;
	var currentquantity = 0.00;

	var orderid = req.body.orderid.trim();

	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('User was not found');
			res.json({ success: false, message: 'User not found.' });
		} else if (user) {
			console.log('User found!');	    
			orders.findById(orderid,function(err,order){
				if (err) {throw err;}
				if (!order) {
					console.log('Order Was Not found');
					res.json({ success: false, message: 'Order Was Not Found' });
				} 
				else if (order) {		   
					athletes.findById(order.athleteid, function(err,athlete){
						if(err) {throw err;}
						if(!athlete){
							console.log('Athlete Was Not found');
							res.json({ success: false, message: 'Athlete Was Not Found' });
						}
						else if (athlete){
							console.log('Current Price: ' + athlete.currentprice);
							console.log('Current Order Quantity: ' + currentquantity);
							finalprice = athlete.currentprice;
							availableshares = athlete.availableshares;
							totalshares = athlete.totalshares;				    
							console.log('Total Shares: ' + totalshares);
							console.log('Available Shares: ' + availableshares);

							console.log('Order Quantity: ' + order.quantity);
							console.log('Final Price: ' + finalprice);
							console.log('Final Commission: ' + finalcommission);

							athlete.availableshares = +availableshares + -order.quantity;
							order.recordstatus = 4;
							order.recordstatusdate = new Date();

							var neworder = order;							    								    

							athlete.listorders.push(neworder);

							athlete.save(function (err,data) {
								if (err) {throw err;}
								console.log('Athlete Saved Successfully!');
							});	

							order.save(function (err,data) {
								if (err) {throw err;}
								console.log('Order Saved Successfully!');
							});	

							console.log('Cancellation Order sent to database');
							res.json({ success: true, message: 'Cancellation Order sent to database.' });
						}
					});
				}
			});
		}
	});
};


//User Thread for Cancelling Order
var cancelorder =  Fiber(function(req){
	var finalcommission = 0.00;
	var finalprice = 0.00;
	var availableshares = 0.00;
	var totalshares = 0.00;
	var orderid = req.body.orderid.trim();

	console.log('Cancelling Order:' + orderid);

	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('User was not found');
			res.json({ success: false, message: 'User not found.' });
		} else if (user) {
			console.log('User found!');	    
			orders.findById(orderid,function(err,order){
				if (err) {throw err;}
				if (!order) {
					console.log('Order Was Not found');
					res.json({ success: false, message: 'Order Was Not Found' });
				} 
				else if (order && order.recordstatus != 4 && order.recordstatus != 3) {		   
					athletes.findById(order.athleteid, function(err,athlete){
						if(err) {throw err;}
						if(!athlete){
							console.log('Athlete Was Not found');
							res.json({ success: false, message: 'Athlete Was Not Found' });
						}
						else if (athlete){
							var currentqueue = athletes.findOneAndUpdate(
									{ _id: athlete._id },
									{ $inc : { 'nextqueue' : 1 } });
							var userqueueposition = currentqueue.nextqueue;

							while (userqueueposition != currentqueue.currentqueue){
								var currentqueue = athletes.findById(athlete._id);
								sleep(1000);
							}


							console.log('Received Price: ' + athlete.currentprice);
							finalprice = athlete.currentprice;
							availableshares = athlete.availableshares;
							totalshares = athlete.totalshares;				    
							console.log('Total Shares: ' + totalshares);
							console.log('Available Shares: ' + availableshares);

							console.log('Order Quantity: ' + order.quantity);
							console.log('Final Price: ' + finalprice);
							console.log('Final Commission: ' + finalcommission);

							athlete.availableshares = +availableshares + -order.quantity;
							order.recordstatus = 4;
							order.recordstatusdate = new Date();

							var cancelorder = order;
							athlete.listorders.push(cancelorder);

							user.listoftransactions.push({
								description: 'Cancelled Order: ' + athlete.name,
								amount: order.quantity,
								actiontype: 'Cancel',
								recordstatusdate: new Date(),
								recordstatus: 1
							});

							athlete.save(function (err,athletedata) {
								if (err) {throw err;}
								if(!athletedata){

								}
								else if(athletedata){
									console.log('Athlete Saved Successfully!');
									order.save(function (err,orderdata) {
										if (err) {throw err;}
										if(!orderdata){

										}
										else if(orderdata){
											console.log('Order Saved Successfully!');
											user.save(function (err,userdata) {
												if (err) {throw err;}
												if(!userdata){

												}
												else if(userdata){
													console.log('User Saved Successfully!');
													console.log('Cancellation Order sent to database');

													// setup e-mail data with unicode symbols
													var mailOptions = {
															from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
															to: '' + user.email + '', // list of receivers
															subject: 'Your Order', // Subject line
															text: 'Your Order was Cancelled Successfully', // plaintext body
															html: '<b>Your Order was Cancelled Successfully</b>' // html body
													};

													// send mail with defined transport object
													transporter.sendMail(mailOptions, function(error, info){
														if(error){
															return console.log(error);
														}
														console.log('Message sent: ' + info.response);
													});
												}
											});	
										}
									});	
								}
							});									    
						}
					});
				}
			});
		}
	});
});

//Cancel Order for Customer
exports.cancelorder = function(req,res){
	cancelorder.run(req);
	res.json({ success: true, message: 'Order submitted successfully' });
}

//Thread for Submitting Individual Orders
var submitorder =  Fiber(function(req){
	console.log('Submitting Order');
	console.log(req.body);

	var finalcommission = 0.00;
	var finalprice = 0.00;
	var availableshares = 0.00;
	var totalshares = 0.00;
	var isMarketOpen = false;

	var quote = req.body.quote.trim();
	var quantity = req.body.quantity.trim();
	var actiontype = req.body.actiontype.toLowerCase();

	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('User was not found');
			//res.json({ success: false, message: 'User not found.' });
		} else if (user) {
			console.log('User found!');

			// find by some conditions and update
			settings.findOne(function(err, setting) {
				if (err) {throw err;}
				if (!setting) {
					console.log('Commission Was Not found');
				} else if (setting) {
					console.log('Received Settings: ' + setting);
					console.log('Received Setting Commission: ' + setting.commission);
					finalcommission = setting.commission;
					console.log('Commission: ' + finalcommission);
					console.log('Received Settings: ' + setting);
					var marketopenhour = parseInt(setting.marketopen.split(":",1));
					var marketclosehour = parseInt(setting.marketclose.split(":",1));
					var marketopentime = new Date();
					var marketclosetime = new Date();
					marketopentime.setHours(+marketopenhour);
					marketopentime.setMinutes(0);
					marketopentime.setSeconds(0);
					marketopentime.setMilliseconds(0);
					console.log("Market Open:" + marketopentime);
					console.log("Market Open (GET TIME):" + marketopentime.getTime());
					marketclosetime.setHours(+marketclosehour);
					marketclosetime.setMinutes(0);
					marketclosetime.setSeconds(0);
					marketclosetime.setMilliseconds(0);
					console.log("Market Closed:" + marketclosetime);
					console.log("Market Closed (GET TIME):" + marketclosetime.getTime());
					var currentdate = new Date();
					console.log("Current Time:" + currentdate);
					console.log("Current Time (GET TIME):" + currentdate.getTime());
					if(currentdate.getTime() >= marketopentime.getTime() && currentdate.getTime() <= marketclosetime.getTime()){
						console.log("Market Is Open!!");
						isMarketOpen = true;
					}								    
					else{
						console.log("Market Is Closed!!");
					}
					athletes.findOne({quote: quote},function(err,athlete){
						if (err) {throw err;}
						if (!athlete) {
							console.log('Athlete Was Not found');
						} else if (athlete) {

							var currentqueue = athletes.findOneAndUpdate(
									{ _id: athlete._id },
									{ $inc : { 'nextqueue' : 1 } });
							var userqueueposition = currentqueue.nextqueue;

							while (userqueueposition != currentqueue.currentqueue){
								var currentqueue = athletes.findById(athlete._id);
								sleep(1000);
							}

							stripe.customers.retrieve(
									user.stripeaccount,
									function(err, balance) {
										if (err){throw err;}
										if(!balance){
											console.log('Balance Was Not found');
										}
										else if(balance){
											console.log('Account Info:' + balance);
											var accountbalance = (+balance.account_balance * -1) / 100;

											console.log('Received Price: ' + athlete.currentprice);
											finalprice = athlete.currentprice;
											availableshares = athlete.availableshares;
											totalshares = athlete.totalshares;
											var isvalidorder = false;
											var isresellable = false;
											var externalathleteid = Number(athlete.athleteid);
											var athleteid = athlete._id;
											console.log('Total Shares: ' + totalshares);
											console.log('Available Shares: ' + availableshares);

											var existingposition = null;
											for(i in user.listofathletes){
												//username is the variable of the username of the like you want to find
												if(user.listofathletes[i].athleteid == athlete._id){
													existingposition = user.listofathletes[i];
													console.log('Found Athlete! Name:  ' + existingposition);
												}
											}

											var isneworder = true;
											var neworder = {
													quote: athlete.quote, 
													customerid: req.decoded._doc._id,
													quantity: quantity,
													actiontype: actiontype,
													cost: +quantity * +finalprice,
													commission: finalcommission,
													recordstatusdate: new Date(),
													recordstatus: '1',
													customerid: user._id,
													price: finalprice,
													extathleteid: externalathleteid,
													athleteid: athleteid,
													ispending: false
											};

											var updateshares = quantity;
											isresellable = athlete.isresellable;

											if (req.body.actiontype.toLowerCase() == "buy")
											{
												console.log("Athlete ID: " + athleteid);						    	

												if(+availableshares > +neworder.quantity && balance.account_balance)
												{
													orders.find({$and : [ {$or: [ { athleteid: athleteid }, { extathleteid: externalathleteid } ]}, {recordstatus : {$ne : 3}},{recordstatus : {$ne : 4}}, {actiontype: 'sell'}  ]},function(err,order){
														if (err) {throw err;}
														if (!order || isMarketOpen == false) {
															console.log('Orders Were Not found');

															user.listoftransactions.push({
																description: '(Pending) Buy Order: ' + athlete.name,
																amount: neworder.cost,
																actiontype: 'Buy',
																recordstatusdate: new Date(),
																recordstatus: 1
															});

															neworder.ispending = true;

															var o = new orders(neworder);

															athlete.save(function (err,athletedata) {
																if (err) {throw err;}
																if(!athletedata){
																	console.log('Athlete Save Failed!');
																	athletes.findOneAndUpdate(
																			{ _id: athlete._id },
																			{ $inc : { 'currentqueue' : 1 } });
																}
																else if(athletedata){
																	console.log('Athlete Saved Successfully!');
																	o.save(function (err,orderdata) {
																		if (err) {throw err;}
																		if(!orderdata){
																			console.log('Order Save Failed!');
																			athletes.findOneAndUpdate(
																					{ _id: athlete._id },
																					{ $inc : { 'currentqueue' : 1 } });
																		}
																		else if(orderdata){
																			console.log('Order Saved Successfully!');
																			user.save(function (err,userdata) {
																				if (err) {throw err;}
																				if(!userdata){
																					console.log('User Save Failed!');
																					athletes.findOneAndUpdate(
																							{ _id: athlete._id },
																							{ $inc : { 'currentqueue' : 1 } });
																				}
																				else if(userdata){
																					console.log('User Saved Successfully!');
																					console.log('Order sent to database');
																					// setup e-mail data with unicode symbols
																					var mailOptions = {
																							from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
																							to: '' + user.email + '', // list of receivers
																							subject: 'Your Order', // Subject line
																							text: 'Your Order was Submitted Successfully', // plaintext body
																							html: '<b>Your Order was Submitted Successfully</b>' // html body
																					};

																					// send mail with defined transport object
																					transporter.sendMail(mailOptions, function(error, info){
																						if(error){
																							return console.log(error);
																						}
																						console.log('Message sent: ' + info.response);
																					});
																					athletes.findOneAndUpdate(
																							{ _id: athlete._id },
																							{ $inc : { 'currentqueue' : 1 } });																			  
																				}
																			});	
																		}
																	});	
																}
															});
														} 
														else if (order && typeof order !== 'undefined' && order.length > 0 && isMarketOpen == true) {

															console.log('Orders: ' + order);											
															console.log('Order Quantity: ' + -updateshares);
															console.log('Order Cost: ' + neworder.cost);
															console.log('Final Price: ' + finalprice);
															console.log('Final Commission: ' + finalcommission);

															var initialQuantityRequest = updateshares;
															var remainingShares = 0;

															var counter = 0;

															while(order[counter] != null && updateshares > 0){										
																var nextOrder = order[counter];

																console.log('Next Order:' +  nextOrder);

																if(nextOrder != null){
																	var nextorderquantity = nextOrder.quantity;
																	var newquantity = +nextorderquantity + -updateshares;
																	var tempQuantity = updateshares;

																	if(nextOrder.customerid != null){
																		if(newquantity < 0){
																			nextOrder.quantity = 0;
																			updateshares = newquantity;
																			nextOrder.recordstatus = 3;
																		}
																		else{
																			nextOrder.quantity = newquantity;
																			updateshares = 0;
																		}
																		customers.findById(nextOrder.customerid, function(err, nextuser) {
																			if (err) {throw err;}
																			if (!nextuser) {
																				console.log('User was not found');
																				athletes.findOneAndUpdate(
																						{ _id: athlete._id },
																						{ $inc : { 'currentqueue' : 1 } });
																			} else if (nextuser) {
																				console.log('User found!');
																				stripe.customers.retrieve(
																						nextuser.stripeaccount,
																						function(err, nextuserbalance) {
																							if (err){throw err;}
																							if(!nextuserbalance){
																								console.log('Balance Was Not found');
																								athletes.findOneAndUpdate(
																										{ _id: athlete._id },
																										{ $inc : { 'currentqueue' : 1 } });
																							}
																							else if(nextuserbalance){
																								console.log('Account Info:' + nextuserbalance);
																								var nextuseraccountbalance = (+nextuserbalance.account_balance * -1) / 100;

																								var nextposition = nextuser.listofathletes.athleteid(athlete._id);

																								if(nextposition != null && nextposition.recordstatus != 3){
																									var nextcurrentquantity = nextposition.quantity;
																									var nextcurrentcostpershare = nextposition.costpershare;
																									var nextrecordstatus = 2;

																									if(nextOrder.quantity == 0){
																										nextrecordstatus = 3;
																									}

																									var ordercost = tempQuantity * finalprice;

																									var newquantity = +nextcurrentquantity - +tempQuantity;

																									nextposition.quantity = newquantity,
																									nextposition.costpershare = ((+nextcurrentquantity * +currentcostpershare) - (+ordercost)) / +newquantity ,
																									nextposition.athletename = athlete.name,
																									nextposition.imageurl = athlete.imageurl,
																									nextposition.recordstatusdate = new Date(),
																									nextposition.recordstatus = nextrecordstatus

																									var nextusernewbalance = parseInt((+nextuseraccountbalance + +ordercost) * 100) * -1;

																									stripe.customers.update(nextuser.stripeaccount, {
																										account_balance: nextusernewbalance
																									}, function(err, balance) {
																										if(err){throw err;}
																										if(!balance){
																											console.log("Customer failed to have account updated with new balance");
																										}
																										else if(balance){
																											console.log("Successfully refunded customer's funds: " + ordercost);


																											nextuser.listoftransactions.push({
																												description: 'Sell Order Complete: ' + athlete.name,
																												amount: ordercost,
																												actiontype: 'Sold',
																												recordstatusdate: new Date(),
																												recordstatus: 1
																											});

																											nextuser.save(function (err,data) {
																												if (err) {throw err;}
																												if(data){
																													var mailOptions = {
																															from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
																															to: '' + nextuser.email + '', // list of receivers
																															subject: 'Your Order', // Subject line
																															text: 'Your Sell Order for ' + athlete.name + ' was Purchased Sucessfully', // plaintext body
																															html: '<b>Your Sell Order for ' + athlete.name + ' was Purchased Sucessfully</b>' // html body
																													};

																													// send mail with defined transport object
																													transporter.sendMail(mailOptions, function(error, info){
																														if(error){
																															return console.log(error);
																														}
																														console.log('Message sent: ' + info.response);
																													});
																												}
																												console.log('User Info Updated and Saved Successfully!');
																											});
																										}
																									});
																								}
																							}
																						});
																			}
																		});
																	}
																	else{
																		if(newquantity < 0){
																			nextOrder.quantity = 0;
																			updateshares = newquantity;
																			nextOrder.recordstatus = 3;
																			nextOrder.isresellable = true;
																		}
																		else{
																			nextOrder.quantity = newquantity;
																			updateshares = 0;
																		}
																	}
																}
																else{
																	console.log('Orders: '+ order);
																	console.log('No Orders Found');
																	throw "No Orders Found";
																}
																counter = counter + 1;
															}

															if(updateshares >= 0){
																remainingshares = updateshares;
																updateshares = +initialQuantityRequest - +updateshares;
																neworder.cost = +updateshares * +finalprice;
																neworder.quantity = updateshares;

																var leftoverorder = {
																		quote: athlete.quote, 
																		customerid: req.decoded._doc._id,
																		quantity: remainingshares,
																		actiontype: req.body.actiontype.toLowerCase(),
																		cost: remainingshares * finalprice,
																		commission: finalcommission,
																		recordstatusdate: new Date(),
																		recordstatus: '1',
																		customerid: user._id,
																		price: finalprice,
																		extathleteid: externalathleteid,
																		athleteid: athleteid,
																		ispending: true
																};

																var lefto = new orders(leftoverorder); 

																var newbalance = parseInt((+accountbalance - +neworder.cost) * 100) * -1;

																athlete.listorders.push(neworder);
																athlete.availableshares = +availableshares + -updateshares;

																user.listoftransactions.push({
																	description: 'Buy Order: ' + athlete.name,
																	amount: neworder.cost,
																	actiontype: 'Buy',
																	recordstatusdate: new Date(),
																	recordstatus: 1
																});

																if(isresellable){
																	var x = (+neworder.quantity / +totalshares);
																	athlete.currentprice = (+finalprice * +x) + +finalprice;

																	user.pricehistory.push({
																		price: athlete.currentprice,
																		isathletevalueprice: false,
																		recordstatusdate: new Date(),
																		recordstatus: 1
																	});
																}

																if(existingposition != null){
																	var currentquantity = existingposition.quantity;
																	var currentcostpershare = existingposition.costpershare;
																	var newpositionquantity = +currentquantity + +updateshares;

																	existingposition.quantity = newpositionquantity,
																	existingposition.costpershare = ((+currentcostpershare * +currentquantity) + (+updateshares * +finalprice)) / +newpositionquantity,
																	existingposition.athletename = athlete.name,
																	existingposition.imageurl = athlete.imageurl,
																	existingposition.recordstatusdate = new Date(),
																	existingposition.recordstatus = 1
																}
																else{
																	var customerposition = {
																			quote: req.body.quote,
																			recordstatusdate: new Date(),
																			recordstatus: 1,
																			costpershare: finalprice,
																			quantity: req.body.quantity,
																			athleteid: athlete._id,
																			athletename: athlete.name,
																			athletequote: athlete.quote,
																			imageurl: athlete.imageurl
																	};
																	user.listofathletes.push(customerposition);            
																}

																var o = new orders(neworder);

																stripe.customers.update(user.stripeaccount, {
																	account_balance: newbalance
																}, function(err, balance) {
																	if(err){throw err;}
																	if(!balance){
																		console.log("Customer failed to have account updated with new balance");
																	}
																	else if(balance){
																		console.log("Successfully charged customer's funds: " + newbalance);
																		athlete.save(function (err,athletedata) {
																			if (err) {throw err;}
																			if(!athletedata){
																				console.log('Athlete Save Failed!');
																				athletes.findOneAndUpdate(
																						{ _id: athlete._id },
																						{ $inc : { 'currentqueue' : 1 } });
																			}
																			else if(athletedata){
																				console.log('Athlete Saved Successfully!');
																				o.save(function (err,orderdata) {
																					if (err) {throw err;}
																					if(!orderdata){
																						console.log('Order Save Failed!');
																						athletes.findOneAndUpdate(
																								{ _id: athlete._id },
																								{ $inc : { 'currentqueue' : 1 } });
																					}
																					else if(orderdata){
																						console.log('Order Saved Successfully!');
																						lefto.save(function (err,leftorderdata) {
																							if (err) {throw err;}
																							if(!leftorderdata){
																								console.log('Order Save Failed!');
																								athletes.findOneAndUpdate(
																										{ _id: athlete._id },
																										{ $inc : { 'currentqueue' : 1 } });
																							}
																							else if(leftorderdata){
																								console.log('Order Saved Successfully!');
																								user.save(function (err,userdata) {
																									if (err) {throw err;}
																									if(!userdata){
																										console.log('User Save Failed!');
																										athletes.findOneAndUpdate(
																												{ _id: athlete._id },
																												{ $inc : { 'currentqueue' : 1 } });
																									}
																									else if(userdata){
																										console.log('User Saved Successfully!');
																										console.log('Order sent to database');
																										console.log('Order sent to database');
																										athletes.findOneAndUpdate(
																												{ _id: athlete._id },
																												{ $inc : { 'currentqueue' : 1 } });																				 
																									}
																								});	
																							}
																						});
																					}
																				});	
																			}
																		});
																	}
																});
															}
															else{
																var newbalance = parseInt((+accountbalance - +neworder.cost) * 100) * -1;

																athlete.listorders.push(neworder);
																athlete.availableshares = +availableshares + -updateshares;

																user.listoftransactions.push({
																	description: 'Buy Order: ' + athlete.name,
																	amount: neworder.cost,
																	actiontype: 'Buy',
																	recordstatusdate: new Date(),
																	recordstatus: 1
																});

																if(isresellable){
																	var x = (+neworder.quantity / +totalshares);
																	athlete.currentprice = (+finalprice * x) + +finalprice;

																	user.pricehistory.push({
																		price: athlete.currentprice,
																		isathletevalueprice: false,
																		recordstatusdate: new Date(),
																		recordstatus: 1
																	});
																}

																if(existingposition != null){
																	var currentquantity = existingposition.quantity;
																	var currentcostpershare = existingposition.costpershare;
																	var newpositionquantity = +currentquantity + +updateshares;

																	existingposition.quantity = newpositionquantity,
																	existingposition.costpershare = ((+currentcostpershare * +currentquantity) + (+updateshares * +finalprice)) / +newpositionquantity,
																	existingposition.athletename = athlete.name,
																	existingposition.imageurl = athlete.imageurl,
																	existingposition.recordstatusdate = new Date(),
																	existingposition.recordstatus = 1
																}
																else{
																	var customerposition = {
																			quote: req.body.quote,
																			recordstatusdate: new Date(),
																			recordstatus: 1,
																			costpershare: finalprice,
																			quantity: req.body.quantity,
																			athleteid: athlete._id,
																			athletename: athlete.name,
																			athletequote: athlete.quote,
																			imageurl: athlete.imageurl
																	};
																	user.listofathletes.push(customerposition);            
																}

																var o = new orders(neworder);

																stripe.customers.update(user.stripeaccount, {
																	account_balance: newbalance
																}, function(err, balance) {
																	if(err){throw err;}
																	if(!balance){
																		console.log("Customer failed to have account updated with new balance");
																	}
																	else if(balance){
																		console.log("Successfully charged customer's funds: " + newbalance);
																		athlete.save(function (err,athletedata) {
																			if (err) {throw err;}
																			if(!athletedata){
																				console.log('Athlete Save Failed!');
																				athletes.findOneAndUpdate(
																						{ _id: athlete._id },
																						{ $inc : { 'currentqueue' : 1 } });
																			}
																			else if(athletedata){
																				console.log('Athlete Saved Successfully!');
																				o.save(function (err,orderdata) {
																					if (err) {throw err;}
																					if(!orderdata){
																						console.log('Order Save Failed!');
																						athletes.findOneAndUpdate(
																								{ _id: athlete._id },
																								{ $inc : { 'currentqueue' : 1 } });
																					}
																					else if(orderdata){
																						console.log('Order Saved Successfully!');
																						user.save(function (err,userdata) {
																							if (err) {throw err;}
																							if(!userdata){
																								console.log('User Save Failed!');
																								athletes.findOneAndUpdate(
																										{ _id: athlete._id },
																										{ $inc : { 'currentqueue' : 1 } });
																							}
																							else if(userdata){
																								console.log('User Saved Successfully!');

																								var mailOptions = {
																										from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
																										to: '' + user.email + '', // list of receivers
																										subject: 'Your Order', // Subject line
																										text: 'Your Buy Order for ' + athlete.name + ' was Purchased Sucessfully', // plaintext body
																										html: '<b>Your Buy Order for ' + athlete.name + ' was Purchased Sucessfully</b>' // html body
																								};

																								// send mail with defined transport object
																								transporter.sendMail(mailOptions, function(error, info){
																									if(error){
																										return console.log(error);
																									}
																									console.log('Message sent: ' + info.response);
																								});


																								console.log('Order sent to database');
																								console.log('Order sent to database');
																								athletes.findOneAndUpdate(
																										{ _id: athlete._id },
																										{ $inc : { 'currentqueue' : 1 } });																				
																							}
																						});	
																					}
																				});	
																			}
																		});
																	}
																});
															}
														}
														else{
															console.log('Orders Were Not found');
															athletes.findOneAndUpdate(
																	{ _id: athlete._id },
																	{ $inc : { 'currentqueue' : 1 } });
														}
													}).sort({recordstatusdate : 1});	
												}
												else{
													console.log('Buy Order was not valid');
													console.log('Available Shares: ' + availableshares);
													console.log('Order Quantity: ' + neworder.quantity);
													athletes.findOneAndUpdate(
															{ _id: athlete._id },
															{ $inc : { 'currentqueue' : 1 } });
												}	   
											}
										}
										else if(req.body.actiontype.toLowerCase() == "sell" && existingposition != null && +totalshares >= (+availableshares + +updateshares))
										{
											console.log('Order Quantity: ' + updateshares);
											console.log('Order Cost: ' + neworder.cost);
											console.log('Final Price: ' + finalprice);
											console.log('Final Commission: ' + finalcommission);

											athlete.listorders.push(neworder);
											athlete.availableshares = +availableshares + +updateshares;
											var o = new orders(neworder);

											user.listoftransactions.push({
												description: 'Sell Order Submitted: ' + athlete.name,
												amount: neworder.cost,
												actiontype: 'Sell',
												recordstatusdate: new Date(),
												recordstatus: 1
											});

											if(!isresellable && isMarketOpen == true){
												var x = (+neworder.quantity / +totalshares);
												athlete.currentprice = +finalprice - (+finalprice * +x);
												var newaccountbalance = parseInt(+accountbalance + +neworder.cost) * -1;
												stripe.customers.update(user.stripeaccount, 
														{account_balance: newaccountbalance}, function(err, balance) {
															if(err){throw err;}
															if(!balance){
																console.log("Customer failed to have account updated with new balance");
																athletes.findOneAndUpdate(
																		{ _id: athlete._id },
																		{ $inc : { 'currentqueue' : 1 } });
															}
															else if(balance){
																console.log("Successfully refunded customer's funds: " + req.body.money);
																user.listoftransactions.push({
																	description: 'Sell Order Complete: ' + athlete.name,
																	amount: neworder.cost,
																	actiontype: 'Sold',
																	recordstatusdate: new Date(),
																	recordstatus: 1
																});

																athlete.save(function (err,athletedata) {
																	if (err) {throw err;}
																	if(!athletedata){
																		console.log('Athlete Save Failed!');
																		athletes.findOneAndUpdate(
																				{ _id: athlete._id },
																				{ $inc : { 'currentqueue' : 1 } });
																	}
																	else if(athletedata){
																		console.log('Athlete Saved Successfully!');
																		o.save(function (err,orderdata) {
																			if (err) {throw err;}
																			if(!orderdata){
																				console.log('Order Save Failed!');
																				athletes.findOneAndUpdate(
																						{ _id: athlete._id },
																						{ $inc : { 'currentqueue' : 1 } });
																			}
																			else if(orderdata){
																				console.log('Order Saved Successfully!');
																				user.save(function (err,userdata) {
																					if (err) {throw err;}
																					if(!userdata){
																						console.log('User Save Failed!');
																						athletes.findOneAndUpdate(
																								{ _id: athlete._id },
																								{ $inc : { 'currentqueue' : 1 } });
																					}
																					else if(userdata){
																						console.log('User Saved Successfully!');
																						var mailOptions = {
																								from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
																								to: '' + user.email + '', // list of receivers
																								subject: 'Your Order', // Subject line
																								text: 'Your Sell Order for ' + athlete.name + ' was Purchased Sucessfully', // plaintext body
																								html: '<b>Your Sell Order for ' + athlete.name + ' was Purchased Sucessfully</b>' // html body
																						};

																						// send mail with defined transport object
																						transporter.sendMail(mailOptions, function(error, info){
																							if(error){
																								return console.log(error);
																							}
																							console.log('Message sent: ' + info.response);
																						});
																						console.log('Order sent to database');
																						athletes.findOneAndUpdate(
																								{ _id: athlete._id },
																								{ $inc : { 'currentqueue' : 1 } });
																					}
																				});	
																			}
																		});	
																	}
																});
															}
														});	
											}
											else
											{	
												orders.find({ $and : [ {$or: [ { athleteid: athleteid }, { extathleteid: externalathleteid } ]}, {recordstatus : {$ne : 3}},{recordstatus : {$ne : 3}}, {actiontype: 'buy'}  ]},function(err,order){
													if (err) {throw err;}
													if (!order || isMarketOpen == false) {
														console.log('Orders Were Not found');
														athlete.save(function (err,athletedata) {
															if (err) {throw err;}
															if(!athletedata){
																console.log('Athlete Save Failed!');
																athletes.findOneAndUpdate(
																		{ _id: athlete._id },
																		{ $inc : { 'currentqueue' : 1 } });
															}
															else if(athletedata){
																console.log('Athlete Saved Successfully!');
																o.save(function (err,orderdata) {
																	if (err) {throw err;}
																	if(!orderdata){
																		console.log('Order Save Failed!');
																		athletes.findOneAndUpdate(
																				{ _id: athlete._id },
																				{ $inc : { 'currentqueue' : 1 } });
																	}
																	else if(orderdata){
																		console.log('Order Saved Successfully!');
																		user.save(function (err,userdata) {
																			if (err) {throw err;}
																			if(!userdata){
																				console.log('User Save Failed!');
																				athletes.findOneAndUpdate(
																						{ _id: athlete._id },
																						{ $inc : { 'currentqueue' : 1 } });
																			}
																			else if(userdata){
																				console.log('User Saved Successfully!');
																				console.log('Order sent to database');
																				var mailOptions = {
																						from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
																						to: '' + user.email + '', // list of receivers
																						subject: 'Your Order', // Subject line
																						text: 'Your Sell Order for ' + athlete.name + ' was Submitted Sucessfully', // plaintext body
																						html: '<b>Your Sell Order for ' + athlete.name + ' was Submitted Sucessfully</b>' // html body
																				};

																				// send mail with defined transport object
																				transporter.sendMail(mailOptions, function(error, info){
																					if(error){
																						return console.log(error);
																					}
																					console.log('Message sent: ' + info.response);
																				});
																				athletes.findOneAndUpdate(
																						{ _id: athlete._id },
																						{ $inc : { 'currentqueue' : 1 } });
																			}
																		});	
																	}
																});	
															}
														});
													} 
													else if (order && typeof order !== 'undefined' && order.length > 0 && isMarketOpen == true) {

														var updateshares = neworder.quantity;
														var initialQuantityRequest = updateshares;
														var remainingShares = 0;

														console.log('Orders: ' + order);											
														console.log('Order Quantity: ' + -updateshares);
														console.log('Order Cost: ' + neworder.cost);
														console.log('Final Price: ' + finalprice);
														console.log('Final Commission: ' + finalcommission);

														var counter = 0;

														while(order[counter] != null && updateshares > 0){										
															var nextOrder = order[counter];

															console.log('Next Order:' +  nextOrder);

															if(nextOrder != null){
																var nextorderquantity = nextOrder.quantity;
																var newquantity = +nextorderquantity + +updateshares;
																var tempQuantity = updateshares;

																if(nextOrder.customerid != null){
																	if(newquantity < 0){
																		nextOrder.quantity = 0;
																		updateshares = newquantity;
																		nextOrder.recordstatus = 3;
																	}
																	else{
																		nextOrder.quantity = newquantity;
																		updateshares = 0;
																	}
																	customers.findById(nextOrder.customerid, function(err, nextuser) {
																		if (err) {throw err;}
																		if (!nextuser) {
																			console.log('User was not found');
																		} else if (nextuser) {
																			console.log('User found!');
																			stripe.customers.retrieve(
																					nextuser.stripeaccount,
																					function(err, nextuserbalance) {
																						if (err){throw err;}
																						if(!nextuserbalance){
																							console.log('Balance Was Not found');
																						}
																						else if(nextuserbalance){
																							console.log('Account Info:' + nextuserbalance);
																							var nextuseraccountbalance = (+nextuserbalance.account_balance * -1) / 100;

																							var nextposition = nextuser.listofathletes.athleteid(athlete._id);

																							if(nextposition != null && nextposition.recordstatus != 3){
																								var nextcurrentquantity = nextposition.quantity;
																								var nextcurrentcostpershare = nextposition.costpershare;
																								var nextrecordstatus = 2;

																								if(nextOrder.quantity == 0){
																									nextrecordstatus = 3;
																								}

																								var ordercost = +tempQuantity * +finalprice;

																								var newquantity = +nextcurrentquantity + +tempQuantity;

																								nextposition.quantity = newquantity,
																								nextposition.costpershare = ((+nextcurrentquantity * +currentcostpershare) + (+ordercost)) / +newquantity ,
																								nextposition.athletename = athlete.name,
																								nextposition.imageurl = athlete.imageurl,
																								nextposition.recordstatusdate = new Date(),
																								nextposition.recordstatus = nextrecordstatus

																								var newnextuseraccountbalance = parseInt((+nextuseraccountbalance - +ordercost) * 100) * -1;
																								stripe.customers.update(nextuser.stripeaccount, {
																									account_balance: newnextuseraccountbalance
																								}, function(err, nextaccountbalance) {
																									if(err){throw err;}
																									if(!nextaccountbalance){
																										console.log("Customer failed to have account updated with new balance");
																									}
																									else if(nextaccountbalance){
																										console.log("Successfully refunded customer's funds: " + ordercost);

																										nextuser.listoftransactions.push({
																											description: 'Sell Order Complete: ' + athlete.name,
																											amount: ordercost,
																											actiontype: 'Sold',
																											recordstatusdate: new Date(),
																											recordstatus: 1
																										});

																										nextuser.save(function (err,data) {
																											if (err) {throw err;}
																											var mailOptions = {
																													from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
																													to: '' + nextuser.email + '', // list of receivers
																													subject: 'Your Order', // Subject line
																													text: 'Your Buy Order for ' + athlete.name + ' was Completed Sucessfully', // plaintext body
																													html: '<b>Your Buy Order for ' + athlete.name + ' was Completed Sucessfully</b>' // html body
																											};

																											// send mail with defined transport object
																											transporter.sendMail(mailOptions, function(error, info){
																												if(error){
																													return console.log(error);
																												}
																												console.log('Message sent: ' + info.response);
																											});
																											console.log('User Info Updated and Saved Successfully!');
																										});
																									}
																								});
																							}
																						}
																					});
																		}
																	});
																}
																else{
																	if(newquantity < 0){
																		nextOrder.quantity = 0;
																		updateshares = newquantity;
																		nextOrder.recordstatus = 3;
																		nextOrder.isresellable = true;
																	}
																	else{
																		nextOrder.quantity = newquantity;
																		updateshares = 0;
																	}
																}
															}
															else{
																console.log('Orders: '+ order);
																console.log('No Orders Found');
																throw "No Orders Found";
															}
															counter = counter + 1;
														}

														if(updateshares >= 0){
															remainingshares = updateshares;
															updateshares = +initialQuantityRequest - +updateshares;
															neworder.cost = +updateshares * +finalprice;
															neworder.quantity = updateshares;

															var leftoverorder = {
																	quote: athlete.quote, 
																	customerid: req.decoded._doc._id,
																	quantity: remainingshares,
																	actiontype: req.body.actiontype.toLowerCase(),
																	cost: +remainingshares * +finalprice,
																	commission: finalcommission,
																	recordstatusdate: new Date(),
																	recordstatus: '1',
																	customerid: user._id,
																	price: finalprice,
																	extathleteid: externalathleteid,
																	athleteid: athleteid,
																	ispending: true
															};

															var lefto = new orders(leftoverorder); 

															var newbalance = parseInt((+accountbalance + +neworder.cost) * 100) * -1;

															athlete.listorders.push(neworder);
															athlete.availableshares = +availableshares + -updateshares;

															user.listoftransactions.push({
																description: 'Sold Order: ' + athlete.name,
																amount: neworder.cost,
																actiontype: 'Sell',
																recordstatusdate: new Date(),
																recordstatus: 1
															});

															if(isresellable){
																var x = (+neworder.quantity / +totalshares);
																athlete.currentprice = (+finalprice * +x) + +finalprice;

																user.pricehistory.push({
																	price: athlete.currentprice,
																	isathletevalueprice: false,
																	recordstatusdate: new Date(),
																	recordstatus: 1
																});
															}

															if(existingposition != null){
																var currentquantity = existingposition.quantity;
																var currentcostpershare = existingposition.costpershare;
																var newpositionquantity = +currentquantity + +updateshares;

																existingposition.quantity = newpositionquantity,
																existingposition.costpershare = ((+currentcostpershare * +currentquantity) + (+updateshares * +finalprice)) / +newpositionquantity,
																existingposition.athletename = athlete.name,
																existingposition.imageurl = athlete.imageurl,
																existingposition.recordstatusdate = new Date(),
																existingposition.recordstatus = 1
															}
															else{
																var customerposition = {
																		quote: req.body.quote,
																		recordstatusdate: new Date(),
																		recordstatus: 1,
																		costpershare: finalprice,
																		quantity: req.body.quantity,
																		athleteid: athlete._id,
																		athletename: athlete.name,
																		athletequote: athlete.quote,
																		imageurl: athlete.imageurl
																};
																user.listofathletes.push(customerposition);            
															}

															var o = new orders(neworder);

															stripe.customers.update(user.stripeaccount, {
																account_balance: newbalance
															}, function(err, balance) {
																if(err){throw err;}
																if(!balance){
																	console.log("Customer failed to have account updated with new balance");
																}
																else if(balance){
																	console.log("Successfully charged customer's funds: " + newbalance);
																	athlete.save(function (err,athletedata) {
																		if (err) {throw err;}
																		if(!athletedata){
																			console.log('Athlete Save Failed!');
																			athletes.findOneAndUpdate(
																					{ _id: athlete._id },
																					{ $inc : { 'currentqueue' : 1 } });
																		}
																		else if(athletedata){
																			console.log('Athlete Saved Successfully!');
																			o.save(function (err,orderdata) {
																				if (err) {throw err;}
																				if(!orderdata){
																					console.log('Order Save Failed!');
																					athletes.findOneAndUpdate(
																							{ _id: athlete._id },
																							{ $inc : { 'currentqueue' : 1 } });
																				}
																				else if(orderdata){
																					console.log('Order Saved Successfully!');
																					lefto.save(function (err,leftorderdata) {
																						if (err) {throw err;}
																						if(!leftorderdata){
																							console.log('Order Save Failed!');
																							athletes.findOneAndUpdate(
																									{ _id: athlete._id },
																									{ $inc : { 'currentqueue' : 1 } });
																						}
																						else if(leftorderdata){
																							console.log('Order Saved Successfully!');
																							user.save(function (err,userdata) {
																								if (err) {throw err;}
																								if(!userdata){
																									console.log('User Save Failed!');
																									athletes.findOneAndUpdate(
																											{ _id: athlete._id },
																											{ $inc : { 'currentqueue' : 1 } });
																								}
																								else if(userdata){
																									console.log('User Saved Successfully!');
																									console.log('Order sent to database');

																									var mailOptions = {
																											from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
																											to: '' + user.email + '', // list of receivers
																											subject: 'Your Order', // Subject line
																											text: 'Your Sell Order for ' + athlete.name + ' was Submitted Sucessfully', // plaintext body
																											html: '<b>Your Sell Order for ' + athlete.name + ' was Submitted Sucessfully</b>' // html body
																									};

																									// send mail with defined transport object
																									transporter.sendMail(mailOptions, function(error, info){
																										if(error){
																											return console.log(error);
																										}
																										console.log('Message sent: ' + info.response);
																									});

																									console.log('Order sent to database');
																									athletes.findOneAndUpdate(
																											{ _id: athlete._id },
																											{ $inc : { 'currentqueue' : 1 } });																					  
																								}
																							});	
																						}
																					});
																				}
																			});	
																		}
																	});
																}
															});
														}
														else if (updateshares == 0){
															var newbalance = parseInt((+accountbalance + +neworder.cost) * 100) * -1;

															athlete.listorders.push(neworder);
															athlete.availableshares = +availableshares + -updateshares;

															user.listoftransactions.push({
																description: 'Sold Order: ' + athlete.name,
																amount: neworder.cost,
																actiontype: 'Sell',
																recordstatusdate: new Date(),
																recordstatus: 1
															});

															if(isresellable){
																var x = (+neworder.quantity / +totalshares);
																athlete.currentprice = (+finalprice * +x) + +finalprice;

																user.pricehistory.push({
																	price: athlete.currentprice,
																	isathletevalueprice: false,
																	recordstatusdate: new Date(),
																	recordstatus: 1
																});
															}

															if(existingposition != null){
																var currentquantity = existingposition.quantity;
																var currentcostpershare = existingposition.costpershare;
																var newpositionquantity = +currentquantity + +updateshares;

																existingposition.quantity = newpositionquantity,
																existingposition.costpershare = ((+currentcostpershare * +currentquantity) + (+updateshares * +finalprice)) / +newpositionquantity,
																existingposition.athletename = athlete.name,
																existingposition.imageurl = athlete.imageurl,
																existingposition.recordstatusdate = new Date(),
																existingposition.recordstatus = 1
															}
															else{
																var customerposition = {
																		quote: req.body.quote,
																		recordstatusdate: new Date(),
																		recordstatus: 1,
																		costpershare: finalprice,
																		quantity: req.body.quantity,
																		athleteid: athlete._id,
																		athletename: athlete.name,
																		athletequote: athlete.quote,
																		imageurl: athlete.imageurl
																};
																user.listofathletes.push(customerposition);            
															}

															var o = new orders(neworder);

															stripe.customers.update(user.stripeaccount, {
																account_balance: newbalance
															}, function(err, balance) {
																if(err){throw err;}
																if(!balance){
																	console.log("Customer failed to have account updated with new balance");
																}
																else if(balance){
																	console.log("Successfully charged customer's funds: " + newbalance);
																	athlete.save(function (err,athletedata) {
																		if (err) {throw err;}
																		if(!athletedata){
																			console.log('Athlete Save Failed!');
																			athletes.findOneAndUpdate(
																					{ _id: athlete._id },
																					{ $inc : { 'currentqueue' : 1 } });
																		}
																		else if(athletedata){
																			console.log('Athlete Saved Successfully!');
																			o.save(function (err,orderdata) {
																				if (err) {throw err;}
																				if(!orderdata){
																					console.log('Order Save Failed!');
																					athletes.findOneAndUpdate(
																							{ _id: athlete._id },
																							{ $inc : { 'currentqueue' : 1 } });
																				}
																				else if(orderdata){
																					console.log('Order Saved Successfully!');
																					user.save(function (err,userdata) {
																						if (err) {throw err;}
																						if(!userdata){
																							console.log('User Save Failed!');
																							athletes.findOneAndUpdate(
																									{ _id: athlete._id },
																									{ $inc : { 'currentqueue' : 1 } });
																						}
																						else if(userdata){
																							console.log('User Saved Successfully!');
																							console.log('Order sent to database');

																							var mailOptions = {
																									from: '"AVEX" <avexcustomerrelations@avex.com>', // sender address
																									to: '' + user.email + '', // list of receivers
																									subject: 'Your Order', // Subject line
																									text: 'Your Sell Order for ' + athlete.name + ' was Submitted Sucessfully', // plaintext body
																									html: '<b>Your Sell Order for ' + athlete.name + ' was Submitted Sucessfully</b>' // html body
																							};

																							// send mail with defined transport object
																							transporter.sendMail(mailOptions, function(error, info){
																								if(error){
																									return console.log(error);
																								}
																								console.log('Message sent: ' + info.response);
																							});

																							console.log('Order sent to database');
																							athletes.findOneAndUpdate(
																									{ _id: athlete._id },
																									{ $inc : { 'currentqueue' : 1 } });																				  
																						}
																					});	
																				}
																			});	
																		}
																	});
																}
															});
														}
													}
													else{
														console.log('Orders Were Not found');
														athletes.findOneAndUpdate(
																{ _id: athlete._id },
																{ $inc : { 'currentqueue' : 1 } });
													}
												}).sort({recordstatusdate : 1});	
											}
										}
									});
						}
					});
				}
			}); 
		}
	});
});


//Submit Order for Customer
exports.submitorder = function(req,res){
	submitorder.run(req);
	res.json({ success: true, message: 'Order submitted successfully' });
};

//Get Customer's Account Balance
exports.accountbalance = function(req,res){
	console.log('Get Account Balance for Customer:' + req.decoded._doc.emailaddress);
	// find the user
	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('Authentication failed. User not found.');
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {
			console.log('User found!');
			stripe.customers.retrieve(
					user.stripeaccount,
					function(err, balance) {
						if(err){throw err;}
						if(!balance){
							console.log('No Balance Received');
							res.json({ success: false, message: 'No Balance Received' });
						}
						else if(balance){
							console.log('Account Info:' + balance);
							var accountbalance = (+balance.account_balance * -1);
							balance.account_balance = accountbalance;
							res.json({
								success : true,
								message : "Account Balance",
								balance : balance
							});
						}
					});		
		}
	});
};

//Add Customer Account
exports.addaccount = function(req,res){
	console.log('Add Account for Customer:' + req.decoded._doc.emailaddress);
	// find the user
	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('Authentication failed. User not found.');
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {
			console.log('User found!');
			stripe.customers.createSource(
					user.stripeaccount,
					{source: req.body.stripetoken},
					function(err, card) {
						if(err){throw err;}
						if(!card){
							console.log("Unable to add account");
							res.json({ success: false, message: 'Unable to add card' });
							var newhistory = {
									description: 'Add account failed',
									actiontype: 'Add Account',
									recordstatusdate: new Date(),
									recordstatus: 3
							};
							user.listofcustomerhistory.push(newhistory);
							user.save(function (err,userdata) {
								if (err) {throw err;}
								if(!userdata){
									console.log('User Save Failed!');
									res.json({ success: false, message: 'Unable to add card' });
								}
								else if(userdata){
									console.log('User Saved Successfully!');
									res.json({ success: false, message: 'Unable to add card' });
								}
							});	
						}
						if(card){
							console.log("Added account successfully");
							var newhistory = {
									description: 'Added account successfully',
									actiontype: 'Add Account',
									recordstatusdate: new Date(),
									recordstatus: 1
							};
							user.listofcustomerhistory.push(newhistory);

							user.save(function (err,userdata) {
								if (err) {throw err;}
								if(!userdata){
									console.log('User Save Failed!');
									res.json({ success: true, message: 'Added account successfully' });
								}
								else if(userdata){
									console.log('User Saved Successfully!');
									res.json({ success: true, message: 'Added account successfully' });
								}
							});	
						}
					});		
		}
	});
};

//Remove Customer's Account
exports.removeaccount = function(req,res){

	var accountid = req.body.accountid.trim();

	console.log('Remove account from Customer:' + req.decoded._doc.emailaddress);
	// find the user
	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('Authentication failed. User not found.');
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {
			console.log('User found!');
			stripe.customers.deleteCard(
					user.stripeaccount,
					accountid,
					function(err, confirmation) {
						if(err){throw err;}
						if(!confirmation){
							console.log("Account removal failed");
							var newhistory = {
									description: 'Account removal failed',
									actiontype: 'Removal Account',
									recordstatusdate: new Date(),
									recordstatus: 3
							};
							user.listofcustomerhistory.push(newhistory);
							user.save(function (err,userdata) {
								if (err) {throw err;}
								if(!userdata){
									console.log('User Save Failed!');
									res.json({ success: false, message: 'Account removal failed' });
								}
								else if(userdata){
									console.log('User Saved Successfully!');
									res.json({ success: false, message: 'Account removal failed' });
								}
							});	
						}
						else if(confirmation){
							console.log("Account removal succeed");
							var newhistory = {
									description: 'Account removal succeed',
									actiontype: 'Removal Account',
									recordstatusdate: new Date(),
									recordstatus: 1
							};
							user.listofcustomerhistory.push(newhistory);
							user.save(function (err,userdata) {
								if (err) {throw err;}
								if(!userdata){
									console.log('User Save Failed!');
									res.json({ success: true, message: 'Account removal succeed' });
								}
								else if(userdata){
									console.log('User Saved Successfully!');
									res.json({ success: true, message: 'Account removal succeed' });
								}
							});	
						}
					});		
		}
	});
};

//Validate Customer's External Bank Account
exports.validatebankaccount = function(req,res){

};

//Withdrawal Funds From Customer's AVEX Account
exports.withdrawal = function(req,res){
	var money = req.body.money.trim();
	var isaccount = req.body.accountid.trim();
	var transaction = 'Withdrawl ' + money + ' From Account';

	console.log('Withdrawal Money From Customer Account:' + req.decoded._doc.emailaddress);
	// find the user
	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('Authentication failed. User not found.');
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {
			console.log('User found!');
			console.log("Withdrawal " + (+money/100) +" into the customer's account");
			stripe.customers.retrieve(
					user.stripeaccount,
					function(err, balance) {
						if (err){throw err;}
						if(!balance){
							console.log('Balance Was Not found');
							res.json({ success: false, message: 'Balance Was Not Found' });
						}
						else if(balance){
							var accountbalance = (+balance.account_balance * -1);
							if(+accountbalance >= +money){
								if(isaccount){
									stripe.customers.retrieveCard(
											user.stripeaccount,
											isaccount,
											function(err, card) {
												if(err){throw err;}
												if(!card){
													console.log("No Card Found");
													res.json({ success: false, message: 'No Card Found' });
												}
												else if(card){
													stripe.charges.create({
														amount_refunded: money,
														currency: "usd",
														customer: user.stripeaccount,
														source: card.id, // obtained with Stripe.js
														description: transaction
													}, function(err, charge) {
														if(err){throw err;}
														if(!charge){
															console.log("Charge Failed");
															res.json({ success: false, message: 'Charge Failed' });
														}
														else if(charge){
															console.log("Charge was successful: " + charge);
															var newaccountbalance = (+accountbalance - +money) * -1;
															stripe.customers.update(user.stripeaccount, {
																account_balance: newaccountbalance
															}, function(err, balance) {
																if(err){throw err;}
																if(!balance){
																	console.log("Customer failed to have account updated with new balance");
																	user.listoftransactions.push({
																		description: 'Customer failed to have account updated with new balance: ' + (+money/100),
																		amount: (+money/100),
																		actiontype: 'Withdrawal',
																		recordstatusdate: new Date(),
																		recordstatus: 1
																	});
																	user.save(function (err,userdata) {
																		if (err) {throw err;}
																		if(!userdata){
																			console.log('User Save Failed!');
																			res.json({ success: false, message: 'Customer failed to have account updated with new balance' });
																		}
																		else if(userdata){
																			console.log('User Saved Successfully!');
																			res.json({ success: false, message: 'Customer failed to have account updated with new balance' });
																		}
																	});	
																}
																else if(balance){
																	console.log("Successfully refunded customer funds: " + money);
																	user.listoftransactions.push({
																		description: 'Successfully refunded customer funds: ' + (+money/100),
																		amount: (+money/100),
																		actiontype: 'Withdrawal',
																		recordstatusdate: new Date(),
																		recordstatus: 1
																	});
																	user.save(function (err,userdata) {
																		if (err) {throw err;}
																		if(!userdata){
																			console.log('User Save Failed!');
																		}
																		else if(userdata){
																			console.log('User Saved Successfully!');
																			res.json({ success: true, message: "Successfully refunded customer's funds: " + req.body.money.trim() });
																		}
																	});	
																}
															});
														}
													});	
												}
											});  
								}
								else{
									console.log("No Account ID Sent");
									res.json({ success: false, message: 'No Account ID Sent' });
								}
							}
							else{
								console.log("Customer does not have enough money in account for requested amount");
								res.json({ success: false, message: 'Customer does not have enough money in account for requested amount' });
							}
						}
					});	
		}
	});
};

//Deposit Funds Into Customer's AVEX Account
exports.deposit = function(req,res){
	var money = req.body.money.trim();
	var isaccount = req.body.accountid.trim();
	var transaction = 'Deposit ' + money + ' Into Account';

	console.log('Deposit Money into Customer Account:' + req.decoded._doc.emailaddress);
	// find the user
	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('Authentication failed. User not found.');
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {
			console.log('User found!');
			console.log("Deposit " + (+money/100) +" into the customer's account");

			if(isaccount){
				stripe.customers.retrieve(
						user.stripeaccount,
						function(err, account) {
							if (err){throw err;}
							if(!account){
								console.log('Balance Was Not found');
								res.json({ success: false, message: 'Balance Was Not Found' });
							}
							else if(account){
								var accountbalance = (+account.account_balance * -1);
								stripe.customers.retrieveCard(
										user.stripeaccount,
										isaccount,
										function(err, card) {
											if(err){throw err;}
											if(!card){
												console.log("No Account Found");
												res.json({ success: false, message: 'No Account Found' });
											}
											else if(card){
												stripe.charges.create({
													amount: money,
													currency: "usd",
													customer: user.stripeaccount,
													source: card.id, // obtained with Stripe.js
													description: transaction
												}, function(err, charge) {
													if(err){throw err;}
													if(!charge){
														console.log("Charge was unsuccessful");
														res.json({ success: false, message: 'Charge was unsuccessful' });
													}
													else if(charge){
														console.log("Charge was successful:" + charge);
														var newaccountbalance = (+accountbalance + +money) * -1;
														stripe.customers.update(user.stripeaccount, {
															account_balance: newaccountbalance
														}, function(err, balance) {
															if(err){throw err;}
															if(!balance){
																console.log("Customer failed to have account updated with new balance");
																user.listoftransactions.push({
																	description: 'Customer failed to have account updated with new balance: ' + (+money/100),
																	amount: (+money/100),
																	actiontype: 'Deposit',
																	recordstatusdate: new Date(),
																	recordstatus: 1
																});
																user.save(function (err,userdata) {
																	if (err) {throw err;}
																	if(!userdata){
																		console.log('User Save Failed!');
																	}
																	else if(userdata){
																		console.log('User Saved Successfully!');
																		res.json({ success: false, message: 'Customer failed to have account updated with new balance' });
																	}
																});	
															}
															else if(balance){
																console.log("Succesfully deposited customer's funds: " + money);
																user.listoftransactions.push({
																	description: 'Succesfully deposited customer funds: ' + (+money/100),
																	amount: (+money/100),
																	actiontype: 'Deposit',
																	recordstatusdate: new Date(),
																	recordstatus: 1
																});
																user.save(function (err,userdata) {
																	if (err) {throw err;}
																	if(!userdata){
																		console.log('User Save Failed!');
																	}
																	else if(userdata){
																		console.log('User Saved Successfully!');
																		res.json({ success: true, message: 'Customer balance was updated successfully.' });																  }
																});	
															}
														});
													}
												});	
											}
										});
							}
						});
			}
			else{
				console.log("No Card ID Sent");
				res.json({ success: false, message: 'No Card ID Sent' });
			}
		}
	});
};

//Get Team Info
exports.getteam = function(req,res){

};

//Get Customer's Account Info
exports.getcustomercards = function(req,res){
	console.log('Get Cards For Customer:' + req.decoded._doc.emailaddress);
	// find the user
	customers.findById(req.decoded._doc._id, function(err, user) {
		if (err) {throw err;}
		if (!user) {
			console.log('Authentication failed. User not found.');
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {
			console.log('User found!');
			stripe.customers.listCards(
					user.stripeaccount,
					function(err, cards) {
						if(err){throw err;}
						if(!cards){
							console.log('No Cards Received:' + cards);
							res.json({ success: false, message: 'No Cards Received:' + cards });
						}
						else if(cards){
							console.log('Cards:' + cards);
							res.json({
								success: true,
								message: "Enjoy your cards!",
								cards: cards
							});
						}
					}
			);		
		}
	});
};

//Get Athlete Info
exports.getathlete = function(req,res){
	var athleteid = req.query.athleteid.trim();

	athletes.findById(athleteid, function(err, athlete) {
		if (err) {throw err;}
		if (!athlete) {
			console.log('Nothing was found');
			res.json({ success: false, message: 'Nothing was found.' });
		} else if (athlete) {
			console.log('Received Results: ' + athlete);
			res.json({
				success: true,
				message: "Athlete Received",
				athlete: athlete
			});
		}		
	});
};

function performRequest(endpoint, method, data, success) {
	var dataString = JSON.stringify(data);
	console.log('Request Info From API: ' + host);

	var headers = {};

	if (method == 'GET') {
		endpoint += '?' + querystring.stringify(data);
		console.log('Endpoint: ' + endpoint);
	}
	else {
		headers = {
				'Content-Type': 'application/json',
				'Content-Length': dataString.length
		};
	}
	var options = {
			host: host,
			path: endpoint,
			method: method,
			headers: headers,
			rejectUnauthorized:false
	};

	var req = https.request(options, function(res) {
		res.setEncoding('utf-8');

		var responseString = '';

		res.on('data', function(data) {
			responseString += data;
		});

		res.on('end', function() {
			console.log(responseString);
			var responseObject = JSON.parse(responseString);
			success(responseObject);
		});
	});

	req.write(dataString);
	req.end();
};

module.export = router;


