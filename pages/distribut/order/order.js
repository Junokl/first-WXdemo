// order.js
var app = getApp();
import LoadMore from '../../../utils/LoadMore.js';
var load = new LoadMore;
var util = require('../../../utils/util.js');
var request = app.request;
var api_token = require('../../../utils/token.js');
var setting = app.globalData.setting;

Page({
  data: {
    currentTab_2: 0,
    currentTab: 0,
    topBar: [
      { name: "直属" },
      { name: "推荐" }
    ],
    url: app.globalData.setting.url,
    statuses: [
      { name: "未付款", status: '0' },
      { name: "已付款", status: '1,2' },
      { name: "已结算", status: '3' }
    ],
    activeStatus: '0',
    orders: null,
    goods_list: [],
    currentPage: 1,
    user: "",
    user_type: null,  //1代表会员，2代表VIP用户，3代表团长
    type: 0//type=0代表直属，1代表推荐
  },

  onLoad: function (options) {
    var that = this;
    var status = typeof options.status == 'undefined' ? this.data.activeStatus : options.status;
    load.init(this, '', 'orders');
    app.getUserInfo(function (userInfo) {
      that.setData({
        user: userInfo,
        user_type: userInfo.level
      });
    });
    this.requestOrders(status);
  },
  // 切换‘全部’按钮
  changeTab: function (e) {
    this.resetData();
    this.requestOrders(e.currentTarget.dataset.status);
    this.setData({
      activeStatus: e.currentTarget.dataset.status
    });
  },
  //切换‘直属’按钮 
  changeTopTab: function (e) {
    this.setData({
      currentTab: e.currentTarget.dataset.idx,
      type: e.currentTarget.dataset.idx
    });
    this.resetData();
    this.requestOrders(this.data.activeStatus);
  },

  // requestOrders: function (status) {
  //   var that = this;
  //   // 用户id
  //   var user_id = wx.getStorageSync('app:userInfo').user_id;
  //   // console.log(user_id);
  //   request.get('/api/Commission/distributOrderList', {
  //     data: {
  //       p: that.data.currentPage,
  //       type: that.data.type,
  //       status: status
  //     },
  //     success: function (res) {
  //       that.data.currentPage++;
  //       console.log(res);
  //       console.log(that.data.orders);
  //       res.data.result.list.forEach(function (val, index, arr) {
  //         val.createTimeFormat = util.formatTime(val.create_time);
  //         val.goods_list.forEach(function (val2, index2, arr2) {
  //           val2.distributRatio = (val2.commission / val2.goods_price * 100).toFixed(1);
  //         });
  //       });
  //       // that.setData({ orders: res.data.result });
  //       console.log(that.data.orders);
  //       wx.stopPullDownRefresh();

  //     }
  //   });
  // },

  requestOrders: function (status) {
    var that = this;
    var requestUrl = '/api/Commission/distributOrderList?status=' + status + '&p=' + that.data.currentPage + '&type=' + that.data.type;
    load.request(requestUrl, function (res) {
      that.data.currentPage++;
      console.log(res);
      res.data.result.list.forEach(function (val, index, arr) {
        val.createTimeFormat = util.formatTime(val.create_time);
        val.goods_list.forEach(function (val2, index2, arr2) {
          val2.distributRatio = (val2.commission / val2.goods_price * 100).toFixed(1);
        });
      });
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    if (load.canloadMore()) {
      this.requestOrders(this.data.activeStatus);
    }
  },

  onPullDownRefresh: function (e) {
    this.resetData();
    this.requestOrders(this.data.activeStatus);
  },

  /** 重置数据 */
  resetData: function () {
    this.data.orders = null;
    this.data.currentPage = 1;
    load.resetConfig();
  },
});