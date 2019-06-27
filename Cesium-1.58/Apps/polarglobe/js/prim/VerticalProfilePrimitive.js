/////////////////////////////////////////////////////////
//INITIALIZED BY FENG & SIZHE @ 2015
//
//2ND EDITTING BY SIZHE, LAST UPDATE @ MAR. 1ST, 2017
/////////////////////////////////////////////////////////

Cesium.VerticalProfilePrimitive = function () {
	var PGPrimitive = Cesium.PGPrimitive;
	var BoundingSphere = Cesium.BoundingSphere;
	var Cartesian3 = Cesium.Cartesian3;
	var combine = Cesium.combine;
	var defaultValue = Cesium.defaultValue;
	var defined = Cesium.defined;
	var destroyObject = Cesium.destroyObject;
	var Matrix4 = Cesium.Matrix4;
	var VertexFormat = Cesium.VertexFormat;
	var BufferUsage = Cesium.BufferUsage;
	var DrawCommand = Cesium.DrawCommand;
	var ShaderSource = Cesium.ShaderSource;
	var BlendingState = Cesium.BlendingState;
	var Material = Cesium.Material;
	var Pass = Cesium.Pass;
	var SceneMode = Cesium.SceneMode;

	var RenderState = Cesium.RenderState;
	var ShaderProgram = Cesium.ShaderProgram;
	var Buffer = Cesium.Buffer;
	var VertexArray = Cesium.VertexArray;
	var IndexDatatype = Cesium.IndexDatatype;
	var Texture = Cesium.Texture;
	var TextureWrap = Cesium.TextureWrap;
	var TextureMinificationFilter = Cesium.TextureMinificationFilter;
	var TextureMagnificationFilter = Cesium.TextureMagnificationFilter;
	var Sampler = Cesium.Sampler;

	var _shader = Utils.loadFile("./shader/vertical.glsl");

    var _vp_pts =  null;
    var _vp_handler = null;
    var vPolylines = null;
	var pickHandler = null;

	var VerticalProfilePrimitive = function(options) {
		this._va = undefined;
		this._sp = undefined;
		this._sp_pv = undefined;
		this._sp_pl = undefined;
		this._cmd_pv = undefined;
		this._cmd_pl = undefined;
		this._cmd_draw = undefined;

		this._pl_value_tex = undefined;
		this._pv_value_tex = undefined;
		this._pv_height_tex = undefined;
		this._pv_offset_tex = undefined;
		
		this._pickHeight = NaN;
		this._pickOffset = NaN;
		this._selectedHeight = this._pickHeight;
		this._selectedOffset = this._pickOffset;
		
		this._ctrlPts = undefined;
		this._vp_k = 0;
		this._vp_offset = {x: 0, y: 0};
		this._vp_offset_range = [0, 0];

		PGPrimitive.call(this, options);
	}
	VerticalProfilePrimitive.prototype = new PGPrimitive();
	VerticalProfilePrimitive.prototype.constructor = VerticalProfilePrimitive;

	VerticalProfilePrimitive.prototype.initialize = function(context, options) {
		var prim = this;

        this._vp_supported = true;
		this._is_charting = true;
        this.horizontalPickSamples = defaultValue(options.nHPickSamples, 50);
		
		this._uniforms.uHLineHeight = function () {
			var height = prim._pickHeight || prim._selectedHeight;
			return isNaN(height) || !window._val_picking ? -1 : height;
		};
		this._uniforms.uNHSamples = function () {
			return prim.horizontalPickSamples;
		};

        var _pl_w = 1000;
        var _pl_h = 1;
        this._pl_value_tex = new Texture({
            context : context,
            width : _pl_w,
            height : _pl_h,
        });

		this._sp = ShaderProgram.replaceCache({
			context : context,
			shaderProgram : this._sp,
			vertexShaderSource : new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_DRAW_', '_VS_']
			}),
			fragmentShaderSource : new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_DRAW_', '_FS_']
			}),
			attributeLocations : {
				position : 0,
				texcoords : 1
			}
		});
		this._sp_pv = ShaderProgram.replaceCache({
			context : context,
			shaderProgram : this._sp_pv,
			vertexShaderSource : new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_PICK_VAL_', '_VS_']
			}),
			fragmentShaderSource : new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_PICK_VAL_', '_FS_']
			}),
			attributeLocations : {
				position : 0,
				texcoords : 1
			}
		});
		this._sp_pl = ShaderProgram.replaceCache({
			context : context,
			shaderProgram : this._sp_pl,
			vertexShaderSource : new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_PICK_LINE_', '_VS_']
			}),
			fragmentShaderSource : new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_PICK_LINE_', '_FS_']
			}),
			attributeLocations : {
				position : 0,
				texcoords : 1
			}
		});

		var _rs = RenderState.fromCache({
			depthTest : { enabled : true },
		});
        this._cmd_pv = new Cesium.ComputeCommand({
            shaderProgram: this._sp_pv,
            uniformMap: this._uniforms,
            persists: true,
            postExecute: function(out) {
                this.rawpick = out[0].getPixel(this._cx, this._cy); 
                this.pickvalue = Utils.clr2val(
                    this.rawpick, 
                    prim.valueFilter.vmin, 
                    prim.valueFilter.vmax
                );

				this.rawpick_height = out[1].getPixel(this._cx, this._cy);
                prim._pickHeight = Utils.clr2int24(this.rawpick_height); 

				this.rawpick_offset = out[2].getPixel(this._cx, this._cy);
                prim._pickOffset = Utils.clr2int24(this.rawpick_offset) / 65536; 
            }
        });

        this._cmd_pl = new Cesium.ComputeCommand({
            shaderProgram: this._sp_pl,
            uniformMap: this._uniforms,
            outputTexture: this._pl_value_tex,
            persists: true,
            postExecute: function(out) {
                var rawpick = out.getPixel(0, 0, _pl_w, _pl_h);
                this.values = Utils.sampleValuesFromRGBAArray(
                    rawpick, 
                    prim.horizontalPickSamples,
                    prim.valueFilter.vmin, 
                    prim.valueFilter.vmax
                );
            }
        });
		this._cmd_draw = new DrawCommand({
            owner: prim,
        	renderState: _rs,
			vertexArray: prim._va, 
        	shaderProgram: prim._sp,
        	uniformMap: prim._uniforms,
        	primitiveType: Cesium.PrimitiveType.TRIANGLES,
			pass: Pass.OPAQUE,
        });

        pickHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
		pickHandler.setInputAction(function(movement) {
            if (!prim.show || !window._val_picking || isNaN(prim._pickHeight) || isNaN(prim._pickOffset))
				return;
			prim._selectedHeight = prim._pickHeight;
			prim._selectedOffset = prim._pickOffset;
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
	}

	function getHeightAndUVW(cartographicPt, levelNum) {
    	var lat = Math.degrees(cartographicPt.latitude);
    	var lng = Math.degrees(cartographicPt.longitude);
		var xy = Utils.latlng2grid(lng, lat);

		var uvHeightW = [];
		uvHeightW.push(xy[0] / 359);
		uvHeightW.push(xy[1] / 359);

    	var heightW = [];
    	for(var i = 0; i < levelNum; i++) {
			heightW.push(this._heights[i]);
			heightW.push(i * 1.0);
    	}

		uvHeightW.push(heightW);

		return uvHeightW;
	}

	function init_va(prim, context) {
        var numRow = 25;
		var granularity = defaultValue(granularity, Math.PI/720.0);
		var ellipsoid = defaultValue(ellipsoid, Cesium.Ellipsoid.WGS84);
		var maximumHeights = [];
		var minimumHeights = [];
		for(var i in prim._ctrlPts){
			maximumHeights.push(50000.0);
			minimumHeights.push(10000.0);
		}
		
		var pts = prim._ctrlPts.map(function(x) { 
			return Utils.grid2latlng(
				x[0] + prim._vp_offset.x,
				x[1] + prim._vp_offset.y
			);
		});
		pts = pts.reduce(function(a, b) { return a.concat(b); });
		pts = Cesium.Cartesian3.fromDegreesArray(pts);

		var interPos = Cesium.WallGeometryLibrary.computePositions(
			ellipsoid, pts, 
			maximumHeights, minimumHeights, 
			granularity, true
		);
		var topPos = interPos.topPositions;
		var cartesianPos = [];
		for(var i = 0;i< topPos.length/3;i++){
			cartesianPos[i] = new Cartesian3(topPos[3*i],topPos[3*i+1],topPos[3*i+2]);
		}
		var cartoPositions = ellipsoid.cartesianArrayToCartographicArray(cartesianPos);

		var UVs = [];
		var positionsBuffer = [];
		var textureSize = 1800;
	  	for(var i = 0; i < cartoPositions.length; i++) {
			var uvHeightW = getHeightAndUVW.call(prim, cartoPositions[i], numRow);
			var xoffset = uvHeightW[0];
			var yoffset = uvHeightW[1];
			var heightW = uvHeightW[2];

			for(var j = 0; j < heightW.length; j = j + 2) {
				var sphe  = cartoPositions[i];
				//sphe.height = heightW[j] * prim.wallHeight;
	  			//var spheC = ellipsoid.cartographicToCartesian(sphe);

				positionsBuffer.push(sphe.longitude);
				positionsBuffer.push(sphe.latitude);
				positionsBuffer.push(heightW[j]);
                positionsBuffer.push(i / (cartoPositions.length - 1));

				var ratio = 360 / textureSize;
				var u = (xoffset + (heightW[j + 1] % 5)) * ratio;
				var v = (yoffset + ~~(heightW[j + 1] / 5)) * ratio;
				UVs.push(u);
				UVs.push(v);
			}			
	  	}

		var numVertices = positionsBuffer.length / 4;
    	var numCol = numVertices / numRow;
    	var indices = new Array((numRow - 1) * (numCol - 1) * 6);
    	var edgeIndex = 0;
    	for(var i = 0; i < numCol - 1; i++)	{
    		for(var j = 0; j < numRow - 1; j++)	{
    			var LL = i * numRow + j;
    			var LR = (i+1) * numRow + j;
    			var UL  = i * numRow + j+1;
    			var UR = (i+1) * numRow +j +1;
    
    			//anti-clockwise 
    			indices[edgeIndex++] = LL;		
    			indices[edgeIndex++] = UR;		
    			indices[edgeIndex++] = UL;
    			indices[edgeIndex++] = UR;		
    			indices[edgeIndex++] = LL;		
    			indices[edgeIndex++] = LR;
    		}
    	}

		var vertexBuffer = Buffer.createVertexBuffer({
			context: context,
			typedArray: new Float32Array(positionsBuffer), 
			usage: Cesium.BufferUsage.STATIC_DRAW
		});
		var texcoordBuffer = Buffer.createVertexBuffer({
			context: context,
			typedArray: new Float32Array(UVs), 
			usage: Cesium.BufferUsage.STATIC_DRAW
		});
		var attributes = [
		{
			index : 0,
			enabled : true,
			vertexBuffer : vertexBuffer,
			componentsPerAttribute : 4,
			componentDatatype : Cesium.ComponentDatatype.FLOAT,
			normalize : false,
			offsetInBytes : 0,
			strideInBytes : 0
		}, {
			index : 1,
			enabled : true,
			vertexBuffer: texcoordBuffer,
			componentsPerAttribute : 2,
			componentDatatype :	Cesium.ComponentDatatype.FLOAT,
			normalize : false,
			offsetInBytes : 0,
			strideInBytes : 0
		}];

		var indexBuffer = Buffer.createIndexBuffer({
			context: context,
			typedArray: new Uint16Array(indices), 
			usage: Cesium.BufferUsage.STATIC_DRAW,
			indexDatatype : IndexDatatype.UNSIGNED_SHORT
		});
		var vertexInfo = new VertexArray({
			context : context,
			attributes: attributes,
			indexBuffer: indexBuffer
		});

		vertexBuffer && vertexBuffer.destroy();
		texcoordBuffer && texcoordBuffer.destroy();
		indexBuffer && indexBuffer.destroy();
		
		return vertexInfo;
	}

    function pickValue(prim, context) {
        if (!window._val_picking)
            return;
        
		prim._cmd_pv._cx = cursorX;
		prim._cmd_pv._cy = cursorY;
        prim._cmd_pv.vertexArray = prim._va;
        prim._cmd_pv.outputTexture = [
			prim._pv_value_tex, 
			prim._pv_height_tex, 
			prim._pv_offset_tex,
		];
        prim._cmd_pv.execute(scene._computeEngine);
        updateValuePicking(prim._cmd_pv.pickvalue);
    }

   function pickLine(prim, context) {
        if (!window._val_picking) {
			prim._selectedHeight = NaN;
			prim._selectedOffset = NaN;
            return;
		}
		
        prim._cmd_pl.vertexArray = prim._va;
        prim._cmd_pl.execute(scene._computeEngine);
        updateHLinePickValues(prim._cmd_pl.values, prim._pickOffset || prim._selectedOffset);
    }

    VerticalProfilePrimitive.prototype.onResize = function(context, width, height) {
		var tex = [
			'_pv_value_tex',
			'_pv_offset_tex',
			'_pv_height_tex',
		];
		for (var i in tex) {
			this[tex[i]] && this[tex[i]].destroy();
			this[tex[i]] = new Texture({
				context : context,
				width : width,
				height : height,
			});
		}
    }

	VerticalProfilePrimitive.prototype.render = function(context, cmdlist) {
		if(this._ctrlPts === undefined)
			return;

		if(this._va === undefined) 
			this._cmd_draw.vertexArray = this._va = init_va(this, context);

		pickValue(this, context);
		pickLine(this, context);
		cmdlist.push(this._cmd_draw);
	}

	VerticalProfilePrimitive.prototype.dispose = function() {
        this._va = this._va && this._va.destroy();
        this._sp = this._sp && this._sp.destroy();
        this._sp_pv = this._sp_pv && this._sp_pv.destroy();
        this._sp_pl = this._sp_pl && this._sp_pl.destroy();
        this._pv_value_tex = this._pv_value_tex && this._pv_value_tex.destroy();
        this._pv_offset_tex = this._pv_offset_tex && this._pv_offset_tex.destroy();
        this._pv_height_tex = this._pv_height_tex && this._pv_height_tex.destroy();
        this._pl_value_tex = this._pl_value_tex && this._pl_value_tex.destroy();
        pickHandler = pickHandler && pickHandler.destroy();
	}

	VerticalProfilePrimitive.prototype.save = function(obj) {
		PGPrimitive.prototype.save.call(this, obj);

		obj.vertical_opt = {
			heightMag: this.heightMag,
			offset: this._vp_offset,
			offrange: this._vp_offset_range,
			ctrlPts: this._ctrlPts,
		};
	};

	VerticalProfilePrimitive.prototype.load = function(obj) {
		PGPrimitive.prototype.load.call(this, obj);
		
		var options = obj.vertical_opt;
		this._va = this._va && this._va.destroy();
		this._ctrlPts = options.ctrlPts;
		this._vp_offset = options.offset;
		this._vp_offset_range = options.offrange;
		this.heightMag = options.heightMag;
		this.onAdjust(this.heightMag, this._vp_offset_range);
	};
	
	VerticalProfilePrimitive.prototype.onAdjust = function(heightMag, offrange) {
		//callback
	}

	VerticalProfilePrimitive.prototype.updateGeometry = function(options){
		if (!options)
			return;
		if (options.heightMag && typeof(options.heightMag) === 'number') {
			this.heightMag = options.heightMag;
		}
		if (options.wallOffset && typeof(options.wallOffset) === 'number') {
			var ol, k = this._vp_k;
			ol = Math.max(this._vp_offset_range[0], options.wallOffset);
			ol = Math.min(this._vp_offset_range[1], options.wallOffset);

			this._vp_offset.x = ol * Math.sqrt(1 / (1 + k * k));
			this._vp_offset.y = ol * Math.sqrt(k * k / (1 + k * k)) * (k < 0 ? -1 : 1);

	        this._va = this._va && this._va.destroy();
		}
	}

    VerticalProfilePrimitive.prototype.startDraw = function() {
        _vp_destroy();
        this._vp_clear();
        _vp_pts = new Array();
        var ellipsoid = scene.globe.ellipsoid;

        vPolylines = new Cesium.PolylineCollection();
        var path = vPolylines.add({
            //positions : Cesium.Cartesian3.fromDegreesArray([0,89,-43,55]),
            material : Cesium.Material.fromType(Cesium.Material.PolylineGlowType, {
                innerWidth : 3.0,
                color : new Cesium.Color(1.0, 0.5, 0.0, 1.0)
            }),
            width : 6.0
        });
        defPrim.add(vPolylines);

        // Mouse over the globe to see the cartographic position
        _vp_handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        _vp_handler.setInputAction(function(movement) {
            var cartesian = scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
            if (cartesian) {
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
				var lat = Math.degrees(cartographic.latitude);
				var lng = Math.degrees(cartographic.longitude);
				var outOfRange = Utils.latlng2grid(lng, lat)[2];
				updatePositionSelecting(outOfRange ? [] : [lat, lng]);
            } else {
				updatePositionSelecting(null);
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _vp_handler.setInputAction(function(movement) {
            var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
            if (cartesian) {
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
				var lat = Math.degrees(cartographic.latitude);
				var lng = Math.degrees(cartographic.longitude);
				var outOfRange = Utils.latlng2grid(lng, lat)[2];
				if (!outOfRange) {
					_vp_pts.push(lng);
					_vp_pts.push(lat);
					path.positions = Cesium.Cartesian3.fromDegreesArray(_vp_pts);
				}
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    }

    VerticalProfilePrimitive.prototype.endDraw = function(h) {
        _vp_handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        _vp_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);

		this._ctrlPts = [];
		for (var i = 0; i < _vp_pts.length; i += 2)
			this._ctrlPts.push(Utils.latlng2grid(_vp_pts[i], _vp_pts[i + 1]));
		
		var xy1 = this._ctrlPts[0];
		var xy2 = this._ctrlPts[this._ctrlPts.length - 1];
		var x1 = xy1[0], y1 = xy1[1];
		var x2 = xy2[0], y2 = xy2[1];
		var k = this._vp_k = Math.abs(x1 - x2) > Math.abs(y1 - y2) * 1e5 ? 
			Math.sign(-(x1 - x2) * (y1 - y2)) * 1e5 :
			- (x1 - x2) / (y1 - y2);

		var offsets = this._ctrlPts.map(function(a) { return computeOffsetRange(a[0], a[1], k); });
		this._vp_offset_range = [
			offsets.reduce(function(a, b) { return [Math.max(a[0], b[0]), 0]; })[0],
			offsets.reduce(function(a, b) { return [0, Math.min(a[1], b[1])]; })[1],
		];

        _vp_destroy();
		this.onAdjust(this.heightMag, this._vp_offset_range);
    }

    VerticalProfilePrimitive.prototype.cancelDraw = function() {
        _vp_handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        _vp_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        _vp_destroy();
    }

    VerticalProfilePrimitive.prototype._vp_clear = function() {
        this._ctrlPts = undefined;
		this._vp_offset = {x: 0, y: 0};
		this._selectedHeight = NaN;
		this._selectedOffset = NaN;
        this._va = this._va && this._va.destroy();
    }

	function computeOffsetRange(_x, _y, k) {
		var x, y;
		var minx = 0, maxx = 359;
		var miny = 0, maxy = 359;
		var one_over_k = Math.abs(k) < 1e-5 ? (k < 0 ? -1e5 : 1e5) : 1 / k;

		x = minx;
		y = k * (x - _x) + _y;
		var dis_xmin = Math.distance(x, y, _x, _y);

		x = maxx;
		y = k * (x - _x) + _y;
		var dis_xmax = Math.distance(x, y, _x, _y);
			
		y = miny;
		x = one_over_k * (y - _y) + _x;
		var dis_ymin = Math.distance(x, y, _x, _y);
			
		y = maxy;
		x = one_over_k * (y - _y) + _x;
		var dis_ymax = Math.distance(x, y, _x, _y);
		
		return k < 0 ? 
			[-Math.min(dis_xmin, dis_ymax), Math.min(dis_xmax, dis_ymin)] :
			[-Math.min(dis_xmin, dis_ymin), Math.min(dis_xmax, dis_ymax)] ;
	}

    function _vp_destroy() {
        if (_vp_handler) {
            _vp_handler = _vp_handler && _vp_handler.destroy();
            _vp_handler = null;
        }
        if (vPolylines) {
            vPolylines.removeAll();
            defPrim.remove(vPolylines);
            vPolylines = null;
        }
		updatePositionSelecting(null);
    }

	return VerticalProfilePrimitive;
}();
