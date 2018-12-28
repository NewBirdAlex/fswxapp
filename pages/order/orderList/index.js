import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js';
const app = getApp()
Page({
	data: {
		scrollX: 0,
		dataList: [],
		isLoading: false,
		noMoreData: false,
		noData: false,
		page: 1,
		activeIndex: -1,
		// tabs: ["全部", "待付款", "待发货", "待收货", "已完成", "待评价", "已取消"],
		reason: ['我不想买了', '信息填写错误，重新拍', '其他原因'],
		sliderOffset: 0,
		sliderLeft: 0,
	},
	onLoad: function (options) {
		
	},
	onShow:function() {
		this.setData({
			scrollX: 0,
			dataList: [],
			isLoading: false,
			noMoreData: false,
			noData: false,
			page: 1,
			activeIndex: -1,
			sliderOffset: 0,
			sliderLeft: 0,
		})
		this.loadMore();
		tracker.firstRead({ id: '713', title: '我的订单页' });
	},
	tabClick: function (e) {
		if (this.data.activeIndex == e.currentTarget.id) return;
		this.data.page = 1;
		this.data.dataList = [];
		this.data.noData = false;
		this.setData({
			sliderOffset: e.currentTarget.offsetLeft,
			activeIndex: e.currentTarget.id,
			noData: this.data.noData,
			noMoreData: false,
		});
		let scrollX = 0;
		var screenWidth = wx.getSystemInfo({
			success: (res) => {
				screenWidth = res.windowWidth
				let leftPos = e.currentTarget.offsetLeft;
				if (leftPos <= screenWidth * 0.7) {
					scrollX = 0;
				} else {
					scrollX = -e.currentTarget.offsetLeft;
				}
				this.setData({
					scrollX: scrollX,
					sliderOffset: leftPos,
					activeIndex: e.currentTarget.id
				});
			}
		})
		this.loadMore()
	},
	loadMore() {
		wx.showLoading({
			title: '正在加载...',
		})
		client.postData(apiUrl + "eb-api/order/list", {
			"ordStatus": this.data.activeIndex,
			"page": {
				"currentPage": this.data.page,
				"pageSize": 10
			}
		}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				if (this.data.page == 1 && res.data.data.length == 0) {
					this.setData({
						noData: true
					})
				}
				if (res.data.data.length < 10) {
					this.setData({
						noMoreData: true
					})
				}
				this.data.page = this.data.page + 1;
				res.data.data.forEach(item => {
					if (item.orderSubList[0].ordStatus === 0 || item.orderSubList[0].ordStatus === 4) {
						item.isSubOrder = false;
						let count = 0;
						item.orderSubList.forEach(sitem => {
							sitem.orderDetailList.forEach(citem => {
								count += citem.ordSkuNum;
							})
						})
						item.orderProductCount = count;
						this.data.dataList.push(item);
					} else {
						item.orderSubList.forEach(sitem => {
							sitem.isSubOrder = true;
							let count = 0;
							sitem.orderDetailList.forEach(citem => {
								count += citem.ordSkuNum;
							})
							sitem.orderProductCount = count;
							if ((sitem.ordStatus == this.data.activeIndex || this.data.activeIndex == -1) && this.data.activeIndex != 6) {
								this.data.dataList.push(sitem);
							}
							if (this.data.activeIndex == 6 && sitem.ordStatus == 3 && sitem.ordCommentStatus != 1) {
								this.data.dataList.push(sitem);
							}
						})
					}
				})
				this.setData({
					dataList: this.data.dataList
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
	goOrderDetail(e) {
		tracker.trackData({ id: '713005', title: '点击订单' });
		let id = e.currentTarget.dataset.type == 1 ? e.currentTarget.dataset.item.ordOrderId : e.currentTarget.dataset.item.orsId;
		wx.navigateTo({
			url: "/pages/order/orderDetail/index?type=" + e.currentTarget.dataset.type + "&orderId=" + id,
		})
	},
	goLogisticsDetail(e) {
		tracker.trackData({ id: '713006', title: '点击查看物流' });
		let id = e.currentTarget.dataset.type == 1 ? e.currentTarget.dataset.item.ordOrderId : e.currentTarget.dataset.item.orsId;
		wx.navigateTo({
			url: "/pages/order/viewFlow/index?ordOrderId=" + e.currentTarget.dataset.item.ordOrderId,
		})
	},
	goComment(e) {
		tracker.trackData({ id: '713007', title: '点击评价' });
		wx.navigateTo({
			url: "/pages/order/goodsEvaluation/index?ordOrderId=" + e.currentTarget.dataset.item.ordOrderId,
		})
	},
	goCommentList(e) {
		wx.navigateTo({
			url: "/pages/order/viewEvaluation/index"
		})
	},
	comfirmGoods(e) {
		let _this = this;
		wx.showModal({
			title: '提示',
			content: '确定收货吗？',
			success: function (res) {
				if (res.confirm) {
					wx.showLoading({
						title: '正在确认...',
					})
					client.postData(apiUrl + "eb-api/order/receiveOrderSub?ordOrderId=" + e.currentTarget.dataset.item.ordOrderId, {}).then(res => {
						wx.hideLoading()
						if (res.data.code === 200) {
							let index = _this.data.dataList.find(sitem => e.currentTarget.dataset.item.ordOrderId == sitem.ordOrderId || e.currentTarget.dataset.item.orsId == sitem.orsId);
							_this.data.dataList.splice(index, 1);
							_this.setData({
								dataList: _this.data.dataList
							})
							wx.navigateTo({
								url: '/pages/order/getGoods/index?ordOrderId=' + e.currentTarget.dataset.item.ordOrderId,
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
	deleteOrder(e) {
		tracker.trackData({ id: '713004', title: '点击删除' });
		let _this = this;
		wx.showModal({
			title: '提示',
			content: '确定删除订单吗？',
			confirmText: '删除',
			success: function (res) {
				if (res.confirm) {
					wx.showLoading({
						title: '正在删除...',
					})
					let ordOrderIdList = '';
					let item = e.currentTarget.dataset.item;
					if (e.currentTarget.dataset.type == 1) {
						ordOrderIdList = item.ordOrderId;
					} else {
						let arr = [];
						item.orderSubList.forEach(sitem => {
							arr.push(sitem.ordOrderId);
						})
						ordOrderIdList = arr.join(',');
					}
					client.postData(apiUrl + "eb-api/order/hideOrderSubList?ordOrderIdList=" + ordOrderIdList, {}).then(res => {
						wx.hideLoading()
						if (res.data.code === 200) {
							let index = _this.data.dataList.find(sitem => item.ordOrderId == sitem.ordOrderId || item.orsId == sitem.orsId);
							_this.data.dataList.splice(index, 1);
							_this.setData({
								dataList: _this.data.dataList
							})
							if (_this.data.dataList.length == 0) {
								_this.setData({
									noData: true
								})
							}
							$wuxToast.show({
								type: 'text',
								timer: 2000,
								color: '#fff',
								text: "删除成功"
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
	// 取消订单
	cancelOrder(e) {
		tracker.trackData({ id: '713009', title: '点击取消订单' });
		let _this = this;
		wx.showActionSheet({
			itemList: _this.data.reason,
			success: function (res) {
				wx.showLoading({
					title: '正在取消...',
				})
				client.postData(apiUrl + "eb-api/order/cancelOrderSet", {
					"ordCancelReason": _this.data.reason[res.tapIndex],
					"orsId": e.currentTarget.dataset.item.orsId
				}).then(res => {
					wx.hideLoading()
					if (res.data.code === 200) {
						let index = e.currentTarget.dataset.index;
						console.log(index);
						if (_this.data.activeIndex == -1) {
							// e.currentTarget.dataset.item.orderSubList[0].ordStatus = 4;
							_this.data.dataList[index].orderSubList[0].ordStatus = 4;
							_this.data.dataList[index].ordStatus = 4;
						} else {
							_this.data.dataList.splice(index, 1);
							if (_this.data.dataList.length == 0) {
								_this.setData({
									noData: true
								})
							}
						}
						_this.setData({
							dataList: _this.data.dataList
						});
						console.log(_this.data.dataList)
						$wuxToast.show({
							type: 'text',
							timer: 2000,
							color: '#fff',
							text: "取消成功"
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
	makeSure(e) {
		tracker.trackData({ id: '713010', title: '点击确认收货' });
		wx.showModal({
			title: '提示',
			content: '确定收货吗？',
			success: function (res) {
				if (res.confirm) {
					wx.showLoading({
						title: '正在确认...',
					})
					tracker.trackData({ id: '713011', title: '确认收货-是' });
					client.postData(apiUrl + "eb-api/order/receiveOrderSub?ordOrderId=" + e.currentTarget.dataset.item.ordOrderId, {}).then(res => {
						wx.hideLoading()
						if (res.data.code === 200) {
							let index = _this.data.dataList.findIndex(sitem => e.currentTarget.dataset.item.ordOrderId == sitem.ordOrderId);
							_this.data.dataList.splice(index, 1);
							_this.setData({
								dataList: _this.data.dataList
							})
							wx.navigateTo({
								url: '/pages/order/getGoods/index?ordOrderId=' + e.currentTarget.dataset.item.ordOrderId,
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
				} else if (res.cancel) {
					tracker.trackData({ id: '713012', title: '确认收货-否' });
				}
			}
		})
	},
	buyAgain(e) {
		wx.showLoading({
			title: '正在加载...',
		})
		tracker.trackData({ id: '713002', title: '点击再次购买' });
		let options = [];
		let item = e.currentTarget.dataset.item;
		if (e.currentTarget.dataset.type == 1) {
			options = [item.ordOrderId];
		} else {
			item.orderSubList.forEach(sitem => {
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
	goPay(e) {
		let orsId = e.currentTarget.dataset.orsid;
		let index = e.currentTarget.dataset.index;
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
						_this.getPayResult(orsId, index);
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
	getPayResult(orderNo,index) {
		client.postData(apiUrl + "eb-api/pay/getPayResult", {
			"appOrderNo": orderNo
		}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				if (res.data.data == 0) {
					console.log("未支付");
				} else if (res.data.data == 1) {
					this.data.dataList.splice(index, 1);
					wx.showToast({
						title: '支付成功',
						icon: 'success',
						duration: 1500,
						mask: true
					});
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
	onReachBottom() {
		if(!this.data.noMoreData){
			this.loadMore()
		}
	},
})