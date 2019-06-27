/////////////////////////////////////////////////////////
//INITIALIZED BY SIZHE @ NOV. 20TH, 2015
//
//LAST EDITTING BY SIZHE @ MAR. 1ST, 2017
/////////////////////////////////////////////////////////

Cesium.HorizontalSectionPrimitive = function() {
	var PGPrimitive = Cesium.PGPrimitive;
	var Cartesian3 = Cesium.Cartesian3;
	var defaultValue = Cesium.defaultValue;
	var BufferUsage = Cesium.BufferUsage;
	var DrawCommand = Cesium.DrawCommand;
	var ShaderSource = Cesium.ShaderSource;
	var Pass = Cesium.Pass;

	var BlendFunction = Cesium.BlendFunction;
	var RenderState = Cesium.RenderState;
	var ShaderProgram = Cesium.ShaderProgram;
	var VertexArray = Cesium.VertexArray;
	var IndexDatatype = Cesium.IndexDatatype;
	var Buffer = Cesium.Buffer;
	var Texture = Cesium.Texture;

	var _shader = Utils.loadFile("./shader/horizontal.glsl");

    var HorizontalSectionPrimitive = function(options) {
        this._va = undefined;
        this._sp = undefined;
        this._sp_pv = undefined;

        this._pick_tex = undefined;
        this._cmd_draw = undefined;
        this._cmd_pick = undefined;

        this.texInv = 0;
        this.verInv = 0;

		options.initMaskTex = true;
		PGPrimitive.call(this, options);
    };

	HorizontalSectionPrimitive.prototype = new PGPrimitive();
	HorizontalSectionPrimitive.prototype.constructor = HorizontalSectionPrimitive;

	HorizontalSectionPrimitive.prototype.initialize = function(context, options) {
        var prim = this;
        
        this._vp_supported = true;
		this.alpha = defaultValue(options.alpha, 1);
        this.layerNum = defaultValue(options.layerNum, 5);
		this.contourIntv = defaultValue(options.contourIntv, 3);
        this.lightDir = Cartesian3.fromArray(defaultValue(options.lightDir, [-2, -3, 8]));
		this.isReverseHeight = defaultValue(options.reverseHeight, false);

        this._uniforms.uHeightMag = function () {
            return prim.heightMag * 4000;
        };
        this._uniforms.uLightDir = function () {
            return prim.lightDir;    
        };
        this._uniforms.uTexInv = function () {
            return prim.texInv;    
        };
        this._uniforms.uVerInv = function () {
            return prim.verInv;    
        };
        this._uniforms.uAlpha = function () {
            return prim.alpha;
        };
        this._uniforms.uRevHeight = function () {
            return prim.isReverseHeight;    
        };
        this._uniforms.uContourDensity = function () {
            var vf = prim.valueFilter;
            var range = vf.vmax - vf.vmin;
            return range / prim.contourIntv;
        };

        prim._va = init_va(prim, context);
        prim._sp = ShaderProgram.replaceCache({
            context : context,
            shaderProgram : prim._sp,
            vertexShaderSource : new ShaderSource({
                sources: [this._util_shader, _shader],
                defines: ['_DRAW_', '_VS_', prim.valueDecoder]
            }),
            fragmentShaderSource : new ShaderSource({
                sources: [this._util_shader, _shader],
                defines: ['_DRAW_', '_FS_', prim.valueDecoder]
            }),
            attributeLocations : {
                aPosition: 0,
                aTexture: 1,
            }
        });
		
        prim._sp_pv = ShaderProgram.replaceCache({
            context : context,
            shaderProgram : prim._sp_pv,
            vertexShaderSource : new ShaderSource({
                sources: [this._util_shader, _shader],
                defines: ['_PICK_', '_VS_', prim.valueDecoder]
            }),
            fragmentShaderSource : new ShaderSource({
                sources: [this._util_shader, _shader],
                defines: ['_PICK_', '_FS_', prim.valueDecoder]
            }),
            attributeLocations : {
                position : 0,
                texcoords : 1
            }
        });

        var _rs = RenderState.fromCache({
            depthTest : {
                enabled : true
            },
            blending: {
                enabled: true,
                functionSourceRgb : BlendFunction.SOURCE_ALPHA,
                functionSourceAlpha : BlendFunction.SOURCE_ALPHA,
                functionDestinationRgb : BlendFunction.ONE_MINUS_SOURCE_ALPHA,
                functionDestinationAlpha : BlendFunction.ONE_MINUS_SOURCE_ALPHA					
            },
        });

        prim._cmd_draw = new DrawCommand({
            owner: prim,
        	renderState: _rs,
			vertexArray: prim._va,
        	shaderProgram: prim._sp,
        	uniformMap: prim._uniforms,
        	primitiveType: Cesium.PrimitiveType.TRIANGLE_STRIP,
			pass: Pass.OPAQUE,
        });

        prim._cmd_pick = new Cesium.ComputeCommand({
            vertexArray: prim._va,
            shaderProgram: prim._sp_pv,
            uniformMap: prim._uniforms,
            outputTexture: prim._pick_tex,
            persists: true,
			preExecute: function(cc, exeoption) {
				exeoption.primitiveType = Cesium.PrimitiveType.TRIANGLE_STRIP;
			},
            postExecute: function(out) {
                this.rawpick = out.getPixel(cursorX, cursorY); 
                this.pickvalue = Utils.clr2val(
                    this.rawpick, 
                    prim.valueFilter.vmin, 
                    prim.valueFilter.vmax
                );
            }
        });
    }

    function init_va(prim, context) {
		var arr, ai;
		var size = 360;
		var layerNum = prim.layerNum - 1;
        var sampleRatio = 1;
        
		var ai = 0;
        var arr = new Array(size / sampleRatio * size / sampleRatio * 2);
        for (var i = 0; i < size; i+=sampleRatio) {
            for (var j = 0; j < size; j+=sampleRatio) {
                arr[ai] = i;
                arr[ai + 1] = j;
                ai += 2;
            }
        }
        var vertexBuffer = Buffer.createVertexBuffer({
			context: context,
			typedArray: new Float32Array(arr), 
			usage: Cesium.BufferUsage.STATIC_DRAW
		});
        prim.verInv = sampleRatio;

		ai = 0;
		arr = new Array(size / sampleRatio * size / sampleRatio * 2);
		var texsize = 1800;
		var tstep = 1. / texsize;
		var layerOffset = size / texsize;
		var layersPerRow = ~~(1 / layerOffset);
        var xoff = layerNum % layersPerRow * layerOffset;
        var yoff = ~~(layerNum / layersPerRow) * layerOffset;
        for (var i = 0; i < size; i+=sampleRatio) {
            for (var j = 0; j < size; j+=sampleRatio) {
                arr[ai] = xoff + i * tstep;
                arr[ai + 1] = yoff + j * tstep;
                ai += 2;
            }
		}
        var texcoordBuffer = Buffer.createVertexBuffer({
			context: context,
			typedArray: new Float32Array(arr), 
			usage: Cesium.BufferUsage.STATIC_DRAW
		});
        prim.texInv = tstep * sampleRatio;

        var indices = [];
        for (var i = 0; i < size / sampleRatio - 1; i++) {
            for (var j = 0; j < size / sampleRatio; j++) {
                indices.push(j + i * size / sampleRatio);
                indices.push(j + (i + 1) * size / sampleRatio);
            }
            indices.push((i + 2) * size / sampleRatio - 1);
            indices.push((i + 1) * size / sampleRatio);
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
				componentsPerAttribute : 2,
				componentDatatype      : Cesium.ComponentDatatype.FLOAT,
				normalize              : false,
				offsetInBytes          : 0,
				strideInBytes          : 0 // tightly packed
			}, {
				index                  : 1,
				enabled                : true,
				vertexBuffer           : texcoordBuffer,
				componentsPerAttribute : 2,
				componentDatatype      : Cesium.ComponentDatatype.FLOAT,
				normalize              : false,
				offsetInBytes          : 0,
				strideInBytes          : 0
			}],
            indexBuffer: indexBuffer,
		});

        vertexBuffer && vertexBuffer.destroy();
		texcoordBuffer && texcoordBuffer.destroy();
		indexBuffer && indexBuffer.destroy();

        return vertexInfo;
    }

    function pick(prim, context) {
        if (!window._val_picking)
            return;
        
        prim._cmd_pick.vertexArray = prim._va;
        prim._cmd_pick.outputTexture = prim._pick_tex;
        prim._cmd_pick.execute(scene._computeEngine);
        updateValuePicking(prim._cmd_pick.pickvalue);
    }

    HorizontalSectionPrimitive.prototype.onResize = function(context, width, height) {
        this._pick_tex = this._pick_tex && this._pick_tex.destroy();
        this._pick_tex = new Texture({
            context : context,
            width : width,
            height : height,
        });
    }

    HorizontalSectionPrimitive.prototype.render = function(context, cmdlist) {
        if (this._va === undefined)
            this._cmd_draw.vertexArray = this._va = init_va(this, context);
        
        pick(this, context);
		cmdlist.push(this._cmd_draw);
    };

    HorizontalSectionPrimitive.prototype.dispose = function() {
        this._va = this._va && this._va.destroy();
        this._sp = this._sp && this._sp.destroy();
        this._sp_pv = this._sp_pv && this._sp_pv.destroy();
        this._pick_tex = this._pick_tex && this._pick_tex.destroy();
    };

	HorizontalSectionPrimitive.prototype.save = function(obj) {
		PGPrimitive.prototype.save.call(this, obj);

		obj.horizontal_opt = {
			alpha: this.alpha,
            contourIntv: this.contourIntv,
			heightMag: this.heightMag,
            layerNum: this.layerNum,
		};
	};

	HorizontalSectionPrimitive.prototype.load = function(obj) {
		PGPrimitive.prototype.load.call(this, obj);

		var options = obj.horizontal_opt;
		this.updateGeometry({
			layerNum: options.layerNum,
			heightMag: options.heightMag,
		});
        this.setAlpha(options.alpha);
        this.setContourIntv(options.contourIntv);
		this.onAdjust(this.layerNum, this.heightMag, this.alpha, this.contourIntv);
	};

	HorizontalSectionPrimitive.prototype.onAdjust = function(layerNum, heightMag, alpha, contourIntv) { 
		//callback	
	}

    HorizontalSectionPrimitive.prototype.setAlpha = function(val) {
        this.alpha = 1 + 1/27 - Math.pow(3, -val * 3);
    }
    HorizontalSectionPrimitive.prototype.setContourIntv = function(val) {
        this.contourIntv = val;
    }
    HorizontalSectionPrimitive.prototype.updateGeometry = function(options) {
        if (options.layerNum) {
            this.layerNum = options.layerNum;
			this._va = this._va && this._va.destroy();    
		}
        if (options.heightMag)
            this.heightMag = options.heightMag;
    }

    return HorizontalSectionPrimitive;
} ();
