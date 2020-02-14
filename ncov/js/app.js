var BIGMap;
var playback;
//页面加载完成后执行
$(document).ready(function () {
    var beyonmap = new BigMap("mapmap", {
        minZoom:1,
        maxZoom: 19,
        zoom:3
    });
   
    BIGMap = beyonmap;
    BIGMap.enableMarkerPopup();
    var google = new ol.layer.Tile({
        title: 'Google影像',
        type: 'base',
        visible: true,
        source: new ol.source.XYZ({
        	attributions:"Google影像",
            url: 'http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}'//CONFIGURL.Google_RasterUrl
        })
    });
 
    BIGMap.addBaseLayer(google);

   
    PageMain.init();
});

//3d
var camera;
function init3D(){
	BIGMap.init3DMap();
    var scene =  BIGMap.getOL3D().getCesiumScene();
    camera = new Cesium.Camera(scene);
}

/**
 * 投影转换，将 EPSG:4326转换成EPSG:3857
 * @param {*} extent 
 */
function transform(extent) {
    return ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
}

/**
 * 新增可视化功能
 * 
 */
//配置
var metaData;
var colorArr = ['#ffffff','rgb(250, 230, 210)','rgb(242, 168, 141)','rgb(227, 102, 84)','rgb(201, 47, 49)','rgb(118, 22, 26)','#000000'];
var featuresVector = [],featuresHeat = [],viewBloo=false;
var PageMain = {
   
    //初始化
    init :function(){
        PageMain.initData();
        PageMain.handle();
    },
    createRegion:function(){
        PageMain.clean();
        BIGMap.getVectorLayer().set('visible', true);
        //PageMain.draw.createLengthMap();
    },
    createHeatMap:function(){
        PageMain.clean();
        BIGMap.getHeatmapLayer().set('visible', true);
    },
    createSupport:function(){
        PageMain.clean();
        createFlight();
        BIGMap.setCenter(ol.proj.fromLonLat([114.3896, 30.6628]));
        BIGMap.setZoom(5);
    },
    createTV:function(){
        window.open('https://m.yangshipin.cn/static/2020/c0126.html');
       
    },
    hssModule : function(){
        if(!BIGMap.getOL3D()) {
            alert("请先切换到三维视图！");
            return;
        }
        PageMain.clean();
       
        BIGMap.getOL3D().setEnabled(true);
        var hssModuleentity = BIGMap.getOL3D().getDataSourceDisplay().defaultDataSource.entities.add(
            {
                name: "火神山",
                position: Cesium.Cartesian3.fromDegrees(114.3896, 30.6628, 0),
                //orientation: orientation,
                model: {
                    uri: "data/huoshenfltf_0.glb",
                    minimumPixelSize: 128,//最小的模型像素
                    maximumScale: 200000,//最大的模型像素
                    show:true,
                    scale:200000
                }
            }
        );
        camera.flyTo({
            destination:Cesium.Cartesian3.fromDegrees(114.3896, 30.6628, 1000),
            orientation: {
                heading : Cesium.Math.toRadians(2.0), // 方向
                pitch : Cesium.Math.toRadians(-90.0),// 倾斜角度
                roll : 0
            }});
    },
    lssModule : function(){
        if(!BIGMap.getOL3D()) {
            alert("请先切换到三维视图！");
            return;
        }
        PageMain.clean();
        BIGMap.getOL3D().setEnabled(true);
       // BIGMap.enableLighting(true);    
        var lssModuleentity = BIGMap.getOL3D().getDataSourceDisplay().defaultDataSource.entities.add(
            {
                name: "雷神山",
                position: Cesium.Cartesian3.fromDegrees(114.3896, 30.6628, 0),
                //orientation: orientation,
                model: {
                    uri: "data/leishenhillgltf_0.glb",
                    minimumPixelSize: 128,//最小的模型像素
                    maximumScale: 20000,//最大的模型像素
                    runAnimations:true,//是否显示动画
                    clampAnimations:true,//是否保持最后一针的动画
                    show:true,
                    scale:1
                }
            }
        );
        camera.flyTo({
            destination:Cesium.Cartesian3.fromDegrees(114.3896, 30.6628, 1000),
            orientation: {
                heading : Cesium.Math.toRadians(2.0), // 方向
                pitch : Cesium.Math.toRadians(-90.0),// 倾斜角度
                roll : 0
            }});
    },
    switchView:function(){
        //三维
        if(!viewBloo){
            init3D();
            BIGMap.getOL3D().setEnabled(true);
            viewBloo = !viewBloo;
        }else{
            alert('echrts插件不兼容olc 切换二维部分功能缺失');
        }
        
    },
    back:function(){
        location.reload() 
    },
    clean:function(){
        BIGMap.getVectorLayer().set('visible', false);
        BIGMap.getHeatmapLayer().set('visible', false);

        BIGMap.setCenter(ol.proj.fromLonLat([101.4173, 37.9204]));
        BIGMap.setZoom(3);
        if(BIGMap.getOL3D()){
            BIGMap.getOL3D().getDataSourceDisplay().defaultDataSource.entities.removeAll();
        }
        
        //PageMain.draw.removeLengthMap(); 
        cleanEcharts();
    },
    initData : function(){
        //https://service-f9fjwngp-1252021671.bj.apigw.tencentcs.com/release/pneumonia
        //这里备份了一份数据，接口本地做了代理
        $.get('data/data.json',{},(data)=>{
            if(!data)return false;
            metaData = {statistics,listByArea,listByOther,timeline,listByCountry} = data.data;
            PageMain.draw.getChina();
        });
    },
    handle : function(){
        var _lastSelectedFeature;
        BIGMap.getMap().on('pointermove',(e)=>{
            var pixel = BIGMap.getMap().getEventPixel(e.originalEvent);
            var hit = BIGMap.getMap().hasFeatureAtPixel(pixel);

            if (_lastSelectedFeature) {
                _lastSelectedFeature.getStyle().getStroke().setWidth(1);
                _lastSelectedFeature.changed();
            }
            if (hit) {
                var f = BIGMap.getMap().forEachFeatureAtPixel(e.pixel, function (feature) {
                    return feature;
                });
                if (f.type === 'region') {
                    f.getStyle().getStroke().setWidth(3);
                    var html = "区域 ："+f.get('name');
                    html += " 确诊 ："+f.confirmed
                    html += " 疑似 ："+f.suspected
                    html += " 死亡 ："+f.dead;
                    html += " 痊愈 ："+f.cured;
                    BIGMap.popup.show(ol.proj.fromLonLat([f.get('longitude'),f.get('latitude')]), html);
                    f.changed();
                    _lastSelectedFeature = f;
                }
    
            }else{
                BIGMap.popup.hide();
            }
        });
        BIGMap.getMap().on('click', function (e) {
            var feature = BIGMap.getMap().forEachFeatureAtPixel(e.pixel, function (feature) {
                return feature;
            });
            if (feature) {
              console.log(feature.cities);
    
            }
    
        });
    },
    //区域分布
    draw : {
        //数据处理 获取全国
        getChina : function(){
            $.get('data/china.json',{},(data)=>{
                featuresVector = new ol.format.GeoJSON({featureProjection: 'EPSG:3857'}).readFeatures(data);
                featuresVector.forEach((feature,index,arr)=>{
                    if(!metaData)return false;
                    var featureName = feature.get('name');
                    metaData.listByArea.forEach((province,index,arr)=>{
                        if(province.provinceShortName == featureName){
                            //处理矢量要素
                            feature.type = 'region';
                            feature.confirmed = province.confirmed;
                            feature.cured = province.cured;
                            feature.dead = province.dead;
                            feature.suspected = province.suspected;
                            feature.cities = province.cities;
                            feature.setStyle(PageMain.draw.setStyle(feature.confirmed));

                            //处理热力图
                            featuresHeat.push(
                                new ol.Feature({
                                    geometry: new ol.geom.Point
                                    (ol.proj.fromLonLat([feature.get('longitude'),feature.get('latitude')])),
                                    name: feature.name,
                                    weight : parseFloat(feature.confirmed) / parseFloat(100)
                                })
                            );
                        }
                    });
                });
                //创建默认区域分布
                PageMain.draw.createRegion(featuresVector);
    
                //热力图
                BIGMap.getHeatmapLayer().set('visible', false);
                PageMain.draw.createHeat(featuresHeat);
            })
        },
        //添加要素
        createRegion:function(features){
            BIGMap.getVectorLayer().getSource().addFeatures(features);
           // PageMain.draw.createLengthMap();
        },
        //创建热力图
        createHeat:function(features){
            BIGMap.addHeatmapDatas(features);
        },
        //降维设置配色
        setStyle : function(value){
            function getIndex(){
                return value == 0 ? 0 :
                value < 10 ? 1 : 
                value < 100 ? 2 :
                value <500 ? 3 :
                value < 1000 ? 4:
                value < 10000? 5 : 6; 
            }
            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: colorArr[getIndex()]
                }),
                stroke: new ol.style.Stroke({ //边界样式
                    color: '#ffffff',
                    width: 1
                }),  
            });
        },
        //创建图例
        createLengthMap:function(){
            /*
             * 图例数据
             */
            var dataObj = [{
                tname: '>10000',
                color: '#000000',
            }, {
                tname: '1000-10000',
                color: 'rgb(118, 22, 26)',
            }, {
                tname: '500-999',
                color: 'rgb(201, 47, 49)',
            }, {
                tname: '100-499',
                color: 'rgb(227, 102, 84)',
            },{
                tname: '10-99',
                color: 'rgb(242, 168, 141)',
            },{
                tname: '1-9',
                color: 'rgb(250, 230, 210)',
            },{
                tname: '0',
                color: '#ffffff',
            }]
            //getMapPoint(dataObj);
            drawMapTuliMethod(dataObj);
        },
        removeLengthMap:function(){
            addNewsChartsDelectOring('all');
        }
    }
}
var echartslayer;
function createFlight(){
      echartslayer = new ol3Echarts(getOption(), {
        source: '',
        destination: '',
        hideOnMoving: true,
        forcedRerender: false,
        forcedPrecomposeRerender: false
      });
      console.log(echartslayer);
      echartslayer.appendTo(BIGMap.getMap());
}

