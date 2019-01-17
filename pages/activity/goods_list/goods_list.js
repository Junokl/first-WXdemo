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
        goods_list: [],//商品列表
        type: 1
    },

    onLoad: function (options) {
        this.setData({type: options.type || 1});
        this.setBarTitle(options.type);
        load.init(this, '', 'goodlist');
        this.getFightGroupList();
    },

    setBarTitle(type) {
        wx.setNavigationBarTitle({
            title: type == 1? '热销榜单': '新品上市',
        });
    },

    getFightGroupList: function(){
        var that = this;
        var apiStr = (this.data.type == 1) ? 'api/goods/getHotGoods' : 'api/goods/getNewGoods';
        var requestUrl = `/${apiStr}?p=${that.data.currentPage}`;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            that.setData({ goods_list:res.data.result})
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
        this.data.goods_list = null;
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