// 引入文件系统
var fs = require('fs');

module.exports = {
    writeFile: function(filePath,content){
        return new Promise((resolve,reject)=>{
            fs.writeFile(filePath,content,'utf8',function(err,data){
                if(err){
                    return reject(err);
                }
            })
        })
        
    }
}

