import config from '../config';
import { getData, postData, initRequest } from './fs/request';
import { login, initLogin } from './fs/login';
import { submitWXForm, initWX } from './fs/wx';
let app = null;
let debug = config.debug;


// 小程序初始化完成调用，获取小程序实例
const init = function (wxapp) {
  app = wxapp;
  initRequest(wxapp);
  initLogin(wxapp);
  initWX(wxapp);
}

export default {
  postData,
  getData,
  login,
  init,
  submitWXForm,
  apiUrl: config.apiUrl,
}
