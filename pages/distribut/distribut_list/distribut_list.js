var app = getApp();
var request = app.request;

Page({
    data: {
        url: app.globalData.setting.url,
        requestUrl: '', //请求的链接
        goods: null,
        checkAllToggle: false, //全选标志
    },

    onLoad: function (options) {
        this.requestGoodsList();
    },

    requestGoodsList: function () {
        var that = this;
        request.get('/api/Distribut/distribution_list', {
            success: function (res) {
                that.setData({ goods: res.data.result });
            }
        });
    },

    //全选
    checkAll:function(){
        var checkAll = !this.data.checkAllToggle;
        var goodList = [];
        var goods = this.data.goods;
        if(goods == null || goods.length <= 0){
            return;
        }
        for (var i = 0; i < goods.length; i++) {
            goodList.push({
                goods_id: goods[i].goods_id,
                goods_name: goods[i].goods_name,
                selected: checkAll,
                distribut: goods[i].distribut,
                shop_price: goods[i].shop_price,
                goods_thumb: goods[i].goods_thumb
            })
        }
        this.setData({ goods: goodList });
        this.setData({ checkAllToggle: checkAll });
    },

    /** 选择单一商品 */
    selectGoods: function (e) {
        var id = e.currentTarget.dataset.id;
        var goodList = this.data.goods;
        for (var i = 0; i < goodList.length; i++){
            if (id == goodList[i].goods_id){
                goodList[i].selected = !goodList[i].selected;
            }
        }
        var checkAll = true;
        for (var j = 0; j < goodList.length; j++) {
            if (!goodList[j].selected) {
                checkAll = false;
            }
        }
        this.setData({ checkAllToggle: checkAll });
        this.setData({ goodList: goodList });
    },

    delGoods: function(){
        var that = this;
        var ids = [];
        var goodList = this.data.goods;
        for (var i = 0; i < goodList.length; i++) {
            if (goodList[i].selected) {
                ids.push(goodList[i].goods_id);
            }
        }
        if(ids.length <= 0){
            app.showWarning("没有选中商品");
            return;
        }
        request.post('/api/Distribut/delete', {
            data: { goods_ids: ids, terminal: "miniapp" },
            success: function (res) { 
                that.setData({ checkAllToggle: false });
                that.requestGoodsList();
            }
        });
    },

    goodsDetail: function(e){
        var goodsId = e.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id='+goodsId, });
    },

});