const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({

  order:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Order"
  },

  farmer:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Farmer"
  },

  supermarket:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Supermarket"
  },

  driver:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Driver"
  },

  pickupLocation:{
    address:String,
    lat:Number,
    lng:Number
  },
  dropLocation:{
    lat:Number,
    lng:Number,
    address:String
  },
  deliveryDate:Date,

  distanceKm:Number,
  loadKg:Number,
  deliveryCharge:Number,

  status:{
    type:String,
    enum:["AVAILABLE","ASSIGNED","IN_TRANSIT","COMPLETED"],
    default:"AVAILABLE"
  }

},{timestamps:true});

module.exports = mongoose.model("Delivery", deliverySchema);
