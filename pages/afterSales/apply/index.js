import { apiUrl, apiUrl_cms } from '../../../common/config.js'
import { $wuxToast } from '../../../components/wux'
import utils from '../../../common/utils/utils.js'
import client from '../../../common/utils/client';
import tracker from '../../../common/utils/tracker.js';
Page({
	data: {
		data: null,
		explain: '',
		orstNo: 0,
    showDetail:false,
    goodIndex:null,
    reasonIndex:null,
    numIndex:0,
    numArray:[1],
    showReason:false,
    option1: '请选择',
    options1: [{
      key: 1,
      value: '已收到货'
    }, {
      key: 2,
      value: '未收到货'
    }],
    option2: '请选择',
    //options2: ['尺码拍错／不喜欢／效果差', '质量问题','材质／面料与商品描述不符','大小尺寸与商品描述不符','颜色／款式／图案与描述不符','卖家发错货','收到商品少件或破损'],
    options2: [],
    noGoodReason: [],
    hasGoodReason: [],
    images: [],
    onlyMoney: true,
    showDetail: false,
    totalMoney: null
	},
  getDetail(ordId){
    client.postData(apiUrl + '/eb-api/order/getRefundOrderDetail', {
      "ordId": ordId
    }).then(res => {
      if(res.data.data){
        this.setData({
          data:res.data.data,
          totalMoney: res.data.data.orrSkuNum * res.data.data.unitPrice,
          numIndex: res.data.data.orrSkuNum-1,
          explain: res.data.data.orrClientRemark
        });
      }
      let arr = [];
      if (this.data.data.ordNum){
        for(let i =0;i<this.data.data.ordNum;i++){
          arr.push(i + 1)
        } 
      }else{
        for (let i = 0; i < this.data.data.ordSkuNum; i++) {
          arr.push(i + 1)
        } 
      }
      this.setData({
        numArray: arr,
        
      });
    }, err => { });
  },
	onLoad: function (options) {
		let applyDetail = wx.getStorageSync("apply_goods_detail");
		this.setData({
			data: applyDetail,
			orstNo: options.orstNo,
      totalMoney: applyDetail.ordPromotion
		});
    console.log(options)
    if (options.orderId){
      this.getDetail(options.orderId);
    
    }
    this.getReason();
	},
  getReason(){
    //退款原因             
    client.postData(apiUrl_cms + 'eb-manager/system/listDictionary', {
      "key": "",
      "keyValue": "",
      "page": {
        "currentPage": 1,
        "pageSize": 100,
        "startIndex": 0,
        "totalPage": 0,
        "totalSize": 0
      },
      "parentCode": "refund_reason"
    }).then(res => {
      this.setData({
        noGoodReason: res.data.data
      });
    }, err => { });
    client.postData(apiUrl_cms + 'eb-manager/system/listDictionary', {
      "key": "",
      "keyValue": "",
      "page": {
        "currentPage": 1,
        "pageSize": 100,
        "startIndex": 0,
        "totalPage": 0,
        "totalSize": 0
      },
      "parentCode": "refund_reason_receive"
    }).then(res => {
      this.setData({
        hasGoodReason: res.data.data
      });
    }, err => { });
  },
	textareaInput(e) {
		this.setData({
			explain: e.detail.value
		})
	},
  chooseType(type){
    this.setData({
      showDetail: true
    })
    type.currentTarget.id == "onlyMoney" ? this.setData({
      onlyMoney: true
    }) : this.setData({
      onlyMoney: false,
      showReason:true,
      options2: this.data.hasGoodReason
    });
  },
  getRefundMoney(e){
    this.setData({
      totalMoney:e.detail.value
    });
  },
  bindGoodChange(e){
    this.setData({
      [e.currentTarget.id]: e.detail.value
    })
    console.log(e.detail.value)
    //change good status
    if (e.currentTarget.id =="goodIndex"){
      this.setData({
        reasonIndex: null,
        showReason:true
      });
      if(e.detail.value==0){
        this.setData({
          options2: this.data.hasGoodReason
        });
      }
      if (e.detail.value == 1) {
        this.setData({
          options2: this.data.noGoodReason
        });
      }
    }
    //change number change money
    if (e.currentTarget.id == "numIndex"){
      let num = Number(e.detail.value) +1;
      let price = this.data.data.unitPrice || this.data.data.ordPromotion;
      let money = this.floatMul(num, price)
      this.setData({ totalMoney: money});

    }
  },
  floatMul(arg1, arg2) {
    console.log(arg1, arg2)
    var m = 0,
      s1 = arg1.toString(),
      s2 = arg2.toString();
    try {
      m += s1.split(".")[1].length
    } catch (e) { }
    try {
      m += s2.split(".")[1].length
    } catch (e) { }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
  },
	apply() {
    if (this.onlyMoney) {
      if (this.data.goodIndex === null || this.data.reasonIndex === null || this.data.totalMoney == "") {

        $wuxToast.show({
          type: 'text',
          timer: 2000,
          color: '#fff',
          text: '请填写完整信息'
        });
        return
      }
    } else {
      if (this.reasonIndex === null || this.totalMoney == "") {
        $wuxToast.show({
          type: 'text',
          timer: 2000,
          color: '#fff',
          text: '请填写完整信息'
        });
        return
      }
    }
    if (this.data.totalMoney > this.data.data.ordActTotalAmount) {
     
      $wuxToast.show({
        type: 'text',
        timer: 2000,
        color: '#fff',
        text: '金额填写错误,请重新输入'
      });
      return
    }
    let opt = {
      "orrClientRemark": this.data.explain,
      "orrOrdId": this.data.data.ordId || this.data.data.orrOrdId,
      "orrOrstNo": this.data.orstNo,
      orrRefundAmount: this.data.totalMoney,
      orrRefundReason: this.data.options2[this.data.reasonIndex].key,
      orrRefundType: 1,
      refundImages:[],
      refundNum: this.data.numArray[this.data.numIndex],
      refundReasonString: this.data.options2[this.data.reasonIndex].keyValue
    }
    if (!this.data.onlyMoney) {
      opt.orrRefundType = 2;
    }
		client.postData(apiUrl + 'eb-api/order/refundOrderV2', opt).then((res) => {
			wx.hideLoading();
			if (res.data.code === 200) {
				$wuxToast.show({
					type: 'text',
					timer: 2000,
					color: '#fff',
					text: '申请成功！'
				});
				setTimeout(function(){
          wx.redirectTo({
            url: '../index'
          })
				},2000);
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
	},
})