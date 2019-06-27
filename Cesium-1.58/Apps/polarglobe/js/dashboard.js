VERSION = 3;

function getPlaybackSpeed() {
    var v = $('#rngPlaybackSpeed').val();
    return (v ? parseFloat(v) : 1) * 2;
}

function getPCPointSize() {
    var v = $('#rngPCPointSize').val();
    return v ? parseFloat(v) : 1;
}

function getPCLayerNum() {
    var v = $('#rngPCLayer').val();
    var fromto = (v ? v : '1;5').split(';');
    return {
        from: parseInt(fromto[0]),
        to:   parseInt(fromto[1])
    };
}

function getPCHeight() {
    var v = $('#rngPCHeight').val();
    return v ? parseInt(v) : 100;
}

function getHSOpacity() {
    var v = $('#rngHSOpacity').val();
    return v ? parseFloat(v) : 1;
}

function getHSLayerNum() {
    var v = $('#rngHSLayer').val();
    return v ? parseInt(v) : 2;
}

function getHSHeight() {
    var v = $('#rngHSHeight').val();
    return (v ? parseInt(v) : 8) * 10;
}

function getHSContourIntv() {
    var v = $('#rngHSContourIntv').val();
    return (v ? parseFloat(v) : MD.__VCINT[1]);
}

function getVPHeight() {
    var v = $('#rngVPHeight').val();
    return v ? parseInt(v) : 50;
}

function getVPOffset() {
    var v = $('#rngVPMove').val();
    return v ? parseFloat(v) * 3.6 : 0;
}

function getVolumeRangeValue() {
    var rngString = $('#rngValue').val();
    var fromto = rngString.split(';');
    return {
        from: parseInt(fromto[0]),
        to:   parseInt(fromto[1])
    };
}

function getSLLayerNum() {
    var v = $('#rngSLLayer').val();
    var fromto = (v ? v : '1;10').split(';');
    return {
        from: parseInt(fromto[0]),
        to:   parseInt(fromto[1])
    };
}

function getSLHeight() {
    var v = $('#rngSLHeight').val();
    return v ? parseInt(v) : 200;
}

function getGWLayerNum() {
    var v = $('#rngGWLayer').val();
    var fromto = (v ? v : '1;6').split(';');
    return {
        from: parseInt(fromto[0]),
        to:   parseInt(fromto[1])
    };
}

function getGWHeight() {
    var v = $('#rngGWHeight').val();
    return v ? parseInt(v) : 200;
}

function getGWNLayerNum() {
    var v = $('#rngGWNLayer').val();
    var fromto = (v ? v : '1;6').split(';');
    return {
        from: parseInt(fromto[0]),
        to:   parseInt(fromto[1])
    };
}

function getGWNHeight() {
    var v = $('#rngGWNHeight').val();
    return v ? parseInt(v) : 200;
}

function getVRLayerNum() {
    var v = $('#rngVRLayer').val();
    var fromto = (v ? v : '1;20').split(';');
    return {
        from: parseInt(fromto[0]),
        to:   parseInt(fromto[1])
    };
}

function getVRHeight() {
    var v = $('#rngVRHeight').val();
    return v ? parseInt(v) : 200;
}

function getOCLayerNum() {
    var v = $('#rngOCLayer').val();
    var fromto = (v ? v : '5;55').split(';');
    return {
        from: parseInt(fromto[0]),
        to:   parseInt(fromto[1])
    };
}

function getOCHeight() {
    var v = $('#rngOCHeight').val();
    return v ? parseInt(v) : 200;
}

function updateFPS(fps) {
    if (fps)
        document.lblFPS.innerHTML = fps.toPrecision(4) + ' FPS';
}

function updateStats(stats) {
    var str = '';
    $.each(stats, function(k, v) {
        if (!v)
            v = 'N/A';
        str += k + ': ' + v + '<br>';
    });
    document.cvsStats.innerHTML = str;
}

function toggleLegend(enabled) {
	var lgd = $('#legendTable');
	var isShow = lgd.attr('hide') === undefined;

	if (isShow && enabled !== true) {
		if ($('#colorSel').is(':visible')) {
			$('#btnColorScheme').trigger('click');
		}
        destroyGradPicker();
		lgd.attr('hide', '');
	} 
	if (!isShow && enabled !== false) 
		lgd.removeAttr('hide');
}

function toggleFullScreen() {
	if ((document.fullScreenElement && document.fullScreenElement !== null) ||	
	 (!document.mozFullScreen && !document.webkitIsFullScreen)) {
		if (document.documentElement.requestFullScreen) {
			document.documentElement.requestFullScreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullScreen) {
			document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	} else {
		if (document.cancelFullScreen) {
			document.cancelFullScreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen();
		}
	}
}

function resetCamera() {
	var selReg = $('#selRegion')[0];        
    var ci = selReg.selectedIndex == 0 ? 
        scene.camera.regionEyePos.def[window.__curr_dataset] : 
        scene.camera.regionEyePos[selReg.value.replace(' ', '_')];

	scene.camera.flyTo({
		destination: ci.pos,
		orientation: {
			heading : Cesium.Math.toRadians(0.0),
			pitch : Cesium.Math.toRadians(ci.pitch),
			roll : 0.0
		},
		duration: 2.0
	});
}

function resetFilters(prim) {
    if (!prim.setValueFilter)
        return;

	var data = prim.valueFilter;
	var slider = $("#rngValue").data("ionRangeSlider");

	$('#btnValue').iCheck(data.enabled ? 'check' : 'uncheck');

	slider.update({
		min: data.vmin - 5,
		max: data.vmax + 5,
		from: data.from,
		to: data.to,
	});            
	
	$('#selRegion').val(prim.getSpatialFilterName() || 'None');
	//resetCamera();
}

function updateControl() {
    $('#rngValue').data("ionRangeSlider").update({
        postfix: MD.__VUNIT,
    });

    $('#rngHSContourIntv').data("ionRangeSlider").update({
        min: MD.__VCINT[0],
        max: MD.__VCINT[2],
        from: MD.__VCINT[1],
        step: MD.__VCINT[3],
        postfix: MD.__VUNIT,
    });
}

function updateLegend(prim) {
	var range = prim.valueFilter;
	var data = d3.range(range.vmin, range.vmax);
	var min = d3.min(data);
	var max = d3.max(data);
	var nums = [];
	var len = prim.legendCodes.length;

    if (prim.legendGradPos) {
        for (var i = 0; i < len; i++) 
            nums.push(min + (max - min) * prim.legendGradPos[i]);
    } else {
        for (var i = 0; i < len; i++) 
            nums.push(i / (len - 1) * (max - min) + min);
    }

	var colorScale = d3.scale.linear()
		.domain(nums)
		.range(prim.legendCodes);
		
	var colorbar = Colorbar()    
		.scale(colorScale)
		.barlength(200)
		.thickness(50)
		.orient("vertical")
		.title(MD.__VNAME)
		.suffix(MD.__VUNIT);

	d3.selectAll("#vizLegend > g").remove();
	d3.selectAll("#vizLegend").append("g").attr("id","colorbar");
	d3.selectAll("#colorbar").call(colorbar);
}

function updateDatetime(year, month, day){
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];
    var date = new Date(year, 0);
    date.setMonth(month);
    date = new Date(date.setDate(day));

    var day = date.getDate();
    var month = monthNames[date.getMonth()];
    var year = date.getFullYear();

    var d = day.toString();
    if (d.length == 1)
        d = " " + d;
    var postfix;
    if (d.endsWith('1') && !d.startsWith('1'))
        postfix = 'st';
    else if (d.endsWith('2') && !d.startsWith('1'))
        postfix = 'nd';
    else if (d.endsWith('3') && !d.startsWith('1'))
        postfix = 'rd';
    else
        postfix = 'th';

    var strDT = month + " " + d + postfix + ", " + year;
    var progressor = document.getElementById('date-view');
    progressor.innerHTML = strDT
}

