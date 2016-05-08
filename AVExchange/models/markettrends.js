 // get an instance of mongoose and mongoose.Schema
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    
// set up a mongoose model and pass it using module.exports
var athlete = new Schema({ 
    name: String,
    quote: String,
    sport: String,
    position: String,
    imageurl: String,
    currentprice: Number,
    availableshares: Number
});

var market = new Schema({
	marketprice: Number,
	recordstatusdate : Date,
	recordstatus : Number
});

var marketTrendsSchema = new Schema({
	totalmarkettoday: [market],
	totalmarketpast5days: [market],
	totalmarketpastmonth: [market],
	totalmarketpastyear: [market],
	totalmarketpast5years: [market],
	totalmarketpast10years: [market],
	topgainerstoday: [athlete],
	toploserstoday: [athlete],
	recordstatusdate: Date,
	recordstatus: Number	
});

mongoose.model('markettrends',marketTrendsSchema);