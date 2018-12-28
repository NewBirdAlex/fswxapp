import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js'
const app = getApp()

Page({
	data: {
		orderData: null,
		logisticsData: null,
		optionsType: 1,
		orderId: null,
		reason: ['我不想买了', '信息填写错误，重新拍', '其他原因'],
	},
	onLoad: function (options) { //type=1&orderId=925985419869446165 //type=2&orderId=924960168976998491
		console.log(options)
		this.getOrderData(options.type, options.orderId);
		this.setData({
			optionsType: options.type,
			orderId: options.orderId
		})
	},
	onShow: function () {
		tracker.firstRead({ id: '718', title: '订单详情页' });
	},
	getOrderData(type, orderId) {
		wx.showLoading({
			title: '正在加载中...',
		})
		let url = '';
		if (type == 1) {
			url = 'eb-api/order/getByOrderSubId?ordOrderId=' + orderId
		} else {
			url = 'eb-api/order/getByOrderSetId?orsId=' + orderId
		}
		client.postData(apiUrl + url, {}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				if (type == 1) {
					this.getLogisticsData(res.data.data.ordOrderId);
				} else {
					res.data.data.orderSubList.forEach(item => {
						this.getLogisticsData(item.ordOrderId);
					})
				}
				this.setData({
					orderData: res.data.data
				})
			} else {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				})
			}
		}, res => {
			wx.hideLoading()
			console.log(res)
		})
	},
	getLogisticsData(ordOrderId) {
		client.postData(apiUrl + "eb-api/odd/getByOrderSubId?ordOrderId=" + ordOrderId, {}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				this.setData({
					logisticsData: res.data.data
				})
			} else {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				})
			}
		}, res => {
			wx.hideLoading()
			console.log(res)
		})
	},
	goLogisticsDetail() {
		tracker.trackData({ id: '718003', title: '点击查看物流' });
		wx.navigateTo({
			url: "/pages/order/viewFlow/index?ordOrderId=" + this.data.orderId,
		})
	},
	goToGoodsDetail(e) {
		wx.navigateTo({//
			url: "/pages/goodsDetail/index?spuId=" + e.currentTarget.dataset.spuid,
		})
	},
	delayMakeSure(e) {
		let _this = this;
		tracker.trackData({ id: '718007', title: '点击延长收货' });
		wx.showModal({
			title: '提示',
			content: '确定延长收货吗？每笔订单只能延长一次哦',
			success: function (res) {
				if (res.confirm) {
					wx.showLoading({
						title: '正在延长收货中...',
					})
					client.postData(apiUrl + "eb-api/order/extendDefaultRecevierTime?ordOrderId=" + e.currentTarget.dataset.orid, {}).then(res => {
						wx.hideLoading()
						if (res.data.code === 200) {
							_this.getOrderData(_this.data.optionsType, _this.data.orderId);
							$wuxToast.show({
								type: 'text',
								timer: 2000,
								color: '#fff',
								text: "延长收货成功"
							})
						} else {
							$wuxToast.show({
								type: 'text',
								timer: 2000,
								color: '#fff',
								text: res.data.msg
							})
						}
					}, res => {
						wx.hideLoading()
						console.log(res)
					})
				}
			}
		})
	},
	delayCancel() {
		wx.showModal({
			title: '提示',
			content: '只能延长收货一次哦！',
		})
	},
	comfirmGoods(e) {
		let _this = this;
		tracker.trackData({ id: '718006', title: '点击确认收货' });
		wx.showModal({
			title: '提示',
			content: '确定收货吗？',
			success: function (res) {
				if (res.confirm) {
					wx.showLoading({
						title: '正在确认...',
					})
					tracker.trackData({ id: '718009', title: '点击延长收货-是' });
					client.postData(apiUrl + "eb-api/order/receiveOrderSub?ordOrderId=" + e.currentTarget.dataset.orid, {}).then(res => {
						wx.hideLoading()
						if (res.data.code === 200) {
							_this.getOrderData(_this.data.optionsType, _this.data.orderId);
							wx.navigateTo({
								url: '/pages/order/getGoods/index?ordOrderId=' + e.currentTarget.dataset.orid,
							})
						} else {
							$wuxToast.show({
								type: 'text',
								timer: 2000,
								color: '#fff',
								text: res.data.msg
							})
						}
					}, res => {
						wx.hideLoading()
						console.log(res)
					})
				}else{
					tracker.trackData({ id: '718010', title: '点击延长收货-否' });
				}
			}
		})
	},
	buyAgain(e) {
		wx.showLoading({
			title: '正在加入购物车',
		})
		tracker.trackData({ id: '718008', title: '点击再次购买' });
		let options = [];
		if (this.data.optionsType == 1) {
			options = [this.data.orderData.ordOrderId];
		} else {
			this.data.orderData.orderSubList.forEach(sitem => {
				options.push(sitem.ordOrderId);
			})
		}
		client.postData(apiUrl + "eb-api/order/buyAgainOrderSub", { ordOrderIdList: options }).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				wx.switchTab({
					url: '/pages/cart/index',
				})
			} else {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				})
			}
		}, res => {
			wx.hideLoading()
			console.log(res)
		})
	},
	goComment(e) {
		tracker.trackData({ id: '718004', title: '点击评价' });
		let ordOrderId = '';
		if (this.data.optionsType == 1) {
			ordOrderId = this.data.orderData.ordOrderId;
		} else {
			this.data.orderData.orderSubList.forEach(sitem => {
				ordOrderId = sitem.ordOrderId;
			})
		}
		wx.navigateTo({
			url: "/pages/order/goodsEvaluation/index?ordOrderId=" + ordOrderId,
		})
	},
	goCommentList(e) {
		wx.navigateTo({
			url: "/pages/order/viewEvaluation/index"
		})
	},
	cancelOrder(e) {
		let _this = this;
		tracker.trackData({ id: '718005', title: '点击取消订单' });
		wx.showActionSheet({
			itemList: _this.data.reason,
			success: function (res) {
				wx.showLoading({
					title: '正在取消...',
				})
				client.postData(apiUrl + "eb-api/order/cancelOrderSet", {
					"ordCancelReason": _this.data.reason[res.tapIndex],
					"orsId": _this.data.orderData.orsId
				}).then(res => {
					wx.hideLoading()
					if (res.data.code === 200) {
						$wuxToast.show({
							type: 'text',
							timer: 2000,
							color: '#fff',
							text: "取消成功"
						})
						wx.navigateBack({
							delta: 1
						})
					} else {
						$wuxToast.show({
							type: 'text',
							timer: 2000,
							color: '#fff',
							text: res.data.msg
						})
					}
				}, res => {
					wx.hideLoading()
					console.log(res)
				})
			},
			fail: function (res) {
				console.log(res.errMsg)
			}
		})
	},
	goPay(e) {
		let orsId = this.data.orderData.orsId;
		tracker.trackData({ id: '713008', title: '确认收货' });
		client.postData(apiUrl + 'eb-api/pay/payOrderSetExt', {
			"appId": app.globalData.appId,
			"appOrderNo": orsId,
			"openId": wx.getStorageSync("tokenInfo").openId,
			"orsPayChannel": 10,
			"tradeType": "JSAPI"
		}).then(res => {
			if (res.data.code === 200) {
				//调用微信支付接口
				wx.requestPayment({
					'timeStamp': res.data.data.timestamp,
					'nonceStr': res.data.data.noncestr,
					'package': res.data.data.package,
					'signType': 'MD5',
					'paySign': res.data.data.sign,
					'success': (result) => {
						wx.hideLoading();
						//查询支付结果
						_this.getPayResult(orsId);
					},
					'fail': (res) => {
						wx.hideLoading()
						wx.showToast({
							title: '支付失败',
							icon: 'loading',
							duration: 2000
						})
					}
				})
			} else {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				})
			}
		}, res => {
			console.log(res);
		})
	},
	getPayResult(orderNo) {
		client.postData(apiUrl + "eb-api/pay/getPayResult", {
			"appOrderNo": orderNo
		}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				if (res.data.data == 0) {
					console.log("未支付");
				} else if (res.data.data == 1) {
					wx.showToast({
						title: '支付成功',
						icon: 'success',
						duration: 1500,
						mask: true
					});
					setTimeout(function () {
						wx.navigateBack({
							delta: 1
						})
					}, 1500)
				} else if (res.data.data == 2) {
					console.log("取消支付");
				} else {
					console.log("无效订单");
				}
			} else {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				})
			}
		}, res => {
			wx.hideLoading()
			console.log(res)
		})
	},
})