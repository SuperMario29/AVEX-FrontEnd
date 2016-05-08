// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//set up a mongoose model and pass it using module.exports
var transaction = new Schema({ 
    description: String,
    isdeposit: Boolean,
    iswithdrawl: Boolean,
    isrefund: Boolean,
    isdividend: Boolean,
    dollarvalue: Number,
    commission: Number,
    recordstatusdate: Date,
    recordstatus: Number
    });

var accountsSchema = new Schema({ 
    currentbalance: Number,
    pendingbalance: Number,
    recordstatusdate: Date,
    recordstatus: Number,
    transactionlist : [transaction]
});

mongoose.model('accounts',accountsSchema);