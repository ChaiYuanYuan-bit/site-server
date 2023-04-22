const routes = require('../utils/constant');
const routerHandler = require('../routerHandler/userRouterHandler');
const {isAuthorized,isExpired} = require('../utils/verifyToken')

module.exports = (req,res,next)=>{
    /*
        token验证规则：
            1. Get用户信息，以及POST,DELETE,PUT等修改操作均需要验证规则
            2. GET其余信息不需要验证
            3. POST下的登录和注册不需要验证
    */
    let needVerify = false;
    if(req.method === routes.POST && req.path !== routes.LOGIN && req.path !== routes.REGISTER)
    {
        needVerify = true;
    }
    else if(req.method === routes.GET && req.path === routes.GETUSER || req.path.indexOf('/users') !== -1)
    {
        needVerify = true;
    }
    else if(req.method === routes.PUT || req.method === routes.DELETE )
    {
        needVerify = true;
    }
    if(needVerify)
    {
        const token = req.headers.token;
        //验证token
        if(!token || !isAuthorized(token))
        {
            console.log('isAuthorized false')
            res.json({status:400,success:false,message:'未授权！'});
            console.log('未授权！');
            return;
        }
        else if(isExpired(token))
        {
            console.log('isExpired false')
            res.json({status:400,success:false,message:'token已过期，请重新登录！'});
            console.log('token已过期，请重新登录');
            return;
        }
    }
    switch(req.method){
        case routes.GET:
            console.log(req.query);
                switch(req.path)
                {
                    case routes.GETUSER:
                            routerHandler.getUser(req,res);
                            break;
                    case routes.USER_ORDER_NUM:
                            routerHandler.getUserOrderNum(req,res);
                            break;
                    case routes.USER_NUM:
                            routerHandler.getUserNum(req,res);
                            break;
                    default:next();
                }
                break;
        case routes.POST: 
        console.log(req.body);
            {
                switch(req.path)
                {
                    //登录
                    case routes.LOGIN:
                            routerHandler.login(req,res);
                            break;
                    //注册
                    case routes.REGISTER:
                            routerHandler.register(req,res);
                            break;
                    //添加订单
                    case routes.ADD_ORDER:
                        setTimeout(()=>{routerHandler.addOrder(req,res);},2000);
                            break;
                    //取消订单
                    case routes.CANCEL_ORDER:
                        setTimeout(()=>{routerHandler.cancelOrder(req,res);},2000);
                            break;
                    // 验证支付密码
                    case routes.VERIFY_PAYCODE:
                        setTimeout(()=>{routerHandler.verifyPayCode(req,res);},2000);
                            break;
                    // 支付订单
                    case routes.PAY_ORDER:
                        setTimeout(()=>{routerHandler.payOrder(req,res);},2000);
                            break;
                    case routes.MODIFY_USER:
                        setTimeout(()=>{routerHandler.modifyUser(req,res);},2000);
                        break;
                    case routes.MODIFY_SELF:
                        setTimeout(()=>{routerHandler.modifySelf(req,res);},2000);
                        break;
                    default:next();
                }
                break;
            }
        case routes.DELETE:next();break;
        case routes.PUT:next();break;
        default:next();
    }
};