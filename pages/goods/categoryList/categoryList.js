var app = getApp();
var request = app.request;

Page({
    data: {
        url: app.globalData.setting.url,
        firstCategoris: [],
        categories: [],
        ad: null, //广告
        currentCategoryId: 0, //目前的第一分类id
        scrollHeight: 0, //界面高度，用于滚动
        isAuthorize: true
    },

    onLoad: function() {
        this.requestFirstCategoris();
    },
    
    onShow: function () {
        if (app.auth.isUserAuth()) {
            this.closeAuth();
        }
    },

    requestFirstCategoris: function () {
        var that = this;
        request.post('/api/goods/goodsCategoryList', {
            data: { new_ad: 1 },
            success: function (res) {
                if (res.data.result.adv != null){
                    that.setData({ ad: res.data.result.adv });
                }
                var categories = res.data.result.category;
                if (categories.length == 0) {
                    return;
                }
                that.setData({ firstCategoris: categories });
                that.requestCategories(categories[0].id);
            }
        });
    },

    //请求分类
    requestCategories: function (parenId) {
        var that = this;
        request.get('/api/goods/goodsSecAndThirdCategoryList', {
            data: { 'parent_id': parenId },
            success: function (res) {
                that.setData({ 
                    categories: res.data.result,
                    currentCategoryId: parenId
                });
            }
        });
    },

    //切换第一分类
    switchFirstCategory: function(e) {
        this.requestCategories(e.currentTarget.dataset.id);
    },

    goodsList: function(e){
        var catId = e.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/goods/goodsList/goodsList?cat_id=' + catId, })
    },

    openAuth() {
        this.setData({ isAuthorize: true })
    },
    closeAuth() {
        this.setData({ isAuthorize: false })
    },
     // 用户授权操作
    bindGetUserInfo: function (res) {
        if (res.detail.userInfo != undefined) {
            // 用户授权公开信息
            try {
                wx.setStorageSync('wx_user_info', res.detail);
                
                this.closeAuth();
                // 设置用户
                app.globalData.wechatUser = res.detail.userInfo
                app.globalData.authStatus = true;
                // 请求第三方登录
                app.auth.auth(function (res) {
                    if (res.status !== -1) {
                        app.globalData.authLogin = true
                        wx.removeStorageSync('first_leader');
                        wx.removeStorageSync('unique_id');
                    } else {
                        app.globalData.authLogin = false
                    }
                })
            } catch (e) {
                app.globalData.authStatus = false;
                this.openAuth();
            }
        } else {
            app.globalData.authStatus = false;
            // 取消授权
            this.openAuth();
        }
    },

})