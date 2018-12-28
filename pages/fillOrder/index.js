import { apiUrl, apiUrl_cms } from '../../common/config.js'
import { $wuxToast } from '../../components/wux'
import utils from '../../common/utils/utils.js'
import client from '../../common/utils/client';
import tracker from '../../common/utils/tracker.js';
const app = getApp()
Page({
	data: {
		storageData: null,
		chosenAddress: null,
		chooseCartData: null,
		totalPrice: 0,//合计金额
		sumPrice: 0,//总计金额
		discountPrice: 0,//优惠金额
		totalGoodsNum: 0,
		orderFreight: 0,
		totalDiscount: 0,
		authorizationInput: false,
		authorizationWhy: false,
		authorizationList: false,
		authorizationListData: null,
		spuCountryType: 1,//'国内外分类：1-国内，2-国外'，默认为1,
		authSign: '',
		name: '',
		IDCard: '',
		mrnId: '',
		madId: '',
		buyerMessage: '',
		cartIdList: [],
		cartList: [],
		usableCouponList: null,
		chosenConpouPrice: null,
		giftCardList: null,
		totalBalance: null,
		totalBalancePrice: 0,
		promotionSum: 0,
	},
	onLoad: function (options) {
		this.getChosenCartData();
		this.getDefaultAddress();
		// this.getRealNameData();
		// this.getOrderCouponData();
	},
	onShow: function () {
		tracker.firstRead({ id: '706', title: '填写订单页' });
		let addressValue = wx.getStorageSync('chosenAddress');
		if (addressValue != '') {
			this.getFreight(addressValue.provinceName);//获取运费
			this.setData({
				chosenAddress: addressValue
			})
		}
		// if (addressValue) {
		// 	this.setData({
		// 		chosenAddress: addressValue
		// 	})
		// }

		//获取优惠券
		let hasChosenCoupon = wx.getStorageSync("hasChosenCoupon");
		if (hasChosenCoupon == "") {
			this.getOrderCouponData();
		} else if (hasChosenCoupon == "empty") {
			this.setData({
				chosenConpouPrice: null
			});
			// this.priceCalculation();
		} else {
			hasChosenCoupon.showMkcPrice = hasChosenCoupon.mkcPrice.toFixed(2);
			this.setData({
				chosenConpouPrice: hasChosenCoupon
			});
			// this.priceCalculation();
		}
		//获取礼品卡
		let giftCardChosenData = wx.getStorageSync('giftCardChosenData');
		if (giftCardChosenData != '' && giftCardChosenData != null && giftCardChosenData != undefined && giftCardChosenData.length != 0) {
			this.setData({
				giftCardList: giftCardChosenData.giftCardChosen,
				totalBalance: giftCardChosenData.totalBalance
			});
			// console.log(this.data.giftCardList);
			// this.priceCalculation();
		} else {
			this.getGiftCardList();
		}

		this.priceCalculation();
	},
	getChosenCartData() {
		let cartArr = wx.getStorageSync('chooseCartData');
		this.setData({
			chooseCartData: cartArr
		})
		this.data.chooseCartData.forEach(item => {
			if (item.spuCountryType != 1) {
				this.data.spuCountryType = 2;
			}
			this.data.cartIdList.push(item.orcId);
			this.data.cartList.push({
				"ordGiftStatus": 0,
				"ordOriginal": item.skuSalePrice,
				"ordPackageCode": "",
				"ordPackageName": "",
				"ordPackageStatus": '',
				"ordSkuId": item.orcSkuId,
				"ordSkuNum": item.orcNumber
			});
		})
		// this.priceCalculation();
		this.getTotalDiscount();
	},
	getOrderCouponData() {
		let cartListParams = [];
		let chooseCartData = wx.getStorageSync('chooseCartData');
		chooseCartData.forEach((val, index) => {
			let obj = {};
			if (val.skuPromotionPrice == val.skuSalePrice) {
				obj = { "amount": val.skuSalePrice * val.orcNumber, "spuId": val.skuSpuId };
			} else {
				obj = { "amount": val.skuPromotionPrice * val.orcNumber, "spuId": val.skuSpuId };
			}
			cartListParams.push(obj);
		});
		client.postData(apiUrl + 'eb-api/mkt/getMktCampaignRespList', {
			"carList": cartListParams,
			"mkcMemberId": '',
			"mkcStatus": '',
			"type": 2,
			"targetAppId": app.globalData.targetAppId
		}).then(res => {
			if (res.data.code === 200) {
				if (res.data.data.usableList && res.data.data.usableList.length != 0) {
					res.data.data.usableList[0].showMkcPrice = res.data.data.usableList[0].mkcPrice.toFixed(2);
					this.setData({
						usableCouponList: res.data.data.usableList,
						chosenConpouPrice: res.data.data.usableList[0],
					});
					this.priceCalculation();
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
		})
	},
	openCard() {
		// wx.showLoading({
		// 	title: '正在加载卡券列表...',
		// });
		// let codeList = [];
		// this.data.usableCouponList.forEach( item => {
		// 	codeList.push(item.cardCode);
		// });
		// this.decryptCode(codeList);
		wx.setStorageSync("chosenConpouPrice", this.data.chosenConpouPrice);
		wx.navigateTo({
			url: '/pages/fillOrder/coupon/index',
		})
	},
	opengiftCard() {
		tracker.trackData({ id: '706014', title: '点击礼品卡' });
		wx.navigateTo({
			url: '/pages/giftCard/index?hideCheck=false',
		})
	},
	decryptCode(arr) {
		client.postData(apiUrl_cms + 'cms-pay/wechat/card/1.0.0/code/decrypt', {
			"targetAppId": app.globalData.targetAppId,
			"encryptCodeList": arr
		}).then(res => {
			wx.hideLoading();
			if (res.data.code === 200) {
				let arr = []
				res.data.data.forEach((item, index) => {
					arr.push({ cardId: 'pdRrKvyMnSZEqzYhzgycKw1Mvm68', code: item.code })
				})
				// console.log(arr)
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
			wx.hideLoading();
			console.log(res);
		})
	},
	goAddress(e) {
		this.getAddressList()
	},
	//获取地址列表
	getAddressList: function () {
		let _this = this;
		if (_this.data.page < _this.data.allPage) {
			wx.showLoading({
				title: '加载中',
			})
		}
		client.postData(apiUrl + "eb-api/ma/getMemberAddressByMemberId", {
			"page": {
				"currentPage": _this.data.page,
				"pageSize": 5,
			}
		}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				if (res.data.data.length == 0) {
					tracker.trackData({ id: '706004', title: '点击新增地址' });
					wx.chooseAddress({
						success: (res) => {
							wx.showLoading({
								title: '正在加载...',
							})
							client.postData(apiUrl + "eb-api/ma/createMemberAddress", {
								"madAddressDetail": res.detailInfo,
								"madCity": res.cityName,
								"madDefault": 0,
								"madMobile": res.telNumber,
								"madPostCode": '',
								"madProvince": res.provinceName,
								"madReceiver": res.userName,
								"madTown": res.countyName
							}).then(res => {
								wx.hideLoading()
								if (res.data.code === 200) {
									client.postData(apiUrl + "eb-api/ma/getMemberAddressByMemberId", {
										"page": {
											"currentPage": _this.data.page,
											"pageSize": 5,
										}
									}).then(res => {
										wx.hideLoading()
										if (res.data.code === 200) {
											// wx.setStorageSync('chosenAddress', res.data.data[0])
											let address = {
												madId: res.data.data[0].madId,
												userName: res.data.data[0].madReceiver,
												nationalCode: "",
												telNumber: res.data.data[0].madMobile,
												postalCode: "",
												provinceName: res.data.data[0].madProvince,
												cityName: res.data.data[0].madCity,
												countyName: res.data.data[0].madTown,
												detailInfo: res.data.data[0].madAddressDetail
											};
											wx.setStorageSync("chosenAddress", address)
											_this.setData({
												chosenAddress: address
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
						fail: (res) => {
							wx.navigateTo({
								url: '/pages/addressList/index?type=2&show=true',
							})
						}
					})
				} else {
					tracker.trackData({ id: '706005', title: '点击已有地址' });
					wx.navigateTo({
						url: '/pages/addressList/index?type=2&show=true',
					})
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
	getDefaultAddress() {
		client.postData(apiUrl + "eb-api/ma/getMemberAddressByMemberId", {
			"page": {
				"currentPage": this.data.page,
				"pageSize": 5,
			}
		}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				if (res.data.data.length != 0) {
					res.data.data.forEach(item => {
						if (item.madDefault == 1) {
							let address = {
								madId: item.madId,
								userName: item.madReceiver,
								nationalCode: "",
								telNumber: item.madMobile,
								postalCode: "",
								provinceName: item.madProvince,
								cityName: item.madCity,
								countyName: item.madTown,
								detailInfo: item.madAddressDetail
							};
							wx.setStorageSync("chosenAddress", address);
							this.setData({
								chosenAddress: address
							});
							this.getFreight(address.provinceName);
						}
					})
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
	goToDetail(e) {
		wx.navigateTo({
			url: "/pages/goodsDetail/index?spuId=" + e.currentTarget.dataset.spuid,
		})
	},
	priceCalculation() {
		this.data.totalPrice = 0;
		this.data.sumPrice = 0;
		this.data.totalBalancePrice = 0;
		this.data.totalGoodsNum = 0;
		this.data.chooseCartData.forEach((item, index) => {
			this.data.totalPrice += item.skuPromotionPrice * item.orcNumber;
			this.data.totalGoodsNum += item.orcNumber;
			this.data.sumPrice += item.skuSalePrice * item.orcNumber;
		});
		if (this.data.chosenConpouPrice) {
			this.data.totalPrice = this.data.totalPrice - this.data.chosenConpouPrice.mkcPrice;
		}
		if (this.data.orderFreight != 0) {
			this.data.totalPrice = this.data.totalPrice + Number(this.data.orderFreight);
		}
		let giftCardChosenData = wx.getStorageSync('giftCardChosenData');
		if (giftCardChosenData != '' && giftCardChosenData != null && giftCardChosenData != undefined) {
			if (this.data.totalPrice > giftCardChosenData.totalBalance) {
				this.data.totalPrice = this.data.totalPrice - giftCardChosenData.totalBalance;
				this.data.totalBalancePrice = giftCardChosenData.totalBalance;
			} else {
				this.data.totalBalancePrice = this.data.totalPrice;
				this.data.totalPrice = 0;
			}
		}
		this.setData({
			totalPrice: (this.data.totalPrice - this.data.promotionSum).toFixed(2),
			sumPrice: this.data.sumPrice.toFixed(2),
			totalBalancePrice: this.data.totalBalancePrice.toFixed(2),
			discountPrice: (this.data.sumPrice - this.data.totalPrice).toFixed(2),
			totalGoodsNum: this.data.totalGoodsNum
		});
	},
	getFreight(pro) { //获取运费
		// let objData = '{';
		// this.data.chooseCartData.forEach((val, index) => {
		// 	objData += '"' + val.skuSpuId + '"' + ":" + val.orcNumber + ',';
		// });
		// objData = objData.substring(0, objData.length - 1);
		// objData += '}';
		let spuNumMap = {};
		let skuNumMap = {};
		this.data.chooseCartData.forEach((val, index) => {
			spuNumMap[val.skuSpuId] = val.orcNumber;
			skuNumMap[val.orcSkuId] = val.orcNumber;
		});
		client.postData(apiUrl + 'eb-api/pc/getPromotionAndCarriage', {
			"area": pro,
			"skuNumMap": skuNumMap,
			"spuNumMap": spuNumMap
		}).then((res) => {
			if (res.data.code === 200) {
				this.setData({
					orderFreight: res.data.data.carriage.toFixed(2),
					promotionSum: res.data.data.promotion,
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
			wx.hideLoading()
			console.log(res)
		});
	},
	getTotalDiscount() { //获取限时折扣信息
		let discountArr = [];
		this.data.chooseCartData.forEach((val, index) => {
			discountArr.push({ "num": val.orcNumber, "skuId": val.orcSkuId });
		});
		client.postData(apiUrl + 'eb-api/mkt/getTotalDiscount', discountArr).then((res) => {
			if (res.data.code === 200) {
				this.setData({
					totalDiscount: res.data.data
				})
			} else {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				})
			}
		}, (res) => {
			wx.hideLoading()
			console.log(res)
		});
	},
	getGiftCardList() { //获取礼品卡列表
		client.postData(apiUrl + "eb-api/giftCard/list", {}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				let giftCardChosenData = wx.getStorageSync('giftCardChosenData');
				if (res.data.data.detailList && res.data.data.detailList.length != 0 && giftCardChosenData != '' && giftCardChosenData != null && giftCardChosenData != undefined && giftCardChosenData.length != 0) {
					this.data.giftCardList = res.data.data.detailList;
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
	getRealNameData() {
		client.postData(apiUrl + "eb-api/mrn/list", {}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				console.log(res)
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
	goTopay() {
		tracker.trackData({ id: '706008', title: '点击去支付' });
		if (!this.data.chosenAddress) {
			wx.showModal({
				title: '提示',
				content: '请添加收货地址',
			})
		} else {
			wx.showLoading({
				title: '正在加载中...',
			})
			let fetchData = [];
			this.data.chooseCartData.forEach((val, index) => {
				fetchData.push({ "ordSkuNum": val.orcNumber, "skuId": val.orcSkuId, "skuSalePrice": val.skuSalePrice, "skuDiscountPrice": val.skuPromotionPrice })
			});
			//检查商品是否存在下架或已售罄
			client.postData(apiUrl + "eb-api/order/checkSku", fetchData).then(res => {
				if (res.data.code === 200) {
					if (res.data.data.length == 0) {
						if (this.data.spuCountryType == 2) {
							wx.hideLoading();
							$wuxToast.show({
								type: 'text',
								timer: 2000,
								color: '#fff',
								text: '订单内含有海外商品'
							})
							client.postData(apiUrl + "eb-api/mrn/list", {}).then(res => {
								wx.hideLoading()
								if (res.data.code === 200) {
									if (res.data.data.length == 0) {
										this.setData({
											authorizationInput: true
										})
									} else {
										res.data.data.forEach((item, index) => {
											if (index == 0) {
												item.active = true;
											} else {
												item.active = false;
											}
											item.mrnIdentity = item.mrnIdentity.replace(/(\d{3})\d{11}(\d{4})/, '$1***********$2');
										})
										this.setData({
											authorizationList: true,
											authorizationListData: res.data.data,
											mrnId: res.data.data[0].mrnId
										})
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
						} else {
							this.payNow()
						}
					} else {
						//存在下架或者已售罄商品
						let onlyPriceChange = true;
						let this_ = this;
						res.data.data.forEach((val, index) => {
							if (val.unableSale == 1) {
								onlyPriceChange = false;
								wx.showModal({
									title: '提示',
									content: '商品状态已发生变化，请重新确认订单',
									showCancel: false,
									success: function (res) {
										if (res.confirm) {
											wx.navigateBack({
												delta: 1,
											})
										}
									}
								})
							}
							this.data.chooseCartData.forEach((item, ind) => {
								if (item.orcSkuId == val.skuId) {
									if ((item.promotionPrice == null && val.skuSalePrice == val.skuDiscountPrice) || (item.promotionPrice == 0 && val.skuSalePrice == val.skuDiscountPrice)) {
										item.skuPromotionPrice = val.skuSalePrice;
									} else {
										item.skuPromotionPrice = val.skuDiscountPrice;
									}
									item.skuSalePrice = val.skuSalePrice;
								}
							});
						});
						if (onlyPriceChange) {
							wx.setStorageSync('chooseCartData', this.data.chooseCartData)
							$wuxToast.show({
								type: 'text',
								timer: 2000,
								color: '#fff',
								text: "订单商品价格已发生变化，请重新确认订单"
							})
						}
					}
				} else {
					wx.hideLoading()
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
	},
	payNow() {
		let _this = this;
		let giftCards = [];
		if (this.data.giftCardList && this.data.giftCardList.length != 0) {
			this.data.giftCardList.forEach(item => {
				giftCards.push(item.cardDetailId);
			})
		}
		let fetchData = {
			"buyerMessage": this.data.buyerMessage,
			"cartIdList": this.data.cartIdList,
			"detailList": this.data.cartList,
			"giftCards": giftCards,
			"madId": this.data.chosenAddress.madId,
			"mrnId": this.data.mrnId,
			"ordCampaignId": this.data.chosenConpouPrice == null ? '' : this.data.chosenConpouPrice.mkcCampaignId,
			"ordLogiType": 1,
			"ordShopId": -1,
			"ordVersion": '',
			"orsChannel": '',
			"orsClientType": 3,
			"orsClientVersion": "",
			"orsContent": "",
			"orsHeader": '',
			"orsMemberId": '',
			"orsTaxpayerNum": '',
			"orsTaxpayerAccount": '',
			"orsTaxpayerAddress": '',
			"orsTaxpayerEmail": '',
			"orsTaxpayerName": '',
			"orsTaxpayerPhone": '',
			"orsType": '',
			"orsSource": wx.getStorageSync('sourceData'),
			"orsStartSeries": tracker.startSeries
		};
		this.setData({
			authorizationList: false
		});
		client.postData(apiUrl + "eb-api/order/createOrder", fetchData).then(res => {
			if (res.data.code === 200) {
				//得到订单ID，调用接口获取微信支付相关参数
				let orderNo = res.data.data.orsId;
				if (res.data.data.orsOpenPay == 0) { //当支付总金额为0，就不调用支付，直接提示支付成功
					wx.showToast({
						title: '支付成功',
						icon: 'success',
						duration: 1500,
						mask: true
					});
					setTimeout(function () {
						wx.switchTab({
							url: '/pages/index/index',
						})
					}, 1500)
				} else {
					client.postData(apiUrl + 'eb-api/pay/payOrderSetExt', {
						"appId": app.globalData.appId,
						"appOrderNo": res.data.data.orsId,
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
									_this.getPayResult(orderNo);
								},
								'fail': (res) => {
									wx.hideLoading()
									wx.showToast({
										title: '支付失败',
										icon: 'loading',
										duration: 2000
									});
									setTimeout(function () {
										wx.redirectTo({
											url: '/pages/order/orderList/index',
										})
									}, 2000);
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
				}
			} else {
				wx.hideLoading()
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
					wx.removeStorageSync("hasChosenCoupon");
					wx.removeStorageSync("giftCardChosenData");
					setTimeout(function () {
						wx.switchTab({
							url: '/pages/index/index',
						})
					}, 1500);
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
	whyToAuth(e) {
		tracker.trackData({ id: '706009', title: '实名认证-点击实名认证说明' });
		if (e.currentTarget.dataset.sign == "input") {
			this.setData({
				authSign: 'input',
				authorizationWhy: true,
				authorizationInput: false
			})
		} else if (e.currentTarget.dataset.sign == "list") {
			this.setData({
				authSign: 'list',
				authorizationWhy: true,
				authorizationList: false
			})
		}
	},
	closeWhyAuth() {
		tracker.trackData({ id: '706010', title: '实名认证-点击知道了' });
		if (this.data.authSign == "input") {
			this.setData({
				authSign: 'input',
				authorizationWhy: false,
				authorizationInput: true
			})
		} else if (this.data.authSign == "list") {
			this.setData({
				authSign: 'input',
				authorizationWhy: false,
				authorizationList: true
			})
		}
	},
	bindKeyName(e) {
		this.setData({
			name: e.detail.value,
		})
	},
	bindKeyIDCard(e) {
		this.setData({
			IDCard: e.detail.value,
		})
	},
	bindKeyMsg(e) {
		this.setData({
			buyerMessage: e.detail.value,
		})
	},
	addRealName() {
		tracker.trackData({ id: '706013', title: '实名认证-确认' });
		if (this.data.IDCard == "" || this.data.name == "") {
			$wuxToast.show({
				type: 'text',
				timer: 2000,
				color: '#fff',
				text: "请输入完整信息"
			})
		} else if (this.data.IDCard.length != 18) {
			$wuxToast.show({
				type: 'text',
				timer: 2000,
				color: '#fff',
				text: "身份证不足18位"
			})
		} else {
			wx.showLoading({
				title: '正在加载中...',
			});
			client.postData(apiUrl + "eb-api/mrn/createMemberRealName", {
				"mrnIdentity": this.data.IDCard,
				"mrnName": this.data.name
			}).then(res => {
				if (res.data.code === 200) {
					this.setData({
						authorizationInput: false,
						mrnId: res.data.data
					});
					this.payNow();
				} else {
					wx.hideLoading()
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
	},
	chooseRealName(e) {
		this.data.authorizationListData.forEach((item, index) => {
			item.active = false;
		})
		this.data.authorizationListData[e.currentTarget.dataset.index].active = true;
		this.setData({
			authorizationListData: this.data.authorizationListData,
			mrnId: e.currentTarget.dataset.mrnid
		})
	},
	closeAllAuth() {
		this.setData({
			authorizationInput: false,
			authorizationWhy: false,
			authorizationList: false,
		})
	},
	msgTracker() {
		tracker.trackData({ id: '706007', title: '点击买家留言' });
	},
	nameTracker() {
		tracker.trackData({ id: '706011', title: '实名认证-输入姓名' });
	},
	IDCardTracker() {
		tracker.trackData({ id: '706012', title: '实名认证-输入身份证号' });
	},
	onUnload: function () {
		wx.removeStorageSync("hasChosenCoupon");
		wx.removeStorageSync("giftCardChosenData");
	},
})