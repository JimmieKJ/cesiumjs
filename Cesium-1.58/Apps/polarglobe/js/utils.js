var MD = {
    TYPE_VIDEO: 'vid',
    TYPE_IMAGE: 'img',
	__def: {
        DATA_DIR: 'vdata/',
        __VTYPE: 'vid',
		__VMIN : 0,
        __VMAX : 100,
        __VNAME: 'Unknown',
        __VUNIT: '',
        __VACCU: 3,
        __VHREV: false,
        __VCINT: [1, 3, 5, 1],
		__VECFN: function(x){return x},
		__VDCFN: "x",
        __VDATA: [],
        __VDFPS: 4,
        __VDFPD: 8,
        __VDYR:  2012,
        __VDMON: 1,
        __VDDAY: 1,
	},
    applyDataset: function(dname, isinit) {
        for (var i in this.__def)
            this[i] = this.__def[i];

		this.__VDCFN = '_FN(x) (' + this.__VDCFN + ')';

        if (!this.hasOwnProperty(dname))
            return;

        this.currData = dname;
        for (var i in this[dname])
            this[i] = this[dname][i];

        document.getElementById('date-view').innerHTML = '';
        var vdatanode = document.getElementById("vdata");
        var idatanode = document.getElementById("idata");

        while (vdatanode.firstChild) 
            vdatanode.removeChild(vdatanode.firstChild);
        vdatanode.initializing = 1;
        idatanode.src = '';
        
        vdatanode._ready = false;
        idatanode._ready = false;
        
        if (this.__VTYPE == this.TYPE_VIDEO) {
            for (var i in this.__VDATA) {
                var s = this.__VDATA[i];
                var src = document.createElement('source');
                src.setAttribute('src' , this.DATA_DIR + s);
                src.setAttribute('type', 'video/' + s.substr(s.lastIndexOf('_') + 1));
                vdatanode.appendChild(src);
            }
        } else if (this.__VTYPE == this.TYPE_IMAGE) {
            idatanode.src = this.DATA_DIR + this.__VDATA;
            
        }

        if (!isinit) { 
            for (var i in defPrim._primitives) {
                var prm = defPrim._primitives[i];
                if (prm.valueFilter) {
                //  prm.valueFilter.from = this.__VMIN;
                //  prm.valueFilter.vmin = this.__VMIN;
                //  prm.valueFilter.to   = this.__VMAX;
                //  prm.valueFilter.vmax = this.__VMAX;
                //  prm.valueFilter.nlt_min = this.__VECFN(this.__VMIN);
                //  prm.valueFilter.nlt_max = this.__VECFN(this.__VMAX);
					prm.valueDecoder = this.__VDCFN;
                }
                if (prm.isReverseHeight !== undefined)
                    prm.isReverseHeight = this.__VHREV;
            }
            if (this.__VTYPE == this.TYPE_VIDEO) {
                vdatanode.load();
                vdatanode.onloadedmetadata = function () {
                    vdatanode.playbackRate = getPlaybackSpeed();
                    vdatanode.onloadedmetadata = undefined;
                }
            }
            updateControl();
            setPlayEnabled(this.__VTYPE == this.TYPE_VIDEO);
        }
    }
};

