//引入并配置server.js
const jsonServer = require('json-server');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname,'./public/database/db.json'),{'delay':500});
const middlewares = jsonServer.defaults({
    'static':'./public/source',
    'logger':true,
    "bodyParser":true,
});
//引入cors跨域
const cors = require('cors');
//引入自定义路由
const user_router = require('./src/router/userRouter');

server.use(cors());
server.use(jsonServer.bodyParser);
server.use(middlewares);
//自定义路由中间件
server.use(user_router);
//json-server路由
server.use(router);

server.listen(3000, () => {
  console.log('JSON Server is running')
});