// index.js
var app = getApp();
var setting = app.globalData.setting;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
  data: {
        url: setting.url,
        currentPage: 1,
        goods_list:[],
        id: 0,
        requestData: null,
        userInfo: wx.getStorageSync('app:userInfo') || {} ,
    },

    onLoad: function (options) {
        this.setBarTitle(decodeURIComponent(options.name) || '专题列表');
        this.setData({id: options.id || 0 })
        load.init(this, 'list', 'requestData');
        this.getFightGroupList();
    },

    setBarTitle(name) {
        wx.setNavigationBarTitle({
            title: name
        });
    },

    getFightGroupList: function(){
        var that = this;
        var requestUrl = `/api/goods/getSpecialGoods?p=${that.data.currentPage}&id=${that.data.id}`;
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