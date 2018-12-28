import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js';
Page({
	data: {
		refund: null,
		product: null,
    showMask:false
	},
	onLoad: function (options) {
		this.loadData(options);
	},
  opetate(e){
    let type = e.currentTarget.dataset.index;
    console.log(type)
    if (type == 1) {
      //fixed
      wx.navigateTo({
        url: '/pages/afterSales/apply/index?orderId=' + this.data.refund.orrOrdId + '&orstNo=' + this.data.refund.orrOrstNo,
      });
    } else {
      //cancel
      this.setData({
        showMask:true
      });
    }
  },
  changeMask(e){
    let type = e.currentTarget.dataset.index;
    if(type==1){
      this.setData({
        showMask: false
      });
    }else{
      client.postData(apiUrl +"/eb-api/order/cancelRefund",{
        refundId: this.data.refund.orrId
      }).then(
        res => {
          console.log(res);
          if (res.data.code == 200) {
            $wuxToast.show({
              type: 'text',
              timer: 2000,
              color: '#fff',
              text: '已撤销订单'
            });
            setTimeout(function () {
              wx.navigateBack({
                delta: 1
              })
            }, 2000);
          } else {
            $wuxToast.show({
              type: 'text',
              timer: 2000,
              color: '#fff',
              text: res.data.msg
            });
           }
        },
        res => { }
        );
    }
  },
	loadData: function (options) {
		client.postData(apiUrl + "eb-api/order/getRefundOrderDetail", { 'ordId': options.orrOrdId }).then(res => {
			wx.hideLoading();
			if (res.data.code != 200) {
				return;
			}
			res.data.data.orrCreatedTime = this.formatDate(res.data.data.orrCreatedTime);
      console.log(res.data.data)
      let progress = res.data.data.processLog;
      for(let i = 0 ;i<progress.length;i++){
        progress[i].createdTime = this.formatDate(progress[i].createdTime);
      }
			this.setData({
				refund: res.data.data, product: {
					'ordOrderId': res.data.data.orrOrdId,
					'status': res.data.data.orrRefundStatus,
					'spuPic': res.data.data.spuPic,
					'spuName': res.data.data.spuName,
					'skuName': res.data.data.skuName,
					'skuNum': res.data.data.orrSkuNum
				}
			});
		}, res => {

		});
	},
	formatDate(date) {
		let dd = new Date();
		let y = dd.getFullYear();
		let m = (dd.getMonth() + 1) < 10 ? '0' + (dd.getMonth() + 1) : '' + (dd.getMonth() + 1);
		let d = dd.getDate() < 10 ? '0' + dd.getDate() : '' + dd.getDate();
		let h = dd.getHours() < 10 ? '0' + dd.getHours() : '' + dd.getHours();
		let mo = dd.getMinutes() < 10 ? '0' + dd.getMinutes() : '' + dd.getMinutes();
		let s = dd.getSeconds() < 10 ? '0' + dd.getSeconds() : '' + dd.getSeconds();
		return y + "年" + m + "月" + d + "日  " + h + ":" + mo ;
	},
})