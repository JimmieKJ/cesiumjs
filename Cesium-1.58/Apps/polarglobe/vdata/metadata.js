MD._ext_host = 'polar.geodacenter.org:7000';
MD._gfs_udir = 'http://dpe-vm0.dhcp.asu.edu:9000/gfs/';
histDate = new Date();
histDate.setDate(histDate.getDate() - 13);

MD.tempr = {
	__VMIN : -73,
	__VMAX : 27,
	__VNAME: 'Temperature',
	__VUNIT: '°C',
	__VICLR: 'rgb',
	__VACCU: 2,
	__VHREV: true,
	__VDATA: [
		'tempr_vc_webm',
	],
};
MD.windVector = {
	__VMIN : 0,
	__VMAX : 100,
	__VNAME: 'Wind Speed',
	__VUNIT: 'm/s',
	__VICLR: 'wind',
	__VACCU: 3,
	__VDATA: [
		'wind_xy_webm',
	],
};
MD.height = {
	__VMIN : -300,
	__VMAX : 700,
	__VNAME: 'Height',
	__VUNIT: 'm',
	__VICLR: 'yrb',
	__VACCU: 1,
	__VCINT: [10, 30, 50, 1],
	//__VECFN: function(x){return Math.sign(x)*(Math.log(Math.abs(x)+Math.exp(7))-7)},
	//__VDCFN: "sign(x)*(exp(abs(x)+7.)-1096.6331584284585)",
	__VDATA: [
		'height_vc_webm',
	],
};
MD.GlobalWind = {
	__VMIN : 0,
	__VMAX : 100,
	__VNAME: 'Wind Speed',
	__VUNIT: 'm/s',
	__VICLR: 'wind',
	__VACCU: 3,
	__VDATA: [
		'gfs_uv_now_mp4',
	],
    __VDFPD: 4,
    __VDYR:  histDate.getYear() + 1900,
    __VDMON: histDate.getMonth() + 1,
    __VDDAY: histDate.getDate(),
};
MD.GlobalWindNow = {
    //DATA_DIR: new SimpleProxy('/proxy/proxy?type=image/jpeg&url=').getURL(MD._gfs_udir),
    __VTYPE: MD.TYPE_IMAGE,
	__VMIN : 0,
	__VMAX : 100,
	__VNAME: 'Wind Speed',
	__VUNIT: 'm/s',
	__VICLR: 'wind',
	__VACCU: 3,
	__VDATA: 'gfs_uv_now.jpg'/*tpa=http://polar.geodacenter.org/polarglobe/vdata/gfs_uv_now.jpg*/,
    __VDYR:  new Date().getYear() + 1900,
    __VDMON: new Date().getMonth() + 1,
    __VDDAY: new Date().getDate(),
};
MD.oceanCurrent = {
    __VTYPE: MD.TYPE_IMAGE,
	__VMIN : -2,
	__VMAX : 30,
	__VNAME: 'Water Tempr',
	__VUNIT: '°C',
	__VICLR: 'jet2',
	__VACCU: 2,
	__VDATA: 'oc_tuv.png'/*tpa=http://polar.geodacenter.org/polarglobe/vdata/oc_tuv.png*/,
    __VDYR:  2017,
    __VDMON: 1,
    __VDDAY: 1,
};