function updatePositionSelecting(latlng) {
    var cc = $('#cesiumContainer');
    var showtb = !!latlng;
    var istb = cc.mousetip('isenabled');
    if (showtb) {
		if (latlng.length < 2) {
			cc.mousetip('setText', 'Invalid Position');
		} else {
			var lat = latlng[0];
			var lng = latlng[1]
			cc.mousetip(
				'setText', 
				'Longitude: ' + Math.abs(lng).toFixed(3) + '° ' + (lng < 0 ? 'W' : 'E') + '<br>' +
				'Latitude : ' + Math.abs(lat).toFixed(3) + '° ' + (lat < 0 ? 'S' : 'N')
			);
		}
	}
    if (showtb != istb)
        cc.mousetip('enable', showtb);    
}

function updateValuePicking(val, tag) {
    var cc = $('#cesiumContainer');
    var showtb = window._val_picking;

    if (typeof(val) === 'number') {
        showtb = showtb && !isNaN(val);
        val = [val];
    }
    if (tag === undefined)
        tag = MD.__VNAME;
    if (typeof(tag) === 'string') {
        var tmp = [];
        for (var i in val)
            tmp.push(tag);
        tag = tmp;
    }

    showtb = showtb && val.length;

    var istb = cc.mousetip('isenabled');
    if (showtb) {
        var text = "";
        for (var i in val) 
            text += '<br>' + tag[i] + ': ' + val[i].toFixed(MD.__VACCU) + MD.__VUNIT;
        cc.mousetip('setText', text.substr(4));
    }
    if (showtb != istb)
        cc.mousetip('enable', showtb);    
}

function updateHLinePickValues(arr, offset) {
    var data = [];
    var chart = window._vp_chart;
    for(var i = 0; i < arr.length; i++)     
        data.push({'x': i / (arr.length - 1), 'v': arr[i]});

    chart.valueAxes[0].unit    = MD.__VUNIT;
    chart.valueAxes[0].maximum = MD.__VMAX;
    chart.valueAxes[0].minimum = MD.__VMIN;
	chart.valueAxes[1].guides[0].value = isNaN(offset) ? -1 : offset;
    chart.dataProvider = data;
    chart.validateData();
}

function createGradPicker(prims) {
    var prim = prims[0];
    var pos;

    if (prim.legendGradPos)
        pos = prim.legendGradPos;
    else {
        var step = 1 / (prim.legendCodes.length - 1);
        pos = [];
        for (var i in prim.legendCodes) 
            pos[i] = step * i;    
    }

    var cp = [];
    for (var i in prim.legendCodes)
        cp[i] = prim.legendCodes[i] + ' ' + (100 * pos[i]) + '%';

    $("#color-picker").removeAttr('hide');
    $("#color-picker .grad-ex").gradientPicker({
        change: function(points) { 
            var gpos = [];
            var gclr = [];
            for (var i in points) {
                gpos[i] = points[i].position;
                gclr[i] = points[i].color;
            }
            for (var i in prims) {
                prims[i].setColorScheme(Utils.clr2arr(gclr));
                prims[i].legendGradPos = gpos;
            }
            updateLegend(prim);
        },
        generateStyles: false,
        controlPoints: cp
    });    
}

function destroyGradPicker() {
    $("#color-picker").attr('hide', '');
    $("#color-picker .grad-ex").empty();    
}

function closeAllVis() {
    var v = $('.onoffswitch[checked]');
    v.each(function() {
        this.toggle(false);
    });
    v.find('.onoffswitch-checkbox').trigger('change');
}

function setPlayEnabled(enabled) {
    $('#btnPlayPause').iCheck('uncheck');
    $('#btnPlayPause').iCheck(enabled ? 'enable' : 'disable');
}

function toggleRotation(e) {
    var spinRate = -.1;
    var previousTime = Date.now();
    window.__gr_lis = window.__gr_lis || function (scene, time){
        var currentTime = Date.now();
        var delta = ( currentTime - previousTime ) / 1000;
        previousTime = currentTime;
        scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -spinRate * delta);
    };

    var eo = scene.postRender;
    var ll = eo._listeners.length;
    eo.removeEventListener(window.__gr_lis);
    e.removeAttribute('check')
    if (ll == eo._listeners.length) {
        eo.addEventListener(window.__gr_lis);
        e.setAttribute('check', '');
    }
}

//////////////////////////////////////
//Vector data simulation section//////
//////////////////////////////////////
function getParticleTrans(){
	var v = $('#rngParticleTrans').val();
	return v ? parseFloat(v) : .5;
}

function getParticleSize(){
	var v = $('#rngParticleSize').val();
	return v ? parseFloat(v) : 20;
}

function getParticleSpeed(){
	var v = $('#rngParticleSpeed').val();
	return (v ? parseFloat(v) : 1) * 2;
}

function getParticleNumber() {
	var v = $('#selParticleNumber')[0].selectedIndex;
	return (v > -1 ? Math.pow(2, v) : 1) * 256;
}

