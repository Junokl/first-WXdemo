var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');
var WxParse = require('../../../utils/wxParse/wxParse.js');
var md5 = require('../../../utils/md5.js');
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;

Page({
    data: {
        url: setting.url,
        defaultAvatar: "../../../images/user68.jpg",
        userInfo: null,
        data: null, //请求的商品详情数据
        result: null,
        content: '', //商品详情页html
        goodsAttrs: null, //商品属性列表
        cartGoodsNum: 0, //购物车商品数量
        specSelect: 0, //选中的组合规格数组spec_goods_price下标
        optionItemId: 0, //页面参数，页面初始化指定显示的itemid，用于活动
        goodsInputNum: 1, //选中的商品件数
        openSpecModal: false, //是否打开规格弹窗
        openPromModal: false, //是否打开优惠信息弹窗
        showStore: false,
        activeCategoryId: 0, //商品主页tab
        supportPageScroll: false, //微信版本是否支持页面滚动回顶部
        address: {
            address: '',
            district: 0,
        },
        shipping: '',
        shippingCost: 0,
        enterAddressPage: false,
        categories: [
            { name: "商品介绍", id: 0 },
            { name: "商品详情", id: 1 },
        ],
        activeCategoryId2: 0, //商品内容tab
        categories2: [
            { name: "商品详情", id: 0 },
            { name: "规格参数", id: 1 },
        ],
        activeCategoryId3: 0, //商品评论tab
        categories3: [
            { name: "全部评价", id: 0, num: 0 },
            { name: "好评", id: 1, num: 0 },
            { name: "中评", id: 2, num: 0 },
            { name: "差评", id: 3, num: 0 },
            { name: "有图", id: 4, num: 0 }
        ],
        select: { //选择的(规格)商品的参数，用于显示
            // 商品价格
            price: 0,
            // 库存
            stock: 0,
            spec_img: '',
            specName: '',
            activity: null
        },
        timer: null, //活动倒计时定时器
        imChoose: 0, //0 QQ客服,1 IM客服,2 小能客服
        // 是否打开电话弹窗
        openFixedShow: false,
        // 电话
        store_phone: null,
        // 是否分享弹框Flag
        openShareShow: false,
        // 是否未注册授权
        isAuthPhoneShow: false,
        isBindAuthPhone: false,
        openPosterShow: false,
        canvasHeight: 436,
        // 页面参数
        options: {},
        // 页面授权
        isAuthorize: false,
        // 分享信息
        shareMessage: {},
        // 是否显示
        isShowReturnHome: false
    },

    onLoad: function (options) {
        this.userInfoStatus();
        if (options.scene) {
            // 小程序二维码
            let scene = decodeURIComponent(options.scene);
            var arrPara = scene.split("&")
            var sceneOptions = {}
            for (var i in arrPara) {
                var keyValue = arrPara[i].split('=');
                sceneOptions[keyValue[0]] = keyValue[1]
            }
            options = {
                goods_id: sceneOptions.g,
                item_id: sceneOptions.i,
                first_leader: sceneOptions.f,
                home: sceneOptions.h,
            }
        }

        options.home && this.showHomeButton();

        // 绑定上级
        options.first_leader && wx.setStorageSync('first_leader', options.first_leader)

        // 设置全局options页面参数
        this.setData({
            options: {
                g: options.goods_id,
                i: options.item_id || 0,
                f: options.first_leader || wx.getStorageSync('app:userInfo')['user_id'] || ''
            }
        })

        var userInfo = wx.getStorageSync('app:userInfo');
        this.setData({ userInfo: userInfo });

        var that = this;
        app.getConfig(function (res) {
            var im_choose = common.getConfigByName(res.config, 'im_choose');
            that.setData({ imChoose: im_choose });
        });

        this.data.optionItemId = options.item_id || 0;

        this.requestGoodsInfo(options.goods_id);

        this.requestCardNum();

        //是否支持返回按钮
        if (wx.pageScrollTo) {
            this.setData({ supportPageScroll: true });
        }

        //小程序嵌套不能超过5层
        var pages = getCurrentPages();
        if (pages.length < 5) {
            this.setData({ showStore: true });
            return;
        }
    },

    showHomeButton () {
        console.log('showButon')
        this.setData({isShowReturnHome: true})
    },

    onUnload() {
        wx.getStorageSync('first_leader') && wx.setStorageSync('first_leader', '')
    },

    getFirstLeaderId(options) {
        // 获得上级信息
        if (options.first_leader) {
            wx.setStorageSync('first_leader', options.first_leader);
        }
    },

    requestGoodsInfo(goods_id) {
        var that = this;
        request.get('/api/goods/goodsInfo', {
            data: { id: goods_id, share_id: wx.getStorageSync('first_leader') || '' },
            failRollback: true,
            success: function (res) {
                that.setData({ result: res.data.result });
                that.initData(res.data.result);
                that.requestGoodsContent();
                that.refreshDispatch(res.data.result);
            }
        });
    },
    

    getAuthPhoneHandler(e) {
        var that = this;
        var wechatUser = app.globalData.wechatUser
        if (e.detail.errMsg == 'getPhoneNumber:ok') {
            wx.checkSession({
                // 五分钟未失效
                success: function () {
                    console.log('未失效')
                    app.auth.wxLogin((res) => {
                        if (res.status === -1) {
                            wx.login({
                                success: function (res) {
                                    e.detail.code = res.code
                                    app.globalData.code = res.code
                                    that.requestWxAppPhone(e.detail, wechatUser)
                                },
                                fail: function (res) {
                                    console.log('未超时:'+ JSON.stringify(res));
                                }
                            })
                        }
                    })
                },
                // 超时
                fail: function () {
                    console.log('失效')
                    app.auth.wxLogin((res) => {
                        if (res.status === -1) {
                            wx.login({
                                success: function (res) {
                                    e.detail.code = res.code
                                    app.globalData.code = res.code
                                    that.requestWxAppPhone(e.detail, wechatUser)
                                },
                                fail: function (res) {
                                    console.log('超时:'+ JSON.stringify(res));
                                }
                            })
                        }
                    })
                }
            })
        } else {
            // 不选择手机号码
            // wx.navigateTo({ url: '/pages/user/binding_info/binding_info?nickName=' + wechatUser.nickName + '&userHeadPic=' + wechatUser.avatarUrl });
        }
    },

    requestWxAppPhone: function (data, wechatUser) {
        var that = this;
        request.postUser('/api/user/getWxMiniAppPhone?oauth=miniapp', {
            data: data,
            success(res) {
                var res = res.data;
                if (res.status == 1) {
                    that.closeAuthPhoneModal();
                    if (wechatUser) {
                        that.requrestBindUserInfo(wechatUser.nickName, res.result.purePhoneNumber);
                    } else {
                        that.requrestBindUserInfo('用户名', res.result.purePhoneNumber);
                    }
                }
            },
            fail() {
                // that.closeAuthPhoneModal();
            },
            failStatus(res) {
                if (res.data.status == -1) {
                    request.showError('滞留时间过长，请重新尝试', {});
                    return false;
                }
            }
        })
    },

    requrestBindUserInfo: function (nickname, phone) {
        var that = this;
        request.postUser('/api/user/bind_reg', {
            data: {
                mobile: phone,
                password: md5('TPSHOP123456'),
                nickname: nickname || '用户名',
                isMessage: 0
            },
            header: {
                "content-type": "application/x-www-form-urlencoded",
                'cookie': `first_leader=${wx.getStorageSync('first_leader') || ''}`
            },
            success: function (res) {
                wx.setStorageSync('isAuth', true);
                app.globalData.authLogin = true;
                app.globalData.userInfo = res.data.result.user;
                wx.setStorageSync('app:userInfo', res.data.result.user);
                app.showSuccess('绑定成功', function () {});
            },
            fail() {
                that.openAuthPhoneModal();
            }
        });
    },

    // 用户信息判断
    userInfoStatus() {
        wx.getSetting({
            success: (res) => {
                if (res.authSetting['scope.userInfo']) {
                    // 授权
                    this.closeAuth();
                } else {
                    // 未授权
                    this.openAuth();
                }
            },
            fail: () => {
            }
        })
        // if (!app.auth.hasLogin()) {
        //     // 未注册
        //     this.openAuthPhoneModal();
        // } else {
        //     // 已经注册[登录]
        //     this.closeAuthPhoneModal();
        // }
    },

    // 打开授权弹框
    openAuth() {
        this.setData({ isAuthorize: true })
    },

    // 关闭授权弹框
    closeAuth() {
        this.setData({ isAuthorize: false })
    },

    // 打开海报弹窗
    openPosterModal() {
        this.setData({ openPosterShow: true })
    },

    // 关闭海报弹窗
    closePosterModal() {
        this.setData({ openPosterShow: false })
    },

    // 
    openAuthPhoneModal() {
        this.setData({ isAuthPhoneShow: true })
    },

    openBindModal() {
        this.setData({ isBindAuthPhone: true })
    },

    closeAuthPhoneModal() {
        this.setData({ isAuthPhoneShow: false })
    },

    closeBindModal() {
        this.setData({ isBindAuthPhone: false })
    },

    //重新刷新物流数据
    onShow: function () {
        if (this.data.enterAddressPage) {
            this.data.enterAddressPage = false;
            this.refreshDispatch(this.data.result);
        }
    },

    /**查询商品物流 */
    refreshDispatch: function (result) {
        var that = this;
        var consigneeAddress = wx.getStorageSync('goodsInfo:goodsInfo:address') || result.consignee;
        that.setData({
            'address.address': consigneeAddress.address,
            'address.district': consigneeAddress.district,
        });
        request.get('/api/goods/dispatching', {
            data: {
                goods_id: result.goods.goods_id,
                region_id: consigneeAddress.district,
            },
            success: function (res) {
                var shippinginfo;
                if (res.data.result > 0) {
                    shippinginfo = '¥' + res.data.result;
                } else if (res.data.result == 0) {
                    shippinginfo = '包邮';
                } else {
                    shippinginfo = res.data.msg;
                }
                that.setData({ shippingCost: res.data.result });
                that.setData({ shipping: shippinginfo });
            },
        });
    },

    enterAddress: function () {
        this.data.enterAddressPage = true;
        wx.navigateTo({ url: '/pages/user/address_list/address_list?operate=selectAddress' });
    },

    onUnload: function () {
        this.destroyActivityTimer();
    },

    /** 初始化数据，注意顺序 */
    initData: function (data) {
        //初始化评论
        this.initComment(data);
        //初始化规格
        //this.initSpecsPrice(data);
        this.initCheckGoods(data);
        //初始化店铺
        this.initStore(data);
        //检查一下购物的数量，可能无库存
        this.checkCartNum(this.data.goodsInputNum);
    },

    /** 检查商品 */
    initCheckGoods: function (data) {
        // console.log(data)
        var that = this;
        var item_id = data.spec_goods_price.length > 0 ? data.spec_goods_price[0]['item_id'] : '';
        if (that.data.optionItemId) {
            item_id = that.data.optionItemId;
        }
        request.get('/api/goods/activity', {
            data: {
                goods_id: data.goods.goods_id,
                item_id: item_id,
            },
            success: function (res) {
                // console.log('act', res)
                //初始化规格
                if (res.data.result.goods.activity_is_on == 1) {
                    // data.activity = res.data.result.goods
                    that.initSpecsPrice(data);
                } else {
                    data.goods.prom_type = 0;
                    that.initSpecsPrice(data);
                }
            }
        });
    },

    /** 初始化店铺 */
    initStore: function (data) {
        var s = data.store;
        s.avgScore = (s.store_desccredit / 3 + s.store_servicecredit / 3 + s.store_deliverycredit / 3).toFixed(2);
        s.descScoreDesc = common.getStoreScoreDecs(s.store_desccredit);
        s.serviceScoreDesc = common.getStoreScoreDecs(s.store_servicecredit);
        s.deliveryScoreDesc = common.getStoreScoreDecs(s.store_deliverycredit);
        this.setData({ 'data.store': s });
    },

    /** 初始化评论相关 */
    initComment: function (data) {
        //好评率
        data.goods.goodCommentRate = data.goods.comment_statistics.high_rate;
        //评论日期格式化
        for (var i = 0; i < data.comment.length; i++) {
            data.comment[i].addTimeFormat = util.formatTime(data.comment[i].add_time);
            data.comment[i].goods_rank = parseInt(data.comment[i].goods_rank);
        }
        //评论数
        this.data.categories3[0].num = data.goods.comment_statistics.total_sum;
        this.data.categories3[1].num = data.goods.comment_statistics.high_sum;
        this.data.categories3[2].num = data.goods.comment_statistics.center_sum;
        this.data.categories3[3].num = data.goods.comment_statistics.low_sum;
        this.data.categories3[4].num = data.goods.comment_statistics.img_sum;
        //渲染视图
        this.setData({
            categories3: this.data.categories3,
            data: data
        });
    },

    /** 初始化所有规格 */
    initSpecsPrice: function (data) {
        // console.log(data);
        var specSelect = 0; //初始化选中第一个规格
        var specs = data.spec_goods_price;
        if (specs.length == 0) { //没有规格
            this.initActivity(data.activity);
            return;
        }
        //第一次请求的总数据中的activity默认是第一种规格的,可减少一次请求
        specs[0].activity = data.activity;
        if (this.data.optionItemId) { //指定规格
            for (var i = 0; i < specs.length; i++) {
                if (specs[i].item_id == this.data.optionItemId) {
                    specSelect = i;
                    break;
                }
            }
        } else { //初始化选库存不为0的规格
            for (var i = 0; i < specs.length; i++) {
                if (specs[i].store_count <= 0) {
                    continue;
                }
                specSelect = i;
                break;
            }
        }
        //生成子规格组(goods_spec_list)的各自选中项
        var specIds = specs[specSelect].key.split("_");
        var list = data.goods_spec_list;
        for (var i = 0; i < list.length; i++) {
            for (var j = 0; j < list[i].spec_list.length; j++) {
                if (util.inArray(list[i].spec_list[j].item_id, specIds)) {
                    list[i].selectItemId = list[i].spec_list[j].item_id;
                    break;
                }
            }
        }
        this.setData({
            specSelect: specSelect,
            'data.goods_spec_list': list,
            'data.spec_goods_price': specs
        });
        this.initSelectSpecGoods();
    },

    /** 初始化选中的规格商品 */
    initSelectSpecGoods: function () {
        var specSelect = this.data.specSelect;
        var specs = this.data.data.spec_goods_price;
        var itemId = specs[specSelect].item_id;
        if (specs[specSelect].prom_type == 0) {
            var noActivity = { prom_type: 0 };
            specs[specSelect].activity = noActivity;
            this.initActivity(noActivity);
        } else if (typeof specs[specSelect].activity != 'undefined') {
            this.initActivity(specs[specSelect].activity);
        } else {
            this.requestSpecInfo(specSelect);
        }
    },

    /** 请求规格商品的活动信息 */
    requestSpecInfo: function (specSelect) {
        var that = this;
        var specs = this.data.data.spec_goods_price;
        request.get('/api/goods/activity', {
            data: {
                goods_id: this.data.data.goods.goods_id,
                item_id: specs[specSelect].item_id
            },
            success: function (res) {
                specs[specSelect].activity = res.data.result.goods;
                that.initActivity(res.data.result.goods);
            }
        });
    },

    /** 初始化显示的活动信息 */
    initActivity: function (activity) {
        if (activity.prom_type && activity.prom_type != 6) {
            var startTime = (new Date()).getTime();
            if (activity.prom_type == 1) { //抢购
                activity.priceName = '抢购价';
                activity.countName = '限时抢购';
            } else if (activity.prom_type == 2) { //团购
                activity.priceName = '团购价';
                activity.countName = '限时团购';
            } else if (activity.prom_type == 3) { //促销
                activity.countName = '优惠促销';
            } else if (activity.prom_type == 4) { //预售
                activity.priceName = '预售价';
                activity.countName = '预售';
            }
            // console.log(activity);
            activity.countTime = '--天--时--分--秒';
            if (!activity.diffTime) {
                activity.diffTime = (new Date()).getTime() - activity.server_current_time * 1000;
            }
        } else if (activity.prom_type == 6) {
            // console.log(activity)
            activity.countName = '该商品正在参与拼团';
            activity.goods_id = activity.goods_id || this.data.data.goods.goods_id;
            activity.team_id = activity.prom_id || this.data.data.goods.prom_id
            activity.item_id = activity.item_id || 0
        }
        this.setData({ 'select.activity': activity });
        this.destroyActivityTimer();
        this.createActivityTimer();
        this.initSelectedData();
    },
    
    /** 初始化选中的（规格）商品的显示参数 */
    initSelectedData: function () {
        var goods = this.data.result.goods;
        var activity = this.data.select.activity;
        // 规格种类
        var specs = this.data.result.spec_goods_price;
        //  选中规格的数据列表
        var specSelect = this.data.specSelect;
        var stock = 0;
        var price = 0;
        var specImg = goods.goods_thumb
        // 等待重构
        if (activity.prom_type == 1 || activity.prom_type == 2 || activity.prom_type == 4) {
            price = specs.length > 0
                ? (activity.activity_is_on) ? (specs[specSelect].activity.shop_price || specs[specSelect].activity.prom_price) : (activity.market_price || activity.prom_price)
                : (activity.prom_price || ((activity.activity_is_on) ? activity.shop_price : activity.market_price))

            stock = specs.length > 0
                ? specs[specSelect].store_count
                : (activity.prom_store_count || activity.store_count)

        } else if (activity.prom_type == 3) {
            price = activity.prom_price;
            stock = specs.length > 0 ? specs[specSelect].store_count : goods.store_count;
        } else if (specs.length > 0) {
            price = specs[specSelect].price;
            stock = specs[specSelect].store_count;
        } else {
            price = goods.shop_price;
            stock = goods.store_count;
        }
        // 多规格
        if (specs.length > 0) {
            specImg = specs[specSelect].spec_img || goods.goods_thumb;
        }
        if (goods.exchange_integral > 0) {
            price = price - goods.exchange_integral / parseInt(goods.point_rate);
            price = price.toFixed(2);
        }
        this.setData({
            'select.price': price,
            'select.stock': stock,
            'select.spec_img': specImg,
            'select.specName': specs.length > 0 ? specs[specSelect].key_name : '',
        });
    },

    /** 创建活动倒计时定时器 */
    createActivityTimer: function () {
        var activity = this.data.select.activity;
        if (!activity.prom_type) {
            return;
        }
        var that = this;
        this.data.timer = setInterval(function () {
            var remainTime = activity.prom_end_time * 1000 - (new Date()).getTime() + activity.diffTime;
            remainTime = util.remainTime(remainTime);
            that.setData({ 'select.activity.countTime': remainTime });
        }, 1000);
    },

    /** 销毁活动倒计时定时器 */
    destroyActivityTimer: function () {
        if (this.data.timer) {
            clearInterval(this.data.timer);
            this.data.timer = null;
        }
    },

    /** 商品首页 */
    tabClick: function (e) {
        var typeId = e.currentTarget.id;
        this.setData({
            activeCategoryId: typeId
        });
        if (typeId == 1) {
            this.tabGoodsContent();
        } else if (typeId == 2) {
            this.tabComment();
        }
    },

    /** 商品详情页 */
    tabClick2: function (e) {
        this.setData({
            activeCategoryId2: e.currentTarget.id
        });
    },

    /** 评论页 */
    tabClick3: function (e) {
        if (e.currentTarget.id == this.data.activeCategoryId3) {
            return;
        }
        this.setData({ activeCategoryId3: e.currentTarget.id });
        this.requestComments(this.data.data.goods.goods_id, e.currentTarget.id);
    },

    /** 请求评论数据 */
    requestComments: function (goodsId, commentType) {
        var that = this;
        commentType++;
        var requestUrl = that.data.url + '/api/goods/getGoodsComment?goods_id=' + goodsId + '&type=' + commentType;
        // console.log(requestUrl);
        request.get(requestUrl, {
            success: function (res) {
                var comments = res.data.result;
                for (var i = 0; i < comments.length; i++) {
                    comments[i].addTimeFormat = util.formatTime(comments[i].add_time);
                    comments[i].goods_rank = parseInt(comments[i].goods_rank);
                }
                that.setData({ comments: comments });
            }
        });
    },

    /** 返回顶部 */
    doScrollTop: function () {
        wx.pageScrollTo({ scrollTop: 0 });
    },

    /** 打开评论页 */
    tabComment: function () {
        this.setData({ activeCategoryId: 2 });
        if (!this.data.comments) {
            this.requestComments(this.data.data.goods.goods_id, this.data.activeCategoryId3);
        }
    },

    /** 打开商品内容页 */
    tabGoodsContent: function () {
        this.setData({ activeCategoryId: 1 });
    },

    /** 请求商品详情页嵌入的html内容 */
    requestGoodsContent: function () {
        var that = this;
        request.get('/api/goods/goodsContent', {
            data: { id: this.data.result.goods.goods_id },
            success: function (res) {
                WxParse.wxParse('content', 'html', res.data.result.goods_content, that, 6);
                //网页中的图片加上域名
                common.wxParseAddFullImageUrl(that, 'content');
                that.setData({ goodsAttrs: res.data.result.goods_attr_list });
            },
        });
    },

    /** 点击规格按钮的回调函数 */
    selectSpec: function (e) {
        //对商品数量进行判断，对库存进行判断
        var itemId = e.currentTarget.dataset.itemid;
        var listIdx = e.currentTarget.dataset.listidx;
        var list = this.data.data.goods_spec_list;
        if (list[listIdx].selectItemId == itemId) {
            return;
        }
        list[listIdx].selectItemId = itemId;
        var newSpecKeys = [];
        for (var i = 0; i < list.length; i++) {
            newSpecKeys[i] = list[i].selectItemId;
        }
        //item排序,生成key
        var newSpecKeys = util.sortSize(newSpecKeys).join('_');
        var newSpecSelect = 0;
        var specs = this.data.data.spec_goods_price;
        for (var i = 0; i < specs.length; i++) {
            if (specs[i].key == newSpecKeys) {
                newSpecSelect = i;
                break;
            }
        }
        this.setData({
            specSelect: newSpecSelect,
            'data.goods_spec_list': list
        });
        this.initSelectSpecGoods();
        this.checkCartNum(this.data.goodsInputNum);
    },

    /** 加入购物车 */
    addCart: function (e) {
        var that = this;
        var itemId = 0;
        var specs = this.data.data.spec_goods_price;
        //区分有规格和无规格
        if (specs.length > 0) {
            if (specs[this.data.specSelect].store_count <= 0) {
                return app.showWarning("库存已为空！");
            }
            itemId = specs[this.data.specSelect].item_id;
        } else {
            if (this.data.data.goods.store_count <= 0) {
                return app.showWarning("库存已为空！");
            }
        }
        if (this.data.goodsInputNum <= 0) {
            return app.showWarning("商品数量不能为0");
        }
        var data = {
            goods_id: this.data.data.goods.goods_id,
            goods_num: this.data.goodsInputNum,
            item_id: itemId,
            goods_thumb: this.data.select.spec_img,
            share_id: wx.getStorageSync('first_leader') || ''
        };
        if (this.data.data.goods.is_virtual) {
            return this.buyVirtualGoods(data);
        }
        if (e.currentTarget.dataset.action == 'add') { //加入购物车
            if (this.data.shippingCost < 0 || this.data.select.stock <= 0) {
                return;
            }
            request.post('/api/cart/addCart', {
                data: data,
                success: function (res) {
                    wx.showModal({
                        title: '添加成功！',
                        cancelText: '去购物车',
                        confirmText: '再逛逛',
                        success: function (res) {
                            if (res.cancel) {
                                wx.switchTab({ url: '/pages/cart/cart/cart' });
                            } else {
                                that.requestCardNum();
                            }
                        }
                    });
                }
            });
        } else if (e.currentTarget.dataset.action == 'exchange') { //立即兑换
            this.exchange(data);
        } else { //立即购买
            this.buyNow(data);
        }
    },

    /** 购买虚拟商品 */
    buyVirtualGoods: function (data) {
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isUserAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }
        Object.assign(data, {
            goods_name: this.data.data.goods.goods_name,
            spec_name: this.data.select.specName,
            price: this.data.select.price,
        });
        try {
            wx.setStorageSync('step2order', JSON.stringify(data))
            wx.navigateTo({ url: '/pages/virtual/buy_step/buy_step' });
        } catch (error) {
        }
    },

    /** 立即兑换 */
    exchange: function (data) {
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isUserAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }
        if (this.data.shippingCost < 0 || this.data.select.stock <= 0) {
            return;
        }
        try {
            wx.setStorageSync('integral2order', JSON.stringify(data))
            wx.navigateTo({ url: '/pages/cart/integral/integral' });
        } catch (error) {
        }
        // wx.navigateTo({ url: '/pages/cart/integral/integral?' + util.Obj2Str(data) });
    },

    /** 立即购买 */
    buyNow: function (data) {
        
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isUserAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }
        if (this.data.shippingCost < 0 || this.data.select.stock <= 0) {
            return;
        }
        Object.assign(data, {
            action: 'buy_now',
            spec_img: this.data.select,
            share_id: wx.getStorageSync('first_leader') || ''
        });
        try {
            wx.setStorageSync('cart2order', JSON.stringify(data))
            wx.navigateTo({ url: '/pages/cart/cart2/cart2' });
        } catch (error) {
        }
    },

    /** 增加购买的商品数量 */
    addCartNum: function (e) {
        this.checkCartNum(this.data.goodsInputNum + 1);
    },

    /** 减少购买的商品数量 */
    subCartNum: function (e) {
        this.checkCartNum(this.data.goodsInputNum - 1);
    },

    /** 输入购买的数量 */
    inputCartNum: function (e) {
        this.checkCartNum(Number(e.detail.value));
    },

    /** 检查购买的数量 */
    checkCartNum: function (num) {
        var stock = this.data.result.goods.store_count;
        if (this.data.result.spec_goods_price.length > 0) {
            stock = this.data.result.spec_goods_price[this.data.specSelect].store_count;
        }
        if (num > stock || stock == 0) {
            num = stock;
        } else if (num < 1) {
            num = 1;
        }
        this.setData({ goodsInputNum: num });
    },

    /** 关闭规格弹窗 */
    closeSpecModal: function () {
        this.closeAuthPhoneModal();
        this.setData({ openSpecModal: false });
    },

    /** 打开规格弹窗 */
    openSpecModel: function () {
        if (!app.auth.hasLogin()) {
            // 未注册
            this.openAuthPhoneModal();
        } else {
            // 已经注册[登录]
            this.closeAuthPhoneModal();
        }
        this.setData({ openSpecModal: true });
    },

    collectGoods: function () {
        var that = this;
        request.post('/api/goods/collectGoodsOrNo', {
            data: { goods_id: that.data.data.goods.goods_id },
            success: function (res) {
                that.setData({ 'result.goods.is_collect': !that.data.result.goods.is_collect });
            }
        });
    },

    /** 联系客服 */
    contactService: function () {
        let store_phone = this.data.data.store.store_phone
        if (store_phone) {
            this.setData({
                store_phone: store_phone
            })
            this.openPhoneModal();
        }
        // app.confirmBox('请联系客服：' + this.data.data.store.store_phone);
    },

    /** 请求购物车数量 */
    requestCardNum: function () {
        var that = this;
        request.get('/api/cart/cartList', {
            success: function (res) {
                var cartGoodsNum = 0;
                var list = res.data.result.storeList;
                if (!list) {
                    return;
                }
                for (var i = 0; i < list.length; i++) {
                    for (var j = 0; j < list[i].cartList.length; j++) {
                        cartGoodsNum += list[i].cartList[j].goods_num;
                    }
                }
                that.setData({ cartGoodsNum: cartGoodsNum });
            }
        });
    },

    /** 预览图片 */
    previewCommentImgs: function (e) {
        var imgs = this.data.comments[e.currentTarget.dataset.cidx].img;
        wx.previewImage({
            current: imgs[e.currentTarget.dataset.id],
            urls: imgs
        });
    },

    /** 预览图片 */
    previewGoodsCommentImgs: function (e) {
        var imgs = this.data.data.comment[e.currentTarget.dataset.cidx].img;
        wx.previewImage({
            current: imgs[e.currentTarget.dataset.id],
            urls: imgs
        });
    },

    /** 关闭优惠信息弹窗 */
    closePromModal: function () {
        this.setData({ openPromModal: false });
    },

    /** 打开优惠信息弹窗 */
    openPromModal: function () {
        this.setData({ openPromModal: true });
    },

    // 打开电话弹窗
    openPhoneModal: function () {
        this.setData({ openFixedShow: true });
    },

    closePhoneModal: function () {
        this.setData({ openFixedShow: false });
    },

    callPhoneHandler: function (e) {
        var phone = e.target.dataset.phone
        var that = this;
        util.callPhone(phone)
            .then(() => {
                that.closePhoneModal();
            })
            .catch(() => {
                that.closePhoneModal();
            })
    },

    // 打开分享弹窗
    openShareModal: function () {
        this.setData({ openShareShow: true });
    },
    // 关闭分享弹窗
    closeShareModal: function () {
        this.setData({ openShareShow: false });
    },

    goodShare: function () {
        if (!app.auth.hasLogin()) {
            this.closeShareModal();
            return 
        }
        this.openShareModal();
    },
    
    
    // 下载文件
    downloadFile(url) {
        return new Promise((resolve, reject) => {
            wx.downloadFile({
                url,
                success(res) {
                    if (res.statusCode === 200) {
                        resolve(res.tempFilePath)
                    } else {
                        reject(url + '下载失败');
                    }
                },
                fail(err) {
                    reject(err)
                }
            })
        })
    },

    // 请求后台小程序二维码
    requestWxCode: function () {
        var that = this;
        return new Promise((resolve, reject) => {
            request.post('/api/goods/wxacodeGoodsPoster', {
                data: {
                    scene: util.json2Form(that.data.options)+'&h=1',
                    page: 'pages/goods/goodsInfo/goodsInfo',
                    width: 300
                },
                success: function (res) {
                    if (res.data.status == 1) {
                        var url = that.returnHttpsUrl(res.data.result);
                        wx.downloadFile({
                            url: url,
                            success(ret) {
                                if (ret.statusCode === 200) {
                                    resolve(ret.tempFilePath)
                                } else {
                                    reject(url + '下载失败');
                                }
                            },
                            fail(err) {
                                reject(err)
                                wx.hideLoading();
                            }
                        })
                    } else {
                        reject('err')
                        wx.hideLoading();
                    }
                    
                },
                fail: function (err) {
                    reject(err)
                    wx.hideLoading();
                }
            });
        })

    },

    returnHttpsUrl(url) {
        if (url.indexOf('https') == -1) {
            return url.replace('http', 'https');
        }
        return url;
    },

    // 生成海报事件 
    generatePoster: function () {
        var that = this;
        var head_pic = this.returnHttpsUrl(app.globalData.userInfo.head_pic);
        var goods_thumb = this.returnHttpsUrl(this.data.select.spec_img);
        // 三重异步
        Promise.all([
            // 异步下载用户头像到本地
            that.downloadFile(head_pic),
            // 异步下载商品图片到本地
            that.downloadFile(goods_thumb),
            // 异步请求后台小程序二维码 base64
            that.requestWxCode()
        ]).then((result) => {
            wx.showLoading({
                title: '生成中...',
                mask: true,
            })
            // 三重异步都成功后回调执行会话
            that.sharePosteCanvas(result[0], result[1], result[2])
        }).catch((error) => {
            wx.hideLoading();
            that.closeShareModal();
        })

    },
    /**
   * 开始用canvas绘制分享海报
   * @param avaterSrc 下载的头像图片路径
   * @param codeSrc   下载的产品图片路径
   * @param CodeRes  获取二维码Base64
   */
    sharePosteCanvas: function (avaterSrc, codeSrc, CodeRes) {
        var that = this;
        var res = wx.getSystemInfoSync();
        var width = res.windowWidth * .8  // 300
        var height = width * 1090 / 750
        that.setData({ canvasHeight: height })
        var that = this;
        const ctx = wx.createCanvasContext('myCanvas'); //创建画布
        wx.createSelectorQuery().select('#canvas-container').boundingClientRect(function () {
            var left = width * 0.1;
            ctx.setFillStyle('#ffffff');
            ctx.fillRect(0, 0, width, height);

            // 画logo
            ctx.drawImage('../../../images/logo.png', width * 0.4333, height * 0.02220, width * .133333, width * .133333)

            // 用户头像
            ctx.drawImage(avaterSrc, left, height * 0.14036, width * 0.1, width * 0.1);

            // 用户名字
            ctx.setFontSize(parseInt(32*width/750));
            ctx.setTextAlign('left');   
            ctx.setFillStyle('#333');
            ctx.fillText(that.data.userInfo.nickname, width * 0.1 + left + 10 ,height * 0.18);

            // 分享文字
            ctx.setFontSize(parseInt(24*width/750));
            ctx.setTextAlign('left');
            ctx.setFillStyle('#999');
            ctx.fillText('有好物分享给你', left + 50 + that.data.userInfo.nickname.length * parseInt(32*width/750) + 5, height * 0.179810);

            // 商品图片
            ctx.drawImage(codeSrc, left, height * 0.2238, width * .8, width * .8);
            var goodsName = that.data.data.goods.goods_name
            // 商品标题
            if (goodsName) {
                const CONTENT_ROW_LENGTH = 24; // 正文 单行显示字符长度
                let [contentLeng, contentArray, contentRows] = that.textByteLength(goodsName, CONTENT_ROW_LENGTH);
                ctx.setFontSize(parseInt(28*width/750));
                ctx.setTextAlign('left');
                ctx.setFillStyle('#333');
                let contentHh = parseInt(36*width/750) * 1;
                for (let m = 0; m < contentArray.length; m++) {
                    if (m == 2) {
                        break;
                    }
                    ctx.fillText(contentArray[m], left, height * .8183 + contentHh * m);
                }
            }

            // 商品价格
            if (that.data.select.price) {
                ctx.setFontSize(parseInt(24*width/750));
                ctx.setTextAlign('left');
                ctx.setFillStyle('#FF1726');
                ctx.fillText(`￥`, left, height * 0.9394);

                ctx.setFontSize(parseInt(32*width/750));
                ctx.setTextAlign('left');
                ctx.setFillStyle('#FF1726');
                ctx.fillText(`${that.data.select.price}`, left + parseInt(32*width/750), height * 0.9394);
            }
            
            //  绘制小程序二维码
            if (CodeRes) {
                ctx.drawImage(CodeRes, width * 0.69, height * .8, width * 0.2, width * 0.2)
                ctx.setFontSize(parseInt(20*width/750));
                ctx.setFillStyle('#999');
                ctx.fillText("长按识别小程序码", width * 0.69, height * .8 + width * 0.2 + 10);
            }

        }).exec()

        setTimeout(function () {
            ctx.draw();
            that.closeShareModal();
            that.openPosterModal();
            wx.hideLoading();
        }, 1000)

    },

    /**
     * 多行文字处理，每行显示数量
     * @param text 为传入的文本
     * @param num  为单行显示的字节长度
     */
    textByteLength(text, num) {
        let strLength = 0; // text byte length
        let rows = 1;
        let str = 0;
        let arr = [];
        for (let j = 0; j < text.length; j++) {
            if (text.charCodeAt(j) > 255) {
                strLength += 2;
                if (strLength > rows * num) {
                    strLength++;
                    arr.push(text.slice(str, j));
                    str = j;
                    rows++;
                }
            } else {
                strLength++;
                if (strLength > rows * num) {
                    arr.push(text.slice(str, j));
                    str = j;
                    rows++;
                }
            }
        }
        arr.push(text.slice(str, text.length));
        return [strLength, arr, rows] //  [处理文字的总字节长度，每行显示内容的数组，行数]
    },

    //点击保存到相册
    saveShareImg: function () {
        var that = this;
        wx.showLoading({
            title: '正在保存',
            mask: true,
        })
        wx.canvasToTempFilePath({
            canvasId: 'myCanvas',
            success: function (res) {
                wx.hideLoading();
                that.closePosterModal();
                that.saveImageToAlbum(res.tempFilePath)
            },
            fail: function (res) {
                that.closePosterModal();
            }
        });
    },


    // 保存图片到相册
    saveImageToAlbum(imagePath) {
        wx.saveImageToPhotosAlbum({
            filePath: imagePath,
            success(res) {
                wx.showToast({
                    title: '保存成功',
                    duration: 1500,
                })
            },
            fail(err) {
                if (res.errMsg === "saveImageToPhotosAlbum:fail:auth denied") {
                    wx.openSetting({
                        success(settingdata) {
                            if (settingdata.authSetting["scope.writePhotosAlbum"]) {
                                console.log("获取权限成功，再次点击图片保存到相册")
                            } else {
                                console.log("获取权限失败")
                            }
                        }
                    })
                }
            }
        })
    },

    /** 关注店铺 */
    focusStore: function (e) {
        var that = this
        var store_id = e.currentTarget.dataset.storeid;
        request.post('/api/store/collectStoreOrNo', {
            data: { store_id: store_id },
            success: function (res) {
                if (res.data.msg == "关注成功") {
                    that.setData({'data.store.is_collect': 1})
                } else {
                    that.setData({'data.store.is_collect': 0})
                }
            }
        });
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
                        that.setData({ userInfo: res })
                        app.globalData.authLogin = true
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

    /**
     * 转发按钮
     */
    onShareAppMessage: function (res) {
        var goodsName = this.data.data.goods.goods_name;
        var goodsThumb = this.data.data.goods.original_img || this.data.data.goods.goods_thumb
        var share = {
            title: goodsName || "美记生活",
            imageUrl: goodsThumb,
            path: `/pages/goods/goodsInfo/goodsInfo?goods_id=${this.data.options.g}&item_id=${this.data.options.i}&first_leader=${this.data.options.f}&home=1`
        }
        return share
    },


});
