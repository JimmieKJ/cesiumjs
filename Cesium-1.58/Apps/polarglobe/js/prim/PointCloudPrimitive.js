/////////////////////////////////////////////////////////
//INITIALIZED BY SIZHE @ NOV. 5TH, 2015
//
//LAST EDITTING BY SIZHE @ Mar. 1ST, 2017
/////////////////////////////////////////////////////////

Cesium.PointCloudPrimitive = function() {
	var PGPrimitive = Cesium.PGPrimitive;
	var BoundingSphere = Cesium.BoundingSphere;
	var Cartesian3 = Cesium.Cartesian3;
	var defaultValue = Cesium.defaultValue;
	var BufferUsage = Cesium.BufferUsage;
	var DrawCommand = Cesium.DrawCommand;
	var ShaderSource = Cesium.ShaderSource;
	var BlendFunction = Cesium.BlendFunction;
	var Buffer = Cesium.Buffer;
	var VertexArray = Cesium.VertexArray;
	var RenderState = Cesium.RenderState;
	var ShaderProgram = Cesium.ShaderProgram;
	var Texture = Cesium.Texture;
	var Sampler = Cesium.Sampler;
	var TextureMinificationFilter = Cesium.TextureMinificationFilter;
	var TextureMagnificationFilter = Cesium.TextureMagnificationFilter;
	var Pass = Cesium.Pass;

	var _shader = Utils.loadFile("./shader/pointcloud.glsl");

    var PointCloudPrimitive = function(options) {
		this._grid = undefined;
        this._sp = undefined;
        this._va = undefined;
		this._cmd_draw = undefined;
		this._point_tex = undefined;

		options.initMaskTex = true;
		PGPrimitive.call(this, options);
    };

	PointCloudPrimitive.prototype = new PGPrimitive();
	PointCloudPrimitive.prototype.constructor = PointCloudPrimitive;

	PointCloudPrimitive.prototype.initialize = function(context, options) {
		var prim = this;

		this.pointSize = defaultValue(options.pointSize, 1);
		this.pointImage = defaultValue(options.pointImage, Utils.createParticle(128, .5));

		prim._uniforms.uPointSize = function () {
			var from = prim.layerNum.from;
			var to = prim.layerNum.to;
			var span = to - from + 1;
			return prim.pointSize * Math.sqrt(5 / span);
		};
		prim._uniforms.uPointTex = function () {
			return prim._point_tex;
		};

		prim._va = init_va(prim, context);
		prim._sp = ShaderProgram.replaceCache({
			context : context,
			shaderProgram : prim._sp,
			vertexShaderSource : new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_DRAW_', '_VS_']
			}),
			fragmentShaderSource : new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_DRAW_', '_FS_']
			}),
			attributeLocations : {
				aPosition: 0,
				aTexture: 1,
			}
		});

		var _rs = RenderState.fromCache({
			depthTest : {
				enabled : true
			},
			depthMask: false,
			blending: {
				enabled: true,
				functionSourceRgb : BlendFunction.SOURCE_ALPHA,
				functionSourceAlpha : BlendFunction.SOURCE_ALPHA,
				functionDestinationRgb : BlendFunction.ONE_MINUS_SOURCE_ALPHA,
				functionDestinationAlpha : BlendFunction.ONE_MINUS_SOURCE_ALPHA					
			}
		});

		var _bs = new BoundingSphere(Cartesian3.ZERO, 1e9);

		prim._cmd_draw = new DrawCommand({
            owner: prim,
        	renderState: _rs,
        	boundingVolume: _bs,
			vertexArray: prim._va,
        	shaderProgram: prim._sp,
        	uniformMap: prim._uniforms,
        	primitiveType: Cesium.PrimitiveType.POINTS,
			pass: Pass.TRANSLUCENT,
        });

		prim._point_tex = new Texture({
			context: context,
			source: prim.pointImage,
			flipY: false,
			sampler:  new Sampler({
				minificationFilter : TextureMinificationFilter.NEAREST,
				magnificationFilter : TextureMagnificationFilter.NEAREST
			}),
		});
	}

    function init_va(prim, context) {
		var arr, ai;
		var size = 360;
        var l_from = prim.layerNum.from;
        var l_to = prim.layerNum.to;
		var layers = l_to - l_from + 1;

		if(prim._grid === undefined) {
			var g = prim._grid = new Array(size * size * 2);
			
			var index = 0;
			for (var i = 0; i < size; i++) {
				for (var j = 0; j < size; j++) {
					var ll = Utils.grid2latlng(i, j, true);
					g[index] = ll[0];
					g[index + 1] = ll[1];
					index += 2;
				}
			}
		}

		ai = 0;
		arr = new Array(size * size * layers * 3);
		for (var l = l_from; l <= l_to; l++) {
			for (var i = 0; i < size; i++) {
				for (var j = 0; j < size; j++) {
					var index = (i * size + j) * 2;
					var lng = prim._grid[index];
					var lat = prim._grid[index + 1];
					//var c = Cartesian3.fromDegrees(lng, lat, h[l] * prim.heightMag);
					arr[ai] = lng; //c.x;
					arr[ai + 1] = lat; //c.y;
					arr[ai + 2] = prim._heights[l]; //c.z;
					ai += 3;
				}
			}
		}
		
        var vertexBuffer = Buffer.createVertexBuffer({
			context: context,
			typedArray: new Float32Array(arr), 
			usage: Cesium.BufferUsage.STATIC_DRAW
		});

		ai = 0;
		arr = new Array(size * size * layers * 2);
		var texsize = 1800;
		var tstep = 1. / texsize;
		var layerOffset = size / texsize;
		var layersPerRow = ~~(1 / layerOffset);
		for (var l = l_from; l <= l_to; l++) {
			var xoff = l % layersPerRow * layerOffset;
			var yoff = ~~(l / layersPerRow) * layerOffset;
			for (var i = 0; i < size; i++) {
				for (var j = 0; j < size; j++) {
					arr[ai] = xoff + i * tstep;
					arr[ai + 1] = yoff + j * tstep;
					ai += 2;
				}
			}
		}
        var textureBuffer = Buffer.createVertexBuffer({
			context: context,
			typedArray: new Float32Array(arr), 
			usage: Cesium.BufferUsage.STATIC_DRAW
		});

		var vertexInfo = new VertexArray({
			context : context,
			attributes: [{
				index                  : 0,
				enabled                : true,
				vertexBuffer           : vertexBuffer,
				componentsPerAttribute : 3,
				componentDatatype      : Cesium.ComponentDatatype.FLOAT,
				normalize              : false,
				offsetInBytes          : 0,
				strideInBytes          : 0 // tightly packed
			}, {
				index                  : 1,
				enabled                : true,
				vertexBuffer           : textureBuffer,
				componentsPerAttribute : 2,
				componentDatatype      : Cesium.ComponentDatatype.FLOAT,
				normalize              : false,
				offsetInBytes          : 0,
				strideInBytes          : 0
			}]
		});
		
        vertexBuffer && vertexBuffer.destroy();
		textureBuffer && textureBuffer.destroy();

        return vertexInfo;
    }

    PointCloudPrimitive.prototype.render = function(context, cmdlist) {
		if (!this._va)
			this._cmd_draw.vertexArray = this._va = init_va(this, context);

		cmdlist.push(this._cmd_draw);
    };

    PointCloudPrimitive.prototype.dispose = function() {
        this._sp = this._sp && this._sp.destroy();
        this._va = this._va && this._va.destroy();
    };

	PointCloudPrimitive.prototype.save = function(obj) {
		PGPrimitive.prototype.save.call(this, obj);

		obj.pointcloud_opt = {
			pointSize: this.pointSize,
			heightMag: this.heightMag,
            layerNum: this.layerNum,
		};
	};

	PointCloudPrimitive.prototype.load = function(obj) {
		PGPrimitive.prototype.load.call(this, obj);

		var options = obj.pointcloud_opt;
		this.updateGeometry({
			layerNum: options.layerNum,
			heightMag: options.heightMag,
		});
        this.setPointSize(options.pointSize);
		this.onAdjust(this.layerNum, this.heightMag, this.pointSize);
	};

	PointCloudPrimitive.prototype.onAdjust = function(layerNum, heightMag, pointSize) { 
		//callback	
	}

    PointCloudPrimitive.prototype.setPointSize = function(val) {
        this.pointSize = val;
    }
    PointCloudPrimitive.prototype.updateGeometry = function(options) {
        if (!options)
            return;

        if (options.layerNum) {
            this.layerNum = options.layerNum;
            this._va = this._va && this._va.destroy();
		}
        if (options.heightMag)
            this.heightMag = options.heightMag;
    }

    return PointCloudPrimitive;
} ();
