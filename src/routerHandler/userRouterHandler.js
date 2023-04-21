//引入读取数据库方法
const getDataBase = require("../utils/getDataBase")
// aes解密模块
const {decrypt} =  require('../utils/decrypt')
// bcrypt加密模块
const bcrypt = require('bcryptjs');
// 引入token生成器
const jwt = require("jsonwebtoken");
// 生成token的config
const {jwtSecretKey,expiresIn} = require('../../config');
// 引入封装好的axios
const { axiosInstance } = require("../utils/request");
// 引入封装好的文件系统
const { writeFile } = require("../utils/file")
// 引入注册用户初始余额
const {initBalance} = require("../../config")
// 引入路径
const path = require("path")
// 引入文件系统
const fs = require('fs');
// 引入封装好的guid
const Guid = require('../utils/orderId');
const dayjs = require("dayjs");

// 登录业务
exports.login = async (req,res)=>{
    //获取数据库
    const $db = await getDataBase.$db();
    const userInfo = req.body;
    //查找用户
    const userIndex = $db.users.findIndex(item=>item.username===userInfo.username);
    if(userIndex>=0){
         //若存在，则验证密码
         //aes解密,并bcrypt比较
        const isCorrect = bcrypt.compareSync(decrypt(userInfo.password),$db.users[userIndex].password);
        if(isCorrect){
            //判断权限
            if( $db.users[userIndex].roleType.roleTypeId==3)
            {
                res.json({status:200,success:false,message:'未授权用户，请联系管理员！'});
            }
            else
            {
                const {id,username,phone,email,roleType} = $db.users[userIndex];
                const user = {id,username,phone,email,roleTypeId:roleType.roleTypeId}
                const token = "Bearer" +" " + jwt.sign(user, jwtSecretKey, {expiresIn});
                res.json({status:200,success:true,message:'登录成功!',token});
            }
        }
        else{
            res.json({status:400,success:false,message:'用户名或密码错误，请重新输入！'});
        }
    }
    else{
         //若不存在，则响应错误
        res.json({status:400,success:false,message:'用户不存在，请重新输入！'});
    }
};

// 注册业务
exports.register = async (req,res)=>{
    //获取数据库
    const $db = await getDataBase.$db()
    //用户信息
    const regInfo = req.body;
    //非空检查
    if(regInfo && regInfo.username && regInfo.password)
    {
        //查找是否已经存在该用户
        const userIndex = $db.users.findIndex(item=>item.username===regInfo.username);
        if(userIndex>=0){
            //若存在，响应错误信息
            res.json({status:406,success:false,message:'用户名已经存在，请使用其他用户名！'});
        }
        else{
            //若不存在，则注册用户
            //先aes解密，再对密码bcrypt加密，随机椒盐长度为10
            const password = bcrypt.hashSync(decrypt(regInfo.password),10);
            $db.users.push({id:$db.users.length+1,...regInfo,password,balance:initBalance,orders:[]});
            //写入JSON
            writeFile(path.join(__dirname,'../../public/database/db.json'),JSON.stringify($db,null,2))
            .then(res.send({status:200,success:true,message:'注册成功！'}))
            .catch(error=>res.send({status:500,success:false,message:'服务端错误，请稍后再试！'}));
        }
    }
    else{
        //若为空则响应错误信息
        res.status(200).json({success:false,message:'用户名或密码不能为空！'});
    }
};

// 获取用户信息
exports.getUser = async (req,res)=>{
    //获取数据库
    const $db = await getDataBase.$db()
    //用户信息
    const userInfo = req.query;
    //非空检查
    if(userInfo && userInfo.id)
    {
        //查找是否已经存在该用户
        const userIndex = $db.users.findIndex(item=>item.id===userInfo.id*1);
        const info = $db.users[userIndex];
        if(userIndex>=0){
            //若存在，返回该用户,并去掉密码属性
            res.send({status:200,success:true,userInfo:{...info,password:undefined,orders:undefined}});
        }
        else{
            //若不存在
            res.send({status:400,success:false,message:"找不到该用户"});
        }
    }
    else{
        //若为空则响应错误信息
        res.send({status:400,success:false,message:'用户id不能为空！'});
    }
};

