/////////////////////////////////////////////////////////
//INITIALIZED BY SIZHE @ FEB. 22ND, 2016 
//
//LAST EDITTING BY SIZHE @ MAR. 1ST, 2017
/////////////////////////////////////////////////////////

Cesium.StreamLinePrimitive = function() {
	var PGPrimitive = Cesium.PGPrimitive;
	var Color = Cesium.Color;
	var Buffer = Cesium.Buffer;
	var Cartesian2 = Cesium.Cartesian2;
	var Cartesian3 = Cesium.Cartesian3;
	var DrawCommand = Cesium.DrawCommand;
	var ClearCommand = Cesium.ClearCommand;
	var ComputeCommand = Cesium.ComputeCommand;
	var BlendFunction = Cesium.BlendFunction;
	var Framebuffer = Cesium.Framebuffer;
	var VertexArray = Cesium.VertexArray;
	var RenderState = Cesium.RenderState;
	var ShaderProgram = Cesium.ShaderProgram;
	var ShaderSource = Cesium.ShaderSource;
	var Sampler = Cesium.Sampler;
	var Texture = Cesium.Texture;
	var TextureWrap = Cesium.TextureWrap;
	var TextureMinificationFilter = Cesium.TextureMinificationFilter;
	var TextureMagnificationFilter = Cesium.TextureMagnificationFilter;
	var PixelFormat = Cesium.PixelFormat;
	var PixelDatatype = Cesium.PixelDatatype;
	var BoundingSphere = Cesium.BoundingSphere;
	var Pass = Cesium.Pass;

	var czm_x = 0, czm_y = 0;
	var _shader = Utils.loadFile("./shader/streamline.glsl");
	
	var StreamLinePrimitive = function(options) {
		this._pick_tex = undefined;
		this._cmpt_tex0 = undefined;
		this._cmpt_tex1 = undefined;
		this._draw_tex0 = undefined;
		this._draw_tex1 = undefined;
		this._depth_tex = undefined;

        this._sp_draw = undefined;
        this._va_draw = undefined;

        this._cmd_evol = undefined;
		this._cmd_fade = undefined;
        this._cmd_draw = undefined;
        this._cmd_show = undefined;
        this._cmd_pick = undefined;
        this._cmd_clear= undefined;
		this._buff_size = 512;

		PGPrimitive.call(this, options);
	}
	StreamLinePrimitive.prototype = new PGPrimitive();
	StreamLinePrimitive.prototype.constructor = StreamLinePrimitive;

	StreamLinePrimitive.prototype.initialize = function(context, options) {
		var prim = this;

        this._vp_supported = true;
        
		this._uniforms.uPickPos = function () {
			return new Cartesian2(czm_x, czm_y); 
		}
		this._uniforms.uInputTex = function () {
			return prim._cmpt_tex0;
		}
		this._uniforms.uDrawTex = function () {
			return prim._draw_tex0;
		}
		this._uniforms.uShowTex = function () {
			return prim._draw_tex1;
		}
		this._uniforms.uPosTex0 = function () {
			return prim._cmpt_tex0;
		}
		this._uniforms.uPosTex1 = function () {
			return prim._cmpt_tex1;
		}
		this._uniforms.uDepthTex = function () {
			return prim._depth_tex || scene._globeDepth._globeDepthTexture;
		}
		this._uniforms.uRandSeed = function() {
			return new Date().getMilliseconds() / 1000 + .5;
		}
		
        prim._pick_tex = new Texture({
			context: context,
			width: this._heights.length,
			height: 1,
		});

		if (!scene._globeDepth) {
			prim._depth_tex = new Texture({
				context: context,
				width: 1,
				height: 1,
			});
		}

		for (var i in [0, 1]) {
			prim['_cmpt_tex' + i] = new Texture({
				context : context,
				width : prim._buff_size,
				height : prim._buff_size,
				flipY : false,
				pixelFormat: PixelFormat.RGBA,
				pixelDatatype : PixelDatatype.FLOAT,
			});
		}

		new ComputeCommand({
            fragmentShaderSource: new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_INIT_']
			}),
            outputTexture: prim._cmpt_tex1,
        }).execute(scene._computeEngine);

		prim._cmd_evol = new ComputeCommand({
            fragmentShaderSource: new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_EVOL_']
			}),
			uniformMap: prim._uniforms,
        });

		prim._cmd_fade = new ComputeCommand({
            fragmentShaderSource: new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_FADE_']
			}),
			uniformMap: prim._uniforms,
		});
		
		prim._va_draw = init_va(prim, context);
		prim._sp_draw = ShaderProgram.replaceCache({
			context : context,
			shaderProgram : prim._sp_draw,
			vertexShaderSource : new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_DRAW_', '_VS_']
			}),
			fragmentShaderSource : new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_DRAW_', '_FS_']
			}),
			attributeLocations : {
				uvi : 0
			}
		});

		var _rs =  RenderState.fromCache({
			depthTest : {
				enabled : false
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

		prim._cmd_draw = new DrawCommand({
            owner: prim,
        	renderState: _rs,
			vertexArray: prim._va_draw, 
        	shaderProgram: prim._sp_draw,
        	uniformMap: prim._uniforms,
        	primitiveType: Cesium.PrimitiveType.LINES,
			pass: Pass.OPAQUE,
        });

		var _bs = new BoundingSphere(Cartesian3.ZERO, 1e9);
        
		var _sp_show = ShaderProgram.fromCache({
            context: context,
            vertexShaderSource: Cesium._shaders.ViewportQuadVS,
            fragmentShaderSource: new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_SHOW_']
			}),
            attributeLocations : {
                position: 0,
                textureCoordinates: 1
            }
        });
		prim._cmd_show = new DrawCommand({
            owner: prim,
        	renderState: _rs,
        	boundingVolume: _bs,
			vertexArray: context.getViewportQuadVertexArray(),
        	shaderProgram: _sp_show,
        	uniformMap: prim._uniforms,
        	primitiveType: Cesium.PrimitiveType.TRIANGLES,
			pass: Pass.OPAQUE,
        });

        prim._cmd_pick = new ComputeCommand({
            fragmentShaderSource: new ShaderSource({
				sources: [this._util_shader, _shader],
				defines: ['_PICK_']
			}),
            outputTexture: prim._pick_tex,
			uniformMap: prim._uniforms,
            postExecute: function(out) {
                var rawpick = out.getPixel(0, 0, out.width, out.height);
                this._picked_values = Utils.unpackRGBAArray(
                    rawpick, 
                    prim.valueFilter.vmin, 
                    prim.valueFilter.vmax,
                    prim.layerNum.to,
                    prim.layerNum.from
                );
            },
        });

        prim._cmd_clear = new ClearCommand({
            color : new Color(0.0, 0.0, 0.0, 0.0),
            renderState: RenderState.fromCache(),    
        });

		for (var i = 0; i < 128; i++) 
			evolve(prim, context);
    };

    function init_va(prim, context) {
		var arr = [];
		for (var i = .5; i < prim._buff_size; i++) {
			for (var j = .5; j < prim._buff_size; j++) {
				for (var k = -.5; k < 1; k++) {
					arr.push(i / prim._buff_size);
					arr.push(j / prim._buff_size);
					arr.push(k);	
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
				vertexBuffer           : textureBuffer,
				componentsPerAttribute : 3,
				componentDatatype      : Cesium.ComponentDatatype.FLOAT,
				normalize              : false,
				offsetInBytes          : 0,
				strideInBytes          : 0 // tightly packed
			}]
		});

		textureBuffer && textureBuffer.destroy();

        return vertexInfo;
    }

	function evolve(prim, context) {
		var  _temp_tex_ = prim._cmpt_tex0;
		prim._cmpt_tex0 = prim._cmpt_tex1;
		prim._cmpt_tex1 = _temp_tex_;

		prim._cmd_evol.outputTexture = prim._cmpt_tex1;
		prim._cmd_evol.execute(scene._computeEngine);
	}

	function fade(prim, context) {
		var  _temp_tex_ = prim._draw_tex0;
		prim._draw_tex0 = prim._draw_tex1;
		prim._draw_tex1 = _temp_tex_;

		prim._cmd_fade.outputTexture = prim._draw_tex1;
		prim._cmd_fade.execute(scene._computeEngine);
	}

	function draw(prim, context, cmdlist) {
        prim._fb_draw = prim._fb_draw && prim._fb_draw.destroy();
		prim._fb_draw = new Framebuffer({
            context : context,
            colorTextures : [prim._draw_tex1],
            destroyAttachments : false
        });

		prim._cmd_draw.framebuffer = prim._fb_draw;
		cmdlist.push(prim._cmd_draw);
	}

    function clear(prim, context) {
		if (!prim._draw_tex0 || !prim._draw_tex1)
			return;

        var fb = new Framebuffer({
            context : context,
            colorTextures : [prim._draw_tex0, prim._draw_tex1],
            destroyAttachments : false
        });

        prim._cmd_clear.framebuffer = fb;
        prim._cmd_clear.execute(context);

        fb.destroy();
    }

    function pick(prim, context) {
        if (!window._val_picking)
            return;

        var vals = [], tags;
        var ellipsoid = scene.globe.ellipsoid;
        var position = new Cartesian2(cursorX, cursorY);
        var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
        if (cartesian) {
            var cartographic = ellipsoid.cartesianToCartographic(cartesian);
            var lat = Math.degrees(cartographic.latitude);
            var lng = Math.degrees(cartographic.longitude);
            var coord = Utils.latlng2grid(lng, lat);
            if (!coord[2]) {
                czm_x = coord[0];
                czm_y = coord[1];
                prim._cmd_pick.execute(scene._computeEngine);
                vals = prim._cmd_pick._picked_values;
                tags = prim._pres.slice(
                    prim.layerNum.from - 1,
                    prim.layerNum.to
                ).reverse();
            }
        }
        updateValuePicking(vals, tags);
    }

	StreamLinePrimitive.prototype.onResize = function(context, width, height) {
        this._draw_tex0 = this._draw_tex0 && this._draw_tex0.destroy();
        this._draw_tex1 = this._draw_tex1 && this._draw_tex1.destroy();

		for (var i in [0, 1]) {
			this['_draw_tex' + i] = new Texture({
				context: context,
				width: width,
				height: height,
				flipY: false,
				sampler: new Sampler({
					minificationFilter : TextureMinificationFilter.NEAREST,
					magnificationFilter : TextureMagnificationFilter.NEAREST,
					wrapS: TextureWrap.CLAMP_TO_EDGE,
					wrapT: TextureWrap.CLAMP_TO_EDGE,
				}),
			});
		}
	}

    StreamLinePrimitive.prototype.render = function(context, cmdlist) { 
		pick(this, context);
		evolve(this, context);
		fade(this, context);
		draw(this, context, cmdlist);
		cmdlist.push(this._cmd_show);
    };

	StreamLinePrimitive.prototype.save = function(obj) {
		PGPrimitive.prototype.save.call(this, obj);

		obj.streamline_opt = {
			layerNum: this.layerNum,
			heightMag: this.heightMag,
		};
	};

	StreamLinePrimitive.prototype.load = function(obj) {
		PGPrimitive.prototype.load.call(this, obj);

		var options = obj.streamline_opt;
		this.updateGeometry({
			layerNum: options.layerNum,
			heightMag: options.heightMag,
		});

		this.onAdjust(this.layerNum, this.heightMag);
	};

	StreamLinePrimitive.prototype.onAdjust = function(layerNum, heightMag) { 
		//callback	
	}

    StreamLinePrimitive.prototype.dispose = function() {
        this._cmpt_tex0 = this._cmpt_tex0 && this._cmpt_tex0.destroy();
        this._cmpt_tex1 = this._cmpt_tex1 && this._cmpt_tex1.destroy();
        this._draw_tex0 = this._draw_tex0 && this._draw_tex0.destroy();
        this._draw_tex1 = this._draw_tex1 && this._draw_tex1.destroy();
        this._depth_tex = this._depth_tex && this._depth_tex.destroy();
        this._pick_tex = this._pick_tex && this._pick_tex.destroy();
        this._sp_draw = this._sp_draw && this._sp_draw.destroy();
        this._va_draw = this._va_draw && this._va_draw.destroy();
    };

    StreamLinePrimitive.prototype.setVisible = function(showed) {
		PGPrimitive.prototype.setVisible.call(this, showed);
        if(!showed)
            clear(this, scene.context);
    }

    StreamLinePrimitive.prototype.updateGeometry = function(options) {
        if (!options)
            return;
        
        var ret = {};
        if (options.layerNum) {
            var ln = options.layerNum;
            this.layerNum = ln; 
            ret.autoHeight = 2e4 * ln.to / this._heights[ln.to - 1];
		}
        if (options.heightMag) {
            this.heightMag = options.heightMag;
		}
        return ret;
    }

    return StreamLinePrimitive;
} ();