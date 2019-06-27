/////////////////////////////////////////////////////////
//INITIALIZED BY SIZHE @ FEB. 28TH, 2017 
//
//LAST EDITTING BY SIZHE @ FEB. 28TH, 2017
/////////////////////////////////////////////////////////

Cesium.PGPrimitive = function() {
	var defaultValue = Cesium.defaultValue;
	var Cartesian2 = Cesium.Cartesian2;
	var Cartesian3 = Cesium.Cartesian3;
	var Sampler = Cesium.Sampler;
	var Texture = Cesium.Texture;
	var TextureWrap = Cesium.TextureWrap;
	var TextureMinificationFilter = Cesium.TextureMinificationFilter;
	var TextureMagnificationFilter = Cesium.TextureMagnificationFilter;

    var _cvs_filter = null;
    var _ev_handler = null;
    var _box_coords = [];
	var _shader = Utils.loadFile("./shader/util.glsl");

    var PGPrimitive = function(options) {  
		this._inited = false;
		this._data_tex = undefined;
		this._mask_tex = undefined;
		this.czm_w = 0;
		this.czm_h = 0;

        this._vp_supported = false;
		this._is_charting = false;
        this._is_sFilter = false;
		this._sFilter_name = undefined;

        this._util_shader = _shader;

		if (options)
			init(this, scene.context, options);
	};

	function init(prim, context, options) {
		if (prim._inited)
			return;

		prim._heights = [
			114.70226, 316.00092, 521.47827, 731.59033, 946.74554, 1167.2693, 1393.5048, 1625.7402, 
			1864.2783, 2109.4243, 2361.5364, 2620.8948, 2887.8713, 3163.1270, 3446.8784, 3739.8081, 
			4042.7754, 4355.9395, 4680.5977, 5017.6216, 5367.3184, 6111.9146, 6924.9897, 7823.8384, 
			8834.7783, 10005.090, 11425.004, 13264.112, 15848.298
		];
		prim._pres = [
			'1000hPa', ' 975hPa', ' 950hPa', ' 925hPa', ' 900hPa', ' 875hPa', ' 850hPa', ' 825hPa', 
			' 800hPa', ' 775hPa', ' 750hPa', ' 725hPa', ' 700hPa', ' 675hPa', ' 650hPa', ' 625hPa', 
			' 600hPa', ' 575hPa', ' 550hPa', ' 525hPa', ' 500hPa', ' 450hPa', ' 400hPa', ' 350hPa', 
			' 300hPa', ' 250hPa', ' 200hPa', ' 150hPa', ' 100hPa',
		];
		
		prim.data = defaultValue(options.data, null);
        prim.show = defaultValue(options.show, true);
        prim.layerNum = defaultValue(options.layerNum, {from: 1, to: 10});
        prim.heightMag = defaultValue(options.heightMag, 200);
		prim.spatialFilter = defaultValue(options.spatialFilter, 'None');
        prim.initMaskTex = defaultValue(options.initMaskTex, false);
        
        prim.valueFilter = defaultValue(options.valueFilter, {});
        prim.valueFilter.enabled = defaultValue(prim.valueFilter.enabled, false);
        prim.valueFilter.vmin = defaultValue(prim.valueFilter.vmin, 0);
        prim.valueFilter.vmax = defaultValue(prim.valueFilter.vmax, 1);
        prim.valueFilter.from = defaultValue(prim.valueFilter.from, prim.valueFilter.vmin);
        prim.valueFilter.to = defaultValue(prim.valueFilter.to, prim.valueFilter.vmax);
		prim.valueFilter.nlt_min = MD.__VECFN(prim.valueFilter.vmin);
		prim.valueFilter.nlt_max = MD.__VECFN(prim.valueFilter.vmax);
		prim.valueDecoder = MD.__VDCFN;

		prim.setColorScheme(options.colorScheme);

		prim._uniforms = {
            uEyePos: function () {
                return scene.camera.position;
            },
            uEyeHeight: function () {
				return scene.camera.positionCartographic.height;
            },
            uSunlight: function () {
                return scene.isSunlightEnabled();    
            },

            uNColorScheme: function () {
                return prim.colorScheme.length; 
            },
            uColorScheme: function () {
                return prim.colorScheme;
            },
            uGradPos: function() {
                return prim.legendGradPos;
            },

			uHeights: function() {
				return prim._heights;
			},
            uHeightMag: function () {
                return prim.heightMag;
            },
			uHeightRange: function() {
				var min = prim._heights[prim.layerNum.from - 1];
				var max = prim._heights[prim.layerNum.to   - 1];
				return new Cartesian2(min, max);
			},

			uDataTex: function () {
				return prim._data_tex;
			},
            uIsMask: function () {
                return prim._is_sFilter;
            },
            uMaskTex: function () {
                return prim._mask_tex;    
            },
            uIsFilter: function () {
                return prim.valueFilter.enabled;
            },
			uFilterRange: function () {
                var vf = prim.valueFilter;
                var min = (vf.from - vf.vmin) / (vf.vmax - vf.vmin); 
                var max = (vf.to - vf.vmin) / (vf.vmax - vf.vmin); 
                return new Cesium.Cartesian2(min, max);
            },
			u_min_range_ultmin_ultrange: function () {
                var vf = prim.valueFilter;
				return new Cesium.Cartesian4(
					vf.vmin, vf.vmax - vf.vmin, 
					vf.nlt_min, vf.nlt_max - vf.nlt_min
				);
			},
		}
		
		prim._data_tex = new Texture({
			context: context,
			width: 1,
			height: 1,
			flipY: false,
			sampler: new Sampler({
				minificationFilter : TextureMinificationFilter.LINEAR,
				magnificationFilter : TextureMagnificationFilter.LINEAR,
				wrapS: TextureWrap.CLAMP_TO_EDGE,
				wrapT: TextureWrap.CLAMP_TO_EDGE,
			}),
		});
		
		if (options.initMaskTex) {
			prim._mask_tex = new Texture({
				context: context,
				width: 1,
				height: 1,
				flipY: false,
				sampler: new Sampler({
					minificationFilter : TextureMinificationFilter.LINEAR,
					magnificationFilter : TextureMagnificationFilter.LINEAR,
				}),
			});
		}

		prim.initialize(context, options);

		prim._inited = true;
	}

	PGPrimitive.prototype.initialize = function(context, options) { }
	PGPrimitive.prototype.render = function(context, cmdlist) { }
	PGPrimitive.prototype.onDataReady = function(context) { }
	PGPrimitive.prototype.onResize = function(context, width, height) { }
	PGPrimitive.prototype.dispose = function() { }
	PGPrimitive.prototype.onAdjust = function() { }

	PGPrimitive.prototype.save = function(obj) { 
		if (!obj.legend) {
			obj.legend = {
				color: this.legendCodes.map(function(x) { return x.substr(1) }),
				pos: this.legendGradPos,
			};
		}
		if (!obj.vFilter) {
			obj.vFilter = {
				enabled: this.valueFilter.enabled,
				from: this.valueFilter.from,
				to: this.valueFilter.to,
			}
		}
		if (!obj.sFilter) {
			obj.sFilter = {
				isFilter: this._is_sFilter,
				filterName: this._sFilter_name,
			}
		}
	};
	PGPrimitive.prototype.load = function(obj) { 
		this.setValueFilter(obj.vFilter.enabled, obj.vFilter);
		this.setSpatialFilter(obj.sFilter);
		this.setColorScheme(Utils.clr2arr(obj.legend.color));
		this.legendGradPos = obj.legend.pos;
	};

	PGPrimitive.prototype.sync = function(prim) {
		this.colorScheme = prim.colorScheme;
		this.legendCodes = prim.legendCodes;
        this.legendGradPos = prim.legendGradPos;

		this.setValueFilter(prim.valueFilter.enabled, prim.valueFilter);
		this.setSpatialFilter({isFilter: prim._is_sFilter, filterName: prim._sFilter_name});
	}
    PGPrimitive.prototype.update = function(frameState) {
		var context = frameState.context;
		var commandList = frameState.commandList;

        if (!this.show || (frameState.mode !== Cesium.SceneMode.SCENE3D)) 
            return;

        if (this.data._ready) {
            this.data.removeAttribute('loading');    
        } else {
            this.data.setAttribute('loading', '');
            return;    
        }

        if (this.data.id == 'vdata') {
            if(!this._data_tex.updateTexture(this.data))
                return;
        } else {
            if (!this.data._gpu_cached) {
                this._data_tex.updateTexture(this.data);
                this.data._gpu_cached = true;
                this.onDataReady(context);
            }  
        }

		if (this.czm_w != context.drawingBufferWidth || this.czm_h != context.drawingBufferHeight) {
			this.czm_w = context.drawingBufferWidth;
			this.czm_h = context.drawingBufferHeight;

			this.onResize(context, this.czm_w, this.czm_h);
		}

		this.render(context, commandList);
    };

    PGPrimitive.prototype.destroy = function() {
        this._data_tex = this._data_tex && this._data_tex.destroy();
        this._mask_tex = this._mask_tex && this._mask_tex.destroy();

		this.dispose();

        return destroyObject(this);
    };

    PGPrimitive.prototype.isDestroyed = function() {
        return false;
    };

    PGPrimitive.prototype.setVisible = function(showed) {
        this.show = showed;
        if (!showed)
            this.data._gpu_cached = false;
    }
	PGPrimitive.prototype.setColorScheme = function(arr) {
		if (!arr || !arr.length || arr.length < 6)
			arr = [
				0, 0, 1,
				1, 1, 0,
				1, 0, 0,
			];

		this.colorScheme = [];
		this.legendCodes = [];
        this.legendGradPos = [];

        var step = 1 / (~~(arr.length / 3) - 1);
        
		for (var i = 0; i < arr.length; i+=3) {
			this.colorScheme.push(new Cartesian3(arr[i], arr[i + 1], arr[i + 2]));

			var c = 1 << 24;
			for (var k = 2, b = 0; k > -1; k--, b+=8)
				c += ~~(255 * arr[i + k]) << b;
			this.legendCodes.push('#' + c.toString(16).substr(1));
            this.legendGradPos.push(i / 3 * step);
		}
	}
    PGPrimitive.prototype.setSpatialFilter = function(options) {
        if (!options)
            return;

        _box_coords = [];
        _ev_handler = _ev_handler && _ev_handler.destroy();
        updatePositionSelecting(null);

        this._is_sFilter = options.isFilter && (this._sFilter_name = options.filterName) !== undefined;
		if (!this._is_sFilter || !this._mask_tex)
			return;

        if (options.filterName == 'Draw Box') {
            var c = _cvs_filter = _cvs_filter || document.createElement('canvas');
			var ctx = c.getContext('2d');
			c.width = 1024;
			c.height = 1024;
			ctx.clearRect(0, 0, c.width, c.height);	
			this._mask_tex.updateTexture(c); 

            var mask_tex = this._mask_tex;
            var ellipsoid = scene.globe.ellipsoid;
            _ev_handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

            _ev_handler.setInputAction(function(movement) {
                var cartesian = scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                if (cartesian) {
                    var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                    var lat = Math.degrees(cartographic.latitude);
                    var lng = Math.degrees(cartographic.longitude);
                    var gpos = Utils.latlng2grid(lng, lat);
                    updatePositionSelecting(gpos[2] ? [] : [lat, lng]);

                    if (_box_coords.length > 0) {
                        var r = 1023/359;
                        var x = _box_coords[0].x;   
                        var y = _box_coords[0].y;
                        var w = gpos[0] - x;   
                        var h = gpos[1] - y;   
                        ctx.clearRect(0, 0, c.width, c.height);	
                        ctx.fillRect(x*r, y*r, w*r, h*r);
                        mask_tex.updateTexture(c); 
                    }
                } else {
                    updatePositionSelecting(null);
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            _ev_handler.setInputAction(function(movement) {
                var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
                if (cartesian) {
                    var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                    var lat = Math.degrees(cartographic.latitude);
                    var lng = Math.degrees(cartographic.longitude);
                    var gpos = Utils.latlng2grid(lng, lat);
                    if (!gpos[2]) {
                        _box_coords.push({x: gpos[0], y: gpos[1]}) 
                    }
                    if (_box_coords.length == 2) {
                        _box_coords = [];
                        _ev_handler = _ev_handler && _ev_handler.destroy();
                        updatePositionSelecting(null);
                    }
                }
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

            return;
        } 

		var img = new Image();
		img.height = 1024;
		img.width = 1024;
		img.prim = this;
		img.src = 'svg/' + this._sFilter_name + '.svg';
		img.onload = function () {
			var c = _cvs_filter = _cvs_filter || document.createElement('canvas');
			var ctx = c.getContext('2d');
			c.width = this.width;
			c.height = this.height;
			ctx.clearRect(0, 0, c.width, c.height);	
			ctx.drawImage(this, 0, 0, this.width, this.height);	
			this.prim._mask_tex.updateTexture(c);
		};
    }
	PGPrimitive.prototype.getSpatialFilterName = function(options) {
		return this._is_sFilter ? this._sFilter_name : undefined;
	}
    PGPrimitive.prototype.setValueFilter = function(enabled, range) {
        this.valueFilter.enabled = enabled;
        if (enabled && range) {
            this.valueFilter.from = range.from;
            this.valueFilter.to = range.to;
        }
    }

    return PGPrimitive;
} ();
