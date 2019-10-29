const mongoose = require('mongoose');
bodyparser = require("body-parser");
mongoose.connect('mongodb://localhost:27017/pms', {useNewUrlParser: true, useCreateIndex:true,});  
var conn = mongoose.Collection;

var passSchema = new mongoose.Schema({
    password_category:{
        type:String,
        required:true,
        index:{
            unique:true,
        }},
    password_detail:{
            type:String,
            required:true,
            },
   
    date:{
        type:Date,
        default:Date.now
    }

}); 

var passModel = mongoose.model('password_details',passSchema);
module.exports=passModel;