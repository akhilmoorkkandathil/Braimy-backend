
module.exports = {
    CreateError(statusCode, errorMessage){
       const errObj = {
           status : statusCode,
           message: errorMessage,
       };
       return errObj;
   }
}