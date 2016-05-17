// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var datastoreSchema = new Schema({ 
	description: String,
    actiontype: String,
    recordstatusdate: Date,
    recordstatus: Number 
});

mongoose.model('datastore',datastoreSchema);


