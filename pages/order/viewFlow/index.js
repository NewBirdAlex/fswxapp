import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js';
const app = getApp()
Page({
	data: {
		orderData: null,
		logisticsData: null,
	},
	onLoad: function (options) {
		this.getSubOrderDetail(options.ordOrderId);
	},
	onShow: function () {
		tracker.firstRead({ id: '719', title: '查看物流页' });
	},
	getSubOrderDetail(ordOrderId) {
		wx.showLoading({
			title: '正在加载..',
		})
		client.postData(apiUrl + "eb-api/order/getByOrderSubId?ordOrderId=" + ordOrderId, {}).then(res => {
			if (res.data.code === 200) {
				this.getLogisticsData(ordOrderId);
				this.setData({
					orderData: res.data.data
				})
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
	getLogisticsData(ordOrderId) {
		client.postData(apiUrl + "eb-api/odd/getByOrderSubId?ordOrderId=" + ordOrderId, {}).then(res => {
			wx.hideLoading()
			if (res.data.code === 200) {
				res.data.data.forEach( item =>{
					item.oddContent = item.oddContent.replace(/(\d{11,})/, "<span style='color:#3f68ff;'>$1</span>");
				})
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
	setClipboardData(e) {
		wx.setClipboardData({
			data: e,
			success: function (res) {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: "已复制到粘贴板"
				})
			}
		})
	},
})