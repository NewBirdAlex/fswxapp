import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js';
const app = getApp();
Page({
	data: {
		inputValue: '',
	},
	onLoad: function (options) {

	},
	onShow: function () {
		tracker.firstRead({ id: '658', title: '绑定新卡页' });
	},
	cardInPsw(e) {
		this.setData({
			inputValue: e.detail.value
		})
	},
	addCard() {
		tracker.trackData({ id: '658002', title: '点击立即绑定' });
		if (this.data.inputValue=="") {
			$wuxToast.show({
				type: 'text',
				timer: 2000,
				color: '#fff',
				text: '请输入礼品卡密码'
			});
			return;
		}
		wx.showLoading({
			title: '正在绑定礼品卡...',
		})
		client.postData(apiUrl + "eb-api/giftCard/bind", {
			"cardCrypt": this.data.inputValue,
		}).then(res => {
			wx.hideLoading();
			if (res.data.code === 200) {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: '绑定成功'
				});
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
			wx.hideLoading();
			console.log(res);
		})
	},
})