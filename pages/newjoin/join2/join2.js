var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
import Category from '../../../utils/category/Category.js';

Page({
    data: {
        url: setting.url,
        categorydata: null,
        storeTypes: [
            { id: 1, name: '旗舰店'}, 
            { id: 2, name: '专卖店'}, 
            { id: 3, name: '专营店'}
        ],
        storeType: -1,
        storeCats: null,
        storeCat: -1,
    },

    onLoad: function (options) {
        this.getApplyInfo();
        this.initCategory();
    },

    getApplyInfo: function () {
        var that = this;
        request.get('/api/newjoin/getApply', {
            fallRollBack: true,
            success: function (res) {
                that.setData({ storeCats: res.data.result.store_class });
            }
        });
    },

    /** 初始化经营类目弹框相关 */
    initCategory: function () {
        var that = this;
        new Category(this, 'categories', {
            endCall: function (categories) {
                that.setData({ categorydata: categories });
            }
        });
    },

    submitInfo: function (e) {
        if (!e.detail.value.store_name) {
            app.showWarning('店铺名不能为空');
            return 
        }
        if (!e.detail.value.seller_name) {
            app.showWarning('登录名不能为空');
            return 
        }
        var reg = /^[A-Za-z0-9]+$/;
        if (!reg.test(e.detail.value.seller_name)) {
            app.showWarning('登录名不能中文');
            return;
        }
        if (this.data.storeType==-1){
            app.showWarning('请选择店铺类型');
            return;
        }
        if (this.data.categorydata != null && !this.data.categorydata.category3_name){
            app.showWarning('请选择经营类目');
            return;
        }
        if (this.data.storeCat == -1) {
            app.showWarning('请选择店铺分类');
            return;
        }
        var data = e.detail.value;
        var category1 = this.data.categorydata.category1;
        var category2 = this.data.categorydata.category2;
        var category3 = this.data.categorydata.category3.split(',');
        Object.assign(data, {
            store_type: this.data.storeTypes[this.data.storeType].id,
            sc_id: this.data.storeCats[this.data.storeCat].sc_id,
            sc_name: this.data.storeCats[this.data.storeCat].sc_name,
        });
        category3.forEach((item, index) => {
          data['store_class_ids[' + index + ']'] = [category1, category2, item].join(',');
        })
        
        request.post('/api/newjoin/storeInfo', {
            data: data,
            success: function (res) {
                wx.redirectTo({ url: '/pages/newjoin/join3/join3' });
            }
        });
    },

    selectStoreType: function (e) {
        this.setData({ storeType: e.detail.value })
    },

    selectStoreCat: function (e) {
        this.setData({ storeCat: e.detail.value })
    }

})