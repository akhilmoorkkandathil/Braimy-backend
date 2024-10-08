import jwt from 'jsonwebtoken';
import { CreateError } from './error.js';

const commonMethods = {
    createToken:(id,isUser)=>{
       const token = jwt.sign(
            { id: id, isUser: isUser },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        return token
    },
     parseJwt:(token)=> {
        try {
            if (!token) {
                return CreateError(500, "Token not found");
            }
            return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        } catch (e) {
            throw new Error('Invalid token');
        }
}
}

export default commonMethods;