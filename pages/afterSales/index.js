// pages/afterSales/index.js
import { apiUrl } from '../../common/config.js'
import { $wuxToast } from '../../components/wux'
import utils from '../../common/utils/utils.js'
import client from '../../common/utils/client';
import tracker from '../../common/utils/tracker.js';
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		activeIndex: 0,
		sliderOffset: 0,
		sliderLeft: 0,
		orderList: [],
		recordList: [],
		recordPage: {
			page: 1,
			noData: false,
			hasMoreData: true,
		},
		orderPage: {
			page: 1,
			noData: false,
			hasMoreData: true,
		},
		page: 1,
		noData: false,
		hasMoreData: true,
		recordBool: false,
	},
	onLoad: function (options) {
		let that = this;
		wx.getSystemInfo({
			success: function (res) {
				that.setData({
					sliderLeft: 0,
					sliderOffset: res.windowWidth / 2 * that.data.activeIndex
				});

			}
		});
	},
	onShow:function() {
		if (this.data.activeIndex == 0) {
			this.setData({
				orderList: [],
				orderPage: {
					page: 1,
					noData: false,
					hasMoreData: true,
				},
			});
		}else{
			this.setData({
				recordList: [],
				recordPage: {
					page: 1,
					noData: false,
					hasMoreData: true,
				},
			});
		}
		
		this.loadMore();
	},
	tabClick(e) {
		this.setData({ page: 0, noData: false, noMoreData: false, refundList: [], applyRefundList: [] });
		this.setData({
			sliderOffset: e.currentTarget.offsetLeft,
			activeIndex: e.currentTarget.id
		});
		if (!this.data.recordBool) {
			this.loadMore();
		}
	},
	loadMore() {
		if (this.data.activeIndex == 0) {
			wx.showLoading({
				title: '加载中...',
			});
			let options = {
				"page": {
					"currentPage": this.data.orderPage.page,
					"pageSize": 20
				}
			}
			client.postData(apiUrl + 'eb-api/order/getRefundOrderList', options).then((res) => {
				wx.hideLoading();
				if (res.data.code === 200) {
					if (this.data.orderPage.page == 1 && res.data.data.length == 0) {
						this.data.orderPage.noData = true;
						this.data.noData = true;
					}
					if (res.data.data.length < 10) {
						this.data.orderPage.hasMoreData = false;
						this.data.hasMoreData = false;
					}
					this.data.orderPage.page++;
					res.data.data.forEach(item => {
						this.data.orderList.push(item);
					});
					this.setData({
						orderList: this.data.orderList
					});
					this.data.page = this.data.orderPage.page;
					this.data.noData = this.data.orderPage.noData;
					this.data.hasMoreData = this.data.orderPage.hasMoreData;
				} else {
					$wuxToast.show({
						type: 'text',
						timer: 2000,
						color: '#fff',
						text: res.data.msg
					});
				}
			}, (res) => {
				wx.hideLoading();
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				});
			})
		} else if (this.data.activeIndex == 1) {
			wx.showLoading({
				title: '加载中...',
			});
			let options = {
				"currentPage": this.data.recordPage.page,
				"pageSize": 10
			}
			client.postData(apiUrl + 'eb-api/order/getRefundOrderRecords', options).then((res) => {
				wx.hideLoading();
				if (res.data.code === 200) {
					this.data.recordBool = true;
					if (this.data.recordPage.page == 1 && res.data.data.length == 0) {
						this.data.recordPage.noData = true;
						this.data.noData = true;
					}
					if (res.data.data.length < 10) {
						this.data.recordPage.hasMoreData = false;
						this.data.hasMoreData = false;
					}
					this.data.recordPage.page++;
					res.data.data.forEach(item => {
						this.data.recordList.push(item);
					});
					this.setData({
						recordList: this.data.recordList
					});
					
					this.data.page = this.data.recordPage.page;
					this.data.noData = this.data.recordPage.noData;
					this.data.hasMoreData = this.data.recordPage.hasMoreData;
				} else {
					$wuxToast.show({
						type: 'text',
						timer: 2000,
						color: '#fff',
						text: res.data.msg
					});
				}
			}, (res) => {
				wx.hideLoading();
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: res.data.msg
				});
			})
		}
	},
	goApply(e) {
		let orderId = e.currentTarget.dataset.orderid;
		let orstNo = e.currentTarget.dataset.orstno;
		let oitem = e.currentTarget.dataset.oitem;
		wx.setStorageSync('apply_goods_detail', oitem)
		wx.navigateTo({
			url: '/pages/afterSales/apply/index?orderId=' + orderId + '&orstNo=' + orstNo,
		});
	},
	goRecordDetail(e) {

    let item = e.currentTarget.dataset.item
		console.log(item)
    let orrOrdId = e.currentTarget.dataset.orrordid;
		

    if (item.ordRefundStatus == 2 || item.ordRefundStatus == 3 || item.ordRefundStatus == 4) {
      wx.navigateTo({
        url: '/pages/afterSales/refundInfor/index?orrOrdId=' + orrOrdId,
      });
      return
    }
    if (item.orrRefundStatus == 2 || item.orrRefundStatus == 3 || item.orrRefundStatus == 4) {
      wx.navigateTo({
        url: '/pages/afterSales/refundInfor/index?orrOrdId=' + orrOrdId,
      });
      return
    }

    wx.navigateTo({
      url: '/pages/afterSales/detail/index?orrOrdId=' + orrOrdId,
    });
	},
	onReachBottom: function() {
		this.loadMore();
	},
})