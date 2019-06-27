//////////////////////////////////////////
//Created by Feng @ DEC. 14TH. 2015
/////////////////////////////////////////

Cesium.ParticleSimulationPrimitive= function(){
	var BoundingSphere = Cesium.BoundingSphere;
	var Cartesian3 = Cesium.Cartesian3;
	var defaultValue = Cesium.defaultValue;
	var defined = Cesium.defined;
	var Matrix4 = Cesium.Matrix4;
	var VertexFormat = Cesium.VertexFormat;
	var BufferUsage = Cesium.BufferUsage;
	var DrawCommand = Cesium.DrawCommand;
	var ComputeCommand = Cesium.ComputeCommand;
	var ShaderSource = Cesium.ShaderSource;
	var BlendingState = Cesium.BlendingState;
	var Material = Cesium.Material;
	var Pass = Cesium.Pass;
	var SceneMode = Cesium.SceneMode;
	var RenderState = Cesium.RenderState;
	var ShaderProgram = Cesium.ShaderProgram;
	var BlendFunction = Cesium.BlendFunction;
	var Buffer = Cesium.Buffer;
	var Framebuffer = Cesium.Framebuffer;
	var VertexArray = Cesium.VertexArray;
	var IndexDatatype = Cesium.IndexDatatype;
	var Texture = Cesium.Texture;
	var TextureWrap = Cesium.TextureWrap;
	var TextureMinificationFilter = Cesium.TextureMinificationFilter;
	var TextureMagnificationFilter = Cesium.TextureMagnificationFilter;
	var Sampler = Cesium.Sampler;
	var PixelFormat = Cesium.PixelFormat;
	var PixelDatatype = Cesium.PixelDatatype;

	var particleVS = Utils.loadFile("./shader/particle/particleRender.vs");
	var particleFS = Utils.loadFile("./shader/particle/particleRender.fs");
	var particleComputeVS = Utils.loadFile("./shader/particle/particleCompute.vs");
	var particleComputeFS = Utils.loadFile("./shader/particle/particleCompute.fs");
	var	particleInitFS = Utils.loadFile("./shader/particle/particleInit.fs");
	
	var _sc_pts = null;
	var _sc_handler= null;
	var scPolygonPrimitive = null;

	var ParticleSimulationPrimitive = function(options){
		options = defaultValue(options, defaultValue.EMPTY_OBJECT);
		var that = this;

		this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix,Matrix4.IDENTITY));
		this.setColorScheme(options.colorScheme);
		this.pause = defaultValue(options.pause, true);
		this.showed = defaultValue(options.showd, true);
		this.particleSpeed = defaultValue(options.particleSpeed,2.0);
		this.spatialFilter = defaultValue(options.spatialFilter, 'None');

		this.valueFilter = defaultValue(options.valueFilter, {});
        this.valueFilter.enabled = defaultValue(this.valueFilter.enabled, false);
        this.valueFilter.vmin = defaultValue(this.valueFilter.vmin, 0);
        this.valueFilter.vmax = defaultValue(this.valueFilter.vmax, 1);
        this.valueFilter.from = defaultValue(this.valueFilter.from, this.valueFilter.vmin);
        this.valueFilter.to = defaultValue(this.valueFilter.to, this.valueFilter.vmax);

        this.layerNum = defaultValue(options.layerNum, {from: 1, to: 7});

        this.data = defaultValue(options.data, null);
        this.data_tex = undefined;

		this.particleTexture = undefined;
		this.xWindVecTexture = undefined;
		this.yWindVecTexture = undefined;
		this.zWindVecTexture = undefined;

		this.initialized = false;
		this.particleReDistribute = false;
		this.pointSize = defaultValue(options.pointSize, 10.0);
		this.alpha = defaultValue(options.alpha, 0.5);

		this.deltaT = 0.0;
		this.lastFrameTime = 0.0;

		this.sp_particleInit = undefined;
		this.sp_particleCompute = undefined;
		this.sp_particleDraw = undefined;
		this.rs = undefined;
		this.va = undefined;
		this.boundingSphere = undefined;
		this.PARTICLE_DIM = defaultValue(options.particleNumber, 256);

		this.levelIndex = defaultValue(options.levelIndex,1.0);
		
		this.fCycloneDataByRegionAndTime = undefined;
		this.pathPolylines = [];
		this.cyclonePlaceMarker = [];
		
		this.frameBuffers = [
		{
			//width : PARTICLE_DIM,
			//height : PARTICLE_DIM,
			textures : new Array(1)
		},
		{
			//width : PARTICLE_DIM,
			//height : PARTICLE_DIM,
			textures : new Array(1)
		},
		{
			//width : PARTICLE_DIM,
			//height : PARTICLE_DIM,
			textures : new Array(1)
		}
		];

		this.particleDrawCommand = new DrawCommand({
			owner : defaultValue(options._owner,this),
			debugShowBoundingVolume : true
		});

		this.particleInitCommand = new DrawCommand({
			owner : defaultValue(options._owner,this),
			debugShowBoundingVolume : true
		});

		this.particleInitComputeCommand = new ComputeCommand({
			owner : defaultValue(options._owner,this)
		});
		
		this.particleComputeCommand  = new ComputeCommand({
			owner : defaultValue(options._owner,this)
		});

		this.particleInitUniforms = {
			uLevelIndex : function () {
				return that.levelIndex;
			},
			uLevelFrom : function(){
				return that.layerNum.from;
			},
			uLevelTo : function(){
				return that.layerNum.to;
			},
			uWindTexture : function(){
				return that.data_tex;
			},
			uParticleDim : function (){
				return that.PARTICLE_DIM;
			}
		};

		this.particleComputeUniforms = {
			uParticleDim : function (){
				return that.PARTICLE_DIM;
			},
			uDeltaT : function (){
				return that.deltaT;
			},
			uPosTexture : function(){
				return  that.frameBuffers[0].textures[0];
			},
			uWindTexture : function(){
				return that.data_tex;
			},
			uInitialPositionTex :function (){
				return that.frameBuffers[2].textures[0];
			},
			uParticleSpeed : function(){
				return that.particleSpeed;
			}

		};

		this.particleUniforms = {
			uViewProjMat : function () {
				return this.modelMatrix;
			},
			uLevelFrom : function(){
				return that.layerNum.from;
			},
			uLevelTo : function(){
				return that.layerNum.to;
			},
			uSize : function (){
				return that.pointSize;
			},
			uAlpha : function(){
				return that.alpha;
			},
			uPosTexture : function(){
				return that.frameBuffers[0].textures[0];
			},
			uWindTexture : function(){
				return that.data_tex;
			},
            uIsFilter: function () {
                return that.valueFilter.enabled;
            },
            uRange: function () {
                var vf = that.valueFilter;
                var min = (vf.from - vf.vmin) / (vf.vmax - vf.vmin); 
                var max = (vf.to - vf.vmin) / (vf.vmax - vf.vmin); 
                return new Cesium.Cartesian2(min, max);
            },
			uColorScheme : function(){
				return that.colorScheme; 
			},
			uNColorScheme : function(){
				return that.colorScheme.length;
			},
			uParticleTexture: function(){
				return that.particleTexture;
			},
		};
		
		this.InitFrameBuffer(scene.context,this.frameBuffers[0]);
		this.InitFrameBuffer(scene.context,this.frameBuffers[1]);
		this.InitFrameBuffer(scene.context,this.frameBuffers[2]);
		this.InitTextures(scene.context);
	};

	ParticleSimulationPrimitive.prototype.InitTextures = function(context){
		var that = this;
		if(!defined(this.particleTexture)){
			Cesium.loadImage("./images/vparticle.png").then(function(image){
				that.particleTexture = new Texture({
					context : context,
					source : image,
					flipY : false,
					pixelFormat : PixelFormat.RGBA,
					pixelDatatype : PixelDatatype.UNSIGNED_BYTE,
					sampler : new Sampler({
						minificationFilter : TextureMinificationFilter.NEAREST,
						magnificationFilter : TextureMagnificationFilter.NEAREST,
						warpS : TextureWrap.CLAMP_TO_EDGE,
						warpT : TextureWrap.CLAMP_TO_EDGE
					}),
				});
			});
		}

		if(!defined(this.data_tex)){
			this.data_tex = new Texture({
				context : context,
				flipY : false,
				width : 1,
				height : 1,
				sampler : new Sampler({
					minificationFilter : TextureMinificationFilter.LINEAR,
					magnificationFilter : TextureMagnificationFilter.LINEAR,
					warpS : TextureWrap.CLAMP_TO_EDGE,
					warpT : TextureWrap.CLAMP_TO_EDGE
				}),
			});
		}
	}

	ParticleSimulationPrimitive.prototype.LoadTexture = function(context,fileName){
		var tex;
		Cesium.loadImage(fileName).then(function(image){
			tex = new Texture({
			context : context,
			source : image,
			sampler : new Sampler({
				minificationFilter : TextureMinificationFilter.LINEAR,
				magnificationFilter : TextureMagnificationFilter.LINEAR,
				warpS : TextureWrap.CLAMP_TO_EDGE,
				warpT : TextureWrap.CLAMP_TO_EDGE
				}),
			});
			
		});
		return tex;

	}

	ParticleSimulationPrimitive.prototype.InitFrameBuffer= function(context, buf){
		for(var i = 0;i< buf.textures.length ; ++i){
			buf.textures[i] = new Texture({
				context : context,
				width : this.PARTICLE_DIM,
				height : this.PARTICLE_DIM,
				flipY : false,
				sampler : new Sampler({
					minificationFilter : TextureMinificationFilter.LINEAR,
					magnificationFilter : TextureMagnificationFilter.LINEAR,
					warpS : TextureWrap.CLAMP_TO_EDGE,
					warpT : TextureWrap.CLAMP_TO_EDGE
				}),
				pixelFormat: PixelFormat.RGBA,
				pixelDatatype : PixelDatatype.FLOAT,
			});
		}

		buf.frameBuffer =  new Framebuffer({
			context : context,
			colorTextures : buf.textures,
			destroyAttachments : false
		});
	}

	ParticleSimulationPrimitive.prototype.getParticleVA = function(context){
		var array = [];
		for(var i =0;i<this.PARTICLE_DIM;i++){
			for(var j =0;j<this.PARTICLE_DIM;j++){
				array.push(j/this.PARTICLE_DIM);
				array.push(i/this.PARTICLE_DIM);
			}
		}
		var vertexBuffer = Buffer.createVertexBuffer({
			context : context,
			typedArray : new Float32Array(array),
			usage : Cesium.BufferUsage.STATIC_DRAW
		});
		
		var vertexInfo = new VertexArray({
			context : context,
			attributes : [{
				index : 0,
				enabled : true,
				vertexBuffer : vertexBuffer,
				componentsPerAttribute : 2,
				componentDatatype : Cesium.ComponentDatatype.FLOAT,
				normalize : false,
				offsetInBytes : 0,
				strideInBytes : 0
			}]
		});
		return vertexInfo;
	}
	
	ParticleSimulationPrimitive.prototype.drawParticleInit = function(context,frameBuf){
		//if(!defined(this.sp_particleInit)){
			this.sp_particleInit = ShaderProgram.replaceCache({
				context : context,
				shaderProgram : this.sp_particleInit,
				vertexShaderSource : particleComputeVS,
				fragmentShaderSource : particleInitFS,
				attributeLocations : {aPosition : 0}
			});
		//}
		var parInitCompCommand = this.particleInitComputeCommand;
		parInitCompCommand.fragementShaderSource = particleInitFS;
		parInitCompCommand.shaderProgram = this.sp_particleInit;
		parInitCompCommand.outputTexture = frameBuf.textures[0];
		parInitCompCommand.uniformMap = this.particleInitUniforms;

		parInitCompCommand.execute(scene._computeEngine);
	}

	ParticleSimulationPrimitive.prototype.drawParticleCompute = function(frameBuf,frameState){
		//if(!defined(this.sp_particleCompute)){
			this.sp_particleCompute = ShaderProgram.replaceCache({
				context : frameState.context,
				shaderProgram : this.sp_particleCompute,
				vertexShaderSource : particleComputeVS,
				fragmentShaderSource : particleComputeFS,
				attributeLocations : {aPosition : 0}
			});
		//}

		var parComputeCommand = this.particleComputeCommand;
		parComputeCommand.fragmentShaderSource = particleComputeFS;
		parComputeCommand.shaderProgram = this.sp_particleCompute,
		parComputeCommand.outputTexture = frameBuf.textures[0];
		parComputeCommand.uniformMap = this.particleComputeUniforms;

		parComputeCommand.execute(scene._computeEngine);
	}
	
	ParticleSimulationPrimitive.prototype.drawParticle = function(frameState){
		var context = frameState.context;
		var commandList = frameState.commandList;
		if(!defined(this.rs)){
			this.rs = RenderState.fromCache({
				depthTest : {
					enabled : true
				},
				depthMask : false,
				blending :{
					enabled : true,
					functionSourceRgb : BlendFunction.SOURCE_ALPHA,
					functionSourceAlpha : BlendFunction.SOURCE_ALPHA,
					functionDestinationRgb : BlendFunction.ONE_MINUS_SOURCE_ALPHA,
					functionDestinationAlpha : BlendFunction.ONE_MINUS_SOURCE_ALPHA
				}
			});
		}
		if(!defined(this._va)){
			this.va = this.getParticleVA(context);
		}
		
		if(!defined(this.sp_particleDraw)){
			this.sp_particleDraw = ShaderProgram.replaceCache({
				context : context,
				shaderProgram : this.sp_particleDraw,
				vertexShaderSource : particleVS,
				fragmentShaderSource : particleFS,
				attributeLocations : {
					aUV : 0
				}
			});
		}
		
		var parDrawCommand = this.particleDrawCommand;
		parDrawCommand.vertexArray = this.va;
		parDrawCommand.renderState = this.rs;
		parDrawCommand.shaderProgram = this.sp_particleDraw;
		parDrawCommand.uniformMap = this.particleUniforms;
		parDrawCommand.pass  = Pass.OPAQUE;
		parDrawCommand.primitiveType = Cesium.PrimitiveType.POINTS;
		
		commandList.push(parDrawCommand);
	}
	
	ParticleSimulationPrimitive.prototype.update = function(frameState){
		//if(!this.showed ||!defined(this.xWindVecTexture) || !defined(this.yWindVecTexture) || !defined(this.zWindVecTexture) ||!defined(this.particleTexture))
		//	return;

		if(!this.showed || !defined(this.data_tex)||!defined(this.particleTexture)|| !this.data._ready)
			return;
		
		if(this.data._ready)
			this.data_tex.updateTexture(this.data);

		if(!this.initialized){
			this.drawParticleInit(frameState.context,this.frameBuffers[0]);
			this.drawParticleInit(frameState.context,this.frameBuffers[2]);
			this.initialized = true;
		}

		var toStableFrameCount = 5;

		if(!this.particleReDistribute)
		{
			//this.drawParticleInit(frameState.context,this.frameBuffers[0]);
			this.drawParticleInit(frameState.context,this.frameBuffers[2]);
			this.particleReDistribute = true;
			toStableFrameCount = 20;
		}

		var i=0;
		while(i<toStableFrameCount){
			if(!this.pause){
				this.drawParticleCompute(this.frameBuffers[1],frameState);
				var temp = this.frameBuffers[0];
				this.frameBuffers[0] = this.frameBuffers[1];
				this.frameBuffers[1] = temp;
			}
			i++;
		}	
		this.drawParticle(frameState);
	}

	ParticleSimulationPrimitive.prototype.setColorScheme = function(arr) {
		if (!arr || !arr.length || arr.length < 6)
//			arr = [
//				0.047058823529411764, 0.2, 0.5137254901960784, 
//				0.0392156862745098, 0.5333333333333333, 0.7294117647058823,
//				0.9490196078431372, 0.8274509803921568, 0.2196078431372549, 
//				0.9490196078431372, 0.5607843137254902, 0.2196078431372549, 
//				0.8509803921568627, 0.11764705882352941, 0.11764705882352941		
//			];
			arr = [
				0, 0.23529411764705882, 0.6666666666666666, 
				0.0196078431372549, 1, 1, 
				1, 1, 0, 
				0.9803921568627451, 0, 0,
				0.5019607843137255, 0, 0
			];

		this.colorScheme = [];
		this.legendCodes = [];
		for (var i = 0; i < arr.length; i+=3) {
			this.colorScheme.push(new Cartesian3(arr[i], arr[i + 1], arr[i + 2]));

			var c = 1 << 24;
			for (var k = 2, b = 0; k > -1; k--, b+=8)
				c += ~~(255 * arr[i + k]) << b;
			this.legendCodes.push('#' + c.toString(16).substr(1));
		}
	}
	ParticleSimulationPrimitive.prototype.setValueFilter = function(enabled, range) {
        this.valueFilter.enabled = enabled;
        if (enabled && range) {
            this.valueFilter.from = range.from;
            this.valueFilter.to = range.to;
        }
    }

	ParticleSimulationPrimitive.prototype.setAlpha = function(alpha){
		this.alpha = alpha;
	}

	ParticleSimulationPrimitive.prototype.setParticleSize = function(size){
		this.pointSize = size;
	}

	ParticleSimulationPrimitive.prototype.setLevelIndex = function(levelIndex){
		this.levelIndex = levelIndex;
		this.initialized = false;
	}

	ParticleSimulationPrimitive.prototype.updateGeometry = function(options){
		if (!options)
            return;

        if (options.layerNum) {
            this.layerNum = options.layerNum;
            this.initialized = false;
		}

		if(options.reDistribute)
		{
			this.particleReDistribute = false;
		}
		
		//this.initialized = false;
        //if (options.layerInv)
            //this.layerInv = options.layerInv;
	}

	ParticleSimulationPrimitive.prototype.setVisible = function(showed){
		this.showed = showed;
	}

	ParticleSimulationPrimitive.prototype.setParticleNumber = function(particleNum){
		this.PARTICLE_DIM = particleNum;
		this.InitFrameBuffer(scene.context,this.frameBuffers[0]);
		this.InitFrameBuffer(scene.context,this.frameBuffers[1]);
		this.InitFrameBuffer(scene.context,this.frameBuffers[2]);
		this.initialized = false;
	}

	ParticleSimulationPrimitive.prototype.setPause = function(paused){
		this.pause = paused;
	}

	ParticleSimulationPrimitive.prototype.setParticleSpeed= function(speed){
		this.particleSpeed = speed;
	}


	function sc_destroy(){
		if(_sc_handler){
			_sc_handler = _sc_handler && _sc_handler.destroy();
			_sc_handler = null;
		}
		if(scPolygonPrimitive){
			entities.remove(scPolygonPrimitive);
			scPolygonPrimitive = null;
		}
		updatePositionSelecting(null);
	}

	function addCycloneLabel(data, year, decDay){
		for(var i=0;i<data.length;i++){
			var obj = data[i];
			var lng = parseFloat(obj["lon"]);
			var lat = parseFloat(obj["lat"]);
			var cyclonePlaceMarker = entities.add({
				position : Cesium.Cartesian3.fromDegrees(lng,lat),
				billboard :{
					image : './images/cyclone.png',
					verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
					pixelOffsetScaleByDistance : new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5)
				},
				label : {
					text : "No." + obj["sys_num"] +". 200" + obj["year"],
					font : '18px Helvetica',
					fillColor : Cesium.Color.RED,
					outlineColor : Cesium.Color.BLACK,
					outlineWidth : 2,
					style : Cesium.LabelStyle.FILL_AND_OUTLINE,
					horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
					pixelOffsetScaleByDistance : new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5)
				}
			});
		}
	}

	function clearCyclonePointAndPath(windPrim) {
		for(var i = 0;i<entities.length;i++){
			if(entities[i].name == "Cyclone Point"){
				entities.remove(entities[i]);
			}
		}

		if(windPrim.pathPolylines){
			windPrim.pathPolylines.removeAll();
			scene.primitives.remove(windPrim.pathPolylines);
			windPrim.pathPolylines = null;
		}
	}

	function queryFromCycloneDB(prim, polygonCoords, year, decDay){
		var urlString = "http://localhost:7000/getCyclone?year="+year + "&decDay=" + decDay +"&coords=" + polygonCoords;
		var URL = "/proxy/proxy?url=" + encodeURIComponent(encodeURI(urlString));
		
		$.get(URL,function(data){
			var cycloneInfo = document.getElementById('txtInfo');
			cycloneInfo.innerHTML = "<h3>Cyclone Infomation</h3>";
			jData = JSON.parse(data)
			prim.fCycloneDataByRegionAndTime = jData;
			for(var i = 0; i < jData.length; i++){
				var obj = jData[i];
				cycloneInfo.innerHTML += "<ul text-align : left></ul>";
				var ul = document.getElementsByTagName('ul');
				ul[i].innerHTML += "<li>Cyclone Name: No."+obj["sys_num"]+ " in 200" +obj["year"] +"</li>";
				ul[i].innerHTML += "<li>Time: " + obj["month"]+"/"+obj["day"] + "/200"+ obj["year"] + " " + obj["hour"] +":00:00"+ "</li>";
				ul[i].innerHTML += "<li>Center Pressure: "+obj["cent_pressure"]+"</li>";
				ul[i].innerHTML += "<li>laplacian: "+obj["laplacian"]+"</li>";
			}

			prim.addCycloneTrajactory(jData, year, decDay);
		});    
	}

	ParticleSimulationPrimitive.prototype.addCycloneTrajactory = function(data, year, decDay){
		if(!defined(data))
			return;

		for(var i = 0; i<cyclonePointEntity.length; i++){
			entities.remove(cyclonePointEntity[i]);
		}
		cyclonePointEntity = [];

		for(var i = 0;i < this.pathPolylines.length; i++)
		{
			scene.primitives.remove(this.pathPolylines[i]);
			this.pathPolylines = [];
		}

		var pathLines = new Cesium.PolylineCollection();
		for(var i=0;i<data.length;i++){
			var obj = data[i];
			var sd = obj["sTime"];
			var ed = obj["eTime"];
			var temp = obj["trajactory"];
			var coords = obj["trajactory"].replace(/,/g," ").trim().split(" ");

			
			pathCoords = []
			if(decDay >= sd  && decDay <= ed){
				for(var j=0;j<= (decDay - sd ) * 4 ;j++){
					var lng = parseFloat(coords[j * 2]);
					var lat = parseFloat(coords[j * 2 + 1]);
					var grid = Utils.latlng2grid(lng,lat);
					if(grid[0] >= 0 && grid[0] <= 360 && grid[1] >=0 && grid[1] <360){
						var position = Cesium.Cartesian3.fromDegrees(lng,lat,100);
						var cPoint = entities.add({
							name : "Cyclone Point",
							position : Cesium.Cartesian3.fromDegrees(lng,lat),
							point :{
								pixelSize : 8,
								color : Cesium.Color.GOLDENROD,
								alpha : 0.5,
								outlineColor : Cesium.Color.YELLOW,
								outlineWidth : 2
							}
						});
						pathCoords.push(lng);
						pathCoords.push(lat);
						cyclonePointEntity.push(cPoint);
					}
				}
			}
			if(pathCoords.length >=4){
				pathTrajactory = pathLines.add({
					positions : Cesium.Cartesian3.fromDegreesArray(pathCoords),
					width : 10,

					material : Cesium.Material.fromType(Cesium.Material.PolylineGlowType, {
						innerWidth : 3.0,
						color : new Cesium.Color(1.0, 0.5, 0.0, 1.0)
					})

				});
			}

	
		}
		scene.primitives.add(pathLines);
		this.pathPolylines.push(pathLines);
	}

	ParticleSimulationPrimitive.prototype.startDrawBox = function(){
		sc_destroy();
		_sc_pts = new Array();
		var ellipsoid = scene.globe.ellipsoid;

		scPolygonPrimitive = entities.add({
			polygon :{
				//hierarchy :Cesium.Cartesian3.fromDegreesArray([-115.0, 37.0,-115.0, 32.0,-107.0, 33.0,-102.0, 31.0,-102.0, 35.0]),	
                material : Cesium.Color.TRANSPARENT,
                outline : true,
                outlineColor : Cesium.Color.RED, 
                outlineWidth : 5.0                      
			}
		});

		// Mouse over the globe to see the cartographic position
        _sc_handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        _sc_handler.setInputAction(function(movement) {
            var cartesian = scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
            if (cartesian) {
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
				var lat = Math.degrees(cartographic.latitude);
				var lng = Math.degrees(cartographic.longitude);
				updatePositionSelecting([lat, lng]);
            } else {
				updatePositionSelecting(null);
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _sc_handler.setInputAction(function(movement) {
            var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
            if (cartesian) {
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                _sc_pts.push(Cesium.Math.toDegrees(cartographic.longitude)); 
                _sc_pts.push(Cesium.Math.toDegrees(cartographic.latitude));
                scPolygonPrimitive.polygon.hierarchy = Cesium.Cartesian3.fromDegreesArray(_sc_pts);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);


	}

	var lastTime = -1.0;
	var cyclonePointEntity = [];

	ParticleSimulationPrimitive.prototype.endDraw = function(){
        _sc_handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        _sc_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
  		sc_destroy();
  		var queryStr = "";
  		for(var i = 0; i < _sc_pts.length; i += 2){
  			var lng = _sc_pts[i].toFixed(2);
  			var lat = _sc_pts[i+1].toFixed(2);
  			var latlng = lng.toString() + " " + lat.toString();
  			queryStr += latlng +","
  		}
  		queryStr = queryStr + _sc_pts[0].toFixed(2).toString() + " " + _sc_pts[1].toFixed(2).toString();
  		//console.log("queryStr: " + queryStr);

  		var startYear = "7";
		var curTime = ~~(this.data.currentTime * this.data.fps * 0.5) * 2;
		//if(curTime != lastTime && curTime % 2==0){
			var dday = (curTime - curTime % 2) / this.data.fpd;
			queryFromCycloneDB(this, queryStr, startYear, dday + 1);
		//}
		lastTime = curTime;
	}

	ParticleSimulationPrimitive.prototype.cancelPick = function(){
  		_sc_handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        _sc_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        sc_destroy();

	}

	return ParticleSimulationPrimitive;
}();
