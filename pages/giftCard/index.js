import { apiUrl } from '../../common/config.js'
import { $wuxToast } from '../../components/wux'
import utils from '../../common/utils/utils.js'
import client from '../../common/utils/client';
import tracker from '../../common/utils/tracker.js';
const app = getApp();
let sliderWidth = 114;
Page({
	data: {
		activeIndex: 0,
		sliderOffset: 0,
		sliderLeft: 0,
		usableData: null, //可用礼品卡
		disableData: null, //不可用礼品卡
		recordData: null, //消费记录
		giftCardChosen: null,
		hideCheck: false,
	},
	onLoad: function (options) {
		let that = this;
		wx.getSystemInfo({
			success: function (res) {
				that.setData({
					sliderLeft: (res.windowWidth / 3 - sliderWidth) / 2,
					sliderOffset: res.windowWidth / 3 * that.data.activeIndex
				});
			}
		});
		if (options.hideCheck == 'true') {
			this.setData({
				hideCheck: true
			})
		}
	},
	onShow: function () {
		this.getGiftCardList(1);
		this.getGiftCardList(2);
		this.getConsumeLog();
		tracker.firstRead({ id: '657', title: '礼品卡页' });
	},
	getGiftCardList(status) {
		wx.showLoading({
			title: '正在加载...',
		})
		client.postData(apiUrl + "eb-api/giftCard/list", {
			"cardStatus": status,
		}).then(res => {
			wx.hideLoading();
			if (res.data.code === 200) {
				if (res.data.data.detailList && res.data.data.detailList.length != 0) {
					res.data.data.detailList.forEach(item => {
						item.subCardBeginTime = utils.formatDateNoHour(item.subCardBeginTime);
						item.subCardEndTime = utils.formatDateNoHour(item.subCardEndTime);
					});
					if (status == 1) {
						let giftCardChosenData = wx.getStorageSync('giftCardChosenData');
						res.data.data.detailList.forEach(item => {
							if (giftCardChosenData != '' && giftCardChosenData != null && giftCardChosenData != undefined) {
								giftCardChosenData.giftCardChosen.find(val => {
									if (item.cardDetailId == val.cardDetailId) {
										item.active = true;
									}
								})
							}
						});
						this.setData({
							usableData: res.data.data
						})
					} else {
						this.setData({
							disableData: res.data.data
						})
					}
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
			wx.hideLoading();
			console.log(res);
		})
	},
	bindNewCard() {
		tracker.trackData({ id: '657005', title: '点击绑定新卡' });
		wx.navigateTo({
			url: '/pages/giftCard/addCard/addCard',
		})
	},
	tabClick(e) {
		if (e.currentTarget.id == 0) {
			tracker.trackData({ id: '657002', title: '点击可用' });
		} else if (e.currentTarget.id == 1) {
			tracker.trackData({ id: '657003', title: '点击不可用' });
		} else if (e.currentTarget.id == 2) {
			tracker.trackData({ id: '657004', title: '点击收支明细' });
		}
		this.setData({
			sliderOffset: e.currentTarget.offsetLeft,
			activeIndex: e.currentTarget.id
		});
	},
	getConsumeLog() {
		client.postData(apiUrl + "eb-api/giftCard/consumeLog", {}).then(res => {
			if (res.data.code === 200) {
				if (res.data.data.groupList.length != 0) {
					res.data.data.groupList.forEach(item => {
						item.logDate = this.timeSlotFilter(item.logDate);
						item.logList.forEach(val => {
							val.updateTime = utils.formatTime(val.updateTime);
						})
					});
				}
				this.setData({
					recordData: res.data.data
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
	timeSlotFilter: function (time) {
		let date = new Date(time);
		const year = date.getFullYear();
		const month = (date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
		return year + "年" + month + "月";
	},
	chooseGiftCard(e) {
		tracker.trackData({ id: '657006', title: '选择礼品卡' });
		let index = e.currentTarget.dataset.item;
		let totalBalance = 0;
		let giftCardChosenData = [];
		this.data.usableData.detailList[index].active = !this.data.usableData.detailList[index].active;
		this.setData({
			usableData: this.data.usableData
		});
		this.data.usableData.detailList.forEach(item => {
			if (item.active) {
				giftCardChosenData.push(item);
				totalBalance += item.subCardBalance
			}
		});
		wx.setStorageSync('giftCardChosenData', { 'giftCardChosen': giftCardChosenData, 'totalBalance': totalBalance });
	},
})