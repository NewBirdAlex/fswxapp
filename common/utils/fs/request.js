import config from '../../config';
let app = null;
let debug = config.debug;

const initRequest = function (wxapp) {
  app = wxapp;
}

//post请求
const postData = function (url, options) {
  return request(url, options, 'post');
}

//get请求
const getData = function (url, options) {
  return request(url, options, 'get');
}

//网络请求，已登录的用户自动带上authorization信息
function request(url, options, methodType) {
  debug && console.log('authorization', app.globalData.tokenInfo ? app.globalData.tokenInfo.token : '');
  app.globalData.tokenInfo = wx.getStorageSync('tokenInfo');
  return new Promise(function (resolve, reject) {
    wx.request({
      url: url,
      data: options,
      method: methodType,
      header: {
        'content-type': 'application/json', // 默认值
        'authorization': app.globalData.tokenInfo ? app.globalData.tokenInfo.token : '',
        'deviceId': 25,
        'appVersion': 2.5,
        "platform": 'wechat_pro'
      },
      success: res => {
        resolve(res);
      },
      fail: res => {
        reject(res)
      }
    })
  })
}
export {
  postData,
  getData,
  initRequest,
}