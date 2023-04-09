// 引入axios
const { default: axios } = require("axios");
//引入baseURL
const {baseURL} = require("../../config")

const axiosInstance = axios.create({
    baseURL:baseURL,
    timeout: 20000,
  });

//请求拦截器
axiosInstance.interceptors.request.use(function (config){
    return config;
},function (error){
    return Promise.reject(error);
});

//响应拦截器
axiosInstance.interceptors.response.use(function (response){
    return response;
},function (error){
    return Promise.reject(error);
})

exports.axiosInstance = axiosInstance;