// 生成订单（此时只生成订单，状态为未支付，先减少商品数量，不扣钱）
exports.addOrder = async (req,res)=>{
    // 获取数据库
    const $db = await getDataBase.$db();
    // 订单信息
    const orderInfo = req.body;
    const {userId,goodsTypeName,goodsId,comboId,count,days,dataRange} = orderInfo;
    // 非空检查
    if(userId && goodsTypeName && goodsId && comboId && count && days && dataRange[0]&& dataRange[1])
    {
        //找到用户信息
        const user = $db.users.find(item=>item.id===userId*1);
        const username = user.username;
        const roleTypeName = user.roleType.roleTypeName;
        console.log("############",orderInfo)
        // 生成订单号
        const orderId = Guid.create();
        // 查询价格
        let goods = $db[goodsTypeName].find(goods=>goods.id===goodsId);
        let combo = goods.detail.comboType.find(combos=>combos.comboTypeId===comboId);
        let price = combo.comboPrice
        let discount = 0;
        // 计算总价
        let totalPrice = count * price;
        // 生成订单信息
        let newOrder = {
            id:$db.orderPool.length+1,
            orderId:orderId,
            orderDetail:{
                userId,
                username,
                roleTypeName,
                goodsTypeName,
                goodsId,
                storeName:goods.detail.name,
                location:goods.detail.location,
                comboId,
                comboTypeName:combo.comboTypeName,
                comboIntro:combo.comboIntro,
                comboImgUrl:combo.comboImgUrl,
                count,
                comboPrice:price,
                dataRange,
                days,
                payType:["余额支付"],
                discount,
                totalPrice
            },
            orderTime:dayjs().format('YYYY-MM-DD HH:mm:ss:SSS').toString(),
            orderState:"unpay",
            orderStateName:"待付款"
        }
        // 订单池中添加订单
        $db.orderPool.push(newOrder);
        //用户信息orders中添加订单
        const userIndex = $db.users.findIndex(item=>item.id===userId);
        $db.users[userIndex].orders.push({
            id:$db.users[userIndex].orders.length+1,
            orderId:orderId
        });
        // 减少对应商品的数量
        let goodsIndex = $db[goodsTypeName].findIndex(item=>item.id===goodsId);
        let comboIndex = goods.detail.comboType.findIndex(item=>item.comboTypeId===comboId);
        console.log($db[goodsTypeName][goodsIndex].detail.comboType[comboIndex])
        $db[goodsTypeName][goodsIndex].detail.comboType[comboIndex].comboCount -= count;
        //写入JSON
        writeFile(path.join(__dirname,'../../public/database/db.json'),JSON.stringify($db,null,2))
        .then(res.send({status:200,success:true,message:`已创建订单，订单编号为:${orderId}`,orderId}))
        .catch(error=>res.send({status:500,success:false,message:'服务端错误，请稍后再试！'}));
    }
    else
    {
        res.send({status:200,success:false,message:'下单错误！'});
    }
}

// 取消订单 (更改订单状态为已取消，恢复商品数量)
exports.cancelOrder = async (req,res)=>{
    // 获取数据库
    const $db = await getDataBase.$db();
    // 订单Id
    const {orderId} = req.body;
    // 非空检查
    if(orderId)
    {
        // 查找订单
        let orderIndex = $db.orderPool.findIndex(order=>order.orderId===orderId);
        if(orderIndex>=0)
        {
            //拿出订单
            let order = $db.orderPool[orderIndex];
            //找到所买商品类型，套餐类型，购买数量
            const goodsTypeName = order.orderDetail.goodsTypeName;
            const goodsId = order.orderDetail.goodsId;
            const comboId = order.orderDetail.comboId;
            const count = order.orderDetail.count;
            const orderState = order.orderState;
            // 取消订单还应该返回优惠券
            console.log('orderState',orderState)
            if(orderState === 'canceled')
            {
                res.send({status:200,success:false,message:`订单状态错误：是已取消的订单！`});
            }
            else if(orderState === 'payed'){
                res.send({status:200,success:false,message:`订单状态错误：是已支付的账单`});
            }
            else
            {
                //恢复商品数量
                const goodsIndex = $db[goodsTypeName].findIndex(goods=>goods.id===goodsId)
                const comboIndex = $db[goodsTypeName][goodsIndex].detail.comboType.findIndex(combo=>combo.comboTypeId===comboId);
                $db[goodsTypeName][goodsIndex].detail.comboType[comboIndex].comboCount += count;
                //更改订单状态
                $db.orderPool[orderIndex].orderState = 'canceled';
                $db.orderPool[orderIndex].orderStateName = '已取消';
                $db.orderPool[orderIndex].finishTime = dayjs().format('YYYY-MM-DD HH:mm:ss:SSS').toString();
                //写入JSON
                writeFile(path.join(__dirname,'../../public/database/db.json'),JSON.stringify($db,null,2))
                .then(res.send({status:200,success:true,message:'订单已取消'}))
                .catch(error=>res.send({status:500,success:false,message:'服务端错误，请稍后再试！'}));
                } 
            }
        else
        {
            res.send({status:200,success:false,message:'该订单不存在！',orderId})
        }
    }
    else
    {
        res.send({status:200,success:false,message:'客户端错误！'});
    }
}

