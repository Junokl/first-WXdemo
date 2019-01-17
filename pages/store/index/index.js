var app = getApp();
var common = require('../../../utils/common.js');
var request = app.request;
var setting = app.globalData.setting;

Page({
    data: {
        url: setting.url,
        store: null, //请求的店铺信息
        userInfo:  wx.getStorageSync('app:userInfo') || {},
        imChoose: 0
    },

    onLoad: function (options) {
        var that = this;
        app.getConfig(function (res) {
            var im_choose = common.getConfigByName(res.config, 'im_choose');
            that.setData({ imChoose: im_choose });
        });

        this.requestStore(options.store_id);
    },

    /** 请求店家信息 */
    requestStore: function(storeId) {
        var that = this;
        request.get('/api/store/index', {
            failRollBack: true,
            data: { store_id: storeId },
            success: function (res) {
                that.setData({ store: res.data.result });
            }
        });
    },

    /** 关注店铺 */
    focusStore: function () {
        var that = this;
        request.post('/api/store/collectStoreOrNo', {
            data: { store_id: that.data.store.store_id },
            success: function () {
                if (!that.data.store.is_collect) {
                    app.showSuccess('关注成功');
                }
                var num = that.data.store.store_collect;
                that.setData({ 
                    'store.is_collect': !that.data.store.is_collect,
                    'store.store_collect': !that.data.store.is_collect ? (num + 1) : (num - 1)
                });
            }
        });
    },

    /** 联系客服 */
    contactService: function () {
        app.confirmBox('请联系客服：' + this.data.store.store_phone);
    },

});