function cleanEcharts(){
    if(!echartslayer)return false;
    
    echartslayer.remove();
}
function getOption () {
    var geoCoordMap = {
      '上海': [121.4648, 31.2891],
      '北京': [116.4551, 40.2539],
      '江苏': [118.8062, 31.9208],
      '贵州': [108.479, 23.1152],
      '江西': [116.0046, 28.6633],
      '安徽': [117.29, 32.0581],
      '天津': [117.4219, 39.4189],
      '广东': [113.5107, 23.2196],
      '四川': [103.9526, 30.7617],
      '浙江': [119.5313, 29.8773],
      '湖北': [114.3896, 30.6628],
      '山东': [117.1582, 36.8701],
      '河北': [114.4995, 38.1006],
      '贵阳': [106.6992, 26.7682],
      '河南': [113.4668, 34.6234],
      '湖南': [113.0823, 28.2568],
    };
    var planePath = 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z';
    var convertData = function (data) {
      var res = [];
      for (var i = 0; i < data.length; i++) {
        var dataItem = data[i];
        var fromCoord = geoCoordMap[dataItem[0].name];
        var toCoord = geoCoordMap[dataItem[1].name];
        if (fromCoord && toCoord) {
          res.push({
            fromName: dataItem[0].name,
            toName: dataItem[1].name,
            coords: [fromCoord, toCoord]
          });
        }
      }
      return res;
    };
    var color = ['#a6c84c', '#ffa022', '#46bee9'];
    var series = [];
    [
    ['上海', [[{name: '上海'}, {name: '湖北', value: 95}]]],
    ['北京', [[{name: '北京'}, {name: '湖北', value: 95}]]],
    ['江苏', [[{name: '江苏'}, {name: '湖北', value: 95}]]],
    ['贵州', [[{name: '贵州'}, {name: '湖北', value: 95}]]],
    ['江西', [[{name: '江西'}, {name: '湖北', value: 95}]]],
    ['安徽', [[{name: '安徽'}, {name: '湖北', value: 95}]]],
    ['天津', [[{name: '天津'}, {name: '湖北', value: 95}]]],
    ['广东', [[{name: '广东'}, {name: '湖北', value: 95}]]],
    ['四川', [[{name: '四川'}, {name: '湖北', value: 95}]]],
    ['浙江', [[{name: '浙江'}, {name: '湖北', value: 95}]]],
    ['山东', [[{name: '山东'}, {name: '湖北', value: 95}]]],
    ['河北', [[{name: '河北'}, {name: '湖北', value: 95}]]],
    ['贵阳', [[{name: '贵阳'}, {name: '湖北', value: 95}]]],
    ['河南', [[{name: '河南'}, {name: '湖北', value: 95}]]],
    ['湖南', [[{name: '湖南'}, {name: '湖北', value: 95}]]]
    ].forEach(
      function (item, i) {
        series.push({
            name: item[0] + ' 支援队',
            type: 'lines',
            zlevel: 1,
            effect: {
              show: true,
              period: 6,
              trailLength: 0.7,
              color: '#fff',
              symbolSize: 3
            },
            lineStyle: {
              normal: {
                color: color[i],
                width: 0,
                curveness: 0.2
              }
            },
            data: convertData(item[1])
          },
          {
            name: item[0] + ' 支援队',
            type: 'lines',
            zlevel: 2,
            effect: {
              show: true,
              period: 6,
              trailLength: 0,
              symbol: planePath,
              symbolSize: 15
            },
            lineStyle: {
              normal: {
                color: color[i],
                width: 1,
                opacity: 0.4,
                curveness: 0.2
              }
            },
            data: convertData(item[1])
          },
          {
            name: item[0] + ' 支援队',
            type: 'effectScatter',
            coordinateSystem: 'geo',
            zlevel: 2,
            rippleEffect: {
              brushType: 'stroke'
            },
            label: {
              normal: {
                show: true,
                position: 'right',
                formatter: '{b}'
              }
            },
            symbolSize: function (val) {
              return val[2] / 8;
            },
            itemStyle: {
              normal: {
                color: color[i]
              }
            },
            data: item[1].map(function (dataItem) {
              return {
                name: dataItem[1].name,
                value: geoCoordMap[dataItem[1].name].concat([dataItem[1].value])
              };
            })
          });
      });
    return {
      tooltip: {
        trigger: 'item'
      },
      series: series
    };
}
