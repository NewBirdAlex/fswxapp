import { apiUrl, apiUrl_cms } from '../../common/config.js'
import { $wuxToast } from '../../components/wux'
import utils from '../../common/utils/utils.js'
import client from '../../common/utils/client';
import tracker from '../../common/utils/tracker.js';
const app = getApp();
let loginCount = 0;
Page({
	data: {
		cartListData: null,
		chooseAll: true,
		showDeleteSuccTips: false,
		totalPrice: 0,//合计金额
		sumPrice: 0,//总计金额
		discountPrice: 0,//优惠金额
		invalidList: [],
		chooseList: [],
		recommendData: [],
		isLoading: false,
		noMoreData: false,
		noData: false,
		page: 1,
		spuId: null,
		skuPromotionList: [],
		defaultProvince: '',
		promotionSum: 0,
	},
	onLoad: function (options) {
		
	},
	onShow: function () {
		tracker.firstRead({ id: '704', title: '购物车页' });
		this.login();
	},
	login() {
		let _this = this;
		// 登录
		client.login().then(res => {
			this.getCartListData();
			this.setData({
				chooseAll: true
			})
		}, res => {
			console.log('login reject', res);
			//1001:用户拒绝允许授权获取信息,
			//1002:获取openId接口服务报错,
			//1003:获取openId接口网络错误,
			//1004:微信登录调用失败
			loginCount++;
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
	getMemberAddress() {
		client.postData(apiUrl + 'eb-api/ma/getMemberAddressByMemberId', {
			"madMemberId": '',
			"page": {
				"currentPage": 1,
				"pageSize": 10,
			}
		}).then(res => {
			if (res.data.code === 200) {
				this.data.defaultProvince = res.data.data[0].madProvince;
				this.getFreight();
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
			$wuxToast.show({
				type: 'text',
				timer: 2000,
				color: '#fff',
				text: res.data.msg
			})
		})
	},
	getFreight() { //获取运费
		let spuNumMap = {};
		let skuNumMap = {};
		this.data.chooseList.forEach((val, index) => {
			spuNumMap[val.skuSpuId] = val.orcNumber;
			skuNumMap[val.orcSkuId] = val.orcNumber;
		});
		client.postData(apiUrl + 'eb-api/pc/getPromotionAndCarriage', {
			"area": this.data.defaultProvince,
			"skuNumMap": skuNumMap,
			"spuNumMap": spuNumMap
		}).then((res) => {
			if (res.data.code === 200) {
				this.setData({
					promotionSum: res.data.data.promotion
				});
				this.priceCalculation();
			} else {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				})
			}
		}, (res) => {
			$wuxToast.show({
				type: 'text',
				timer: 2000,
				color: '#fff',
				text: res.data.msg
			})
		});
	},
	getCartListData() {
		client.postData(apiUrl + 'eb-api/orc/getOrderCartByMemberId', {
			"isSelectAll": true,
		}).then(res => {
			if (res.data.code === 200) {
				this.data.totalPrice = 0;
				this.data.sumPrice = 0;
				this.data.chooseList = [];
				this.recommendData = [];
				this.isLoading = false;
				this.noMoreData = false;
				if (res.data.data.length != 0) {
					res.data.data.forEach((val) => {
						val.orderCartResps.forEach((item, index) => {
							if (item.skuShowNum != 0 && item.spuShelvesStatus == 1) {
								item.active = true;
								this.data.totalPrice += item.skuPromotionPrice * item.orcNumber;
								this.data.chooseList.push(item)
								// if (item.skuPromotionPrice == item.skuSalePrice) {
								// 	if (item.skuMarketSalePrice == 0) {
								// 		this.data.sumPrice += item.skuSalePrice * item.orcNumber;
								// 	} else {
								// 		this.data.sumPrice += item.skuMarketSalePrice * item.orcNumber;
								// 	}
								// } else {
									this.data.sumPrice += item.skuSalePrice * item.orcNumber;
								// }
								this.getRecommendData(res.data.data[0].orderCartResps[0].skuSpuId)
							} else {
								this.data.invalidList.push(item)
							}
						})
					});
					this.getMemberAddress();
					this.setData({
						cartListData: res.data.data,
						totalPrice: (this.data.totalPrice - this.data.promotionSum).toFixed(2),
						sumPrice: this.data.sumPrice,
						discountPrice: ((this.data.sumPrice - this.data.totalPrice) + this.data.promotionSum).toFixed(2),
						spuId: res.data.data[0].skuSpuId
					})
				} else {
					this.setData({
						cartListData: res.data.data,
					})
					this.getRecommendDataNoGoods()
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
			console.log(res);
			$wuxToast.show({
				type: 'text',
				timer: 2000,
				color: '#fff',
				text: res.data.msg
			})
		})
	},
	getPromotionCartListData() {
		client.postData(apiUrl + 'eb-api/orc/getOrderCartByMemberId', {
			"isSelectAll": false,
			"skuIds": this.data.skuPromotionList
		}).then(res => {
			if (res.data.code === 200) {
				let newArr = [];
				res.data.data.forEach((item) => {
					if (item.promotionName != '') {
						newArr.push(item);
					}
				});
				this.data.cartListData.forEach(item => {
					if (item.promotionName == '') {
						newArr.push(item);
					}
				});
				this.setData({
					cartListData: newArr,
				});
				this.priceCalculation();

				// res.data.data.forEach((val) => {
				// 	val.orderCartResps.forEach((item, index) => {
				// 		if (item.skuShowNum != 0 && item.spuShelvesStatus == 1) {
				// 			item.active = true;
				// 			this.data.totalPrice += item.skuPromotionPrice * item.orcNumber;
				// 			this.data.chooseList.push(item)
				// 			if (item.skuPromotionPrice == item.skuSalePrice) {
				// 				if (item.skuMarketSalePrice == 0) {
				// 					this.data.sumPrice += item.skuSalePrice * item.orcNumber;
				// 				} else {
				// 					this.data.sumPrice += item.skuMarketSalePrice * item.orcNumber;
				// 				}
				// 			} else {
				// 				this.data.sumPrice += item.skuSalePrice * item.orcNumber;
				// 			}
				// 		} else {
				// 			this.data.invalidList.push(item)
				// 		}
				// 	})
				// });
				// this.setData({
				// 	totalPrice: (this.data.totalPrice - this.data.promotionSum).toFixed(2),
				// 	sumPrice: this.data.sumPrice,
				// 	discountPrice: ((this.data.sumPrice - this.data.totalPrice) + this.data.promotionSum).toFixed(2),
				// 	spuId: res.data.data[0].skuSpuId
				// })
				
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
	getRecommendDataNoGoods() {
		client.postData(apiUrl_cms + 'cms-api/goods/2.0.0/getContentListFence', {
			"currentPage": this.data.page,
			"pageSize": 50,
			"fenceId": 10001,
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
	goToDetail(e) {
		tracker.trackData({ id: '704011', title: '点击商品' });
		wx.navigateTo({
			url: "/pages/goodsDetail/index?spuId=" + e.currentTarget.dataset.spuid,
		})
	},
	deleteGoods(e) {
		let _this = this;
		tracker.trackData({ id: '704010', title: '编辑-点击删除' });
		wx.showModal({
			title: '提示',
			content: '确认删除该商品吗？',
			confirmText: "删除",
			cancelText: "我再想想",
			success: function (res) {
				if (res.confirm) {
					client.postData(apiUrl + 'eb-api/orc/deleteOrderCart?orcId=' + e.currentTarget.dataset.orcid, {}).then(res => {
						if (res.data.code === 200) {
							_this.getCartListData()
							_this.setData({
								showDeleteSuccTips: true
							});
							setTimeout(function () {
								_this.setData({
									showDeleteSuccTips: false
								});
							}, 3000);
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
			}
		})
	},
	editCart() {
		let editArr = [];
		this.data.cartListData.forEach((val, index) => {
			val.orderCartResps.forEach(item => {
				editArr.push({
					"orcNumber": item.orcNumber,
					"orcSkuId": item.orcSkuId
				})
			})
		})
		client.postData(apiUrl + 'eb-api/orc/editOrderCart', {
			"requestList": editArr
		}).then(res => {
			if (res.data.code === 200) {
				console.log("修改购物车成功");
				this.data.skuPromotionList = [];
				this.data.cartListData.forEach((val) => {
					val.orderCartResps.forEach((item, index) => {
						if (item.skuShowNum != 0 && item.spuShelvesStatus == 1) {
							this.data.skuPromotionList.push(item.orcSkuId)
						}
					})
				});
				this.getPromotionCartListData();
				this.data.cartListData.forEach((val) => {
					val.orderCartResps.forEach((item, index) => {
						if (item.skuShowNum != 0 && item.spuShelvesStatus == 1) {
							if (item.promotionName!="" && item.isSelect) {
								this.data.chooseList.push(item)
							}
							else if (!item.promotionName==""&&item.active){
								this.data.chooseList.push(item)
							}
						} 
					})
				});
				this.getFreight();
				this.priceCalculation()
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
	skuNumAdd(e) { //数量++
		tracker.trackData({ id: '704004', title: '编辑-点击增加数量' });
		let index = e.currentTarget.dataset.index;
		let sindex = e.currentTarget.dataset.sindex;
		if (this.data.cartListData[sindex].orderCartResps[index].skuShowNum != 0 && this.data.cartListData[sindex].orderCartResps[index].spuShelvesStatus == 1) {
			if (this.data.cartListData[sindex].orderCartResps[index].orcNumber >= this.data.cartListData[sindex].orderCartResps[index].skuShowNum) {
				console.log("库存不足")
				return;
			}
			this.data.cartListData[sindex].orderCartResps[index].orcNumber = this.data.cartListData[sindex].orderCartResps[index].orcNumber + 1;
			this.setData({
				cartListData: this.data.cartListData
			})
			this.editCart()
		}
	},
	skuNumSub(e) { //数量--
		tracker.trackData({ id: '704005', title: '编辑-点击减少数量' });
		let index = e.currentTarget.dataset.index;
		let sindex = e.currentTarget.dataset.sindex;
		if (this.data.cartListData[sindex].orderCartResps[index].skuShowNum != 0 && this.data.cartListData[sindex].orderCartResps[index].spuShelvesStatus == 1) {
			if (this.data.cartListData[sindex].orderCartResps[index].orcNumber < 2) {
				return;
			}
			this.data.cartListData[sindex].orderCartResps[index].orcNumber = this.data.cartListData[sindex].orderCartResps[index].orcNumber - 1;
			this.setData({
				cartListData: this.data.cartListData
			})
			this.editCart()
		}
	},
	chooseGoodsItem(e) {
		let index = e.currentTarget.dataset.index;
		let sindex = e.currentTarget.dataset.sindex;
		let bool = e.currentTarget.dataset.bool;
		let item = e.currentTarget.dataset.item;
		if (bool == 'false') {
			if (item.skuShowNum == 0 || item.spuCountryType == 0) {
				return;
			}
			this.data.cartListData[sindex].orderCartResps[index].active = !this.data.cartListData[sindex].orderCartResps[index].active;
			this.priceCalculation()
			if (this.data.chooseList.length + this.data.invalidList.length == this.data.cartListData.length) {
				this.setData({
					chooseAll: true,
				})
			} else {
				this.setData({
					chooseAll: false,
				})
			}
		} else {
			if (item.skuShowNum == 0 || item.spuCountryType == 0) {
				return;
			}
			this.data.chooseList = [];
			this.data.cartListData.forEach((val) => {
				val.orderCartResps.forEach((sitem, index) => {
					if (sitem.skuShowNum != 0 && sitem.spuShelvesStatus == 1) {
						if (item.orcSkuId == sitem.orcSkuId) {
							if (val.promotionType) {
								if (!sitem.isSelect) {
									this.data.chooseList.push(sitem);
								}
							}else{
								if (!sitem.active) {
									this.data.chooseList.push(sitem);
								}
							}
						}else{
							if (val.promotionType) {
								if (sitem.isSelect) {
									this.data.chooseList.push(sitem);
								}
							} else {
								if (sitem.active) {
									this.data.chooseList.push(sitem);
								}
							}
						}
					}
				})
			})
			if (this.data.chooseList.length + this.data.invalidList.length == this.data.cartListData.length) {
				this.setData({
					chooseAll: true,
				})
			} else {
				this.setData({
					chooseAll: false,
				})
			}
			this.data.skuPromotionList = [];
			this.data.chooseList.forEach((val, index, arr) => {
				this.data.skuPromotionList.push(val.orcSkuId);
			});
			this.getPromotionCartListData();
		}
		// this.getFreight();
	},
	chooseAllGoodsItem() {
		tracker.trackData({ id: '704008', title: '编辑-点击全选' });
		if (this.data.chooseAll) {
			this.data.cartListData.forEach((val, index) => {
				val.orderCartResps.forEach(item => {
					if (item.skuShowNum != 0 && item.spuShelvesStatus == 1) {
						item.active = false
					}
				})
			})
		} else {
			this.data.skuPromotionList = [];
			this.data.cartListData.forEach((val, index) => {
				val.orderCartResps.forEach(item => {
					if (item.skuShowNum != 0 && item.spuShelvesStatus == 1) {
						this.data.skuPromotionList.push(item.orcSkuId);
						item.active = true
					}
				})
			})
		}
		this.setData({
			cartListData: this.data.cartListData,
			chooseAll: !this.data.chooseAll,
		});
		this.getFreight();
		this.getPromotionCartListData();
	},
	priceCalculation() {
		this.data.totalPrice = 0;
		this.data.sumPrice = 0;
		this.data.chooseList = [];
		this.data.cartListData.forEach((val) => {
			val.orderCartResps.forEach((item, index) => {
				if ((item.skuShowNum != 0 && item.spuShelvesStatus == 1 && item.active) || (item.skuShowNum != 0 && item.spuShelvesStatus == 1 && item.isSelect)) {
					this.data.totalPrice += item.skuPromotionPrice * item.orcNumber;
					this.data.chooseList.push(item);
					// if (item.skuPromotionPrice == item.skuSalePrice) {
					// 	if (item.skuMarketSalePrice == 0) {
					// 		this.data.sumPrice += item.skuSalePrice * item.orcNumber;
					// 	} else {
					// 		this.data.sumPrice += item.skuMarketSalePrice * item.orcNumber;
					// 	}
					// } else {
						this.data.sumPrice += item.skuSalePrice * item.orcNumber;
					// }
				}
			})
		});
		this.setData({
			cartListData: this.data.cartListData,
			totalPrice: (this.data.totalPrice - this.data.promotionSum).toFixed(2),
			sumPrice: this.data.sumPrice,
			discountPrice: ((this.data.sumPrice - this.data.totalPrice) + this.data.promotionSum).toFixed(2)
		})
	},
	fillOrder() {
		tracker.trackData({ id: '704018', title: '点击结算' });
		if (this.data.chooseList.length == 0) {
			wx.showModal({
				title: '提示',
				showCancel: false,
				content: '请选择要结算的商品',
			})
			return;
		}
		wx.setStorageSync('chooseCartData', this.data.chooseList);
		wx.removeStorageSync("giftCardChosenData");
		wx.navigateTo({
			url: '/pages/fillOrder/index',
		})
	},
	goToHome() {
		tracker.trackData({ id: '704019', title: '点击去逛逛' });
		wx.switchTab({
			url: '/pages/index/index',
		})
	},
	recommendToDetail(e) {
		tracker.trackData({ id: '704017', title: '点击看了该商品的还买了的商品' });
		wx.navigateTo({//
			url: "/pages/goodsDetail/index?spuId=" + e.currentTarget.dataset.spuid,
		})
	},
	goHomePage() {
		wx.switchTab({
			url: '/pages/index/index',
		})
	},
	orcNumberInput() {
		tracker.trackData({ id: '704006', title: '编辑-点击输入数量' });
	},
	onReachBottom() {
		if (this.data.noMoreData) {
			return
		}
		this.setData({
			isLoading: true
		})
		if (this.data.cartListData.length == 0) {
			this.getRecommendDataNoGoods()
		} else {
			this.getRecommendData(this.data.spuId)
		}
	},
})