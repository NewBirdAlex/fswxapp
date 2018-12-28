import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js';
const app = getApp()
Page({
	data: {
		sureChoosed: 0,
		chosenConpouPrice: null,
		fillOrderCouponData: null,
	},
	onLoad: function (options) {

	},
	goChoosed: function (e) {
		if (e.target.id == 0) {
			this.setData({
				sureChoosed: 0
			})

		}
		if (e.target.id == 1) {
			this.setData({
				sureChoosed: 1
			})
		}
		if (e.target.id == 2) {
			this.setData({
				sureChoosed: 2
			})
		}
	},
	onShow: function () {
		let data = wx.getStorageSync("chosenConpouPrice");
		this.setData({
			chosenConpouPrice: data
		});
		this.getOrderCouponData();
	},
	getOrderCouponData() {
		let cartListParams = [];
		let chooseCartData = wx.getStorageSync('chooseCartData');
		wx.showLoading({
			title: '正在加载优惠券...',
		})
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
			wx.hideLoading();
			if (res.data.code === 200) {
				if (res.data.data.usableList && res.data.data.usableList.length!=0){
					res.data.data.usableList.forEach(item => {//formatDateNoHour
						if (this.data.chosenConpouPrice&&(item.mkcCampaignId == this.data.chosenConpouPrice.mkcCampaignId)) {
							item.active = true;
						} else {
							item.active = false;
						}
						item.mktStart = utils.formatDateNoHour(item.mktStart);
						item.mktEnd = utils.formatDateNoHour(item.mktEnd);
					});
				}
				if (res.data.data.disableList && res.data.data.disableList.length!=0) {
					res.data.data.disableList.forEach(item => {
						item.mktStart = utils.formatDateNoHour(item.mktStart);
						item.mktEnd = utils.formatDateNoHour(item.mktEnd);
					});
				}
				this.setData({
					fillOrderCouponData: res.data.data
				});
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
	chooseCoupon(e) {
		let index = e.currentTarget.dataset.index;
		this.data.fillOrderCouponData.usableList.forEach( (item,ind) => {
			if(index == ind) {
				item.active = !item.active;
			}else{
				item.active = false;
			}
		})
		this.setData({
			fillOrderCouponData: this.data.fillOrderCouponData
		});
		if (this.data.fillOrderCouponData.usableList[index].active){
			wx.setStorageSync("hasChosenCoupon", this.data.fillOrderCouponData.usableList[index]);
		}else{
			wx.setStorageSync("hasChosenCoupon", 'empty');
		}
	},
})