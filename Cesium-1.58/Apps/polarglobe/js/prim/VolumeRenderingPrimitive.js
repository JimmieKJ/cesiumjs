/////////////////////////////////////////////////////////
//INITIALIZED BY SIZHE @ OCT. 20TH, 2016
//
//LAST EDITTING BY SIZHE @ MAR. 1ST, 2017
/////////////////////////////////////////////////////////

Cesium.VolumeRenderingPrimitive = function() {
	var PGPrimitive = Cesium.PGPrimitive;
	var Buffer = Cesium.Buffer;
	var Cartesian3 = Cesium.Cartesian3;
	var DrawCommand = Cesium.DrawCommand;
	var BlendFunction = Cesium.BlendFunction;
	var VertexArray = Cesium.VertexArray;
	var IndexDatatype = Cesium.IndexDatatype;
	var RenderState = Cesium.RenderState;
	var ShaderProgram = Cesium.ShaderProgram;
	var ShaderSource = Cesium.ShaderSource;
	var Sampler = Cesium.Sampler;
	var Texture = Cesium.Texture;
	var TextureMinificationFilter = Cesium.TextureMinificationFilter;
	var TextureMagnificationFilter = Cesium.TextureMagnificationFilter;
	var BoundingSphere = Cesium.BoundingSphere;
	var CullFace = Cesium.CullFace;
	var Pass = Cesium.Pass;

	var _shader = Utils.loadFile("./shader/volrender.glsl");

    var VolumeRenderingPrimitive = function(options) {
		this._grid = undefined;
        this._sp = undefined;
        this._va = undefined;
        this._cmd_draw = undefined;

		options.initMaskTex = true;
		PGPrimitive.call(this, options);
    };

	VolumeRenderingPrimitive.prototype = new PGPrimitive();
	VolumeRenderingPrimitive.prototype.constructor = VolumeRenderingPrimitive;

	VolumeRenderingPrimitive.prototype.initialize = function(context, options) {
		var prim = this;

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
				aPosition : 0
			}
		});

		var _rs =  RenderState.fromCache({
			cull: {
				enabled : true,
				face : CullFace.FRONT
			},
			depthTest: {
				enabled : true
			},
			depthMask: true,
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
        	primitiveType: Cesium.PrimitiveType.TRIANGLE_STRIP,
			pass: Pass.OPAQUE,
        });
	}

    function init_va(prim, context) {
		var arr, ai;
		var size = 360;
		var sampleRatio = 6;
        var l_from = prim.layerNum.from;
        var l_to = prim.layerNum.to;
		var layers = l_to - l_from + 1;

		size /= sampleRatio;

		if(prim._grid === undefined) {
			var g = prim._grid = new Array(size * size * 2);
			
			var index = 0;
			for (var i = 0; i < size; i++) {
				for (var j = 0; j < size; j++) {
					var ll = Utils.grid2latlng(i * sampleRatio, j * sampleRatio, true);
					g[index] = ll[0];
					g[index + 1] = ll[1];
					index += 2;
				}
			}
		}

		ai = 0;
        arr = new Array(size * size * 3 * 2);
        for (var hi = 1; hi > -2; hi -= 2) {
			for (var i = 0; i < size; i++) {
				for (var j = 0; j < size; j++) {
					var index = (i * size + j) * 2;
					var lng = prim._grid[index];
					var lat = prim._grid[index + 1];
					arr[ai] = lng; //c.x;
					arr[ai + 1] = lat; //c.y;
					arr[ai + 2] = hi; //c.z;
					ai += 3;
				}
			}
		}
        var vertexBuffer = Buffer.createVertexBuffer({
			context: context,
			typedArray: new Float32Array(arr), 
			usage: Cesium.BufferUsage.STATIC_DRAW
		});

		//Cubic triangle-strip reference: gamedev.net - Sneftel
		// <reference path="http://www.gamedev.net/topic/124594-triangle-strips-and-a-simple-cube/" />
	    var indices = [];
        for (var i = 0; i < size - 1; i++) {
            for (var j = 0; j < size; j++) {
                indices.push(j + i * size);
                indices.push(j + (i + 1) * size);
            }
            indices.push((i + 2) * size - 1);
			if (i == size - 2)
	            indices.push(size - 1);
			else 
            	indices.push((i + 1) * size);
        }

		indices.push(size - 1);
		indices.push(size * size + size - 1);

		for (var i = 0; i < size; i++) {
			indices.push(size * size + size - 1 + i * size);
			indices.push(size - 1 + i * size);
		}

		for (var j = size - 2; j > -1; j--) {
			indices.push(size * size + j + (size - 1) * size);
			indices.push(j + (size - 1) * size);
		}
		
		indices.push(size * size - size);
		indices.push(size * size * 2 - size);
		
		for (var i = size - 1; i > 0; i--) {
            for (var j = 0; j < size; j++) {
                indices.push(size * size + j + i * size);
                indices.push(size * size + j + (i - 1) * size);
            }
            indices.push(size * size + i * size - 1);
            indices.push(size * size + (i - 1) * size);
        }

		indices.push(size * size);
		indices.push(size * size * 2 - size);

		for (var i = size - 1; i > -1; i--) {
			indices.push(size * size + i * size);
			indices.push(i * size);
		}
		for (var j = 1; j < size; j++) {
			indices.push(size * size + j);
			indices.push(j);
		}

        var indexBuffer = Buffer.createIndexBuffer({
			context: context,
			typedArray: new Uint32Array(indices), 
			usage: Cesium.BufferUsage.STATIC_DRAW,
			indexDatatype : IndexDatatype.UNSIGNED_INT
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
			}],
			indexBuffer: indexBuffer,
		});

        vertexBuffer && vertexBuffer.destroy();
		indexBuffer && indexBuffer.destroy();

        return vertexInfo;
    }

    VolumeRenderingPrimitive.prototype.render = function(context, cmdlist) {
		cmdlist.push(this._cmd_draw);
    };

    VolumeRenderingPrimitive.prototype.dispose = function() {
        this._sp = this._sp && this._sp.destroy();
        this._va = this._va && this._va.destroy();
    };

	VolumeRenderingPrimitive.prototype.save = function(obj) {
		PGPrimitive.prototype.save.call(this, obj);

		obj.volrender_opt = {
			layerNum: this.layerNum,
			heightMag: this.heightMag,
		};
	};

	VolumeRenderingPrimitive.prototype.load = function(obj) {
		PGPrimitive.prototype.load.call(this, obj);

		var options = obj.volrender_opt;
		this.updateGeometry({
			layerNum: options.layerNum,
			heightMag: options.heightMag,
		});

		this.onAdjust(this.layerNum, this.heightMag);
	};

	VolumeRenderingPrimitive.prototype.onAdjust = function(layerNum, heightMag) { 
		//callback	
	}

    VolumeRenderingPrimitive.prototype.updateGeometry = function(options) {
        if (!options)
            return;
        
        var ret = {};
        if (options.layerNum) {
            var ln = options.layerNum;
            this.layerNum = ln; 
            ret.autoHeight = 3e4 * ln.to / this._heights[ln.to - 1];
		}
        if (options.heightMag || ret.autoHeight) {
            this.heightMag = options.heightMag || ret.autoHeight;
		}
        return ret;
    }

    return VolumeRenderingPrimitive;
} ();
