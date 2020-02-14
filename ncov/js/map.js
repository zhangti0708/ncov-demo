/**
 *  地图操作封装，用于简化地图开发 <p>
 *  默认集成了：热力图，动态聚合图，标记图层，量算图层，普通标绘图层，动态标绘图层，态势回放，二三维一体化；
 * 
 * @param {any} mapdiv id 
 * @param {any} options 
 * @author guanml <guanminglin@beyondb.com.cn>
 */
var BigMap = function (mapdiv, options) {
    var m = this._init(mapdiv, options);
    this.lastSelectedFeature = null;
    this.map = m;
    if (options) {
        var _enable3DMap = options.enable3DMap || false;
        var _enableLighting = options.enableLighting || false;
        if (_enable3DMap == true) {
            this.init3DMap();
            this.ol3d.setEnabled(true);
            if (_enableLighting == true) {
                this.enableLighting(true);
            }
        }
    }
}

/**
 * 初始化地图
 * 
 * @param {element} mapdiv id 
 * @param {any} options 
 */
BigMap.prototype._init = function (mapdiv, options) {
    var _zoom = 3;
    var _maxZoom = 18;
    var _minZoom = 2;
    var _center = ol.proj.fromLonLat([101.4173, 37.9204]);
    var _rotation = 0;

    var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(6),
        projection: 'EPSG:4326',
        undefinedHTML: '&nbsp;'
    });

    //定义弹出窗口
    var _popup = new ol.Overlay.Popup({
        popupClass: "default", //"tooltips", "warning" "black" "default", "tips", "shadow",
        closeBox: true,
        //onclose: function(){ console.log("You close the box"); },
        // onshow: function() { console.log("You opened the box"); },
        positioning: 'bottom-center',
        autoPan: true,
        offset: [1.2, -20],
        autoPanAnimation: {
            duration: 100
        }
    });

    //添加阴影
    _popup.addPopupClass('shadow');

    //定义默认标记图层
    var _markersLayer = new ol.layer.Vector({
        title: '标记图层',
        source: new ol.source.Vector({
            wrapX: false
        })
    });

    var _vectorLayer = new ol.layer.Vector({
        title: '矢量图层',
        source: new ol.source.Vector({
            wrapX: false
        })
    });

    //定义默认量算图层
    var _mesureLayer = new ol.layer.Vector({
        title: '量算图层',
        source: new ol.source.Vector(),
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        })
    });

    //定义默认热力图层
    var _heatmapLayer = new ol.layer.Heatmap({
        title: '热力图层',
        source: new ol.source.Vector({
            wrapX: false
        }),
        blur: parseInt(15, 10),
        radius: parseInt(15, 10),
        visible: true
    });

    //当添加feature到热力图层上时，设置热力值
    _heatmapLayer.getSource().on('addfeature', function (event) {
        var magnitude = event.feature.get('weight');
        //var magnitude = parseFloat(name.substr(2));
		event.feature.set('weight', magnitude-2);
    })

    var _baseLayerGroup = new ol.layer.Group({
        'title': '基础底图',
        openInLayerSwitcher: true,
        layers: [
            new ol.layer.Tile({
                title: '天地图影像-网络',
                type: 'base',
                visible: false,
                source: new ol.source.XYZ({
                    url: 'http://t{0-6}.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=2ce94f67e58faa24beb7cb8a09780552'
                })
            })
        ]
    });

    var _overlayersGroup = new ol.layer.Group({
        'title': '叠加图层',
        openInLayerSwitcher: true,
        layers: [
            new ol.layer.Tile({
                title: '天地图影像注记-网络',
                type: 'overlay',
                visible: false,
                source: new ol.source.XYZ({
                    url: 'http://t{0-6}.tianditu.com/DataServer?T=cia_w&x={x}&y={y}&l={z}'
                })
            })
        ]
    });

    if (options) {
        _zoom = options.zoom || 3;
        _center = options.center || ol.proj.fromLonLat([101.4173, 37.9204]);
        _rotation = options.rotation || 0;
        _maxZoom = options.maxZoom || 18;
        _minZoom = options.minZoom || 2;

        //如果options中有定义图层组则使用options中提供的
        if (options.baseLayerGroup) {
            _baseLayerGroup = options.baseLayerGroup;
        }

        if (options.overlayersGroup) {
            _overlayersGroup = options.overlayersGroup;
        }
    }

    this.popup = _popup;
    this.popups = new ol.Collection([]);
    this.baseLayerGroup = _baseLayerGroup;
    this.overlayersGroup = _overlayersGroup;
    this.markersLayer = _markersLayer;
    this.heatmapLayer = _heatmapLayer;
    this.mesureLayer = _mesureLayer;
    this.vectorLayer = _vectorLayer;
    this.zoom = _zoom;
    this.center = _center;
    this.rotation = _rotation;
    this.maxZoom = _maxZoom;
    this.minZoom = _minZoom;

    //添加默认图层
    this.overlayersGroup.getLayers().push(_mesureLayer);
    this.overlayersGroup.getLayers().push(_heatmapLayer);
    this.overlayersGroup.getLayers().push(_vectorLayer);
    this.overlayersGroup.getLayers().push(_markersLayer);

    //定义地图对象
    var _map = new ol.Map({
        layers: [
            _baseLayerGroup,
            _overlayersGroup
        ],

        // controls: ol.control.defaults({
        //     attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
        //         collapsible: false
        //     })
        // }).extend([mousePositionControl, new ol.control.FullScreen({
        //     source: 'fullscreen'
        // })]),
        controls: ol.control.defaults().extend([
            new ol.control.FullScreen()
        ]),
        target: document.getElementById(mapdiv),
        view: new ol.View({
            zoom: _zoom,
            center: _center,
            rotation: _rotation,
            maxZoom: _maxZoom,
            minZoom: _minZoom
        }),
        loadTilesWhileInteracting: true,
        logo: false
    });

    // 添加图层管理器
    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: '图层管理' // Optional label for button
    });
    _map.addControl(layerSwitcher);

    //设置popup显示的地图
    _popup.setMap(_map);

    return _map;
};
/**
 * 初始化三维地图
 * @returns {undefined}
 */
