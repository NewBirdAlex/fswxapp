
import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client'
import tracker from '../../../common/utils/tracker.js';
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		page: 1,
		goodList: [],
		allPage: 1,
		hiddenEva: true
	},


	onLoad: function (options) {
		if (this.data.page <= this.data.allPage) {
			this.loadMore();
		}
	},
	onShow: function () {
		tracker.firstRead({ id: '716', title: '商品评价成功页' });
	},
	goEvaluation: function (e) {
		wx.navigateTo({
			url: '/pages/order/goodsEvaluation/index?ordOrderId=' + e.currentTarget.dataset.item.ordOrderId
		})
	},
	loadMore: function () {
		var _this = this;
		if (_this.data.page < this.data.allPage) {
			wx.showLoading({
				title: '加载中',
			})
		}
		client.postData(apiUrl + 'eb-api/order/list', {
			"ordStatus": 6,
			"page": {
				"currentPage": this.data.page,
				"pageSize": 10
			}
		}).then(res => {
			if (res.data.code === 200) {
				if (_this.data.page == 1 && res.data.data.length == 0) {
					_this.setData({
						hiddenEva: false
					})
				} else {
					_this.setData({
						hiddenEva: true
					})
				}
				_this.setData({
					page: _this.data.page + 1,
					goodList: _this.data.goodList.concat(res.data.data),
					allPage: res.data.page.totalPage
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
	onReachBottom() {
		this.loadMore()
	},
	onReady: function () {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function () {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	}
})