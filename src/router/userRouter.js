const {GET,POST,DELETE,PUT,LOGIN,REGISTER,GETUSER} = require('../utils/constant');
const {login,register,getUser} = require('../routerHandler/userRouterHandler');

module.exports = (req,res,next)=>{
    switch(req.method){
        case GET:console.log(req.query);console.log(req.headers.token);
        {
            switch(req.path)
                {
                    case GETUSER:
                            getUser(req,res);
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
        case POST: 
        console.log(req.body);
            {
                switch(req.path)
                {
                    //登录
                    case LOGIN:
                            login(req,res);
                            break;
                    //注册
                    case REGISTER:
                            register(req,res);
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