BigMap.prototype.init3DMap = function () {

    var ol3dmap = new olcs.OLCesium({
        map: this.map
    });
    this.ol3d = ol3dmap;
    var scene = this.ol3d.getCesiumScene();
    scene.sun = new Cesium.Sun();
    scene.globe.enableLighting = false;
    scene.globe.depthTestAgainstTerrain = true;
    this.ol3d.enableAutoRenderLoop();
    // Show off 3D feature picking
    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    var lastPicked;
    handler.setInputAction(function (movement) {
        var pickedObjects = ol3dmap.getCesiumScene().drillPick(movement.position);
        if (Cesium.defined(pickedObjects)) {
            for (i = 0; i < pickedObjects.length; ++i) {
                var picked = pickedObjects[i];
                if (Cesium.defined(picked) && Cesium.defined(picked.node) && Cesium.defined(picked.mesh)) {
                    console.log('node: ' + picked.node.name + '. mesh: ' + picked.mesh.name);
                    alert("选中：" + picked.mesh.name);
                }

            }
        } else {
            lastPicked = undefined;

        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

/**
 * 启用或关闭三维日照光线视图
 * @returns {undefined}
 */
BigMap.prototype.enableLighting = function (enable) {
    var _ol3d = this.ol3d;
    if (enable) {
        if (_ol3d.getEnabled()) {
            _ol3d.getCesiumScene().globe.enableLighting = true;
        } else {
            alert("请先切换到三维视图！");
            $('#lightningview').prop("checked", "false");
            return;
        }
    } else {
        if (_ol3d.getEnabled()) {
            _ol3d.getCesiumScene().globe.enableLighting = false;
        } else {
            alert("请先切换到三维视图！");
            return;
        }

    }
};


/**
 * 添加基础底图
 * 
 * @param {array} baselayers 
 */
BigMap.prototype.addBaseLayer = function (baselayer) {
    this.baseLayerGroup.getLayers().push(baselayer);
};

/**
 * 添加叠加图层
 * 
 * @param {any} overlayer 
 */
BigMap.prototype.addOverLayLayer = function (overlayer) {
    this.overlayersGroup.getLayers().push(overlayer);
};

/**
 * 添加overlay图层组
 * 
 * @param {any} group 
 */
BigMap.prototype.addOverlayersGroup = function (group) {
    this.map.addLayer(group);
};

/** 
 * 添加marker
 * 
 * @param {ol.Coordinate} lonlat 经纬度坐标
 * @param {ol.style.Style} style  样式
 * @returns {ol.feature}  要素对象
 */
BigMap.prototype.addMarker = function (lonlat, alt, style, content, transform) {

    var coordinate = [];
    if (transform) {
        coordinate = ol.proj.transform(lonlat, 'EPSG:4326', 'EPSG:3857');
    } else {
        coordinate = lonlat;
    }

    //高程不为null时，添加高程坐标
    if (alt) {
        coordinate.push(alt);
    }

    var feature = new ol.Feature({
        type: 'icon',
        geometry: new ol.geom.Point(coordinate),
        content: content
    });


    if (style) {
        feature.setStyle(style);
    } else {
        //设置默认的style
        feature.setStyle(new ol.style.Style({
            image: new ol.style.Icon( /** @type {olx.style.IconOptions} */ ({
                anchor: [0.5, 40],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                scale: 0.8,
                src: API_23D + '/static/images/marker-gold.png'
            }))
        }));

    }

    //添加feature
    this.markersLayer.getSource().addFeature(feature);

    return feature;
};

/**
 * 添加弹出窗口
 * @param {*} popup 
 */
BigMap.prototype.addPopup = function (popup) {
    var _overlay = null;
    var _map = this.map;
    if (popup) {
        var p = this.popups.push(popup);
        if (p) {
            _overlay = _map.addOverlay(popup);
        }
    } else {
        console.error("popup 不能为空！");
    }
    return _overlay;
}

/**
 * 添加热力图数据
 * 
 * @param {any} feature 
 */
BigMap.prototype.addHeatmapData = function (feature) {
    this.heatmapLayer.getSource().addFeature(feature);
};

/**
 * 添加热力图数据数组
 * 
 * @param {any} features 
 */
BigMap.prototype.addHeatmapDatas = function (features) {
    this.heatmapLayer.getSource().addFeatures(features);
};

/**
 * 添加聚合数据
 * 
 * @param {any} feature 
 */
BigMap.prototype.addClusterData = function (feature) {
    this.clusterLayer.getSource().getSource().addFeature(feature);
};

/**
 * 添加聚合数据数组
 * 
 * @param [] features 
 */
BigMap.prototype.addClusterDatas = function (features) {
    this.clusterLayer.getSource().getSource().addFeatures(features);
};

/**
 * 删除 信息框,如果删除成功则返回被删除的popup
 * @param {*} popup 
 */
BigMap.prototype.removePopup = function (popup) {
    var p = this.popups.remove(popup);
    return this.map.removeOverlay(p);
}

/**
 * 清理标记图层
 * 
 */
BigMap.prototype.cleanMarkers = function () {
    this.markersLayer.getSource().clear();
};

/**
 * 清理热力图层
 * 
 */
BigMap.prototype.cleanHeatmapLayer = function () {
    this.heatmapLayer.getSource().clear();
};

/**
 * 清理动态聚合图层
 * 
 */
BigMap.prototype.cleanClusterLayer = function () {
    this.clusterLayer.getSource().clear();
};

/**
 * 清理矢量绘制图层数据
 */
BigMap.prototype.cleanVectorLayer = function () {
    this.vectorLayer.getSource().clear();
}

/**
 * 清理量算图层
 * 
 */
BigMap.prototype.cleanMesureLayer = function () {
    this.mesureLayer.getSource().clear();
};

//TODO 清理地图
BigMap.prototype.cleanMap = function () {
    //TODO 清除所有矢量图层的数据
};

/**
 * 获取标记图层
 * 
 * @returns {ol.layer.Vector} 矢量图层
 */
BigMap.prototype.getMarkersLayer = function () {
    return this.markersLayer;
};

/**
 * 获取热力图层
 * 
 * @returns {ol.layer.Vector} 矢量图层
 */
BigMap.prototype.getHeatmapLayer = function () {
    return this.heatmapLayer;
};

/**
 * 获取动态聚合图层
 * 
 * @returns 
 */
BigMap.prototype.getClusterLayer = function () {
    return this.clusterLayer;
};

/**
 * 获取量算图层
 * 
 * @returns {ol.layer.Vector} 矢量图层
 */
BigMap.prototype.getMeasureLayer = function () {
    return this.mesureLayer;
};

/**
 * 获取矢量绘制图层
 */
BigMap.prototype.getVectorLayer = function () {
    return this.vectorLayer;
}

/**
 * 获取地图对象
 * @return {ol.Map} 地图对象
 */
BigMap.prototype.getMap = function () {
    return this.map;
};

/**
 * 获取3D 地图对象
 * @returns {olcs.OLCesium}
 */
BigMap.prototype.getOL3D = function () {
    return this.ol3d;
};

/**
 * 设置缩放层级
 * 
 * @param {any} zoom 
 */
BigMap.prototype.setZoom = function (zoom) {
    this.map.getView().setZoom(zoom);
};

/**
 * 设置地图中心点
 * 
 * @param {any} center 
 */
BigMap.prototype.setCenter = function (center) {
    this.map.getView().setCenter(center);
};

/**
 * 启用marker和弹出框
 * 
 */
BigMap.prototype.enableMarkerPopup = function () {
    var _map = this.map;
    var _popup = this.popup;
    var _lastSelectedFeature = this.lastSelectedFeature;
    this.map.on('pointermove', function (e) {
        var pixel = _map.getEventPixel(e.originalEvent);
        var hit = _map.hasFeatureAtPixel(pixel);
        _map.getTarget().style.cursor = hit ? 'pointer' : '';
        //如果最后一次选择的marker不为空，则变回原样
        if (_lastSelectedFeature) {
            _lastSelectedFeature.getStyle().getImage().setScale(0.8);
            _lastSelectedFeature.changed();
        }

        if (hit) {
            var f = _map.forEachFeatureAtPixel(e.pixel, function (feature) {
                return feature;
            });

            if (f.get("type") === 'icon') {
                f.getStyle().getImage().setScale(1);
                f.changed();
                _lastSelectedFeature = f;
            }

        }

    });

    this.map.on('click', function (e) {
        var feature = _map.forEachFeatureAtPixel(e.pixel, function (feature) {
            return feature;
        });

        if (feature) {
            var geom = feature.getGeometry();
            var coordinates;
            if (geom instanceof ol.geom.Circle) {
                coordinates = geom.getCenter();
                _popup.setOffset([0, 0]);
            } else if (geom instanceof ol.geom.Point) {
                coordinates = geom.getCoordinates();
                _popup.setOffset([1.2, -20]);
            } else {
                coordinates = e.coordinate;
                _popup.setOffset([0, 0]);
            }

            var content = feature.get("content");
            if (content) {
                _popup.show(coordinates, content);
            }

        } else {
            _popup.hide();
        }

    });
};