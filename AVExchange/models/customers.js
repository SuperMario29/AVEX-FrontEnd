// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var positionSchema = new Schema({ 
    quantity: Number,
    costpershare: Number,
    currentprice: Number,
    reinvestdividend: Number,
    athleteid: String,
    athletename: String,
    athletequote: String,
    imageurl: String,
    recordstatusdate: Date,
    recordstatus: Number
});

var transactionSchema = new Schema({ 
    description: String,
    amount: Number,
    actiontype: String,
    recordstatusdate: Date,
    recordstatus: Number
});

var customerhistorySchema = new Schema({ 
    description: String,
    actiontype: String,
    recordstatusdate: Date,
    recordstatus: Number
});

// set up a mongoose model and pass it using module.exports
var customersSchema = new Schema({ 
    name: String,
    emailaddress: String,
    username: String,
    address1: String,
    address2: String,
    phone: String,
    country: String,
    state: String,
    city: String,
    zipcode: String,
    stripeaccount: String,
    password: String,
    listofathletes: [positionSchema],
    listoftransactions: [transactionSchema],
    listofcustomerhistory: [customerhistorySchema],
    recordstatusdate: Date,
    recordstatus: Number,
    admin: Boolean 
});

mongoose.model('customers',customersSchema);