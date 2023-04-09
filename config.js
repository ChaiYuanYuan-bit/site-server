module.exports = {
    //密钥
    jwtSecretKey: "fuTkisMQQ2j1ESC0cbaQen1ZWmkMdvLx",
    //Token有效期60min
    expiresIn: 60 * 60, 
    //baseUrl
    baseURL: "http://localhost:3000",
    //初始金额
    initBalance:10000,
    //路由过滤规则
    passRoules : [
        '/user/login',
        '/user/register',
        '/roleType'
    ],
}