var Utils = {
	__color_map__: [
		{name: "blackbody", clr: "#000000,#E60000,#E6D200,#FFFFFF,#A0C8FF"}, 
		{name: "summer", clr: "#008066,#FFFF66"}, 
		{name: "picnic", clr: "#0000FF,#3399FF,#66CCFF,#99CCFF,#CCCCFF,#FFFFFF,#FFCCFF,#FF99FF,#FF66CC,#FF6666,#FF0000"}, 
		{name: "copper", clr: "#000000,#FFA066,#FFC77F"}, 
		{name: "spring", clr: "#FF00FF,#FFFF00"}, 
		{name: "greys", clr: "#000000,#FFFFFF"}, 
		{name: "autumn", clr: "#FF0000,#FFFF00"}, 
		{name: "yiorrd", clr: "#800026,#BD0026,#E31A1C,#FC4E2A,#FD8D3C,#FEB24C,#FED976,#FFEDA0,#FFFFCC"}, 
		{name: "earth", clr: "#000082,#00B4B4,#28D228,#E6E632,#784614,#FFFFFF"}, 
		{name: "portland", clr: "#0C3383,#0A88BA,#F2D338,#F28F38,#D91E1E"}, 
		{name: "bluered", clr: "#0000FF,#FF0000"}, 
		{name: "rainbow", clr: "#96005A,#0000C8,#0019FF,#0098FF,#2CFF96,#97FF00,#FFEA00,#FF6F00,#FF0000"}, 
		{name: "winter", clr: "#0000FF,#00FF80"}, 
		{name: "Custom", clr: "#51853F,#E5DE50,#DEB774,#B04E39,#BA0500,#BA133A"},
		{name: "jet2", clr: "#003CAA,#05FFFF,#FFFF00,#FA0000,#800000"},
		{name: "jet", clr: "#000083,#003CAA,#05FFFF,#FFFF00,#FA0000,#800000"}, 
		{name: "rdbu", clr: "#050AAC,#6A89F7,#BEBEBE,#DCAA84,#E6915A,#B20A1C"}, 
		{name: "hot", clr: "#000000,#E60000,#FFD200,#FFFFFF"}, 
		{name: "electric", clr: "#000000,#1E0064,#780064,#A05A00,#E6C800,#FFFADC"}, 

		{name: "aqua", clr:"#00007f,#7fffff"},
		{name: "yrb", clr:"#007fff,#ff0000,#ffff7f"},
		{name: "rgb", clr:"#0000ff,#ffff00,#ff0000"},
		{name: "wind", clr: "#003CAA,#05FFFF,#FFFF00,#FA7F00,#FA0000,#BC0000,#800000"},
		{name: "bright", clr: "#0877CF,#EFF3FF,#A05146,#FFFFCC,#005A32,#F2F0F7,#4A1486,#FFFFB2,#91003F,#CDC2CE,#6E016B"}
	],

    loadFile: function (fileName) {
        var request = new XMLHttpRequest();
        request.open("GET", fileName, false);
        request.send();
        
        return request.responseText;
    },

    grid2latlng: function (x, y, isRadian) {
        var r = 179.5;
        var d = 396.219371902;		//approximate to (179.5 / Math.tan(Math.radians((90 - 41.2558) / 2)))
        var bias = Math.sqrt((x - r) * (x - r) + (y - r) * (y - r));
        var lat, lng;
        lat = 2 * Math.atan(bias / d);
        lat = 90 - Math.degrees(lat);
        lng = Math.atan((x - r) / Math.abs(y - r));
        lng = 90 - Math.degrees(lng);
        lng = lng * Math.sign(r - y);
        lng = (lng + 365) % 360;
        lng = lng > 180 ? lng - 360 : lng;

        if (isRadian) {
            lng = Math.radians(lng);
            lat = Math.radians(lat);
        }

        return [lng, lat];
    },

	latlng2grid : function(lng, lat){
        var r = 179.5;
        var c = 396.219371902;
    	var d = Math.radians(lng - 5);
    	var l = Math.tan(Math.radians((90 - lat) / 2)) * c;
    	y = r - Math.sin(d) * l;
    	x = r + Math.cos(d) * l;

		var overflow = x < 0 || x > 359 || y < 0 || y > 359;
    	x = Math.min(x, 359);
    	x = Math.max(x, 0);
    	y = Math.min(y, 359);
    	y = Math.max(y, 0);

    	return [x, y, overflow];
    },	

    createParticle: function(size, stdDev) {
        var c = document.createElement('canvas');
        var diam = size;
        var r = diam / 2;
        c.width = c.height = diam;

        var ctx = c.getContext("2d");
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, diam, diam);

        var sig = stdDev;
        var ds2 = 2 * sig * sig;
        var cst = 1 / Math.sqrt(2 * Math.PI * sig * sig);
        for (var i = 0; i < diam; i++) {
            for (var j = 0; j < diam; j++) {
                var d = ((i - r) * (i - r) + (j - r) * (j - r)) / (r * r);
                var g =  cst * Math.exp(-d / ds2);
                var hex = (~~Math.min(g * 255, 255)).toString(16);
                if (hex.length < 2)
                    hex = '0' + hex;
                ctx.fillStyle = '#' + hex + hex + hex;
                ctx.fillRect(i, j, 1, 1);
            }
        }

        return c;
    },

    clone: function (obj) {
        if (null == obj || "object" != typeof obj) return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    },
	
	arr2clr: function (arr) {
		var ret = [];
		for (var i = 0; i < arr.length; i+=3) {
			var c = 1 << 24;
			for (var k = 2, b = 0; k > -1; k--, b+=8)
				c += ~~(255 * arr[i + k]) << b;
			ret.push('#' + c.toString(16).substr(1));
		}
		return ret; 
	},

	clr2arr: function (clr) {
		if (! (clr instanceof Array))
			clr = [clr];
		var arr = clr.join().replace(/[,#]/g, '').match(/.{1,2}/g);
		var ret = arr.map(function (i) {
			var r = 0;
			try {
				r = parseInt(i, 16) / 255.;
			} catch(err) { }
			return r;
		});
		return ret;
	},

	name2clr: function (colorname) {
		if (!this._clr_list) {
			this._clr_list = {};
			var data = this.__color_map__;
			for (var i in data) 
				this._clr_list[data[i].name] = data[i].clr.split(',');
		}

		return this._clr_list[colorname];
	},
	
	name2clr_arr: function (colorname) {
		return this.clr2arr(this.name2clr(colorname));
	},

    clr2val: function (clr, min, max) {
        if (clr[3] == 0)
            return NaN;
            
        var sum = clr[0] + clr[1] + clr[2];
        return sum / (255 * 3) * (max - min) + min;   
    },

	clr2int24: function (clr) {
		return clr[3] == 0 ? NaN : clr[0] + (clr[1] << 8) + (clr[2] << 16);
	},

    clr2float_0_1: function (clr) {
        return clr[0] / 255 + clr[1] / 65025 + clr[2] / 16581375 + clr[3] / 4228250625;
    },

    sampleValuesFromRGBAArray: function(arr, n, min, max) {
        var ret = [];
        var step = arr.length / 4 / n;
        for (var index = step / 2, k = 0; k < n ; k++, index += step) {
            var i = ~~(index) * 4;
            var v = this.clr2val([arr[i], arr[i + 1], arr[i + 2], arr[i + 3]], min, max);
            ret.push(v);
        }

        return ret
    },
    
    unpackRGBAArray: function(arr, min, max, from, to) {
        from = (from * 4 || 4) - 4;
        to = (to * 4 || (arr.length - 4)) - 4;

        var ret = [];
        var a = Math.min(from, to);
        var b = Math.max(from, to);
         
        for (var k = a; k < b + 1; k += 4) {
            var i = from < to ? k : a + b - k;
            var v = this.clr2float_0_1([arr[i], arr[i + 1], arr[i + 2], arr[i + 3]]);
            v = v * (max - min) + min;
            ret.push(v);
        }
        return ret
    },
};

if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}  
        F.prototype = o; 
        return new F();  
    };
}

