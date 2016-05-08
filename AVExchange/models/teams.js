// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamSchema  = new Schema({ 
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

mongoose.model('teams',teamSchema);