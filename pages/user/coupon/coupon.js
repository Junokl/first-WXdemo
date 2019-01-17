var app = getApp();
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var util = require('../../../utils/util.js');

Page({

  data: {
    currentPage: 1,
    typeId: 0,
    currentTab: 0,
    categories: [
      { name: "未使用" },
      { name: "已使用" },
      { name: "已过期" }
    ],
    coupons: [],
  },

  onLoad: function (options) {
    var typeId = options.type || this.data.typeId ;
    load.init(this, '', 'coupons');
    this.requestCoupons(typeId);
  },

  onShow() {
    this.reloadCoupons(this.data.typeId)
  },

  changeTopTab: function (e) {
    this.setData({
      currentTab: e.currentTarget.dataset.id,
      typeId: e.currentTarget.dataset.id
    });
    load.resetConfig();
    this.setData({ coupons: null });
    this.data.currentPage = 1;
    this.requestCoupons(e.currentTarget.dataset.id);
  },

  requestCoupons: function (typeId) {
    var that = this;
    var requestUrl = '/api/user/getCouponList?type=' + typeId + '&p=' + that.data.currentPage;
    this.setData({ typeId: typeId });
    load.request(requestUrl, function (res) {
      that.data.currentPage++;
      res.data.result.forEach(function (val, index, arr) {
        val.use_start_time = util.format(val.use_start_time, 'yyyy-MM-dd');
        val.use_end_time = util.format(val.use_end_time, 'yyyy-MM-dd');
      });
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    if (load.canloadMore()) {
      this.requestCoupons(this.data.typeId);
    }
  },

  onPullDownRefresh: function (e) {
    this.reloadCoupons(this.data.typeId);
  },

  // 重载数据
  reloadCoupons: function (typeId) {
    load.resetConfig();
    this.setData({ coupons: null });
    this.data.currentPage = 1;
    this.requestCoupons(typeId);
  },

})
