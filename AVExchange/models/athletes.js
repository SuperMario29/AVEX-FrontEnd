// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//set up a mongoose model and pass it using module.exports
var athletevalue = new Schema({ 
    athletevalue: Number,
    currentprice : Number,
    recordstatusdate: Date,
});

//set up a mongoose model and pass it using module.exports
var price = new Schema({ 
    price : Number,
    recordstatusdate: Date,
    recordstatus: Number,
    isathletevalueprice: Boolean
});

var team  = new Schema({ 
    name: String,
    sport: String,
    address1: String,
    address2: String,
    country: String,
    state: String,
    city: String,
    zipcode: String,
    imageurl: String,
    recordstatusdate: Date,
    recordstatus: Number,
});

//set up a mongoose model and pass it using module.exports
var order = new Schema({ 
    recordstatus: Number,
	recordstatusdate: Date,
    actiontype: String,
    quantity: Number,
    cost: Number,
    commission: Number,
    customerid: String,
    price: Number
});

// set up a mongoose model and pass it using module.exports
var athleteSchema = new Schema({ 
    name: String,
    quote: String,
    sport: String,
    position: String,
    imageurl: String,
    currentprice: Number,
    availableshares: Number,
    totalshares: Number,
    isresellable: Boolean,
    athletevalues: [athletevalue],
    pricehistory: [price],
    team : team,
    listorders : [order],
    athleteid: Number,
    currentqueue: Number,
    nextqueue: Number
});

mongoose.model('athletes',athleteSchema);

