// team_detail.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var util = require('../../../utils/util.js');
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: setting.url,
        openSpecModal: false, //是否打开规格弹窗
        foundId: 0, 
        team: null,
        teamFollow: null,
        teamFound: null,
        serverTime: 0,
        teamGoods: null,
        teamMsg: {
            msg: '',
            btnTxt: '',
        },
        timer: null,
        goodsInputNum: 1,
        currentPage: 1,
    },

    onLoad: function (options) {
        load.init(this, '', 'teamGoods');
        var foundId = options.foundId || 0;
        this.setData({ foundId: foundId });
        this.getTeamGoods();
        this.getTeamGoodlist();
    },

    getTeamGoods: function(){
        var that = this;
        request.get('/api/Team/found', {
            data: {
                id: that.data.foundId,
            },
            failRollback: true,
            success: function (res) {
                var result = res.data.result;
                that.setData({
                    serverTime: result.server_time,
                    team: result.team,
                    teamFollow: result.teamFollow,
                    teamFound: result.teamFound,
                });
                if (result.teamFound.status == 0){
                    that.setData({ 
                        'teamMsg.msg': "待开团",
                        'teamMsg.btnTxt': "一键发起拼单",
                    });
                } else if (result.teamFound.status == 1){
                    that.setData({
                        'teamMsg.msg': '',
                        'teamMsg.btnTxt': "一键参团",
                    });
                    that.createTimer();
                } else if (result.teamFound.status == 2) {
                    that.setData({
                        'teamMsg.msg': "拼单已满",
                        'teamMsg.btnTxt': "一键发起拼单",
                    });
                } else {
                    that.setData({
                        'teamMsg.msg': "拼单失败",
                        'teamMsg.btnTxt': "一键发起拼单",
                    });
                }
				//初始化选择的规格
                that.initSpecsPrice();
            }
        });
    },

    createTimer: function () {
        var that = this;
        var startTime = (new Date()).getTime();
        this.data.timer = setInterval(function () {
            var teamFound = that.data.teamFound;
            var diffTime = startTime - that.data.serverTime * 1000;
            teamFound.remainTime = util.transTime(teamFound.found_end_time * 1000 - (new Date()).getTime() + diffTime);
            if (teamFound.remainTime.hour <= 0 && teamFound.remainTime.minute <= 0 && teamFound.remainTime.second <= 0){
                clearInterval(that.data.timer);
                that.getTeamGoods();
            }
            that.setData({ teamFound: teamFound });
        }, 1000);
    },

    onUnload: function () {
        clearInterval(this.data.timer);
    },

    getTeamGoodlist: function(){
        var that = this;
        var requestUrl = '/api/Team/ajaxGetMore?p=' + that.data.currentPage;
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
        this.data.teamGoods = null;
        this.data.currentPage = 1;
        this.getTeamGoodlist();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        if (load.canloadMore()) {
            this.getTeamGoodlist();
        }
    },

    /** 关闭规格弹窗 */
    closeSpecModal: function () {
        this.setData({ openSpecModal: false });
    },

    /** 打开规格弹窗 */
    openSpecModel: function () {
        this.setData({ openSpecModal: true });
    },

    /** 增加购买的商品数量 */
    addCartNum: function (e) {
        var num = this.data.goodsInputNum + 1;
        this.setData({ goodsInputNum: num});
    },

    /** 减少购买的商品数量 */
    subCartNum: function (e) {
        var num = this.data.goodsInputNum - 1;
        if(num < 1){
            num = 1;
        }
        this.setData({ goodsInputNum: num });
    },

    /** 输入购买的数量 */
    inputCartNum: function (e) {
        var num = Number(e.detail.value);
        this.setData({ goodsInputNum: num });
    },

    /** 立即购买 */
    buyNow: function(){
        var that = this;
        var data={
            goods_id: that.data.team.goods_id,
            team_id: that.data.team.team_id,
            item_id: that.data.team.team_goods_item.length ? that.data.team.team_goods_item[that.data.specSelect].item_id : that.data.team.item_id,
            goods_num: that.data.goodsInputNum,
            found_id: that.data.teamFound.status == 1 ? that.data.foundId : '',
        };
        request.get('/api/Team/addOrder', {
            data: data,
            success: function (res) {
                var result = res.data.result;
                wx.navigateTo({ url: '/pages/team/team_confirm/team_confirm?orderSn=' + res.data.result.order_sn });
            }
        });
    },
	/** 初始化所有规格 */
    initSpecsPrice: function () {
        var specSelect = 0; //初始化选中第一个规格
        var specs = this.data.team.goods.spec_goods_price;
        var team_activity = this.data.team;

        if (specs.length == 0) { //没有规格
            this.setData({
                'specSelect': 0,
                'select.prom_id': team_activity.team_goods_item[0].team_id,
                'select.teamPrice': team_activity.team_goods_item[0].team_price,
                'select.price': team_activity.team_goods_item[0].price ? team_activity.team_goods_item[0].price : team_activity.goods.shop_price,
                'select.stock': team_activity.team_goods_item[0].store_count ? team_activity.team_goods_item.store_count : team_activity.goods.store_count,
                'select.needer': team_activity.needer,
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
        var list = team_activity.goods.spec;
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
            'team.goods.spec': list,
            'team.goods.spec_goods_price': specs,
            'select.prom_id': specs[specSelect].prom_id,
            'select.teamPrice': this.data.team.team_goods_item[0].team_price,
            'select.price': specs[specSelect].price,
            'select.stock': specs[specSelect].store_count,
            'select.needer': team_activity.needer,
        });
    },


    /** 点击规格按钮的回调函数 */
    selectSpec: function (e) {
        //对商品数量进行判断，对库存进行判断
        var itemId = e.currentTarget.dataset.itemid;
        var listIdx = e.currentTarget.dataset.listidx;
        var list = this.data.team.goods.spec;
        var team_activity = this.data.team;

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
        var specs = this.data.team.goods.spec_goods_price;
        for (var i = 0; i < specs.length; i++) {
            if (specs[i].key == newSpecKeys) {
                newSpecSelect = i;
                break;
            }
        }

        this.setData({
            specSelect: newSpecSelect,
            'team.goods.spec': list,
            'team.goods.spec_goods_price': specs,
            'select.prom_id': specs[newSpecSelect].prom_id,
            'select.teamPrice': this.data.team.team_goods_item[0].team_price,
            'select.price': specs[newSpecSelect].price,
            'select.stock': specs[newSpecSelect].store_count,
            'select.needer': team_activity.needer,
        });
        // this.checkCartNum(this.data.goodsInputNum);
    },

})
