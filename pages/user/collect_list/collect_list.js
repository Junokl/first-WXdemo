var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
  data: {
    ifont_bind: 1,//ifont_bind=0的时候更换升序小图标
    sort_size_img: "../../../images/sort.png",//降序小图标
    sort_big_img: "../../../images/little.png",//升序小图标
    url: app.globalData.setting.url,
    storeCollects: null,
    currentPage: 1,
    activeFollow: 1,//选项卡的切换
    activeEdit_goods: false,//商品宝贝的编辑状态
    activeEdit_store: false,//品牌店铺的编辑状态
    activeRadio: [],//单选按钮
    arr: [],
    checked: false,//商品宝贝的选中状态
    selected: false,//品牌店铺的选中状态
    goods_id: "",
    store_id: "",
    middlearr: [],
    checkAllToggle: false, //全选标志
    checked: false,
    goods_id: [],//商品id
    // 更新部分
    currentTab: 0,
    categories: [
      { name: "默认" },
      { name: "促销" },
      { name: "价格" }
    ],
    categories_store: [
      { name: "默认" },
      { name: "促销" },
      { name: "有劵" }
    ],
    goods_list: [],//请求的商品收藏
    list: [],        //请求的店铺收藏
    test_arr: [],//第三方变量
  },

  onLoad: function () {
    load.init(this, '', 'goods_list');
    this.resetData();
    this.requestCollectGoods();
    this.requestCollectStore();
  },


  // 更新部分
  changeTopTab: function (e) {
    this.setData({
      currentTab: e.currentTarget.dataset.idx,
      activeEdit: 0
    });
  },
  // 商品宝贝的数据
  requestCollectGoods: function () {
    var that = this;
    var requestUrl = '/api/user/getGoodsCollect' + '?p=' + that.data.currentPage;
    load.request(requestUrl, function (res) {
      that.data.currentPage++;
    });
  },
  // 品牌店铺的数据
  requestCollectStore: function () {
    var that = this;
    var requestUrl = '/api/user/getUserCollectStore' + '?page=' + that.data.currentPage;
    load.request(requestUrl, function (res) {
      that.data.currentPage++;
    });
  },

  // 商品宝贝 点击编辑
  edit_btn: function () {
    var that = this;
    if (that.data.activeFollow == 1) {
      // 给商品宝贝 数据添加一个checked属性
      for (var i = 0; i < that.data.goods_list.length; i++) {
        let val = that.data.goods_list[i];
        val.checked = false;
      }
      that.setData({
        activeEdit_goods: !that.data.activeEdit_goods,
        test_arr: that.data.goods_list
      });

    } else if (that.data.activeFollow == 2) {
      // test_arr = that.data.list;
      // 给品牌店铺 数据添加一个selected属性
      for (var i = 0; i < that.data.list.length; i++) {
        let val = that.data.list[i];
        val.selected = 'false';
      }
      that.setData({
        activeEdit_store: !that.data.activeEdit_store,
        test_arr: that.data.list
      });
    };
    // 回复初始化，默认不选择
    that.setData({ checkAllToggle: false });
    for (var t1 = 0; t1 < that.data.goods_list.length; t1++) {
      let val = that.data.goods_list[t1];
      val[t1].checked = false;
    };
    for (var t2 = 0; t2 < that.data.list.length; t2++) {
      let val = that.data.list[t2];
      val[t2].checked = false;
    }
  },

  // 商品宝贝 点击单选按钮选择
  selectGoods: function (e) {
    var that = this;
    let arr2 = [];
    var arr = that.data.test_arr;
    var index = e.currentTarget.dataset.index;
    arr[index].checked = !(arr[index].checked);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].checked) {
        arr2.push(arr[i])
        arr2.length == arr.length ? that.setData({ checkAllToggle: true }) : that.setData({ checkAllToggle: false })
      }
    };
    that.setData({
      test_arr: arr,
      middlearr: arr2,
      goods_list: arr,
      list: arr
    })
  },

  //  商品宝贝  点击全选
  all_btn: function () {
    var that = this;
    that.setData({ checkAllToggle: !that.data.checkAllToggle });
    if (that.data.checkAllToggle) {
      let arr = that.data.test_arr;
      let arr2 = [];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].checked == true) {
          arr2.push(arr[i]);
        } else {
          arr[i].checked = true;
          arr2.push(arr[i]);
        }
      }
      that.setData({
        test_arr: arr2,
        middlearr: arr2,
        goods_list: arr2,
        list: arr2
      })
    } else {
      let arr = that.data.test_arr;
      let arr2 = [];
      for (let i = 0; i < arr.length; i++) {
        arr[i].checked = false;
        arr2.push(arr[i]);
      }
      that.setData({
        test_arr: arr2,
        middlearr: [],
        goods_list: arr2,
        list: arr2
      })
    }

  },


  /** 商品宝贝 取消商品收藏 */
  cancelCollectGoods: function () {
    var that = this;
    var str_id = [];
    var str = that.data.middlearr;
    if (that.data.activeFollow == 1) {
      for (var i = 0; i < str.length; i++) {
        str_id.push(str[i].goods_id);
      }
      str_id = str_id.join(",");
      request.post('/api/goods/collectGoodsOrNo', {
        data: { goods_id: str_id },
        success: function (res) {
          app.showSuccess(res.data.msg, function () { });
          that.deleteGoodsData(str_id);
        }
      });
    } else if (that.data.activeFollow == 2) {
      for (var i = 0; i < str.length; i++) {
        str_id.push(str[i].store_id);
      }
      str_id = str_id.join(",");
      request.post('/api/store/collectStoreOrNo', {
        data: { store_id: str_id },
        success: function (res) {
          app.showSuccess(res.data.msg, function () { });
          that.deleteGoodsData(str_id);
        }
      });
    }


  },

  /** 商品宝贝 删除单项商品数据 */
  deleteGoodsData: function (goodsId) {
    var that = this;
    goodsId = goodsId.split(",");
    if (that.data.activeFollow == 1) {
      for (var i = 0; i < this.data.test_arr.length; i++) {
        for (var j = 0; j < goodsId.length; j++) {
          if (this.data.test_arr[i].goods_id == Number(goodsId[j])) {
            this.data.test_arr.splice(i, 1);
            this.setData({
              test_arr: this.data.test_arr,
              goods_list: this.data.test_arr,
              list: this.data.test_arr
            });
          }
        }
      }
    } else if (that.data.activeFollow == 2) {
      for (var i = 0; i < this.data.test_arr.length; i++) {
        for (var j = 0; j < goodsId.length; j++) {
          if (this.data.test_arr[i].store_id == Number(goodsId[j])) {
            this.data.test_arr.splice(i, 1);
            this.setData({
              test_arr: this.data.test_arr,
              goods_list: this.data.test_arr,
              list: this.data.test_arr
            });
          }
        }
      }
    }
  },

  /** 取消店铺收藏 */
  // cancelCollectStore: function () {
  //     var that = this;
  //     console.log(111)
  //     request.post('/api/store/collectStoreOrNo', {
  //         data: { store_id: storeId },
  //         success: function (res) {
  //             // console.log(res);
  //             that.deleteStoreData(storeId);
  //         }
  //     });
  // },

  /** 删除单项店铺数据 */
  // deleteStoreData: function (storeId) {
  //   for (var i = 0; i < this.data.test_arr.length; i++) {
  //     if (this.data.test_arr[i].store_id == storeId) {
  //       this.data.test_arr.splice(i, 1);
  //       this.setData({ test_arr: this.data.test_arr });
  //         break;
  //         }
  //     }
  // },

  checkNav: function (e) {
    this.setData({
      activeFollow: e.currentTarget.dataset.i,
      activeEdit_goods: false,
      activeEdit_store: false
    });
    this.data.currentPage = 1;
    this.data.goods_list = null;
    this.data.list = null;
    if (this.data.activeFollow == 1) {
      load.init(this, '', 'goods_list');
      this.requestCollectGoods();
    } else {
      load.init(this, '', 'list');
      this.requestCollectStore();
    }
  },
  /** 重置数据 */
  resetData: function () {
    load.resetConfig();
    this.data.currentPage = 1;
    if (this.data.activeFollow == 1) {
      this.data.goods_list = null;
      this.requestCollectGoods();
    } else if (this.data.activeFollow == 2) {
      this.data.list = null;
      this.requestCollectStore();
    }
  },
  // 下拉刷新
  onPullDownRefresh: function (e) {
    var that = this;
    this.resetData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var that = this;
    console.log(that.data.activeFollow);
    if (load.canloadMore()) {
      if (that.data.activeFollow == 1) {
        that.requestCollectGoods();
      } else if (that.data.activeFollow == 2) {
        that.requestCollectStore();
      }
    }
  },

});