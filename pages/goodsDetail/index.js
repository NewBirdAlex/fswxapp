import { apiUrl, apiUrl_cms } from '../../common/config.js'
import { $wuxToast } from '../../components/wux'
import utils from '../../common/utils/utils.js'
import client from '../../common/utils/client';
import tracker from '../../common/utils/tracker.js';
const app = getApp();
let loginCount = 0;
Page({
	data: {
		spuId: '',
		goodsData: null,
		couponData: null,
		hasCardIdCouponData: [],
		commentData: null,
		commentPageData: null,
		skuListData: null,
		previewUrls: [],
		sale_out_menu_state: '(๑>◡<๑) 商品售罄了，看看其他商品吧！',
		sale_line_menu_state: '(๑>◡<๑) 商品已下架，看看其他商品吧！',
		isCollected: false,
		showCouponDialog: false,
		showSpecDialog: false,
		showPiDialog: false,
		skuChosenSpec: '',
		skuChosenNumber: 1,
		skuShowNum: 0,
		chosenSkuId: 0,
		skuItemData: null,
		showSkuNumTips: false,
		hasJoinCartState: '',
		cartBadge: 0,
		recommendData: [],
		isLoading: false,
		noMoreData: false,
		noData: false,
		page: 1,
		promotionEndTime: null,
	},
	onLoad: function (options) {
		if (options.source != undefined) {
			wx.setStorageSync('sourceData', options.source)
		}
		let value = wx.getStorageSync('tokenData')
		let _this = this
		this.setData({
			spuId: options.spuId
		});
		this.login(options.spuId)
		tracker.firstRead({ id: '701', title: '商品商品页', object1: this.data.spuId });
	},
	onShow: function () {
	},
	login(spuId) {
		console.log(spuId)
		let _this = this;
		// 登录
		client.login().then(res => {
			console.log('login success', res);
			this.getGoodsDetail(spuId)
      this.getPackage(spuId)
			this.getGoodsCoupon(spuId)
			this.getGoodsComment(spuId)
			this.getCollectData(spuId)
			this.getRecommendData(spuId)
			this.getCartData()
			// this.addCard()
			// this.openCard()
		}, res => {
			console.log('login reject', res);
			loginCount++;
			//1001:用户拒绝允许授权获取信息,
			//1002:获取openId接口服务报错,
			//1003:获取openId接口网络错误,
			//1004:微信登录调用失败
			if (res.code == 1001) {
				wx.showModal({
					content: '请允许微信授权',
					success: res => {

					}
				})
			} else {
				wx.showModal({
					title: '提示',
					content: res.err,
					showCancel: false
				})
				if (loginCount == 3) {
					wx.showModal({
						title: '提示',
						content: '获取用户信息失败，请稍后再试',
						showCancel: false
					})
				}
			}
		});
	},
  getPackage(spuId){
    client.postData(apiUrl + 'eb-api/mktGroup/findGroup', { spuId: spuId}).then(res=>{
      wx.hideLoading()
    },err=>{
      wx.hideLoading()
    });
  },
	getGoodsDetail(spuId) {
		wx.showLoading({
			title: '加载数据...',
			mask: true
		});
		let _this = this;
		client.postData(apiUrl + "eb-api/spu/getAppProductSpuById?spuId=" + spuId, {}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				let hasChosen = false;
				let hasChosenIndex = 0;
				res.data.data.bannerList.forEach((item, index) => {
					this.data.previewUrls.push(item.psrResourceUrl)
				});
				if (res.data.data.promotionResp) {
					res.data.data.spuPromotionPrice = (res.data.data.minSalePrice - res.data.data.promotionResp.misDiscountPrice).toFixed(2);
					res.data.data.skuList.forEach(item => {
						item.proSkuTruePrice = (item.skuSalePrice - res.data.data.promotionResp.misDiscountPrice).toFixed(2);
					})
				}
				res.data.data.skuList.forEach((item,index) => {
					if (item.skuShowNum != 0 && !hasChosen) {
						item.active = true;
						hasChosen = true;
						hasChosenIndex = index;
					}
				});
				if (res.data.data.promotionResp && res.data.data.spuShelvesStatus == 1 && res.data.data.totalShowNum != 0) {
					var timer = setInterval(function () {
						if (utils.getDiffDate(res.data.data.promotionResp.mktEnd) == -1) {
							clearInterval(timer)
							_this.setData({
								count: ''
							});
							return;
						}
						_this.setData({
							promotionEndTime: utils.getDiffDate(res.data.data.promotionResp.mktEnd)
						});
					}, 1000)
				}
				res.data.data.spuMarketMinPric = parseFloat(res.data.data.spuMarketMinPric);
				res.data.data.minSalePrice = parseFloat(res.data.data.minSalePrice);
				this.setData({
					goodsData: res.data.data,
					skuListData: res.data.data.skuList,
					skuShowNum: res.data.data.skuList[0].skuShowNum,
					skuChosenSpec: res.data.data.skuList[0].skuAtrr == "" ? res.data.data.skuList[0].skuName : res.data.data.skuList[0].skuAtrr,
					chosenSkuId: res.data.data.skuList[hasChosenIndex].skuId,
					skuItemData: res.data.data.skuList[hasChosenIndex]
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
	getGoodsCoupon(spuId) {
		client.postData(apiUrl + "eb-api/mkt/getCouponBySpuId?spuId=" + spuId, {}).then(res => {
			if (res.data.code === 200) {
				res.data.data.forEach((item, index) => {
					item.active = true;
					if (item.mkcDateType == 0) {
						item.mktShowStart = utils.formatDateNoHour(item.mktStart)
						item.mktShowEnd = utils.formatDateNoHour(item.mktEnd)
					} else if (item.mkcDateType == 1) {
						item.mktShowStart = utils.getDateStr(0)
						item.mktShowEnd = utils.getDateStr(item.mkcDateNum)
					} else if (item.mkcDateType == 2) {
						item.mktShowStart = utils.getDateStr(1)
						item.mktShowEnd = utils.getDateStr(item.mkcDateNum + 1)
					}

					if (item.cardId != null && item.cardId != "" && item.cardId != undefined) {
						this.data.hasCardIdCouponData.push(item)
					}
				})
				this.setData({
					couponData: res.data.data,
					hasCardIdCouponData: this.data.hasCardIdCouponData
				});
				console.log(this.data.hasCardIdCouponData)
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
	getGoodsComment(spuId) {
		client.postData(apiUrl + "eb-api/oic/getOrderItemCommentBySpuid", {
			"oicImgStatus": 0,
			"page": {
				"currentPage": 1,
				"pageSize": 10,
			},
			"skuId": "",
			"spuId": spuId
		}).then(res => {
			if (res.data.code === 200) {
				res.data.data.forEach((item, ind) => {
					item.oicCreatedTime = utils.formatTime(item.oicCreatedTime)
					if (item.oicImg != '' && item.oicImg != null) {
						item.oicImg = item.oicImg.split(",");
					} else {
						item.oicImg = [];
					}
				});
				this.setData({
					commentData: res.data.data,
					commentPageData: res.data.page,
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
	getCollectData(spuId) {
		client.postData(apiUrl_cms + 'cms-api/behavior/1.0.0/spuBehaviorStatus', { "spuId": spuId }).then(res => {
			if (res.data.code === 200) {
				this.setData({
					isCollected: res.data.data.collectStatus == 0 ? false : true
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
	getCartData() {
		client.postData(apiUrl + 'eb-api/orc/getOrderCartByMemberId', {
			"isSelectAll": true,
		}).then(res => {
			if (res.data.code === 200) {
				let num = 0
				res.data.data.forEach((val, index) => {
					val.orderCartResps.forEach((item) => {
						num += item.orcNumber
					})
				})
				this.setData({
					cartBadge: this.data.cartBadge + num
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
	getRecommendData(spuId) {
		client.postData(apiUrl_cms + 'cms-api/recommemd/1.0.0/relateSpu', {
			"currentPage": this.data.page,
			"pageSize": 50,
			"spuId": spuId,
			"type": 1
		}).then(res => {
			if (res.data.code === 200) {
				if (res.data.data.length < 10) {
					this.setData({
						noMoreData: true
					})
				}
				this.setData({
					recommendData: this.data.recommendData.concat(res.data.data),
					page: this.data.page + 1,
					isLoading: false
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
	previewImage(e) { //图片预览
		wx.previewImage({
			current: e.currentTarget.dataset.img,
			urls: this.data.previewUrls
		})
	},
	collectGoods() { //收藏或取消收藏
		client.postData(apiUrl_cms + 'cms-api/collect/1.0.0/collectSpus', {
			"collectList": [{
				"enableStatus": this.data.isCollected ? 0 : 1,
				"spuId": this.data.spuId
			}]
		}).then(res => {
			if (res.data.code === 200) {
				this.setData({
					isCollected: !this.data.isCollected
				})
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: this.data.isCollected ? "收藏成功" : "取消收藏成功"
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
	toggleCouponDialog() { //打开或关闭优惠券列表弹框
		// if (this.data.showCouponDialog){
		// 	tracker.trackData({ id: '701005', title: '关掉优惠券列表', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		// }else{
		// 	tracker.trackData({ id: '701003', title: '点击优惠券列表', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		// }
		// this.setData({
		// 	showCouponDialog: !this.data.showCouponDialog
		// });
		tracker.trackData({ id: '701003', title: '点击优惠券列表', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		wx.showLoading({
			title: '正在加载...',
		})

		let arr = [];
		let _this = this;
		this.data.hasCardIdCouponData.forEach(item => {
			arr.push(item.cardId);
		});
		//获取调用微信卡券的参数
		client.postData(apiUrl + 'eb-api/mkt/addWechatCard', {
			"appId": app.globalData.appId,
			"cardIdList": arr,
			"targetAppId": app.globalData.targetAppId
		}).then(res => {
			if (res.data.code === 200) {
				let cardList = [];
				res.data.data.forEach(item => {
					cardList.push({
						cardId: item.cardId,
						cardExt: JSON.stringify(item.cardExt)
					})
				});
				wx.addCard({
					cardList: cardList,
					success: function (res) {
						console.log(res.cardList) // 卡券添加结果
						res.cardList.forEach(val => {
							_this.data.hasCardIdCouponData.forEach(item => {
								if (item.cardId == val.cardId) {
									//通知后台已成功领取卡券，并保存code和cardId
									let options = {};
									if (item.mkcDateType == 0) {
										options = {
											"mkcBeginTime": utils.formatTime(item.mktStart),
											"mkcEndTime": utils.formatTime(item.mktEnd)
										}
									} else if (item.mkcDateType == 1) {
										options = {
											"mkcBeginTime": utils.getDateStr(0),
											"mkcEndTime": utils.getDateStr(item.mkcDateNum)
										}
									} else if (item.mkcDateType == 2) {
										options = {
											"mkcBeginTime": utils.getDateStr(1),
											"mkcEndTime": utils.getDateStr((item.mkcDateNum + 1))
										}
									}
									options.mkcCampaignId = item.mkcCampaignId;
									options.mkcChannel = '';
									options.cardCode = val.code;
									options.cardId = val.cardId;
									client.postData(apiUrl + 'eb-api/mkt/createCoupon', options).then(res => {
										if (res.data.code === 200) {
											// $wuxToast.show({
											// 	type: 'text',
											// 	timer: 2000,
											// 	color: '#fff',
											// 	text: "成功领取卡券"
											// })
											console.log("成功领取卡券");
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
								}
							})
						});
					},
					fail: function (res) {
						console.log(res);
					},
					complete: function (res) {
						wx.hideLoading();
						tracker.trackData({ id: '701005', title: '关掉优惠券列表', object1: this.data.spuId, object2: this.data.goodsData.spuName })
					}
				})
			} else {
				wx.hideLoading();
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				})
			}
		}, res => {
			wx.hideLoading();
			console.log(res);
		})

	},
	toggleSpecDialog() { //打开或关闭规格弹框
		if (this.data.showSpecDialog) {
			tracker.trackData({ id: '701013', title: '关掉规格页面', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		} else {
			tracker.trackData({ id: '701006', title: '点击规格数量弹窗', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		}
		this.setData({
			showSpecDialog: !this.data.showSpecDialog
		});

	},
	togglePiDialog() {
		this.setData({
			showPiDialog: !this.data.showPiDialog
		});

	},
	moreComment() {//跳转到商品评论列表页
		tracker.trackData({ id: '701014', title: '查看更多评价', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		wx.navigateTo({
			url: '/pages/goodsDetail/goodsComment/index?spuId=' + this.data.spuId,
		})
	},
	revieveCoupon(e) { //领取优惠券
		tracker.trackData({ id: '701004', title: '点击领取优惠券', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		let options = {};
		if (e.currentTarget.dataset.item.mkcDateType == 0) {
			options = {
				"mkcBeginTime": utils.formatTime(e.currentTarget.dataset.item.mktStart),
				"mkcEndTime": utils.formatTime(e.currentTarget.dataset.item.mktEnd)
			}
		} else if (e.currentTarget.dataset.item.mkcDateType == 1) {
			options = {
				"mkcBeginTime": utils.getDateStr(0),
				"mkcEndTime": utils.getDateStr(e.currentTarget.dataset.item.mkcDateNum)
			}
		} else if (e.currentTarget.dataset.item.mkcDateType == 2) {
			options = {
				"mkcBeginTime": utils.getDateStr(1),
				"mkcEndTime": utils.getDateStr((e.currentTarget.dataset.item.mkcDateNum + 1))
			}
		}
		options.targetAppId = app.globalData.targetAppId;
		options.mkcCampaignId = e.currentTarget.dataset.item.mkcCampaignId;
		options.mkcChannel = "";
		client.postData(apiUrl + 'eb-api/mkt/createCoupon', options).then(res => {
			if (res.data.code === 200) {
				this.data.couponData[e.currentTarget.dataset.index].active = false
				this.setData({
					couponData: this.data.couponData
				})
				console.log(this.data.couponData)
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: "成功领取" + e.currentTarget.dataset.item.mkcPrice + "元优惠券"
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
	skuItemClick(e) {//sku规格点击事件
		tracker.trackData({ id: '701007', title: '点击规格', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		if (this.data.skuListData[e.currentTarget.dataset.index].skuShowNum == 0) {
			return
		}
		if (this.data.skuListData[e.currentTarget.dataset.index].skuShowNum < this.data.skuChosenNumber) {
			this.setData({
				skuChosenNumber: this.data.skuListData[e.currentTarget.dataset.index].skuShowNum
			})
			var that = this;
			this.setData({
				showSkuNumTips: true
			});
			setTimeout(function () {
				that.setData({
					showSkuNumTips: false
				});
			}, 3000);
		}
		this.data.skuListData.forEach((item, index) => {
			item.active = false
		})
		this.data.skuListData[e.currentTarget.dataset.index].active = true;
		this.data.skuItemData = this.data.skuListData[e.currentTarget.dataset.index];
		this.setData({
			skuListData: this.data.skuListData,
			skuShowNum: this.data.skuListData[e.currentTarget.dataset.index].skuShowNum,
			skuChosenSpec: this.data.skuListData[e.currentTarget.dataset.index].skuAtrr == "" ? this.data.skuListData[e.currentTarget.dataset.index].skuName : this.data.skuListData[e.currentTarget.dataset.index].skuAtrr,
			chosenSkuId: this.data.skuListData[e.currentTarget.dataset.index].skuId,
			skuItemData: this.data.skuItemData
		})
	},
	skuNumAdd() { //数量++
		if (this.data.skuChosenNumber >= this.data.skuShowNum) {
			return;
		}
		tracker.trackData({ id: '701008', title: '点击增加数量', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		this.setData({
			skuChosenNumber: this.data.skuChosenNumber + 1
		})
	},
	skuNumSub() { //数量--
		if (this.data.skuChosenNumber < 2) {
			return;
		}
		tracker.trackData({ id: '701009', title: '点击减少数量', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		this.setData({
			skuChosenNumber: this.data.skuChosenNumber - 1
		})
	},
	joinCart() { //加入购物车
		tracker.trackData({ id: '701011', title: '点击规格页面加入购物车', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		wx.showLoading({
			title: '正在加入购物车...',
			mask: true
		})
		client.postData(apiUrl + "eb-api/orc/createOrderCart", {
			"orcNumber": this.data.skuChosenNumber,
			"orcSkuId": this.data.chosenSkuId
		}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				this.setData({
					showSpecDialog: !this.data.showSpecDialog,
					cartBadge: this.data.cartBadge + this.data.skuChosenNumber,
					hasJoinCartState: '已选：“' + this.data.skuChosenSpec + '”  “' + this.data.skuChosenNumber + '件”  '
				});
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: '已加入购物车'
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
	addCard() {
		client.postData(apiUrl_cms + 'cms-pay/wechat/card/1.0.0/addCard', {
			"appId": app.globalData.appId,
			"targetAppId": app.globalData.targetAppId,
			"cardId": "pdRrKvyMnSZEqzYhzgycKw1Mvm68"
		}).then(res => {
			if (res.data.code === 200) {
				wx.addCard({
					cardList: [
						{
							cardId: res.data.data.cardId,
							cardExt: JSON.stringify(res.data.data.cardExt)
						}
					],
					success: function (res) {
						console.log(res.cardList)
					},
					fail: function (res) {
						console.log(res)
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
	openCard() {
		client.postData(apiUrl_cms + 'cms-pay/wechat/card/1.0.0/code/decrypt', {
			"targetAppId": app.globalData.targetAppId,
			"encryptCodeList": [
				"IyZ/FM7ofdlX2H3Q7uZu1DVOaYLCpKk7ckDHyuvMxJk="
			]
		}).then(res => {
			if (res.data.code === 200) {
				let arr = []
				res.data.data.forEach((item, index) => {
					arr.push({ cardId: 'pdRrKvyMnSZEqzYhzgycKw1Mvm68', code: item.code })
				})
				console.log(arr)
				wx.openCard({
					cardList: arr,
					success: function (res) {
						console.log(res)
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
	recommendToDetail(e) {
		wx.navigateTo({//
			url: "/pages/goodsDetail/index?spuId=" + e.currentTarget.dataset.spuid,
		})
	},
	goToCart() {
		console.log(111)
		wx.switchTab({
			url: '/pages/cart/index',
			complete: function (res) {
				console.log(res)
			}
		})
	},
	fillOrder() {
		tracker.trackData({ id: '701012', title: '点击规格页面立即购买', object1: this.data.spuId, object2: this.data.goodsData.spuName })
		let arr = [];
		arr.push({
			coupons: [],
			orcId: "",
			orcMemberId: "",
			orcNumber: this.data.skuChosenNumber,
			orcSkuId: this.data.skuItemData.skuId,
			skuMarketSalePrice: this.data.skuItemData.skuMarketSalePrice.toFixed(2),
			skuName: this.data.skuItemData.skuName,
			skuPromotionPrice: this.data.goodsData.promotionResp == null ? this.data.skuItemData.skuSalePrice.toFixed(2) : (this.data.skuItemData.skuSalePrice - this.data.goodsData.promotionResp.misDiscountPrice).toFixed(2),
			skuSalePrice: this.data.skuItemData.skuSalePrice.toFixed(2),
			skuShowNum: this.data.skuItemData.skuShowNum,
			skuSpuId: this.data.goodsData.spuId,
			skuStopStatus: this.data.skuItemData.skuStopStatus,
			spuCountryType: this.data.goodsData.spuCountryType,
			spuName: this.data.goodsData.spuName,
			spuPic: this.data.goodsData.spuPic,
			spuShelvesStatus: this.data.goodsData.spuShelvesStatus
		});
		wx.setStorageSync('chooseCartData', arr);
		wx.removeStorageSync("giftCardChosenData");
		wx.navigateTo({
			url: '/pages/fillOrder/index',
		});
	},
	goToHome() {
		wx.navigateBack({
			delta: 1
		})
	},
	swiperChange(e) {
		tracker.trackData({ id: '701002', title: '滑动商品图', object1: this.data.spuId, object2: this.data.goodsData.spuName });
	},
	orcNumberInput() {
		tracker.trackData({ id: '701010', title: '点击输入数量', object1: this.data.spuId, object2: this.data.goodsData.spuName });
	},
	// onPageScroll() {
	// 	tracker.trackData({ id: '701016', title: '往下滑动', object1: this.data.spuId, object2: this.data.goodsData.spuName })
	// },
	onReachBottom() {
		if (this.data.noMoreData) {
			return
		}
		// this.setData({
		// 	isLoading: true
		// })
		//this.getRecommendData(this.data.spuId)
	},
	onShareAppMessage: function () {
		tracker.trackData({ id: '701017', title: '分享', object1: this.data.spuId, object2: this.data.goodsData.spuName });
		return {
			title: this.data.goodsData.spuName,
			path: '/pages/goodsDetail/index?spuId=' + this.data.spuId,
			imageUrl: this.data.goodsData.spuPic,
			success: function (res) {
				// 转发成功
			},
			fail: function (res) {
				// 转发失败
			}
		}
	}
})
