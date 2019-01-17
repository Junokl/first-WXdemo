// pages/user/brand_list/brand_list.js
var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var setting = app.globalData.setting;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentPage: 1,
    brandId: 0,
    resultData: null
  },

  onLoad: function (options) {
    this.setBarTitle(decodeURIComponent(options.name) || '品牌列表');
    this.setData({ brandId: options.id || 0 });
    load.init(this, 'goods_list', 'resultData');
    this.requestList();
  },

  setBarTitle(name) {
    wx.setNavigationBarTitle({
      title: name
    });
  },


  requestList: function () {
    var that = this;
    var requestUrl = `/api/Goods/goodsList?brand_id=${this.data.brandId}&p=${this.data.currentPage}`;
    load.request(requestUrl, function (res) {
      that.data.currentPage++;
      wx.stopPullDownRefresh();
    });
  },

  onPullDownRefresh: function () {
    this.reloadGoodList();
  },

  //重置数据
  reloadGoodList: function () {
    load.resetConfig();
    this.data.resultData = null;
    this.data.currentPage = 1;
    this.requestList();
  },

  onReachBottom: function () {
    if (load.canloadMore()) {
      this.requestList();
    }
  },

})