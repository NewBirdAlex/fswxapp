import { apiUrl } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js';
Page({
	data: {
		refund: null,
		product: null,
    showMask:false,
    options:null,
    refundDes: null,
    refundAddress: null,
    expNumber:""
	},
	onLoad: function (options) {
    
    this.setData({
      options: options
    });
		this.loadData(options);
    this.getReason();
	},
  getReason() {
    client.postData(apiUrl + '/eb-manager/system/listDictionary', {
      "key": "",
      "keyValue": "",
      "page": {
        "currentPage": 1,
        "pageSize": 100,
        "startIndex": 0,
        "totalPage": 0,
        "totalSize": 0
      },
      "parentCode": "refund_desc"
    }).then((res) => {
      console.log(res)
      this.setData({
        refundDes:res.data.data
      });
    }, (data) => {
      
    })
    client.postData(apiUrl + '/eb-manager/system/listDictionary', {
      "key": "",
      "keyValue": "",
      "page": {
        "currentPage": 1,
        "pageSize": 100,
        "startIndex": 0,
        "totalPage": 0,
        "totalSize": 0
      },
      "parentCode": "refund_mail_addr"
    }).then((res) => {
      this.setData({
        refundAddress: res.data.data
      });
    }, (data) => {
      
    })
  },
  opetate(e){
    let type = e.currentTarget.dataset.index; 
    if (type == 1) {
      wx.navigateTo({
        url: '/pages/afterSales/apply/index?orderId=' + this.data.refund.orrOrdId + '&orstNo=' + this.data.refund.orrOrstNo,
      });
    } else {
      this.showPopUp = true;
    }
  },
  getInputNumber(e){
    this.setData({
      expNumber:e.detail.value
    });
  },
  inputExpred(){
    this.setData({
      showMask:true
    });
  },
  changeMask(e){
    if (e.currentTarget.dataset.opr==1){
      this.setData({
        showMask: false
      });
    }else{
      //上传物流单号
      if(!this.data.expNumber) return
      client.postData(apiUrl +"/eb-api/order/fillTrackingNumber", {
        "refundId": this.data.refund.orrId,
        "trackingNumber": this.data.expNumber
      }).then((res) => {
        console.log(res)
        if (res.data.code === 200) {
          
          this.loadData(this.data.options);
          this.setData({
            showMask: false
          });
          $wuxToast.show({
            type: 'text',
            timer: 2000,
            color: '#fff',
            text: '成功填写物流单号！'
          });
          console.log("enter")
        } else {
          $wuxToast.show({
            type: 'text',
            timer: 2000,
            color: '#fff',
            text: res.data.msg
          });
        }
      }, (data) => {

      })
      
    }
  },
	loadData: function (options) {
		client.postData(apiUrl + "eb-api/order/getRefundOrderDetail", { 'ordId': options.orrOrdId }).then(res => {
			wx.hideLoading();
			if (res.data.code != 200) {
				return;
			}
      res.data.data.orrCreatedTime = this.formatDate(res.data.data.orrCreatedTime);
      res.data.data.auditTime = this.formatDate(res.data.data.auditTime);
      res.data.data.expressTime = this.formatDate(res.data.data.expressTime);
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