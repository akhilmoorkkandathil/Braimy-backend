module.exports = {
     CreateSuccess(statusCode, successMessage, data, access_token){
        const successObj = {
            success: [200,204,201].some(a=> a===statusCode)? true : false,
            status : statusCode,
            message: successMessage,
            data: data,
            token: access_token
        };
        return successObj;
    }
}