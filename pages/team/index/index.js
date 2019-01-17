// index.js
var app = getApp();
var setting = app.globalData.setting;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
  data: {
        url: setting.url,
        goodlist: null,
        currentPage: 1,
        goods_list: []//商品列表
    },

    onLoad: function () {
        load.init(this, '', 'goodlist');
        this.getFightGroupList();
    },

    getFightGroupList: function(){
        var that = this;
        var requestUrl = '/api/Team/AjaxTeamList?p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            wx.stopPullDownRefresh();
        });
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.reloadGoodList();
    },

    //重置数据
    reloadGoodList: function () {
        load.resetConfig();
        this.data.goodlist = null;
        this.data.currentPage = 1;
        this.getFightGroupList();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        if (load.canloadMore()) {
            this.getFightGroupList();
        }
    },

})