Math.degrees = function(r) { return r / Math.PI * 180; }
Math.radians = function(d) { return d / 180 * Math.PI; }
Math.distance= function(x1, y1, x2, y2) { return this.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)); }

Cesium.Texture.prototype.updateTexture = function (img) {
	var gl = this._context._gl;
	var texture = this._texture;
    var errcode;

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this._flipY);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    errcode = gl.getError();
	gl.bindTexture(gl.TEXTURE_2D, null);

    return errcode != gl.INVALID_VALUE;
}

Cesium.Texture.prototype.getPixel = function (x, y, w, h) {
	var _fb = new Cesium.Framebuffer({
		context : this._context,
		colorTextures : [this],
		destroyAttachments : false, 
	});
	var ret = this._context.getPixel(_fb, x, this.height - y - 1, w, h);
	_fb.destroy();

	return ret;
}

Cesium.Context.prototype.getPixel = function (fb, x, y, w, h) {
    return this.readPixels({
        x: x, y: y, 
        width: w || 1, height: h || 1, 
        framebuffer: fb
    });
}

Cesium.Scene.prototype.enableSunlight = function(enabled) {
    if (this.terrainProvider)
        this.terrainProvider._requestWaterMask = enabled;

	this.globe.depthTestAgainstTerrain = enabled;
    this.globe.enableLighting = enabled;
    this.sun.show = enabled;
}

Cesium.Scene.prototype.isSunlightEnabled = function () {
    return this.globe.enableLighting;
}

function SimpleProxy(proxy) {
	this.proxy = proxy;
	this.getURL = function (url) {
		return this.proxy + encodeURIComponent(encodeURI(url));
	}
}

!function () {
    var $this, $ele;
    var tip = 'mousetip';
    var isenabled = false;

    $.fn.mousetip = function(fn, data) {  
        function enable(enabled) {
			$this.css('cursor', enabled ? 'none' : 'default');

            if (enabled) {
                $this.hover(function() {
                    $ele.show();
                }, function() {
                    $ele.hide().removeAttr('style');
                }).mousemove(function(e) {
                    var mouseX = e.pageX;
                    var mouseY = e.pageY;
                    var w = $(window).width();

                    $ele.attr('pos', mouseX > w * .66 ? 'left' : 'right');
                
                    $ele.show().css({
                        top:mouseY, left:mouseX
                    });
                });

                isenabled = true;
            } else {
                $this.off("mouseenter mouseleave mousemove");
                $ele.hide();     
                
                isenabled = false;    
            }  
        }

        function setText(text) {
            $('.'+tip+'-inner', $this).html(data || 'Greetings!');
        }
        
        if (fn == 'setText') {
            setText(data);
            return $this;
        } else if (fn == 'enable') {
            enable(data);
            return $this;
        } else if (fn == 'isenabled') {
            return isenabled;
        } else if (typeof(fn) != 'string') {
            data = fn;
            
            $this = $(this);
            var text = data && data.text || '';
            var templ = '<div class="'+tip+'"><div class="'+tip+'-arrow"></div><div class="'+tip+'-inner">'+text+'</div></div>';
            
            var _div = document.createElement('div');
            _div.innerHTML = templ;
            
            var ele = _div.firstChild;
            $this.append(ele);
            $ele = $(ele); 

            $ele.attr('pos', 'right');
                
            if (data && data.enabled)
                enable(true);
            
            return $this;
        }
    };
} ();

