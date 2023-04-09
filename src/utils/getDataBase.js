// 引入path
const path = require('path');
// 引入文件系统
const {readFile} = require('../utils/file')

exports.$db = ()=>{
    return new Promise((resolve,reject)=>{
         // 导入json-server数据库
        readFile(path.join(__dirname,'../../public/database/db.json'))
        .then(data=>resolve(JSON.parse(data))
        )
        .catch(err=>reject(err));
    })
}