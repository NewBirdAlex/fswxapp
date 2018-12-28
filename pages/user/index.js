// pages/order/user/index.js
import { apiUrl, apiUrl_cms } from '../../common/config.js'
import { $wuxToast } from '../../components/wux'
import utils from '../../common/utils/utils.js'
import client from '../../common/utils/client';
import tracker from '../../common/utils/tracker.js';
const app = getApp();
let loginCount = 0;
Page({
	data: {
		userInfo: null,
	},
	goPart: function (e) {
		console.log(e.target.id)
		if (e.target.id == 0) {
			wx.navigateTo({
				url: '/pages/order/orderList/index',
			})
		}
		if (e.target.id == 5) {
			wx.navigateTo({
				url: '/pages/afterSales/index',
			})
		}
		if (e.target.id == 1) {
			wx.navigateTo({
				url: '/pages/addressList/index?type=2&show=true',
			})
		}
		if (e.target.id == 2) {
			wx.navigateTo({
				url: '/pages/realName/index',
			})
		}
		if (e.target.id == 3) {
			tracker.trackData({ id: '104026', title: '个人中心页-点击礼品卡' });
			wx.navigateTo({
				url: '/pages/giftCard/index?hideCheck=true',
			})
		}
		if (e.target.id == 4) {
			wx.showLoading({
				title: '正在加载...',
			})
			client.postData(apiUrl + 'eb-api/mkt/listWechatCard', {}).then(res1 => {
				if (res1.data.code === 200) {
					if (res1.data.data.length != 0) {
						//获取cardId和加密后的code
						let cardList = res1.data.data;
						let codeList = [];
						res1.data.data.forEach(item => {
							codeList.push(item.code);
						});
						client.postData(apiUrl_cms + 'cms-pay/wechat/card/1.0.0/code/decrypt', {
							"encryptCodeList": codeList,
							"targetAppId": app.globalData.targetAppId
						}).then(res2 => {
							if (res2.data.code === 200) {
								res2.data.data.forEach((item, index) => {
									// arr.push({ cardId: '', code: item.code })
									cardList.forEach(val => {
										if (item.encryptCode == val.code) {
											val.code = item.code;
										}
									})
								})
								console.log(cardList)
								wx.openCard({
									cardList: cardList,
									success: function (res) {
										console.log(res)
									},
									complete: function () {
										wx.hideLoading();
									}
								})
							} else {
								wx.hideLoading();
								$wuxToast.show({
									type: 'text',
									timer: 2000,
									color: '#fff',
									text: res2.data.msg
								})
							}
						}, res => {
							wx.hideLoading();
							console.log(res2);
						})
					} else {
						wx.hideLoading();
						$wuxToast.show({
							type: 'text',
							timer: 2000,
							color: '#fff',
							text: '您暂无卡券'
						})
					}
				} else {
					wx.hideLoading();
					$wuxToast.show({
						type: 'text',
						timer: 2000,
						color: '#fff',
						text: res1.data.msg
					})
				}
			}, res => {
				wx.hideLoading();
				console.log(res1);
			})
		}
	},
	onLoad: function (options) {
		this.login()
	},
	login() {
		let _this = this;
		// 登录
		client.login().then(res => {
			this.getUserInfo()
		}, res => {
			console.log('login reject', res);
			loginCount++;
			//1001:用户拒绝允许授权获取信息,
			//1002:获取openId接口服务报错,
			//1003:获取openId接口网络错误,
			//1004:微信登录调用失败
			if (res.code == 1001) {
				wx.showModal({
					title: '提示',
					content: '请允许微信授权',
					success: res => {
						console.log(res)
					}
				})
			} else {
				if (loginCount == 3) {
					wx.showModal({
						title: '提示',
						content: '获取用户信息失败，请稍后再试',
					})
				}
			}
		});
	},
	getUserInfo() {
		let info = wx.getStorageSync("userInfo");
		this.setData({
			userInfo: info
		})
	},
})