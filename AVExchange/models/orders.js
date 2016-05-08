// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//set up a mongoose model and pass it using module.exports
var orderSchema = new Schema({ 
    recordstatus: Number,
	recordstatusdate: Date,
    actiontype: String,
    quantity: Number,
    cost: Number,
    commission: Number,
    customerid: String,
    price: Number,
    athleteid: String,
    extathleteid: Number,
    ispending: Boolean
});

mongoose.model('orders',orderSchema);