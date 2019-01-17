//获取应用实例
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');
import LoadMore from '../../../utils/LoadMore.js';
var load = new LoadMore;

Page({
    data: {
        url: setting.url,
        logo: setting.appLogo,
        homeData: null, //首页轮播和广告
        saleGoods: null,  //秒杀商品
        sale: {
            countTime: {
                hour: '00',
                minute: '00',
                second: '00',
            },
            diffTime: 0,
            good: null,
        },
        userInfo: wx.getStorageSync('app:userInfo') || {} ,
        timer: null, //活动倒计时定时器
        recommend: null, //推荐商品
        scrollTop: 0,
        currentPage: 1,
        // 是否授权用户信息
        isAuthorize: true
    },

    // 事件处理函数
    onLoad: function (options) {
        this.getFirstLeaderId(options);
        this.setBarTitle();
        this.checkUserStatus();
        this.requestHomeInit();
    },
    // 切换
    onShow() {
        wx.getSetting({
            success: (res) => {
                if (res.authSetting['scope.userInfo']) {
                    this.closeAuth();
                } else {
                    this.openAuth();
                }
            },
            fail: () => {
            }
        })
        let userInfo = wx.getStorageSync('app:userInfo');
        userInfo && this.setData( { userInfo: userInfo } )
    },

    getFirstLeaderId(options) {
        // 获得上级信息
        if (options.first_leader) {
            wx.setStorageSync('first_leader', options.first_leader);
        }
        if (options.f) {
            wx.setStorageSync('first_leader', options.f);
        }
    },

    // 设置标题
    setBarTitle() {
        wx.setNavigationBarTitle({
            title: setting.appName,
        });
    },

    // 检查用户情况
    checkUserStatus() {
        var that = this;
        
        wx.getSetting({
            success: (res) => {
                if (res.authSetting['scope.userInfo']) {
                    this.closeAuth();
                } else {
                    this.openAuth();
                }
            },
            fail: () => {
            }
        })

        var wx_user_info = wx.getStorageSync('wx_user_info');
        if (wx_user_info) {
            app.globalData.wechatUser = wx_user_info.userInfo;
            app.globalData.authStatus = true
        }
        var appUserInfo = wx.getStorageSync('app:userInfo');
        if (appUserInfo) {
            app.globalData.userInfo = appUserInfo;
            app.globalData.authLogin = true;
        }
        // 以前有登录过，则直接登录
        if (app.auth.hasLogin()) {
            app.getUserInfo(function () {
                app.globalData.authLogin = true;
                that.closeAuth();
            });
        }
    },

    // 请求首页初始化
    requestHomeInit() {
        load.init(this, '', 'recommend');
        this.requestHomePage();
        this.requestRecommend();
        this.requestConfig();
    },


    //  首页logo
    requestConfig: function () {
        request.get('/api/Index/getConfig', {
            failRollback: true,
            successReload: true,
            success: function (res) {
                var data = res.data.result.config;
                data.some(function (item, index) {
                    if (item.name === 'hot_keywords') {
                        try {
                            // 获取热门搜索Key
                            wx.setStorageSync('configStorage:hot_keywords', item.value)
                        } catch (e) {
                        }
                        return true;
                    }
                })
            }
        });
    },

    // 广告位
    adHandler(e) {
        var index = e.currentTarget.dataset.index;
        var adList = this.data.homeData.ad_special;
        var jump_type = adList[index].jump_type
        var link = adList[index].jump_url;
        if (jump_type == 1) {
            if (link && link.indexOf('http') == -1) {
                return false;
            }
            let encodeUrl = encodeURIComponent(link)
            wx.navigateTo({
                url: `/pages/index/outlink/outlink?encodeUrl=${encodeUrl}`
            })
        } else if (jump_type == 2) {
            // 拼团列表
            wx.navigateTo({
                url: `/pages/team/index/index`
            })
        } else if (jump_type == 3) {
            // 促销列表
            wx.navigateTo({
                url: `/pages/activity/group_list/group_list`
            })
        } else if (jump_type == 4) {
            // 商品详情
            wx.navigateTo({
                url: `/pages/goods/goodsInfo/goodsInfo?goods_id=${link}`
            })
        } else {
            // 商品专题列表
            wx.navigateTo({
                url: `/pages/activity/topic_list/topic_list?id=${adList[index].id}&name=${encodeURIComponent(adList[index].ad_special_name)}`
            })
        }
    },

    // 轮播
    bannerClick (e) {
        var index = e.currentTarget.dataset.ids;
        var bannerList = this.data.homeData.banner;
        var media_type = bannerList[index].media_type
        var link = bannerList[index].ad_link;
        if (media_type == 3) {
            wx.navigateTo({
                url: `/pages/goods/goodsInfo/goodsInfo?goods_id=${link}`
            })
        } else if (media_type == 4) {
            wx.navigateTo({
                url: `/pages/goods/goodsList/goodsList?cat_id==${link}`
            })
        } else if (media_type == 5 && link) {
            if (link.indexOf('http') == -1) {
                return false;
            }
            let encodeUrl = encodeURIComponent(link)
            wx.navigateTo({
                url: `/pages/index/outlink/outlink?encodeUrl=${encodeUrl}`
            })
        } else { }
    },

    // 跳转外链
    jumpNianView() {
        var bannerList = this.data.homeData.banner;
        bannerList.some((item, index) => {
            if (item.media_type == 5) {
                var link = item.ad_link
                if (!link) return true;
                wx.navigateTo({
                    url: `/pages/index/outlink/outlink?encodeUrl=${encodeURIComponent(link)}`
                })
                return true;
            }
        })
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestRecommend();
        }
    },

    requestRecommend: function () {
        var that = this;
        var requestUrl = '/api/index/recommend?p=' + that.data.currentPage;
        load.request(requestUrl, function () {
            that.data.currentPage++;
        });
    },

    requestHomePage: function () {
        var that = this;
        request.get('/api/index/homePage?new_ad=1', {
            success: function (res) {
                var sale_goods = res.data.result.flash_sale_goods;
                if (sale_goods.length > 0) {
                    that.setSaleTime(res.data.result);
                    that.setData({ saleGoods: sale_goods });
                }
                that.setData({ homeData: res.data.result });
                wx.stopPullDownRefresh();
            }
        });
    },

    onPullDownRefresh: function (e) {
        this.data.recommend = null;
        this.data.currentPage = 1;
        load.resetConfig();
        this.requestHomePage();//首页数据
        this.requestRecommend();
    },

    onUnload: function () {
        this.destroyActivityTimer();
    },

    setSaleTime: function (result) {
        if (!result.diffTime) {
            result.diffTime = (new Date()).getTime() - result.server_time * 1000;
        }
        this.setData({ 'sale.diffTime': result.diffTime });
        this.setData({ 'sale.good': result.flash_sale_goods[0] });
        this.destroyActivityTimer();
        this.createActivityTimer();
    },

    /** 创建活动倒计时定时器 */
    createActivityTimer: function () {
        var sale = this.data.sale;
        var that = this;
        this.data.timer = setInterval(function () {
            var time = sale.good.end_time * 1000 - (new Date()).getTime() + sale.diffTime;
            var remainTime = util.transTime(time);
            if (time <= 0) {
                // that.destroyActivityTimer();
                // that.requestHomePage();//首页数据
                return;
            }
            that.setData({ 'sale.countTime': remainTime });
        }, 1000);
    },

    /** 销毁活动倒计时定时器 */
    destroyActivityTimer: function () {
        if (this.data.timer) {
            clearInterval(this.data.timer);
            this.data.timer = null;
        }
    },

    jumpSearch: function () {
        wx.navigateTo({ url: '/pages/goods/search/search' });
    },
    /**
     * 转发按钮
     */
    onShareAppMessage: function (res) {
        return setting.share;
    },

    ImgClick: function () {
        let encodeUrl = encodeURIComponent('https://api.meijilive.com/index.php/Mobile/index/index2/id/7');
        wx.navigateTo({
            url: `/pages/index/outlink/outlink?encodeUrl=${encodeUrl}`
        })
    },

    openAuth() {
        this.setData({ isAuthorize: true })
    },
    closeAuth() {
        this.setData({ isAuthorize: false })
    },

    bindGetUserInfo: function (res) {
        var that = this;
        if (res.detail.userInfo != undefined) {
            // 用户授权公开信息
            try {
                wx.setStorageSync('wx_user_info', res.detail);
                
                // 设置用户
                app.globalData.wechatUser = res.detail.userInfo
                app.globalData.authStatus = true;
                // 请求第三方登录
                app.auth.auth(function (res) {
                    that.closeAuth();
                    if (res.status !== -1) {
                        app.showSuccess('登录成功');
                        console.log(res)
                        that.setData({ userInfo: res })
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
    }

});
