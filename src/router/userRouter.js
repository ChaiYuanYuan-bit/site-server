const {GET,POST,DELETE,PUT,LOGIN,REGISTER,GETUSER} = require('../utils/constant');
const {login,register,getUser} = require('../routerHandler/userRouterHandler');
const {isAuthorized,isExpired} = require('../utils/verifyToken')
const {passRoules} = require('../../config')

module.exports = (req,res,next)=>{
    /*
        token验证规则：
            1. Get用户信息，以及POST,DELETE,PUT等修改操作均需要验证规则
            2. GET其余信息不需要验证
            3. POST下的登录和注册不需要验证
    */
    let needVerify = false;
    if(req.method === POST && req.path !== LOGIN && req.path !== REGISTER)
    {
        needVerify = true;
    }
    else if(req.method === GET && req.path.indexOf('/users') !== -1)
    {
        needVerify = true;
    }
    else if(req.method === PUT || req.method === DELETE )
    {
        needVerify = true;
    }
    if(needVerify)
    {
        const token = req.headers.token;
        //验证token
        if(!token || !isAuthorized(token))
        {
            res.json({status:400,success:false,message:'未授权！'});
            console.log('未授权！');
            return;
        }
        else if(isExpired(token))
        {
            res.json({status:400,success:false,message:'token已过期，请重新登录！'});
            console.log('token已过期，请重新登录');
            return;
        }
    }
    switch(req.method){
        case GET:
                switch(req.path)
                {
                    case GETUSER:
                            getUser(req,res);
                            break;
                    default:next();
                }
                break;
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
                }
                break;
            }
        case DELETE:next();break;
        case PUT:next();break;
        default:next();
    }
};