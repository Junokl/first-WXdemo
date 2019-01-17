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
        result: null,
        content: '', //商品详情页html
        goodsAttrs: null, //商品属性列表
        specSelect: 0, //选中的组合规格数组spec_goods_price下标
        optionTeamId: 0,
        optiongoodId: 0,
        optionItemId: 0, //页面参数，页面初始化指定显示的itemid，用于活动
        goodsInputNum: 1, //选中的商品件数
        openSpecModal: false, //是否打开规格弹窗
        activeCategoryId: 0, //商品主页tab
        supportPageScroll: false, //微信版本是否支持页面滚动回顶部
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
        comments: null,
        categories3: [
            { name: "全部评价", id: 0, num: 0 },
            { name: "好评", id: 1, num: 0 },
            { name: "中评", id: 2, num: 0 },
            { name: "差评", id: 3, num: 0 },
            { name: "有图", id: 4, num: 0 }
        ],
        goods: null,
        store: null,
        team: null,
        teamResult: {
            server_time: 0,
            teamFounds: null,
        },
        timer: null,
        select: { //选择的(规格)商品的参数，用于显示
            teamId: 0,
            teamPrice: 0,
            needer: 0,
            price: 0,
            stock: 0,
            statusDesc: '',
            shareDesc: '',
        },
        rule: true,
        imgs: [],
        isAuthPhoneShow: false,
        imChoose: 0
    },

    onLoad: function (options) {
        var that = this;

        app.getConfig(function (res) {
            var im_choose = common.getConfigByName(res.config, 'im_choose');
            that.setData({ imChoose: im_choose });
        });

        var goodId = options.goods_id || 0;
        var itemId = options.item_id || 0;
        var teamId = options.team_id || 0;
        
        options.first_leader && wx.setStorageSync('first_leader', options.first_leader)

        this.setData({
            optiongoodId: goodId,
            optionItemId: itemId,
            optionTeamId: teamId
        });
        this.getTeamList();
        request.get('/api/Team/info', {
            data: {
                goods_id: goodId,
                team_id: teamId,
                share_id: wx.getStorageSync('first_leader') || ''
            },
            failRollback: true,
            success: function (res) {
                var result = res.data.result;
                that.setData({ result: result });
                that.setData({ goods: result.team.goods });
                that.setData({ team: result.team.team_goods_item });
                that.setData({ store: result.store });
                //初始化评论
                that.initComment();
                //初始化规格
                that.initSpecsPrice(result.team.goods);
                //获取详情内容
                that.requestGoodsContent();
                //图片组
                that.goodsImages(result.team);
            }
        });
        //是否支持返回按钮
        if (wx.pageScrollTo) {
            this.setData({ supportPageScroll: true });
        }
    },
    /** 商品图片组 */
    goodsImages: function (data) {
        var img = data.goods.goods_images;
        var imgs = [];
        for (var i = 0; i < img.length; i++) {
            imgs.push(img[i]['image_url'])
        }
        this.setData({ imgs: imgs });
    },
    
    /** 获取拼团列表 */
    getTeamList: function () {
        var that = this;
        request.post('/api/Team/ajaxTeamFound', {
            data: {
                goods_id: that.data.optiongoodId,
            },
            failRollback: true,
            success: function (res) {
                var result = res.data.result;
                that.setData({
                    'teamResult.server_time': result.server_time,
                    'teamResult.teamFounds': result.teamFounds,
                });
                that.createTimer();
            }
        });
    },

    // 去参团
    offered(e) {
        if (app.auth.hasLogin()) {
            wx.navigateTo({
                url: `/pages/team/team_detail/team_detail?foundId=${e.target.dataset.foundid}`
            })
        } else {
            console.log('未登录')
        }
    },

    getAuthPhoneHandler(e) {
        var that = this;
        var wechatUser = app.globalData.wechatUser
        if (e.detail.errMsg == 'getPhoneNumber:ok') {
            wx.checkSession({
                // 五分钟未失效
                success: function () {
                    app.auth.wxLogin((res) => {
                        if (res.status === -1) {
                            wx.login({
                                success: function (res) {
                                    e.detail.code = res.code
                                    app.globalData.code = res.code
                                    that.requestWxAppPhone(e.detail, wechatUser)
                                },
                                fail: function (res) {
                                    console.log('未超时:' + JSON.stringify(res));
                                }
                            })
                        }
                    })
                },
                // 超时
                fail: function () {
                    app.auth.wxLogin((res) => {
                        if (res.status === -1) {
                            wx.login({
                                success: function (res) {
                                    e.detail.code = res.code
                                    app.globalData.code = res.code
                                    that.requestWxAppPhone(e.detail, wechatUser)
                                },
                                fail: function (res) {
                                    console.log('超时:' + JSON.stringify(res));
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
        request.postUser('/api/user/bind_reg', {
            data: {
                mobile: phone,
                password: md5('TPSHOP123456'),
                nickname: nickname || '用户名',
                isMessage: 0
            },
            header: {
                "content-type": "application/x-www-form-urlencoded",
                // 绑定上级分销
                'cookie': `first_leader=${wx.getStorageSync('first_leader') || ''}`
            },
            success: function (res) {
                wx.setStorageSync('isAuth', true);
                app.globalData.authLogin = true;
                app.globalData.userInfo = res.data.result.user;
                wx.setStorageSync('app:userInfo', res.data.result.user);
                app.showSuccess('绑定成功', function () { });
            }
        });
    },

    closeAuthPhoneModal() {
        this.setData({ isAuthPhoneShow: false })
    },

    openAuthPhoneModal() {
        this.setData({ isAuthPhoneShow: true })
    },



    createTimer: function () {
        var that = this;
        var startTime = (new Date()).getTime();
        this.data.timer = setInterval(function () {
            if (that.data.teamResult.teamFounds.length <= 0) {
                return;
            }
            var teamFounds = that.data.teamResult.teamFounds;
            for (var i = 0; i < teamFounds.length; i++) {
                var diffTime = startTime - that.data.teamResult.server_time * 1000;
                teamFounds[i].remainTime = util.transTime((teamFounds[i].found_time + teamFounds[i].time_limit) * 1000 - (new Date()).getTime() + diffTime);
                if (teamFounds[i].remainTime.hour <= 0 && teamFounds[i].remainTime.minute <= 0 && teamFounds[i].remainTime.second <= 0) {
                    clearInterval(that.data.timer);
                    that.getTeamList();
                }
            }
            that.setData({ 'teamResult.teamFounds': teamFounds });
        }, 1000);
    },

    onUnload: function () {
        clearInterval(this.data.timer);
    },

    /** 初始化评论相关 */
    initComment: function () {
        //评论数
        this.data.categories3[0].num = this.data.goods.comment_statistics.total_sum;
        this.data.categories3[1].num = this.data.goods.comment_statistics.high_sum;
        this.data.categories3[2].num = this.data.goods.comment_statistics.center_sum;
        this.data.categories3[3].num = this.data.goods.comment_statistics.low_sum;
        this.data.categories3[4].num = this.data.goods.comment_statistics.img_sum;
        //渲染视图
        this.setData({ categories3: this.data.categories3 });
    },

    /** 初始化所有规格 */
    initSpecsPrice: function (result) {
        var specSelect = 0; //初始化选中第一个规格
        var specs = result.spec_goods_price;
        var team_activity = this.data.result.team;
        if (specs.length == 0) { //没有规格
            this.setData({
                'select.prom_id': this.data.team[0].team_id,
                'select.teamPrice': this.data.team[0].team_price,
                'select.price': this.data.team[0].price ? this.data.team[0].price : this.data.goods.shop_price,
                'select.stock': this.data.team[0].store_count ? this.data.team[0].store_count : this.data.goods.store_count,
                'select.needer': this.data.team[0].needer ? this.data.team[0].needer : team_activity.needer,
                'select.statusDesc': this.data.team[0].front_status_desc ? this.data.team[0].front_status_desc : team_activity.front_status_desc,
                'select.shareDesc': this.data.team[0].share_desc ? this.data.team[0].share_desc : team_activity.share_desc,
            });
            return;
        }
        if (this.data.optionItemId) { //指定规格
            for (var i = 0; i < specs.length; i++) {
                if (specs[i].item_id == this.data.optionItemId) {
                    specSelect = i;
                    break;
                }
            }
        }
        //生成子规格组(spec)的各自选中项
        var specIds = specs[specSelect].key.split("_");
        var list = result.spec;
        for (var i = 0; i < list.length; i++) {
            for (var j = 0; j < list[i].spec_item.length; j++) {
                if (util.inArray(list[i].spec_item[j].id, specIds)) {
                    list[i].selectItemId = list[i].spec_item[j].id;
                    break;
                }
            }
        }
        this.setData({
            specSelect: specSelect,
            'result.team.goods.spec': list,
            'result.team.goods.spec_goods_price': specs,
            'select.prom_id': specs[specSelect].prom_id,
            'select.teamPrice': this.data.team[0].team_price,
            'select.price': specs[specSelect].price,
            'select.stock': specs[specSelect].store_count,
            'select.specName': specs.length > 0 ? specs[specSelect].key_name : '',
            'select.needer': specs[specSelect].needer ? specs[specSelect].needer : team_activity.needer,
            'select.statusDesc': specs[specSelect].front_status_desc ? specs[specSelect].front_status_desc : team_activity.front_status_desc,
            'select.shareDesc': specs[specSelect].share_desc ? specs[specSelect].share_desc : team_activity.share_desc,
        });
    },

    /** 联系客服 */
    contactService: function () {
        if (this.data.store.service_phone) {
            app.confirmBox('请联系客服：' + this.data.store.service_phone);
        } else {
            app.confirmBox('暂无联系方式');
        }
    },

    showRule: function () {
        this.setData({ rule: !this.data.rule });
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
        this.requestComments(this.data.goods.goods_id, e.currentTarget.id);
    },

    /** 请求评论数据 */
    requestComments: function (goodsId, commentType) {
        var that = this;
        commentType++;
        var requestUrl = that.data.url + '/api/goods/getGoodsComment?goods_id=' + goodsId + '&type=' + commentType;
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
            this.requestComments(this.data.goods.goods_id, this.data.activeCategoryId3);
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
            data: { id: this.data.goods.goods_id },
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
        var list = this.data.result.team.goods.spec;
        var team_activity = this.data.result.team;

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
        var specs = this.data.result.team.goods.spec_goods_price;
        for (var i = 0; i < specs.length; i++) {
            if (specs[i].key == newSpecKeys) {
                newSpecSelect = i;
                break;
            }
        }

        this.setData({
            specSelect: newSpecSelect,
            'result.team.goods.spec': list,
            'result.team.goods.spec_goods_price': specs,
            'select.prom_id': specs[newSpecSelect].prom_id,
            'select.teamPrice': specs[newSpecSelect].prom_id > 0 ? this.data.team[newSpecSelect].team_price : '',
            'select.price': specs[newSpecSelect].price,
            'select.stock': specs[newSpecSelect].store_count,
            'select.specName': specs.length > 0 ? specs[newSpecSelect].key_name : '',
            'select.needer': team_activity.needer,
            'select.statusDesc': specs[newSpecSelect].prom_id > 0 ? team_activity.front_status_desc : '',
            'select.shareDesc': specs[newSpecSelect].prom_id > 0 ? team_activity.share_desc : '',
        });
        this.checkCartNum(this.data.goodsInputNum);
    },

    /** 单独购买 */
    buyNormal: function () {
        var parmas = {
            goods_id: this.data.goods.goods_id,
            item_id: this.data.optionItemId,
            team_id: this.data.optionTeamId
        };
        wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?' + util.Obj2Str(parmas) });
    },

    /** 拼团立即购买 */
    buyNow: function () {
        var that = this;
        // 检查用户是否登录方可操作立即购买
        if (!app.auth.isUserAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }
        if (that.data.select.prom_id <= 0) {
            return;
        }
        request.post('/api/Team/addOrder', {
            data: {
                item_id: that.data.team[that.data.specSelect].item_id,
                goods_id: that.data.goods.goods_id,
                goods_num: that.data.goodsInputNum,
                share_id: wx.getStorageSync('first_leader') || ''
            },
            success: function (res) {
                that.setData({ openSpecModal: false });
                wx.navigateTo({ url: '/pages/team/team_confirm/team_confirm?orderSn=' + res.data.result.order_sn });
            }
        });
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
        var stock = this.data.goods.store_count;
        if (this.data.result.team.goods.spec_goods_price.length > 0) {
            stock = this.data.result.team.goods.spec_goods_price[this.data.specSelect].store_count;
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
    /** 关注店铺 */
    focusStore: function (e) {
        var that = this
        var store_id = e.currentTarget.dataset.storeid;
        request.post('/api/store/collectStoreOrNo', {
            data: { store_id: store_id },
            success: function (res) {
                if (res.data.msg == "关注成功") {
                    that.setData({ 'store.is_collect': 1 })
                } else {
                    that.setData({ 'store.is_collect': 0 })
                }
            }
        });
    },

    // 收藏
    collectGoods: function () {
        var that = this;
        request.post('/api/goods/collectGoodsOrNo', {
            data: { goods_id: that.data.goods.goods_id },
            success: function (res) {
                that.setData({ 'result.collect': !that.data.result.collect });
            }
        });
    },

    onShareAppMessage: function (res) {
        var that = this;
        return {
            title: that.data.result.team.goods_name,//自定义转发标题
            path: '/pages/team/team_info/team_info?goods_id=' + that.data.result.team.goods_id + '&item_id=' + that.data.result.team.item_id + '&team_id=' + that.data.result.team.team_id + '&first_leader=' + wx.getStorageSync('app:userInfo')['user_id']
        }
    }

});