!function () {
	var BoundingRectangle = Cesium.BoundingRectangle;
	var Color = Cesium.Color;
	var ComponentDatatype = Cesium.ComponentDatatype;
	var defaultValue = Cesium.defaultValue;
	var defined = Cesium.defined;
	var defineProperties = Cesium.defineProperties;
	var destroyObject = Cesium.destroyObject;
	var DeveloperError = Cesium.DeveloperError;
	var Geometry = Cesium.Geometry;
	var GeometryAttribute = Cesium.GeometryAttribute;
	var PrimitiveType = Cesium.PrimitiveType;
	var ViewportQuadVS = Cesium._shaders.ViewportQuadVS;
	var BufferUsage = Cesium.BufferUsage;
	var ClearCommand = Cesium.ClearCommand;
	var DrawCommand = Cesium.DrawCommand;
	var Framebuffer = Cesium.Framebuffer;
	var RenderState = Cesium.RenderState;
	var ShaderProgram = Cesium.ShaderProgram;

    var renderStateScratch;
    var drawCommandScratch = new DrawCommand({
        primitiveType : PrimitiveType.TRIANGLES
    });
    var clearCommandScratch = new ClearCommand({
        color : new Color(0.0, 0.0, 0.0, 0.0)
    });

    function createFramebuffer(context, outputTexture) {
        return new Framebuffer({
            context : context,
            colorTextures : outputTexture.length ? outputTexture : [outputTexture],
            destroyAttachments : false
        });
    }

    function createViewportQuadShader(context, fragmentShaderSource) {
        return ShaderProgram.fromCache({
            context : context,
            vertexShaderSource : ViewportQuadVS,
            fragmentShaderSource : fragmentShaderSource,
            attributeLocations : {
                position : 0,
                textureCoordinates : 1
            }
        });
    }

    function createRenderState(width, height) {
        if ((!defined(renderStateScratch)) ||
            (renderStateScratch.viewport.width !== width) ||
            (renderStateScratch.viewport.height !== height)) {

            renderStateScratch = RenderState.fromCache({
                viewport : new BoundingRectangle(0, 0, width, height)
            });
        }
        return renderStateScratch;
    }

    Cesium.ComputeEngine.prototype.execute = function(computeCommand) {
		var exeOptions = {};

        if (!defined(computeCommand)) {
            throw new DeveloperError('computeCommand is required.');
        }

        if (defined(computeCommand.preExecute)) {
            computeCommand.preExecute(computeCommand, exeOptions);
        }

        if (!defined(computeCommand.fragmentShaderSource) && !defined(computeCommand.shaderProgram)) {
            throw new DeveloperError('computeCommand.fragmentShaderSource or computeCommand.shaderProgram is required.');
        }

        if (!defined(computeCommand.outputTexture)) {
            throw new DeveloperError('computeCommand.outputTexture is required.');
        }

        var outputTexture = computeCommand.outputTexture;
        var width = outputTexture.width || outputTexture[0].width;
        var height = outputTexture.height || outputTexture[0].height;

        var context = this._context;
        var vertexArray = defined(computeCommand.vertexArray) ? computeCommand.vertexArray : context.getViewportQuadVertexArray();
        var shaderProgram = defined(computeCommand.shaderProgram) ? computeCommand.shaderProgram : createViewportQuadShader(context, computeCommand.fragmentShaderSource);
        var framebuffer = createFramebuffer(context, outputTexture);
        var renderState = createRenderState(width, height);
        var uniformMap = computeCommand.uniformMap;

        var clearCommand = clearCommandScratch;
        clearCommand.framebuffer = framebuffer;
        clearCommand.renderState = renderState;
        exeOptions.noClear || clearCommand.execute(context);

        var drawCommand = drawCommandScratch;
		drawCommand.primitiveType = exeOptions.primitiveType || PrimitiveType.TRIANGLES;
        drawCommand.renderState = exeOptions.renderState || renderState;
        drawCommand.vertexArray = vertexArray;
        drawCommand.shaderProgram = shaderProgram;
        drawCommand.uniformMap = uniformMap;
        drawCommand.framebuffer = framebuffer;
        drawCommand.execute(context);

        framebuffer.destroy();

        if (!computeCommand.persists) {
            shaderProgram.destroy();
            if (defined(computeCommand.vertexArray)) {
                vertexArray.destroy();
            }
        }

        if (defined(computeCommand.postExecute)) {
            computeCommand.postExecute(outputTexture);
        }
    };
} ();
