// my_store.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        currentPage: 1,
        headPic: null,
        storeInfo: null,
        teamGoods: null,
    },

    onLoad: function (options) {
        load.init(this, '', 'teamGoods');
        this.getStoreInfo();
        this.getTeamGoods();
    },

    onShow: function () {
        // this.reloadGoodList();
    },

    getStoreInfo: function () {
        var that = this;
        request.get('/api/Distribut/store_summery', {
            success: function (res) {
                that.setData({ storeInfo: res.data.result });
            }
        });
    },

    getTeamGoods: function () {
        var that = this;
        var requestUrl = '/api/Distribut/my_store?p=' + that.data.currentPage;
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
        this.data.teamGoods = null;
        this.data.currentPage = 1;
        this.getStoreInfo();
        this.getTeamGoods();
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.getTeamGoods();
        }
    },

    goodList: function () {
        wx.navigateTo({ url: '/pages/distribut/good_list/good_list?hasshop=' + true, })
    },

    distributList: function () {
        wx.navigateTo({ url: '/pages/distribut/distribut_list/distribut_list', })
    },

    onShareAppMessage: function () {
        return setting.share;
    }

})