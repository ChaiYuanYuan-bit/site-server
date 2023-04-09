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
//登录业务
exports.login = (req,res)=>{
    //获取数据库
    const $db = getDataBase.$db()
    const userInfo = req.body;
    //查找用户
    const userIndex = $db.users.findIndex(item=>item.username===userInfo.username);
    if(userIndex>=0){
         //若存在，则验证密码
         //aes解密,并bcrypt比较
        const isCorrect = bcrypt.compareSync(decrypt(userInfo.password),$db.users[userIndex].password);
        if(isCorrect){
            const {id,username,phone,email} = $db.users[userIndex];
            const user = {id,username,phone,email}
            const token = "Bearer" +" " + jwt.sign(user, jwtSecretKey, {expiresIn});
            res.json({status:200,success:true,message:'登录成功!',token});
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

//注册业务
exports.register = (req,res)=>{
    //获取数据库
    const $db = getDataBase.$db()
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
            $db.users.push({id:$db.users.length+1,...regInfo,password,balance:initBalance});
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

//获取用户信息
exports.getUser = (req,res)=>{
    //获取数据库
    const $db = getDataBase.$db()
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
            res.send({status:200,success:true,userInfo:{...info,password:""}});
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