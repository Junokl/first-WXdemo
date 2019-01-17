// index.js
var app = getApp();
var setting = app.globalData.setting;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
  data: {
        url: setting.url,
        resultData: null,
        currentPage: 1,
    },

    onLoad: function () {
        load.init(this, 'list', 'resultData');
        this.getFightGroupList();
    },

    getFightGroupList: function(){
        var that = this;
        var requestUrl = '/api/Commission/commissionFlowRecord?p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            wx.stopPullDownRefresh();
        });
    },

    onPullDownRefresh: function () {
        this.reloadGoodList();
    },

    reloadGoodList: function () {
        load.resetConfig();
        this.data.resultData = null;
        this.data.currentPage = 1;
        this.getFightGroupList();
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.getFightGroupList();
        }
    },

})