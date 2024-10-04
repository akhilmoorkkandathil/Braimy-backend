const multer = require('multer');


// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
       //console.log("=========[[]]]]]");
      cb(null, 'uploads/'); // Specify the directory where files will be stored
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Specify how files should be named
    }
  });
  
  const upload = multer({ storage: storage });

  module.exports = upload