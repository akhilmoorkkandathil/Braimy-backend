const cloudinary = require('cloudinary').v2;
//s3 bucket -presigned url
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDAPIKEY,
  api_secret: process.env.CLOUDINARYSECRET
});

module.exports = cloudinary