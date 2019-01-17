var app = getApp();
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        currentPage: 1,
        requestData: null, //请求的数据
        allData: null, //第一次请求到的所有数据，用于恢复筛选数据
        openFilterModal: false, //打开筛选弹框
        openSearchModal: false, //打开搜索界面
        baseUrl: '/api/goods/search', //基地址
        requestUrl: '', //请求的链接
        userInfo: wx.getStorageSync('app:userInfo') || {} ,
        hotWords: [], //搜索热词,
        historyWords: [], //历史纪录
    },

    onLoad: function (options) {
      console.log(options);
        load.init(this, 'goods_list', 'requestData');
        if (typeof options.brand_id != 'undefined') {
            return this.requestSearch(this.data.baseUrl + '?brand_id=' + options.brand_id);
        }
        this.openSearchModal();
        this.getHistoryWords();
        this.getConfigHotKey();
    },

    getHistoryWords: function () {
        var that = this;
        try {
            let historyWord = wx.getStorageSync('historyWordStorage');
            if (historyWord) {
                that.setData({
                    historyWords: historyWord
                })
            } else {
                wx.setStorageSync('historyWordStorage', []);
            }
        } catch (e) {
        }
    },

    getConfigHotKey: function () {
        var that = this;
        try {
            let hotKeyStorage = wx.getStorageSync('configStorage:hot_keywords')
            if (hotKeyStorage) {
                that.setData({
                    hotWords: hotKeyStorage.split('|')
                })
                return true;
            }
            that.requestConfig();
        } catch (e) {
            that.requestConfig();
        }
    },

    requestConfig: function () {
        var that = this;
        request.get('/api/Index/getConfig', {
            success: function (res) {
                var data = res.data.result.config;
                data.some(function (item, index) {
                    if (item.name === 'hot_keywords') {
                        that.setData({
                            hotWords: item.value.split('|')
                        })
                        return true;
                    }
                })
            }
        });
    },


    changeTab: function (e) {
        var href = e.currentTarget.dataset.href
      console.log(e);
        console.log(href);
        if (href.indexOf('shop_price') != -1) {
            if (this.data.requestData.sort_asc == "asc") {
                href = href.replace(/(.*)asc/, '$1desc')
            } else {
                href = href.replace(/(.*)desc/, '$1asc')
            }
        }
        this.resetData();
        this.requestSearch(href);
    },

    requestSearch: function (requestUrl) {
        var that = this;
        this.data.requestUrl = requestUrl; //保存链接
        requestUrl += (requestUrl.indexOf('?') > 0 ? '&' : '?') + 'p=' + that.data.currentPage;
        requestUrl = requestUrl.replace(/\/index.php/, "")
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            if (that.data.allData == null) {
                that.data.allData = Object.assign({}, res.data.result);
            }
            that.closeSearchModal();
        });
    },

    onReachBottom: function () {
        if (this.data.openSearchModal) {
            return;
        }
        if (load.canloadMore()) {
            this.requestSearch(this.data.requestUrl);
        }
    },

    openFilterModal: function () {
        this.setData({ openFilterModal: true });
    },

    closeFilterModal: function () {
        this.setData({ openFilterModal: false });
    },

    /** 商品筛选 */
    filterGoods: function (e) {
        this.resetData();
        this.requestSearch(e.currentTarget.dataset.href);
        this.closeFilterModal();
    },

    /** 重置数据 */
    resetData: function () {
        load.resetConfig();
        this.data.requestData = null;
        this.data.currentPage = 1;
    },

    /** 恢复数据 */
    restoreData: function () {
        this.setData({ 'requestData': this.data.allData });
    },

    openSearchModal: function () {
        this.setData({ openSearchModal: true });
    },

    closeSearchModal: function () {
        this.setData({ openSearchModal: false });
    },

    /** 提交搜索事件 */
    submitSearch: function (e) {
        this.search(e.detail.value);
    },

    /** 点击搜索热词事件 */
    searchHotWord: function (e) {
        this.search(e.currentTarget.dataset.word);
    },

    /** 对搜索词进行搜索 */
    search: function (word) {
        if (typeof word != 'string' || word == '') {
            return app.showWarning('请输入搜索关键词');
        }
        if (this.data.historyWords.indexOf(word) == -1) {
            this.data.historyWords.unshift(word)
            wx.setStorageSync('historyWordStorage', this.data.historyWords)
        }
        this.resetData();
        this.requestSearch(this.data.baseUrl + '?q=' + word);
    },

    clearHistoryKey: function () {
        var that = this;
        if (this.data.historyWords.length == 0) {
            return false;
        }
        wx.showModal({
            title: '确定删除历史纪录',
            success: function (res) {
                if (res.confirm) {
                    that.setData({
                        historyWords: []
                    })
                    wx.setStorageSync('historyWordStorage', []);
                }
            }
        })


    }

});