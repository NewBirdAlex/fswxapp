import config from '../../config';
import { getData, postData } from './request';
let app = null;
let debug = config.debug;

const initWX = function (wxapp) {
  app = wxapp;
}

//提交form表单
const submitWXForm = (formId, fromType) => {
  return new Promise((resolve, reject) => {
    if (formId != 'the formId is a mock one') {
	    postData(config.apiUrl_cms + 'cms-pay/wechat/1.0.0/form/add', {
        "formId": formId,
        "appId": config.appId,
        "fromType": fromType,//0=普通表单，1=支付 
        "openId": wx.getStorageSync("tokenInfo").openId
      }).then(res => {
        resolve(res);
      }, res => {
        reject(res);
      })
    }
  })
}

export {
  submitWXForm,
  initWX,
}