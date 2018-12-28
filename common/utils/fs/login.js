import config from '../../config';
import { getData, postData } from './request';
let app = null;
let debug = config.debug;

const initLogin = function (wxapp) {
	app = wxapp;
}

// 微信登录
const wxLogin = () => {
	return new Promise((resolve, reject) => {
		checkSession().then(res => {
			//登录态未过期，直接读取本地缓存
			app.globalData.tokenInfo = wx.getStorageSync("tokenInfo");
			resolve({ res, tokenInfo: app.globalData.tokenInfo });
			debug && console.log('hasLogin', res);
		}, res => {
			//登录态已过期，调起微信登录授权界面
      console.log("over time")
			wx.login({
				success: res => {
          console.log("wx.login:",res)
					app.globalData.jsCode = res.code;
					resolve(res);
					debug && console.log('acceptLogin', res)
				},
				fail: res => {
					reject({ err: '微信登录打开失败', code: 1004, res });
					debug && console.log('rejectLogin', res)
				}
			})
		})
	})
}

/*
  登录失败
  reject code={
    1001:用户拒绝允许授权获取信息,
    1002:获取openId接口服务报错,
    1003:获取openId接口网络错误,
    1004:微信登录调用失败
  }
  登录成功
  resolve res = {
    userInfo,
    tokenInfo
  }
*/
const login = () => {
	return new Promise((resolve, reject) => {
		if (wx.getStorageSync("tokenInfo") && wx.getStorageSync("userInfo")) {
			resolve({ userInfo: wx.getStorageSync("userInfo"), tokenInfo: wx.getStorageSync("tokenInfo") });
		} else {
			wxLogin().then(res => {
        console.log("wxLogincode:",res)
				//登录成功，获取用户微信信息
				debug && console.log('loginInfo', res);
				//根据tokenInfo判断用户之前在客户端有无登录过
				let hasLogin = res.tokenInfo ? true : false;
				getSetting().then(res => {
					//用户允许授权，获取用户信息
          console.log('getting setting22')
					getUserInfo().then(res => {
						if (hasLogin) {
							//已登录过的用户直接返回用户信息
							resolve({ userInfo: app.globalData.userInfo, tokenInfo: app.globalData.tokenInfo });
							return;
						}
						//之前没登录过的用户需要请求服务接口获取用户token信息
						reqUserInfo().then(res => {
							resolve({ userInfo: app.globalData.userInfo, tokenInfo: app.globalData.tokenInfo });
						}, res => {
							reject(res);
						})
					});
				}, res => {
					//用户拒绝授权
					reject(res);
				})
			}, res => {
				//微信登录失败
				reject(res);
			})
		}
	})

}

//根据微信用户信息，token获取系统用户信息
const reqUserInfo = () => {
	return new Promise((resolve, reject) => {
		wx.showLoading({
			title: '加载中',
		})
    console.log('enter requserinfo')
		let userInfo = app.globalData.userInfo;
		let data = {
			appId: config.appId,
			jsCode: app.globalData.jsCode,
			city: userInfo.city,
			country: userInfo.country,
			headimgurl: userInfo.avatarUrl,
			nickname: userInfo.nickName,
			province: userInfo.province,
			sex: userInfo.gender
		}
		let routes = getCurrentPages();
		if (routes.length !== 0) {
			let source = routes[routes.length - 1].options.source;
			if (source) {
				//路由不为空且当前路由带有source
				data.source = source;
			} else {
				//当前页面不带有source但上一个路由页面携带source，兼容有些场景进入小程序后跳转到其他页面
				if (routes.length > 1) {
					let sourcePrev = routes[routes.length - 2].options.source;
					if (sourcePrev) {
						data.source = sourcePrev;
					}
				}
			}
		}
		if (data.source) {
			wx.setStorage({
				key: 'sourceData',
				data: data.source,
			});
		}
		postData(config.apiUrl_cms + "cms-pay/wechat/1.0.0/getOpenId", data).then(res => {
			wx.hideLoading();
			let data = res.data;
			debug && console.log("getopenid",data);
			if (data.code == 200) {
				let tokenInfo = {
					openId: data.data.openid,
					unionId: data.data.unionid,
					token: data.data.token,
					memberId: data.data.memberId,
				};
				wx.setStorageSync('tokenInfo', tokenInfo);
				app.globalData.tokenInfo = tokenInfo;
				resolve(res);
			} else {
				reject({ err: '获取openId接口失败', code: 1002, res });
			}
		}, res => {
			wx.hideLoading();
			reject({ err: '获取OpenId接口服务失败', code: 1003, res });
		})
	})
}

//检查session
const checkSession = () => {
	return new Promise((resolve, reject) => {
		wx.checkSession({
			success: res => {
				if (wx.getStorageSync("tokenInfo") == "") {
					reject(res)
				} else {
					resolve(res);
				}
			},
			fail: res => {
				reject(res)
			}
		})
	})
}

//获取授权信息
const getSetting = (scopeName = 'scope.userInfo') => {
	return new Promise((resolve, reject) => {
		wx.getSetting({
			success: res => {
        console.log("gettingSetting",res)
				if (res.authSetting[scopeName]) {
					//已授权直接返回
					resolve(res);
				} else {
					//进行授权
          console.log("进行授权")
          
					wx.authorize({
						scope: scopeName,
						success: res => {
              console.log("apply 成功")
              
							resolve(res);
						},
						fail: res => {
              console.log(" 授权失败",res)
							//打开允许获取信息设置
							wx.showModal({
								content: '请允许微信授权',
								showCancel: false,
								complete: res => {
                  console.log("引导用户授权", res)
									//打开设置界面登录方式
									wx.openSetting({
										complete: res => {
											debug && console.log('opensetting', res);
											if (res.authSetting[scopeName]) {
												//用户允许授权，获取用户信息
												resolve(res);
											} else {
												reject({ err: '用户关闭设置获取信息', code: 1001, res });
											}
										}
									})
								}
							})
						}
					})
				}
			}
		})
	})
}

//获取微信用户信息
const getUserInfo = () => {
	return new Promise((resolve, reject) => {
		wx.getUserInfo({
			success: res => {
				// 可以将 res 发送给后台解码出 unionId
				app.globalData.userInfo = res.userInfo;
				wx.setStorage({
					key: 'userInfo',
					data: app.globalData.userInfo,
				})
				resolve(res);
			}
		})
	})
}
export {
	login,
	initLogin,
}