// 验证支付密码
exports.verifyPayCode = async (req,res)=>{
    //获取数据库
    const $db = await getDataBase.$db();
    const userInfo = req.body;
    const {userId,password} = userInfo;
    //合法性检查
    if(userId && password)
    {
        //查找用户
        const userIndex = $db.users.findIndex(item=>item.id===userId*1);
        if(userIndex>=0){
            //若存在，则验证密码
            //aes解密,并bcrypt比较
            const isCorrect = bcrypt.compareSync(decrypt(userInfo.password),$db.users[userIndex].password);
            if(isCorrect){
                res.json({status:200,success:true,message:'支付密码正确'});
            }
            else{
                res.json({status:400,success:false,message:'支付密码错误'});
            }
        }
        else{
            //若不存在，则响应错误
            res.json({status:400,success:false,message:'该用户不存在！'});
        }
    } else
    {
        res.send({status:400,success:false,message:'客户端错误'});
    }
}

// 支付订单业务 
exports.payOrder = async (req,res)=>{
     //获取数据库
     const $db = await getDataBase.$db();
     const orderInfo = req.body;
     const {orderId} = orderInfo;
     //合法性检查
    if(orderId)
    {
        //查找订单
        const orderIndex = $db.orderPool.findIndex(item=>item.orderId===orderId);
        if(orderIndex>=0){
            //若存在，则检查用户余额
            const userId = $db.orderPool[orderIndex].orderDetail.userId;
            const totalPrice = $db.orderPool[orderIndex].orderDetail.totalPrice;
            const userIndex = $db.users.findIndex(item=>item.id===userId);
            const balance =  $db.users[userIndex].balance;
            const orderState = $db.orderPool[orderIndex].orderState;
            if(orderState === 'canceled')
            {
                res.send({status:200,success:false,message:`订单状态错误：该订单已被取消`});
            }
            else if(orderState === 'payed'){
                res.send({status:200,success:false,message:`订单状态错误：是已支付的账单`});
            }
            else{
                if(totalPrice>balance)
                {
                    //余额不足
                    res.json({status:200,success:false,message:'余额不足'});
                }
                else{
                    //扣款
                    $db.users[userIndex].balance -= totalPrice;
                    //订单状态改为已完成
                    $db.orderPool[orderIndex].orderState = 'payed';
                    //订单状态描述
                    $db.orderPool[orderIndex].orderStateName = '待使用';
                    $db.orderPool[orderIndex].finishTime = dayjs().format('YYYY-MM-DD HH:mm:ss:SSS').toString(),
                    //写入JSON
                    writeFile(path.join(__dirname,'../../public/database/db.json'),JSON.stringify($db,null,2))
                    .then(res.send({status:200,success:true,message:`支付成功`}))
                    .catch(error=>res.send({status:500,success:false,message:'服务端错误，请稍后再试！'}));
                }
            }
        }
        else{
            //若不存在，则响应错误
            res.json({status:400,success:false,message:'该订单不存在！'});
        }
    } else
    {
        res.send({status:400,success:false,message:'客户端错误'});
    }
}

// 查询用户的订单总数量
exports.getUserOrderNum = async (req,res)=>{
    // 获取数据库
    const $db = await getDataBase.$db();
    // 用户
    let {userId,orderState,searchInput} = req.query;
      //合法性检查
      if(userId)
      {
        console.log('在查看个人订单')
          //查找用户
        const userIndex = $db.users.findIndex(item=>item.id===userId*1);
        if(userIndex>=0)
        {   
            let userOrders = $db.orderPool.filter(item=>item.orderDetail.userId===userId*1);
            if(orderState)
            {
                //条件过滤
                userOrders = userOrders.filter(item=>item.orderState===orderState);
            }
            const orderNum = userOrders.length;
            res.send({status:200,success:true,message:'查询成功',orderNum})
        }
        else{
            res.send({status:200,success:false,message:'找不到该用户订单信息！'})
        }
      } else
      {
        console.log('在查看所有订单')
        let allOrders = $db.orderPool;
        if(orderState)
        {
            //条件过滤
            allOrders = allOrders.filter(item=>item.orderState===orderState);
        }
        //过滤搜索条件
        if(searchInput!==undefined)
        {
            //查询订单id
            if(searchInput.orderId)
            {
                allOrders = allOrders.filter(item=>item.orderId.indexOf(searchInput.orderId)>=0);
            }
            if(searchInput.storeName)
            {
                allOrders = allOrders.filter(item=>item.orderDetail.storeName.indexOf(searchInput.storeName)>=0);
            }
            if(searchInput.orderTime&&searchInput.orderTime[0]&&searchInput.orderTime[1])
            {
                allOrders = allOrders.filter(item=>dayjs(item.orderTime).isAfter(searchInput.orderTime[0])
                &&dayjs(item.orderTime).isBefore(searchInput.orderTime[1]));
            }
            if(searchInput.userName)
            {
                allOrders = allOrders.filter(item=>item.orderDetail.username.indexOf(searchInput.userName)>=0);
            }
            if(searchInput.roleTypeName)
            {
                if(searchInput.roleTypeName!=='all')
                {
                    allOrders = allOrders.filter(item=>item.orderDetail.roleTypeName.indexOf(searchInput.roleTypeName)===searchInput.roleTypeName);
                }
            }
            if(searchInput.goodsType)
            {
                if(searchInput.goodsType!=='all')
                {
                    allOrders = allOrders.filter(item=>item.orderDetail.goodsTypeName===searchInput.goodsType);
                }
            }
        }
        const orderNum = allOrders.length;
        console.log(orderNum);
        res.send({status:200,success:true,message:'查询成功',orderNum});
      }
}

