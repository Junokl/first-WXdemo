var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        currentPage: 1,
        openFilter: false, //是否打开筛选弹框
        baseUrl: '/api/Distribut/goods_list', //基地址
        requestUrl: '', //请求的链接
        desc: 'asc', //佣金排序
        storeList: null,
        checkAllToggle: false, //全选标志
        hasshop: false, //是否已经开店
        brandList: null, //全部品牌
        categoryList: null, //全部分类
        categoryShow: false,
        brandShow: false,
        keyword: '',
        sort: '',
    },

    onLoad: function (options) {
        this.setData({ hasshop: options.hasshop });
        load.init(this,'', 'storeList');
        var requestUrl = this.data.baseUrl + '?sort=goods_id';
        this.requestGoodsList(requestUrl);
        this.requestCat();
    },

    requestCat: function(){
        var that = this;
        request.get('/api/Distribut/goods_types',{
            success: function (res) {
                that.setData({ brandList: res.data.result.brandList });
                that.setData({ categoryList: res.data.result.categoryList });
            }
        });
    },

    categoryTap: function(){
        var categoryShow = !this.data.categoryShow;
        this.setData({ categoryShow: categoryShow });
    },

    brandTap: function () {
        var brandShow = !this.data.brandShow;
        this.setData({ brandShow: brandShow });
    },

    checkCategory: function (e) {
        var id = e.currentTarget.dataset.id;
        var url = this.data.baseUrl + '?cat_id='+id;
        this.resetData();
        this.requestGoodsList(url);
        this.closeFilterModal();
    },

    checkBrand: function (e) {
        var id = e.currentTarget.dataset.id;
        var url = this.data.baseUrl + '?brand_id=' + id;
        this.resetData();
        this.requestGoodsList(url);
        this.closeFilterModal();
    },

    changeTab: function (e) {
        var type = e.currentTarget.dataset.type;
        var url;
        var sort;
        if (type == 1) { //综合
            sort ='goods_id';
            this.setData({ sort: sort });
            url = this.data.baseUrl + '?sort='+sort;
        } else if (type == 2) { //新品
            sort = 'is_new';
            this.setData({ sort: sort });
            url = this.data.baseUrl + '?sort='+sort;
        } else if (type == 3) { //销量
            sort = 'sales_sum';
            this.setData({ sort: sort });
            url = this.data.baseUrl + '?sort='+sort;
        } else { //佣金
            sort = 'distribut';
            this.setData({ sort: sort });
            if (this.data.desc == 'asc'){
                this.setData({ desc: 'desc' });
                url = this.data.baseUrl + '?sort='+sort+'&sort_asc=' + this.data.desc;
            }else{
                this.setData({ desc: 'asc' });
                url = this.data.baseUrl + '?sort='+sort+'&sort_asc=' + this.data.desc;
            }
        }
        this.setData({ keyword: '' });
        this.resetData();
        this.requestGoodsList(url);
    },

    requestGoodsList: function (requestUrl) {
        var that = this;
        this.data.requestUrl = requestUrl;
        requestUrl += (requestUrl.indexOf('?') > 0 ? '&' : '?') + 'p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            wx.stopPullDownRefresh();
        });
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestGoodsList(this.data.requestUrl);
            this.dealGoods();
            this.setData({ checkAllToggle: false });
        }
    },

    onPullDownRefresh: function () {
        this.resetData();
        this.requestGoodsList(this.data.requestUrl);
        this.setData({ checkAllToggle: false });
    },

    /** 提交搜索事件 */
    submitSearch: function (e) {
        var word = e.detail.value.word;
        if (typeof word != 'string' || word == '') {
            return app.showWarning('请输入关键词');
        }
        this.setData({ keyword: word });
        this.resetData();
        var url = this.data.baseUrl +'?key_word=' + word;
        this.requestGoodsList(url);
    },

    openFilterModal: function () {
        this.setData({ openFilter: true });
    },

    closeFilterModal: function () {
        this.setData({ openFilter: false });
    },

    /** 商品筛选 */
    filterGoods: function (e) {
        this.resetData();
        this.requestGoodsList(e.currentTarget.dataset.href);
        this.closeFilterModal();
    },

    /** 重置数据 */
    resetData: function () {
        load.resetConfig();
        this.data.storeList = null;
        this.data.currentPage = 1;
    },

    dealGoods: function(){
        var goodList = [];
        var goods = this.data.storeList;
        for (var i = 0; i < goods.length; i++) {
            goodList.push({
                goods_id: goods[i].goods_id,
                goods_name: goods[i].goods_name,
                selected: false,
                distribut: goods[i].distribut,
                shop_price: goods[i].shop_price,
                goods_thumb: goods[i].goods_thumb
            })
        }
        this.setData({ storeList: goodList });
    },

    //全选
    checkAll:function(){
        var checkAll = !this.data.checkAllToggle;
        var goodList = [];
        var goods = this.data.storeList;
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
        this.setData({ storeList: goodList });
        this.setData({ checkAllToggle: checkAll });
    },

    /** 选择单一商品 */
    selectGoods: function (e) {
        var id = e.currentTarget.dataset.id;
        var goodList = this.data.storeList;
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

    addGoods: function(){
        var that = this;
        var ids = [];
        var goodList = this.data.storeList;
        for (var i = 0; i < goodList.length; i++) {
            if (goodList[i].selected) {
                ids.push(goodList[i].goods_id);
            }
        }
        if (!that.data.hasshop){
            app.showWarning("您还没有开店");
            return;
        }
        if(ids.length <= 0){
            app.showWarning("没有选中商品");
            return;
        }
        request.post('/api/Distribut/add_goods', {
            data: { 
                goods_ids: ids,
                terminal: "miniapp"
            },
            success: function (res) {
                that.onPullDownRefresh();
            }
        });
    },

    goodsDetail: function(e){
        var goodsId = e.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id='+goodsId, });
    },

});