function getWindLevel(){
	var v = $('#rngWindLevel').val();
	var fromto = (v ? v :'1;7').split(';');
	return {
		from : parseInt(fromto[0]),
		to : parseInt(fromto[1])
	}
}
//////////////////////////////////////
!function () {
    var viewer;
	var setProgressBar;
    
    var prmPointCloud;
    var prmHorizontal;
    var prmVertical;
    var prmVector;
    var prmStreamline;
    var prmVolRender;
    var prmGlobalWind;
    var prmGlobalWindNow;
    var prmOceanCurrent;

    function activateVisGroup(gn, notCloseAll, notOpenDefPrim) {
        if (window.__curr_dataset == gn) 
            return;

        window.__curr_dataset = gn;
        notCloseAll || closeAllVis();
        $('.func-title:not(*[pin])').slideUp(300);
        $('.func-title[group="' + gn + '"]').slideDown(300);
        $('#dataSelector .util-button').removeAttr('checked');
        $('#dataSelector .util-button[target=' + gn + ']').attr('checked', '');

        if (notOpenDefPrim)
            return;
            
        resetCamera();
        var defPrim = $('.func-title[group="' + gn + '"] .onoffswitch[default]')
            .attr('prim');
        eval(defPrim)._ext_activate();
    }
        
    function initControl() {
        !function(data) {
            data = data.filter(function(d) { return d.clr.split(',').length < 17 });

            var w = (40 - 3) * data.length + 5 - 2;
            d3.select('#colorSel > div')
                .style('width', w + 'px')
                .selectAll('span')
                .data(data)
                .enter()
                .append('span')
                .append('canvas')
                .attr('width', 30)
                .attr('height', 200)
                .attr('name', function(d) { return d.name })
                .attr('colors', function(d) { return d.clr })
                .each(function() {
                    var w = this.width;
                    var h = this.height;
                    var colors = this.getAttribute('colors').split(',');
                    var ctx = this.getContext('2d');
                    var grd = ctx.createLinearGradient(0, h, 0, 0);

                    for (var i in colors) {
                        var pos = i / (colors.length - 1);
                        grd.addColorStop(pos, colors[i]);
                    }

                    ctx.fillStyle = grd;
                    ctx.fillRect(0, 0, w, h);

                    this.onclick = function() {
                        $('#btnColorScheme').trigger('click');
                        $(document).trigger('legendChange', [Utils.clr2arr(colors)]);
                    }
                });
        }(Utils.__color_map__);

        $('#main-title').click(function() {
            //$('.func-title:not(*[pin])').slideToggle(300);
            //$('.cvsFunction:not(*[pin],[_disabled])').slideToggle(300);
            window.__admin_lock = 1 + (window.__admin_lock || 0);
            if (window.__admin_lock > 9)
                $('#toolbar').attr('unlocked', '');
        });

        $('.onoffswitch').each(function() {
            var _this = $(this);
            var id = _this.attr('id');
            var cntStr = _this.attr('content');
            var onoff = _this.attr('checked') !== undefined;
            _this.html(
            '<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="swt_' + id + '">' +
            '<label class="onoffswitch-label" for="swt_' + id + '">' + 
            '<span class="onoffswitch-inner"></span>' +
            '<span class="onoffswitch-switch"></span>' +
            '</label>'
            );
            this.toggle = function(checked) {
                var vp_ico = $('#tbiPickValue');
                if (vp_ico.attr('check') !== undefined)
                    vp_ico.trigger('click');
                
                var cb = $('#swt_' + id);
                var cnt = $('#' + cntStr);
                if (checked === undefined)
                    checked = cb.attr('checked') === undefined;
                if (checked) {
                    cb.attr('checked', '');
                    _this.attr('checked', '');
                    cnt.removeAttr('_disabled');
                    _this.is(':visible') && cnt.slideDown(300);
                } else {
                    cb.removeAttr('checked');
                    _this.removeAttr('checked');
                    cnt.attr('_disabled', '');
                    cnt.slideUp(300);
                }
				var anyActive = $('input[id^="swt"][checked]').length > 0;
				toggleLegend(anyActive);
				$('[id^="tbi"]').toggle(anyActive);
				$('#txtAddEvent').toggle(false);
                _this.trigger('viz', checked);
            }
        });

        $('.onoffswitch').mouseup(function (){
            if (this.getAttribute('id').endsWith('Subvolume')) 
                return;
                
            this.toggle();
        });

        var checkBoxCallback = function () {
            if (this.getAttribute('id').endsWith('Subvolume')) 
                return;

            var that = this;
            var checked = $(this).attr('checked');
            var dataname = $(this.parentElement).attr('data');
            $('.onoffswitch:not([data="' + dataname + '"]) .onoffswitch-checkbox').each(function (){
                if (this.getAttribute('id').endsWith('Subvolume')) 
                    return;
                
                if (this !== that && checked) {
                    this.parentElement.toggle(false);
                }
            });

            var isShowFilter = $('.onoffswitch-checkbox[id^=swt_swt_f]').map(function (){ 
                return $(this).attr("checked");
            }).length > 0;
            $('#swt_swtSubvolume')[0].parentElement.toggle(isShowFilter);
        };
        $('.onoffswitch-checkbox').on('change', checkBoxCallback);

        $('.cvsFunction').each(function() {
            this.show = function(enabled) {
                var _this = $(this);
                if(enabled) {
                    _this.css('display', 'block');
                    _this.attr('checked', '');
                }
                else {
                    _this.css('display', 'none');
                    _this.removeAttr('checked');
                }
            }
            this.isVisible = function() {
                return $(this).attr('checked');
            }
            this.show(this.isVisible());
        });

        $('.cesium-button').click(function() {
            var cntId = $(this).attr('content');
            var cnt = $('#' + cntId);
            if(cnt[0].isVisible())
                return;
            else {
                $('.cvsFunction[checked]').slideToggle({
                    duration: 300,
                    complete: function() {
                        this.show(false);
                        $(this).trigger('viz', false);
                    }
                });
                cnt.slideToggle({
                    duration: 300,
                    complete: function() {
                        cnt[0].show(true);
                        cnt.trigger('viz', true);
                    }
                });
            }
        });

        $('#cesiumContainer').mousetip();

        $('#rngPCPointSize').ionRangeSlider({
            min: .3,
            max: 3,
            from: 1,
            step: .1,
            postfix: 'X'
        });

        $('#rngPCLayer').ionRangeSlider({
            type: "double",
            min: 1,
            max: 25,
            from: 1,
            to: 5,
            min_interval: 4,

            onFinish: function(e) {
                e.input.trigger('finish');
            }
        });

        $('#rngPCHeight').ionRangeSlider({
            min: 40,
            max: 320,
            from: 100,
            postfix: 'X',

            onFinish: function(e) {
                e.input.trigger('finish');
            }
        });

        $('#rngHSOpacity').ionRangeSlider({
            min: .1,
            max: 1,
            from: 1,
            step: .05,
        });

        $('#rngHSLayer').ionRangeSlider({
            min: 1,
            max: 3,
            from: 2,

            onFinish: function(e) {
                e.input.trigger('finish');
            }
        });

        $('#rngHSContourIntv').ionRangeSlider({
            min: MD.__VCINT[0],
            max: MD.__VCINT[2],
            from: MD.__VCINT[1],
            step: MD.__VCINT[3],
            postfix: MD.__VUNIT,
        });

        $('#rngHSHeight').ionRangeSlider({
            min: 4,
            max: 24,
            from: 8,
            postfix: 'X',
        });

        $('#rngVPHeight').ionRangeSlider({
            min: 1,
            max: 100,
            from: 50,
            postfix: 'X',
            disable: true,

            onFinish: function (e) {
                e.input.trigger('finish');
            }
        });

        $('#rngVPMove').ionRangeSlider({
            min: -100,
            max: 100,
            from: 0,
			step: .1,
            postfix: '%',
            disable: true,

            onFinish: function (e) {
                e.input.trigger('finish');
            }
        });

        $('#rngSLHeight').ionRangeSlider({
            min: 1,
            max: 500,
            from: 200,
            postfix: 'X',
        });

        $('#rngSLLayer').ionRangeSlider({
            type: "double",
            min: 1,
            max: 25,
            from: 1,
            to: 10,
            min_interval: 1,

            onFinish: function(e) {
                e.input.trigger('finish');
            }
        }).trigger('change');

        $('#rngGWHeight').ionRangeSlider({
            min: 1,
            max: 500,
            from: 200,
            postfix: 'X',
        });

        $('#rngGWLayer').ionRangeSlider({
            type: "double",
            min: 1,
            max: 18,
            from: 1,
            to: 6,
            min_interval: 1,

            onFinish: function(e) {
                e.input.trigger('finish');
            }
        }).trigger('change');

        $('#rngGWNHeight').ionRangeSlider({
            min: 1,
            max: 500,
            from: 200,
            postfix: 'X',
        });

        $('#rngGWNLayer').ionRangeSlider({
            type: "double",
            min: 1,
            max: 18,
            from: 1,
            to: 6,
            min_interval: 1,

            onFinish: function(e) {
                e.input.trigger('finish');
            }
        }).trigger('change');

        $('#rngVRHeight').ionRangeSlider({
            min: 1,
            max: 500,
            from: 200,
            postfix: 'X',
        });

        $('#rngVRLayer').ionRangeSlider({
            type: "double",
            min: 1,
            max: 25,
            from: 1,
            to: 20,
            min_interval: 1,

            onFinish: function(e) {
                e.input.trigger('finish');
            }
        }).trigger('change');

        $('#rngOCHeight').ionRangeSlider({
            min: 1,
            max: 500,
            from: 200,
            postfix: 'X',
        });

        $('#rngOCLayer').ionRangeSlider({
            type: "double",
            min: 5,
            max: 55,
            from: 5,
            to: 55,
            min_interval: 1,
            postfix: 'm',

            onFinish: function(e) {
                e.input.trigger('finish');
            }
        }).trigger('change');

        var rngSpeed = $('#rngPlaybackSpeed');
        var btnPlayPause = $('#btnPlayPause');

        btnPlayPause.iCheck({
            checkboxClass: 'icheckbox_pp-blue',
            insert: '<div class="icheck_pp-icon"></div><text></text>'
        });
        btnPlayPause.on('ifToggled', function(e) {
            var isDisable = !this.checked;
            rngSpeed.data("ionRangeSlider").update({
                disable: isDisable
            });

            if (isDisable) {
                vdata.pause();
                vdata.removeAttribute('playing');
            } else {
                vdata.play();
                vdata.setAttribute('playing', '');
            }
        });
        btnPlayPause.on('ifDisabled', function(e) {
            setProgressBar(0);    
            vdata.setAttribute('nodata', '');

        });
        btnPlayPause.on('ifEnabled', function(e) {
            vdata.removeAttribute('nodata');
        });

       rngSpeed.ionRangeSlider({
            min: .25,
            max: 3,
            from: 1,
            step: .25,
            postfix: 'X',
            disable: true
        });

        var btnValue = $('#btnValue');
        var rngValue = $('#rngValue');

        rngValue.ionRangeSlider({
            type: "double",
            min: -70,
            max: 30,
            from: -30,
            to: -15,
            postfix: MD.__VUNIT,
            disable: !btnValue.is(':checked'),

            onFinish: function () {
                rngValue.trigger('finish');
            }
        });

        btnValue.iCheck({
            checkboxClass: 'icheckbox_line-blue',
            insert: '<div class="icheck_line-icon"></div>' + btnValue.attr('name')
        });
        btnValue.on('ifToggled', function(e) {
            
            var isDisable = !this.checked;
            rngValue.data("ionRangeSlider").update({
                disable: isDisable
            });
        });

        //////////////////////////////////////
        //Vector data simulation section//////
        //////////////////////////////////////
        $('#rngParticleTrans').ionRangeSlider({
            min : .1,
            max : 1,
            from : .5,
            step : .05,
        });

        $('#rngParticleSize').ionRangeSlider({
            min : 1,
            max : 40,
            from: 20,
            step: 1,
        });
        $('#rngWindLevel').ionRangeSlider({
            type :"double",
            min : 1,
            max : 25,
            from : 1,
            to : 7,
            min_interval : 0,

            onFinish : function(e){
                e.input.trigger('finish');
            }
        });

        var rngParticleSpeed = $('#rngParticleSpeed');
        var btnParticlePause = $('#btnParticlePause');

        btnParticlePause.iCheck({
            checkboxClass: 'icheckbox_pp-blue btnSimulate',
            insert: '<div class="icheck_pp-icon"></div><text></text>'
        });

        rngParticleSpeed.ionRangeSlider({
            min: .5,
            max: 4,
            from: 2,
            step: .5,
            postfix: 'X',
            disable: true
        });
        //////////////////////////////////////


        document.lblFPS = $('#lblFPS')[0];
        document.cvsStats = $('#cvsStats')[0];

        var cvsProgressor = document.getElementById('time-progressor');
        var cpWidth = cvsProgressor.width;
        var cpHeight = cvsProgressor.height;
        var cpContext = cvsProgressor.getContext('2d');
        var _grd = cpContext.createLinearGradient(0, 0, 0, cpHeight);
        _grd.addColorStop(0, "transparent");
        _grd.addColorStop(.5, "#08f");
        _grd.addColorStop(1, "transparent");
        cpContext.fillStyle = _grd;

        setProgressBar = function (progress) {
            cpContext.clearRect(0, 0, cpWidth, cpHeight);
            cpContext.fillRect(0, 0, progress * cpWidth, cpHeight);
        }

        $('.onoffswitch').each(function() {
            var onoff = $(this).attr('checked') !== undefined;
            this.toggle(onoff);
        });
		$('.onoffswitch[checked] .onoffswitch-checkbox').trigger('change');

        
		var blackTheme = AmCharts.themes.black;
		var chart = window._vp_chart = new AmCharts.AmXYChart(blackTheme);       
		chart.theme = 'light';
		chart.fontSize = 8; 
		chart.marginTop  = 5;
		chart.marginLeft = 40;
		chart.marginRight= 25;
		chart.marginBottom= 30;
		chart.startDuration = 0;
		chart.autoMarginOffset = 10;
        chart.autoMargins = false;
		chart.dataProvider = [{'x':2,'v':0}];

		var xAxis = new AmCharts.ValueAxis(blackTheme);
		xAxis.position = "left";
		xAxis.autoGridCount = false;
		xAxis.strictMinMax = true;
		xAxis.gridCount = 10;
		chart.addValueAxis(xAxis);

		var yAxis = new AmCharts.ValueAxis(blackTheme);
		yAxis.position = "bottom";
		yAxis.autoGridCount = false;
		yAxis.strictMinMax = true;
		yAxis.gridCount = 10;
		yAxis.minimum = 0;
		yAxis.maximum = 1;
		chart.addValueAxis(yAxis);
		
		var guide = new AmCharts.Guide();
		guide.lineColor = '#fa4800';             
		guide.lineThickness = 1;
		guide.lineAlpha = 1;
		guide.value = .5;
		yAxis.addGuide(guide);

		var graph = new AmCharts.AmGraph(blackTheme);
		graph.valueField = "value";
		graph.xField = "x";
		graph.yField = "v";
		graph.lineAlpha = 1;
		graph.lineThickness = 2;
		graph.lineColor = "#e9fb26";
		graph.bullet = "round";
		graph.bulletSize = 3;
		chart.addGraph(graph);

		chart.write("cvsStats");

        chart.addListener('drawn', function() {
            $('#cvsStats a').remove();
        });

		var txtInfo = document.createElement('div');
		txtInfo.setAttribute('id', 'txtInfo');
		txtInfo.addEventListener("DOMSubtreeModified", function() {
			var cvsStats = $('#cvsStats');
			var isStatsShow = cvsStats.is(':visible');
			cvsStats.attr('mode', 'text');

			if (!isStatsShow)
				$('#icnStats').trigger('click');
		}, false);
		document.getElementById('cvsStats').appendChild(txtInfo);

		var oriurl = 'http://' + MD._ext_host + '/polarglobe?req=get_all_events&appid=' + VERSION;
		$.get(new SimpleProxy('/proxy/proxy?type=text/json&url=').getURL(oriurl), function(data) {
			if(!data || !data.events)
				return;

			var e = data.events;
			for (var i in e) {
				$('#selEvent').append(
					$('<option>').text(e[i])
				);
			}
		});
    }

    function initEventHandler() {
        var currPrims = null;

        $('div.onoffswitch[data]').on('viz', function (event, showed) {
			$('#cesiumContainer').mousetip('enable', false);
            var prim = eval(this.getAttribute('prim'));
			currPrims = currPrims || [];

            if (showed) {
                var dname = this.getAttribute('data');
                if (MD.currData != dname) {
                    MD.applyDataset(dname);
                    currPrims = [];
                } else if (currPrims.length > 0) {
                    prim.sync(currPrims[0]);
                }

                currPrims.push(prim);
                resetFilters(prim);
                updateLegend(prim);
            } else {
				var ind = currPrims.indexOf(prim);
				if (ind > -1)
					currPrims.splice(ind, 1);
			}
            prim.setVisible(showed);
            
            var isVP = currPrims.map((x)=>x._vp_supported).reduce((a,b)=>a+b, 0);
            if (isVP)
                $('#tbiPickValue').removeAttr('_disabled');
            else 
                $('#tbiPickValue').attr('_disabled', '');
        });

        $('#dataSelector .util-button').click(function() {
            var group = this.getAttribute('target');
            activateVisGroup(group);    
        })
        
        $('#rngPlaybackSpeed').on('change', function() {
            vdata.playbackRate = getPlaybackSpeed();
        });
        $('#rngGWLayer').on('change', function() {
            var ret = prmGlobalWind.updateGeometry({layerNum: getGWLayerNum()});
            $('#rngGWHeight').data("ionRangeSlider").update({
                from: ret.autoHeight
            });
        });
        $('#rngGWHeight').on('change', function() {
            prmGlobalWind.updateGeometry({heightMag: getGWHeight()});
        });
        $('#rngGWNLayer').on('change', function() {
            var ret = prmGlobalWindNow.updateGeometry({layerNum: getGWNLayerNum()});
            $('#rngGWNHeight').data("ionRangeSlider").update({
                from: ret.autoHeight
            });
        });
        $('#rngGWNHeight').on('change', function() {
            prmGlobalWindNow.updateGeometry({heightMag: getGWNHeight()});
        });
        $('#rngOCLayer').on('change', function() {
            var ret = prmOceanCurrent.updateGeometry({layerNum: getOCLayerNum()});
            $('#rngOCHeight').data("ionRangeSlider").update({
                from: ret.autoHeight
            });
        });
        $('#rngOCHeight').on('change', function() {
            prmOceanCurrent.updateGeometry({heightMag: getOCHeight()});
        });
        $('#rngSLLayer').on('change', function() {
            var ret = prmStreamline.updateGeometry({layerNum: getSLLayerNum()});
            $('#rngSLHeight').data("ionRangeSlider").update({
                from: ret.autoHeight
            });
        });
        $('#rngSLHeight').on('change', function() {
            prmStreamline.updateGeometry({heightMag: getSLHeight()});
        });
        $('#rngVRLayer').on('change', function() {
            var ret = prmVolRender.updateGeometry({layerNum: getVRLayerNum()});
            $('#rngVRHeight').data("ionRangeSlider").update({
                from: ret.autoHeight
            });
        });
        $('#rngVRHeight').on('change', function() {
            prmVolRender.updateGeometry({heightMag: getVRHeight()});
        });
        $('#rngPCPointSize').on('change', function() {
            prmPointCloud.setPointSize(getPCPointSize());
        });
        $('#rngPCLayer').on('finish', function() {
            prmPointCloud.updateGeometry({layerNum: getPCLayerNum()});
        });
        $('#rngPCHeight').on('change', function() {
            prmPointCloud.updateGeometry({heightMag: getPCHeight()});
        });
        $('#rngHSOpacity').on('change', function() {
            prmHorizontal.setAlpha(getHSOpacity());
        });
        $('#rngHSLayer').on('change', function() {
            prmHorizontal.updateGeometry({layerNum: getHSLayerNum()});
        });
        $('#rngHSHeight').on('change', function() {
            prmHorizontal.updateGeometry({heightMag: getHSHeight()});
        });
        $('#rngHSContourIntv').on('change', function() {
            prmHorizontal.setContourIntv(getHSContourIntv());
        });
        $('#rngParticleTrans').on('change',function(){
            prmVector.setAlpha(getParticleTrans());
        });
        $('#rngParticleSize').on('change',function(){
            prmVector.setParticleSize(getParticleSize());
        });
        $('#rngWindLevel').on('change',function(){
            prmVector.updateGeometry({layerNum : getWindLevel()});
        });
        $('#selParticleNumber').change(function(e){
            prmVector.setParticleNumber(getParticleNumber());
        });
        $('#btnParticlePause').on('ifToggled', function(e) {
            var isDisable = !this.checked;
            $('#rngParticleSpeed').data("ionRangeSlider").update({
                disable: isDisable
            });
            prmVector.setPause(isDisable);
        });
        $('#rngParticleSpeed').on('change',function(){
            prmVector.setParticleSpeed(getParticleSpeed());
        });
		$('#btnSCStart').on('click',function(){
			prmVector.startDrawBox();
			$(this).html('Redraw');
			$('#btnSCEnd').removeAttr('disabled');
			$('#btnSCCancel').removeAttr('disabled');
		});
		$('#btnSCEnd').on('click', function() {
			prmVector.endDraw();
			$(this).attr('disabled', '');
			$('#btnSCCancel').attr('disabled', '');
			$('#btnSCStart').html('Draw Box');
		});
		$('#btnSCCancel').on('click', function() {
			prmVector.cancelPick();
			$(this).attr('disabled', '');
			$('#btnSCEnd').attr('disabled', '');
			$('#btnSCStart').html('Start Draw');
		});
        $('#time-progressor').on('click', function(e) {
            var width = $(this).width();
            var progress = e.offsetX / width;
            var kfn = vdata.keyFrames.length;
            var kfi = Math.min(Math.round(progress * kfn), kfn - 1);
            vdata.currentTime = vdata.duration * vdata.keyFrames[kfi];
        });
        $('#btnVPStart').on('click', function() {
            prmVertical.startDraw();
            $(this).html('Redraw');
            $('#btnVPEnd').removeAttr('disabled');
            $('#btnVPCancel').removeAttr('disabled');
            $('[id^="rngVP"]').data("ionRangeSlider").update({
                disable: true
            });
        });
        $('#btnVPEnd').on('click', function() {
            prmVertical.endDraw(getVPHeight());
        });
        $('#btnVPCancel').on('click', function() {
            prmVertical.cancelDraw();
            $(this).attr('disabled', '');
            $('#btnVPEnd').attr('disabled', '');
            $('#btnVPStart').html('Start Draw');
        });
        $('#rngVPHeight').on('change', function() {
            prmVertical.updateGeometry({
                heightMag: getVPHeight()
            });
        });
        $('#rngVPMove').on('change', function() {
            prmVertical.updateGeometry({
                wallOffset: getVPOffset()
            });
        });
        $('#selRegion').change(function(e) {
            $('#btnValue').iCheck('uncheck');

            for (var i in currPrims) {
                currPrims[i].setSpatialFilter({
                    isFilter: this.selectedIndex > 0,
                    filterName: this.value
                });
            }

            resetCamera();
        });
        $('#btnValue').on('ifToggled', function(e) {
            for (var i in currPrims) 
                if (currPrims[i].setValueFilter)
                    currPrims[i].setValueFilter(this.checked);
        });
        $('#rngValue').on('change', function() {
            if ($('#btnValue:checked').length > 0)
                for (var i in currPrims) 
                    if (currPrims[i].setValueFilter)
                        currPrims[i].setValueFilter(true, getVolumeRangeValue());
        });
		$('#selEvent').change(function() {
            if (this.selectedIndex == 0)
				return;

            var that = this;
			var name = this.value;
			var oriurl = 'http://' + MD._ext_host + '/polarglobe?req=get_event_data&name=' + name + '&appid=' + VERSION;
			$.get(new SimpleProxy('/proxy/proxy?type=text/json&url=').getURL(oriurl), function(data) {
				if(!data) {
					alert('unable to retrieve an event.');
					return;
				}
				if(data.exception) 
					alert(data.exception);
				else {
					var obj = JSON.parse(data.data);
					scene.camera.flyTo({
						destination: obj.camera.position, 
						orientation: {
							heading: obj.camera.heading, 
							pitch: obj.camera.pitch, 
							roll: obj.camera.roll,
						},
                        complete: function() {
                            that.selectedIndex = 0;
                        },
                        easingFunction: function(x) {
                            return x * (x - 1) * (x - 2) + x;
                        },
					});
					vdata._start_time = obj.vprogress;

					//if (MD.currData != obj.dname)
					//	MD.applyDataset(obj.dname);
					
                    closeAllVis();
					for (var i in obj.prims) {
						var prim = eval(obj.prims[i]);
						prim.load(obj);
						prim._ext_activate();
                        if (i == 0)
						    updateLegend(prim);
					}
				}
			});
		});

        $('#icnStats').on('click', function() {
            $('#cvsStats').slideToggle(300);
            //$('#txtCode').slideToggle(300);
        });
        $('#stbiChangeBasemap').click(function () {
            var layers = viewer.scene.imageryLayers;
            layers.imgIndex = layers.imgIndex || 1;
            layers.imgIndex = layers.imgIndex % 2 + 1;

            layers.removeAll();
            layers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
                url : layers.imgIndex == 1 ?
                    '//services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer' :
                    '//services.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer'
            }));
        });
        $('#tbiLegendSwith').click(function () {
			toggleLegend();
		});
        $('#tbiPickValue').click(function () {
			var cvsStats = $('#cvsStats');
			var isStatsShow = cvsStats.is(':visible');
            window._val_picking = !this.hasAttribute('check');

			var isCharting = false;
			for (var i in currPrims)
				isCharting = isCharting || currPrims[i]._is_charting;

            if (window._val_picking) { 
                this.setAttribute('check', '');
				if (isCharting)
					cvsStats.attr('mode', 'chart');
            } else {
				$('#cesiumContainer').mousetip('enable', false);
                this.removeAttribute('check');
				if (isCharting)
					cvsStats.removeAttr('mode');
			}

			if(isCharting && window._val_picking != isStatsShow)
				$('#icnStats').trigger('click');
        });
        $('#_tbiEventSave').click(function () {
			if (!currPrims || currPrims.length == 0)
				return;

			var ele = $('#txtAddEvent');
			if (ele.is(':visible')) {
				ele.slideUp(300);
				ele.find('input').blur();
			} else {
				ele.slideDown(300);
				ele.find('input').focus();
			}
		});
		$('#txtAddEvent span.fa').click(function () {
			if (!currPrims || currPrims.length == 0) {
				alert('No active view.');
				return;
			}

			var eleName = $('#txtAddEvent input');
			var name = eleName.val();
			if (name.length == 0)
				return;
			
			var obj = {
				camera: {
					position: scene.camera.position,
					heading:  scene.camera.heading,
					pitch:    scene.camera.pitch,
					roll:     scene.camera.roll,
				},
				prims: currPrims.map(function(x) { return x._ext_identifier }),
				dname: MD.currData,
				vprogress: vdata.currentTime,
			};
			
			for (var i in currPrims)
				if (typeof(currPrims[i].save) == 'function') 
					currPrims[i].save(obj);

			var data = JSON.stringify(obj);
			var oriurl = 'http://' + MD._ext_host + '/polarglobe?req=add_event&name=' 
				+ name + '&data=' + data + '&appid=' + VERSION; 

			$.get(new SimpleProxy('/proxy/proxy?type=text/json&url=').getURL(oriurl), function(data) {
				eleName.val('');
				eleName.blur();
				$('#txtAddEvent').slideUp(300);

				if(!data) {
					alert('unable to add an event.');
					return;
				}
				if(data.exception) 
					alert(data.exception);
				else {
					alert('event ' + name + ' is successfully added!');
					$('#selEvent').append(
						$('<option>').text(name)
					);
				}
			});
		});
		$('#txtAddEvent input').keypress(function (e) {
			if (e.which == 13) 
				$('#txtAddEvent span.fa').trigger('click');
		});

        $(document).on('legendChange', function(event, arr) {
            for (var i in currPrims) 
                currPrims[i].setColorScheme(arr);
            updateLegend(currPrims[0]);
        });
        $('#btnColorScheme').click(function() {
            $('#legendTable > *').animate({width: 'toggle'}, 300);
            
            var alt = this.getAttribute('alt');
            this.setAttribute('alt', this.innerHTML);
            this.innerHTML = alt;
        });
        $('#vizLegend').click(function() {
            //$('#btnColorScheme').trigger('click');
            if ($('#color-picker').attr('hide') == undefined)
                destroyGradPicker();
            else
                createGradPicker(currPrims);
        });	

		$('#cesiumContainer').keypress(function (e) {
			if (e.which == 32) { //space key
				e.preventDefault();
				$('#btnPlayPause').iCheck('toggle');
			}
		});
    }

    function initCesium() {
        var vdata = document.getElementById("vdata");
        var idata = document.getElementById("idata");
       
        viewer = new Cesium.Viewer('cesiumContainer', {
            imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
                url : '//services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer'
                //url : '//services.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer'
            }),
            fullscreenButton: false,
            baseLayerPicker: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            homeButton: false,
            animation: false,
            geocoder: false,
            timeline: false,
            infoBox: false,
            scene3DOnly: true,
        });

        /*var terrainProvider = new Cesium.CesiumTerrainProvider({
            url : '//assets.agi.com/stk-terrain/world',
            requestVertexNormals: true,
            requestWaterMask: true
        });
        viewer.terrainProvider = terrainProvider;*/

        window.scene = viewer.scene;
        window.entities = viewer.entities;
        window.defPrim = viewer.scene.primitives;

        scene.fxaa = false; //Disable Fast Approximate Anti-aliasing, cuz it is not fast at all, especially on retina display.
		scene._oit = scene._oit || {isSupported: function() { return false }};
        scene._oit._translucentMRTSupport = false;
        scene._oit._translucentMultipassSupport = false;
        scene.debugShowFramesPerSecond = false;
        scene.skyAtmosphere.show = false;
        scene.moon.show = false;
        scene.enableSunlight(false);
		scene.copyGlobeDepth = true; //Makes czm_globeDepthTexture valid 

        var regionEyePos = {};
        regionEyePos['NorthEU'] = {
            'pos': Cesium.Cartesian3.fromRadians(.146, .826, 5e6),
            'pitch': -70
        };
        regionEyePos['Greenland'] = {
            'pos': Cesium.Cartesian3.fromRadians(-.757, .961, 5e6),
            'pitch': -70
        };
        regionEyePos['Alaska'] = {
            'pos': Cesium.Cartesian3.fromRadians(-2.668, .836, 5e6),
            'pitch': -70
        };
        regionEyePos['Wisconsin'] = {
            'pos': Cesium.Cartesian3.fromRadians(-1.556, .61, 3e6),
            'pitch': -70
        };
        regionEyePos['Draw_Box'] = {
            'pos': Cesium.Cartesian3.fromRadians(-1.467, 1.326, 1.3e7),
            'pitch': -90
        };
        var def = regionEyePos.def = {};
        def['asr'] = {
            'pos': Cesium.Cartesian3.fromRadians(-1.483, .96, 7.5e6),
            'pitch': -80
        };
        def['gfs'] = {
            'pos': Cesium.Cartesian3.fromRadians(-1.74, .757, 1.2e7),
            'pitch': -90
        };
        def['oce'] = {
            'pos': Cesium.Cartesian3.fromRadians(-1.61, -.384, 1.2e7),
            'pitch': -90
        };
        scene.camera.regionEyePos = regionEyePos;
        var ci = regionEyePos.def[$('#dataSelector .util-button[default]').attr('target')];

        scene.camera.setView({
            destination : ci.pos,
            orientation: {
                heading : Cesium.Math.toRadians(0.0),	// east, default value is 0.0 (north)
                pitch : Cesium.Math.toRadians(ci.pitch),// default value (looking down)
                roll : 0.0								// default value
            }
        });

		var dname;

		dname = $('#swt_f_Pointcloud').attr('data');
        prmPointCloud = new Cesium.PointCloudPrimitive({
            data: vdata,
            show: false,
            pointSize: getPCPointSize(),
            layerNum: getPCLayerNum(),
            heightMag: getPCHeight(),
            valueFilter: {
                vmin: MD[dname].__VMIN,
                vmax: MD[dname].__VMAX,
            },
            colorScheme: Utils.name2clr_arr(MD[dname].__VICLR),
        });
		dname = $('#swt_f_Horizontal').attr('data');
        prmHorizontal = new Cesium.HorizontalSectionPrimitive({
            data: vdata,
            show: false,
            alpha: getHSOpacity(),
            layerNum: getHSLayerNum(),
            heightMag: getHSHeight(),
            contourIntv: getHSContourIntv(),
            reverseHeight: MD.__VHREV,
            valueFilter: {
                vmin: MD[dname].__VMIN,
                vmax: MD[dname].__VMAX,
            },
            colorScheme: Utils.name2clr_arr(MD[dname].__VICLR),
        });
		dname = $('#swtVerticalProfile').attr('data');
        prmVertical = new Cesium.VerticalProfilePrimitive({
            data: vdata,
            show: false,
            heightMag: getVPHeight(), 
            valueFilter: {
                vmin: MD[dname].__VMIN,
                vmax: MD[dname].__VMAX,
            },
            colorScheme: Utils.name2clr_arr(MD[dname].__VICLR),
        });
		dname = $('#swt_f_Vector').attr('data');
        prmVector = new Cesium.ParticleSimulationPrimitive({
            data : vdata,
            alpha : getParticleTrans(),
            pointSize : getParticleSize(),
            particleNumber: getParticleNumber(),
            valueFilter: {
                vmin: MD[dname].__VMIN,
                vmax: MD[dname].__VMAX,
            },
        });
		dname = $('#swt_v_Stream').attr('data');
        prmStreamline = new Cesium.StreamLinePrimitive({
            data: vdata,
            show: false,
            layerNum: getSLLayerNum(),
            valueFilter: {
                vmin: MD[dname].__VMIN,
                vmax: MD[dname].__VMAX,
            },
            colorScheme: Utils.name2clr_arr(MD[dname].__VICLR),
        });
        dname = $('#swt_v_GlobalWind').attr('data');
        prmGlobalWind = new Cesium.GlobalWindPrimitive({
            data: vdata,
            show: false,
            layerNum: getGWLayerNum(),
            valueFilter: {
                vmin: MD[dname].__VMIN,
                vmax: MD[dname].__VMAX,
            },
            colorScheme: Utils.name2clr_arr(MD[dname].__VICLR),
        });
        dname = $('#swt_v_GlobalWindNow').attr('data');
        prmGlobalWindNow = new Cesium.GlobalWindPrimitive({
            data: idata,
            show: false,
            layerNum: getGWNLayerNum(),
            valueFilter: {
                vmin: MD[dname].__VMIN,
                vmax: MD[dname].__VMAX,
            },
            colorScheme: Utils.name2clr_arr(MD[dname].__VICLR),
        });
        dname = $('#swt_v_Ocean').attr('data');
        prmOceanCurrent = new Cesium.OceanCurrentPrimitive({
            data: idata,
            show: false,
            heightMag: 85,
            valueFilter: {
                vmin: MD[dname].__VMIN,
                vmax: MD[dname].__VMAX,
            },
            colorScheme: Utils.name2clr_arr(MD[dname].__VICLR),
        });
		dname = $('#swt_f_VolRender').attr('data');
        prmVolRender = new Cesium.VolumeRenderingPrimitive({
            data: vdata,
            show: false,
            layerNum: getVRLayerNum(),
            valueFilter: {
                vmin: MD[dname].__VMIN,
                vmax: MD[dname].__VMAX,
            },
            colorScheme: Utils.name2clr_arr(MD[dname].__VICLR),
        });

		var primdata = {
			prmPointCloud: '#swt_f_Pointcloud',
			prmHorizontal: '#swt_f_Horizontal',
			prmVertical: '#swtVerticalProfile',
			prmVector: '#swt_f_Vector',
			prmStreamline: '#swt_v_Stream',
            prmGlobalWind: '#swt_v_GlobalWind',
            prmGlobalWindNow: '#swt_v_GlobalWindNow',
            prmOceanCurrent: '#swt_v_Ocean',
            prmVolRender: '#swt_f_VolRender'
		}
		for (var i in primdata) {
			var prim = eval(i);
			var ele = primdata[i];

			defPrim.add(prim);
			$(ele).attr('prim', i);
			prim._ext_identifier = i;
			prim._ext_activate = function (ele) {
				return function () {
                    var $ele = $(ele);
                    var group = $ele.parent().attr('group');
                    activateVisGroup(group, true, true);
					$ele[0].toggle(true);
					$ele.find('.onoffswitch-checkbox').trigger('change');
				};
			} (ele);
		}

        prmVertical.onAdjust = function(heightMag, offrange) {
			var min = offrange[0] / 3.6;
			var max = offrange[1] / 3.6;
			min = ~~(min * 10) / 10;
			max = ~~(max * 10) / 10;
			
            $('#btnVPEnd').attr('disabled', '');
            $('#btnVPCancel').attr('disabled', '');
            $('#btnVPStart').html('Start Draw');
            $('#rngVPHeight').data("ionRangeSlider").update({
                disable: false,
                from: heightMag,
            });
            $('#rngVPMove').data("ionRangeSlider").update({
				disable: false,
                min: min, 
                max: max,
				from: 0,
            });
        }

        var frameRate = Cesium.FrameRateMonitor.fromScene(scene);
        (window._fps_timer = function(time) {
            setTimeout('_fps_timer(' + time + ')', time);
            updateFPS(frameRate.lastFramesPerSecond);
        }) (1000);
    }

    function initVData() {
        var vdata, idata;

        function startVideo() {
            if (! vdata.initializing)
                return;
                
            vdata.pause();
            vdata.currentTime = vdata._start_time || 0;
            vdata._start_time = 0;

            vdata.startDay = Cesium.JulianDate.fromDate(new Date(Date.UTC(
                MD.__VDYR, MD.__VDMON - 1, MD.__VDDAY
            ))).dayNumber;
            vdata.playbackRate = getPlaybackSpeed();
            vdata.muted = true;
            vdata.dayOfYear = vdata.startDay - Cesium.JulianDate.fromDate(
                new Date(Date.UTC(MD.__VDYR, 0, 1))).dayNumber + 1;
            vdata.year = MD.__VDYR;
            vdata.fpd = MD.__VDFPD;
            vdata.fps = MD.__VDFPS;
            vdata.initializing = 0;
            onProgress();
        }

        function videoDone() {
            vdata.pause();
            vdata.currentTime = 0;
            vdata.play();
        }

        //////////////////////////////////////
        //Vector data simulation section//////
        //////////////////////////////////////
		
		var updateCycloneEvent;
		var lastTime = -1.0;
		var startYear = 2007;

		function updateCyclonePath(){
			var curTime = ~~(vdata.currentTime * vdata.fps);
			if(curTime != lastTime && curTime % 2 == 0){
				var dday = curTime / vdata.fpd;
				prmVector.addCycloneTrajactory(
					prmVector.fCycloneDataByRegionAndTime,
					startYear, dday + 1
				);
			}
			lastTime = curTime;
		}

        //////////////////////////////////////

        function onProgress() {
            if (vdata.initializing)
                return;
                
            var dayOffset = ~~((vdata.currentTime - .001)/ vdata.fpd * vdata.fps);
            var secOfDay = ~~(vdata.currentTime * vdata.fps) % 8 * 10800;
            viewer.clock.currentTime.dayNumber = vdata.startDay + dayOffset;
            viewer.clock.currentTime.secondsOfDay = 25200;
            
            updateDatetime(vdata.year, 0, vdata.dayOfYear + dayOffset)
            setProgressBar(vdata.currentTime / vdata.duration);

			if(prmVector.showed)
				updateCyclonePath();
        }

        var vizPrims;
        function onSeeking() {
            if (vdata._ready === false)
                return;

            vdata._ready = false;
            //vizPrims = defPrim._primitives.filter(function(x) { return x.show; }); 
            //for (var i in vizPrims)
            //    vizPrims[i].setVisible(false);
        }

        function onSeeked() {
            vdata._ready = true;    
            for (var i in vizPrims)
                vizPrims[i].setVisible(true);
        }

        function onImgLoad() {
           idata._ready = true;
           updateDatetime(MD.__VDYR, MD.__VDMON - 1, MD.__VDDAY);
        }

        vdata = document.getElementById("vdata");
        vdata.addEventListener("canplay", startVideo, true);
        vdata.addEventListener("ended", videoDone, true);
        vdata.addEventListener("timeupdate", onProgress, true);
        vdata.addEventListener("seeking", onSeeking, true);
        vdata.addEventListener("seeked", onSeeked, true);

        idata = document.getElementById("idata");
        idata.addEventListener("load", onImgLoad, true);
        
        $.get('vdata/keyframe', function(data) {
            vdata.keyFrames = JSON.parse(data);
        });
    }

    document.onmousemove = function(e){
        window.cursorX = e.pageX * (window.devicePixelRatio || 1);
        window.cursorY = e.pageY * (window.devicePixelRatio || 1);
    }
    
    $(document).ready(function() {
        $('.func-title:not(*[pin])').hide();
        var selection = $('#dataSelector .util-button[default]');
        var group = selection.attr('target');
        MD.applyDataset(null, true);

		$('#toolbar').toggle(false);
        initCesium();
        initEventHandler();
        initControl();
        initVData();
		$('#toolbar').toggle(true);

        activateVisGroup(group, true);

        var visited = $.cookie('visited');
        if (visited == 'yes') {
             // do nothing if it is not first time visit.
        } else {
            runQuickStart();
        }
        $.cookie('visited', 'yes', {
            expires: 365 // the number of days cookie will be effective
        });
    });
}();
