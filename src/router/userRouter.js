const {GET,POST,DELETE,PUT,LOGIN,REGISTER} = require('../utils/constant');
const {login,register} = require('../routerHandler/userRouterHandler');

module.exports = (req,res,next)=>{
    switch(req.method){
        case GET:next();break;
        case POST: 
            {
                switch(req.path)
                {
                    //登录
                    case LOGIN:
                            login(req,res,next);
                            break;
                    //注册
                    case REGISTER:
                            register(req,res,next);
                            break;
                    default:next();
                    // if(isAuthorized(req)){
                        //     next();
                        // }
                        // else{
                        //     res.status(401).send('未授权');
                        // };
                }
                break;
            }
        case DELETE:next();break;
        case PUT:next();break;
        default:next();
    }
   
};