//获取用户总数量
exports.getUserNum = async (req,res)=>{
     // 获取数据库
     const $db = await getDataBase.$db();
      // 用户
    let {roleTypeId,searchType,keyWord} = req.query;
    console.log(roleTypeId,searchType,keyWord)
    let allUsers =  $db.users;
    // 筛选对应roleTypeId的用户
    if(roleTypeId*1!==0&&roleTypeId!==undefined)
    {
        allUsers = allUsers.filter(item=>item.roleType.roleTypeId===roleTypeId*1)
    }
     //如果搜索条件不等于all
     if(searchType!=='all' && keyWord)
     {
         keyWord = keyWord.trim();
         //keyWord非空时才查询
         switch(searchType)
             {
                 case 'username':
                    allUsers = allUsers.filter(item=>item.username.indexOf(keyWord)>=0);
                     break;
                 case 'phone':
                    allUsers = allUsers.filter(item=>item.phone.indexOf(keyWord)>=0);
                     break;
                 case 'email':
                    allUsers = allUsers.filter(item=>item.email.indexOf(keyWord)>=0);
                     break;
             }
     }
    let num = allUsers.length;
    res.send({status:200,success:true,message:'查询成功',num});
}

//修改用户信息
exports.modifyUser = async(req,res)=>{
    // 获取数据库
    const $db = await getDataBase.$db();
    // 用户
    const {userId,roleTypeId,balance} = req.body;
    // 非空检查
    if(userId!==undefined&&roleTypeId!==undefined&&balance!==undefined)
    {
        const userIndex = $db.users.findIndex(item=>item.id===userId*1);
        const userInfo = $db.users[userIndex];
        let changed = false;
        if(balance*1!==userInfo.balance)
        {
            $db.users[userIndex].balance = balance;
            changed = true;
        }
        if(roleTypeId*1!==userInfo.roleType.roleTypeId)
        {
            const roleType = $db.roleType.find(item=>item.id===roleTypeId);
            $db.users[userIndex].roleType = {
                roleTypeId:roleType.id,
                roleTypeName:roleType.roleName
            }
            changed = true;
        }
        if(changed)
        {
          //写入JSON
          writeFile(path.join(__dirname,'../../public/database/db.json'),JSON.stringify($db,null,2))
          .then(res.send({status:200,success:true,message:`修改成功`}))
          .catch(error=>res.send({status:500,success:false,message:'服务端错误，请稍后再试！'}));
        }
        else{
            res.send({status:200,success:true,message:`修改成功`})
        }
    }
    else{
        res.send({status:400,success:false,message:'客户端错误'});
    }
}

//修改自己信息
exports.modifySelf = async(req,res)=>{
    // 获取数据库
    const $db = await getDataBase.$db();
    // 用户
    const {userId,phone,email} = req.body;
    // 非空检查
    if(userId!==undefined&&phone!==undefined&&email!==undefined)
    {
        const userIndex = $db.users.findIndex(item=>item.id===userId*1);
        const userInfo = $db.users[userIndex];
        let changed = false;
        if(phone!==userInfo.phone)
        {
            $db.users[userIndex].phone = phone;
            changed = true;
        }
        if(email!==userInfo.email)
        {
            $db.users[userIndex].email = email;
            changed = true;
        }
        if(changed)
        {
          //写入JSON
          writeFile(path.join(__dirname,'../../public/database/db.json'),JSON.stringify($db,null,2))
          .then(res.send({status:200,success:true,message:`修改成功`}))
          .catch(error=>res.send({status:500,success:false,message:'服务端错误，请稍后再试！'}));
        }
        else{
            res.send({status:200,success:true,message:`修改成功`})
        }
    }
    else{
        res.send({status:400,success:false,message:'客户端错误'});
    }
}