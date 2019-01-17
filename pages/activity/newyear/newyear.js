//Page Object
var app = getApp();
var setting = app.globalData.setting;
import LoadMore from '../../../utils/LoadMore.js';
var load = new LoadMore;

Page({
  data: {
    url: setting.url,
    recommend: null,
    currentPage: 1
  },
  onLoad() {
    load.init(this, '', 'recommend');
    this.requestRecommend();
  },

  requestRecommend: function () {
    var that = this;
    var requestUrl = '/api/index/recommend?p=' + that.data.currentPage;
    load.request(requestUrl, function () {
      that.data.currentPage++;
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    if (load.canloadMore()) {
      this.requestRecommend();
    }
  },
  
  onPullDownRefresh: function (e) {
    this.data.recommend = null;
    this.data.currentPage = 1;
    load.resetConfig();
    this.requestRecommend();
  },

});