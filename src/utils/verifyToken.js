// 获取密钥
const {jwtSecretKey,expiresIn} = require('../../config');
// 校验token模块
const jwt = require('jsonwebtoken');
const jwtDecode = require('jwt-decode');
//引入读取数据库方法
const getDataBase = require("../utils/getDataBase")

//检查token是否过期
const isExpired = (token)=>{
    jwt.verify(token, jwtSecretKey ,(error, decoded) => {
        if (error) {
          return true;
        }
      });
    return false;
}

const isAuthorized = async (token)=>{
  try{
    const userInfo = jwtDecode(token);
    //获取数据库
    const $db = await getDataBase.$db();
    const userIndex = $db.users.findIndex(item=>item.id===userInfo.id);
    //验证token正确性
    if(userIndex>=0)
    {
      if($db.users[userIndex].username === userInfo.username)
      {
        return true;
      }
      return false;
    }
  }catch(error){
    //接收InvalidTokenError，但是什么也不做
  }
  return false;
}

module.exports = {
  isExpired,
  isAuthorized
}