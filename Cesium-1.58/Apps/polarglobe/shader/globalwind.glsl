#define RAND(a, b) fract(sin(dot((a).xy, (b).xy * (b).z)) * 45632.849)

#define FADE_FACT 3e-8
#define SPEED 4e-7
#define LIFE 1000.
#define VAL_MASK .4
#define X_GRID_SIZE 1439.
#define Y_GRID_SIZE  720.
#define NGRID_X 3.
#define NGRID_Y 6.
#define OC_NLAYER 18

uniform float uRandSeed;
uniform float uOCHeights[18];
uniform vec2 uOCHeightRange;

uniform sampler2D uInputTex;
uniform sampler2D uDrawTex;
uniform sampler2D uShowTex;
uniform sampler2D uPosTex0;
uniform sampler2D uPosTex1;
uniform sampler2D uDepthTex;

float decodeValueSL(vec3 cv) {
    return (cv.r + cv.g + cv.b) / 1.5 - 1.;
}
float decodeValueTemp(vec3 cv) {
    return (cv.r + cv.g + cv.b) / 3.;
}

vec3 pickLayerValue(vec2 xy, float z) {
    vec2 st = (xy + vec2(mod(z, NGRID_X), floor(z / NGRID_X))) / vec2(NGRID_X, NGRID_Y);
    vec2 st_x = vec2(st.x * .5, st.y);
	vec2 st_y = vec2(st.x * .5 + .5, st.y);
	
	return vec3(
		decodeValueSL(texture2D(uDataTex, st_x).rgb),
		decodeValueSL(texture2D(uDataTex, st_y).rgb),
        0.
	);
}

vec3 computeVector(vec3 pos) {	
	int ind = 1;
	float s = uOCHeightRange.x;
	float r = uOCHeightRange.y - uOCHeightRange.x;
	float vmin = 0.;
	float vmax = 1.;

	for (int i = 1; i < OC_NLAYER ; i++) {
		ind = i;
		float relH = (uOCHeights[i] - s) / r; 
		if (pos.z > relH) {
			vmin = relH;
			break;
		}
		vmax = relH;
	}
	
	vec3 v1 = pickLayerValue(pos.xy, float(ind - 1));
	vec3 v2 = pickLayerValue(pos.xy, float(ind));
	float ratio = (pos.z - vmin) / (vmax - vmin);
 
	return LINEAR_INTERP(v1, v2, ratio);
}


vec2 grid2lnglat_mercator(vec2 p) {
	float lng = p.x * .25;
	float lat = 90. - p.y * .25;
	
	lat = czm_pi * lat/180.;
	lng = czm_pi * lng/180.;

    return vec2(lng, lat);
}

vec4 initParticle(vec2 uv, bool init) {
    float y = 0.;
    float p = RAND(uv, vec3(89.26456, 65.64545, uRandSeed));
    for (int i = 0; i < 32; i++) {
        y = RAND(vec2(uv.x, y), vec3(32.25363, 67.75623, uRandSeed));
        if (p < cos(czm_pi * (y - .5)))
            break;
    }
    vec3 pos = vec3(
        RAND(uv, vec3(78.63637, 55.22273, uRandSeed)),
        y,
        RAND(uv, vec3(73.36374, 20.65134, uRandSeed))
    );
    
    //vec3 pos = vec3(
    //    uv.x,
    //    uv.y,
    //    RAND(uv, vec3(73.36374, 20.65134, uRandSeed))
    //);
    
    float age = init ? 
        floor(RAND(uv, vec3(16.22632, 98.72634, uRandSeed)) * LIFE) + .5
    : .5;

    return vec4(pos, age);
}

#ifdef _INIT_
varying vec2 v_textureCoordinates;

void main() {
	vec2 uv = v_textureCoordinates;
	vec4 _out = initParticle(uv, true);
	//vec4 _out = vec4(uv,1.0,floor(RAND(uv, vec3(16.22632, 98.72634, uRandSeed)) * LIFE) + .5);
	gl_FragData[0] = _out;
}
#endif

#ifdef _EVOL_
varying vec2 v_textureCoordinates;

void main() {
	vec2 uv  = v_textureCoordinates;
	vec4 _in = texture2D(uInputTex, uv);
    vec4 _ori = _in;
 
	vec4 _out;
	vec3 _vel;
	if (_in.w > LIFE) {
		_out = initParticle(uv, false);
        //_out = vec4(uv,1.0,1.0);
		_vel = computeVector(_out.xyz);
	} else {
		float spd_ratio = clamp(sqrt(uEyeHeight) * SPEED, 1e-3, .1);
		float time_ratio= clamp(floor(3. * log(uEyeHeight) / LOG10 - 17.), 1., 4.);

        _vel = computeVector(_in.xyz);
        _out = vec4(
            mod(_in.x + _vel.x * spd_ratio / cos((_in.y - .5) * czm_pi) + 1., 1.), 
            _in.y - _vel.y * spd_ratio, 
            _in.z, 
            _in.w + time_ratio
        );
        _vel = computeVector(_out.xyz);

        if (!IN_0_1(_out.y) ) {
            _out = vec4(_ori.xyz, LIFE + .5);
        }
    }

	//vec2 _vel = computeVector(_out.xyz); //correct, but 1.5 times slower
	//float spd = length(_vel) / SQRT2; // Actual Value
	float spd = min(length(_vel.xy), 1.);//min(length(_vel), 1.); // Legend Value
	_out.w = floor(_out.w) + .5 + VAL_MASK * spd * 2. - VAL_MASK; 
	
	gl_FragData[0] = _out;
}
#endif

#ifdef _FADE_
varying vec2 v_textureCoordinates;

void main() {
	vec2 uv  = v_textureCoordinates;
	vec4 oriColor = texture2D(uDrawTex, uv);
	if (oriColor.a < .1) {
        gl_FragColor = vec4(0., 0., 0., 0.);
        return;
    } else if (oriColor.a < 1e-4)
		discard;

	float fv = clamp(1. - FADE_FACT * uEyeHeight * 0.4, 0., .98);
    //float fv = 0.7;
	gl_FragColor = vec4(oriColor.rgb, oriColor.a * fv);
}
#endif

#ifdef _DRAW_

varying vec4 color;

#ifdef _VS_
attribute vec3 uvi;

void main() {
	vec4 _in;
	float alpha = .4;

	if (uvi.z < 0.) {
		_in = texture2D(uPosTex0, uvi.st);
		if (_in.w > LIFE)
			alpha = 0.;
	} else {
		_in = texture2D(uPosTex1, uvi.st);
		if (_in.w < 1.)
			alpha = 0.;
	}

	vec3 clr = vec3(0., 0., 0.);
	vec3 pos = vec3(0., 0., 0.);

	if (alpha > .1) {
		float height = uOCHeightRange.x + (uOCHeightRange.y - uOCHeightRange.x) * _in.z;
		vec2 lnglat = grid2lnglat_mercator(vec2(_in.x * X_GRID_SIZE,_in.y * Y_GRID_SIZE));
		pos = wgs84ToCartesian(vec3(lnglat, height * uHeightMag));
	
		float spd = (fract(_in.w) - .5) / VAL_MASK / 2. + .5 ;
		clr = computeColor(spd);
		alpha += .8;//.5 * spd; 
	}
	color = vec4(clr, alpha);

    gl_Position = czm_viewProjection * vec4(pos, 1.);
}
#endif
#ifdef _FS_

void main(){
    if (color.a < .1)
        discard;
        
	vec2 uv = gl_FragCoord.xy / czm_viewport.zw;
	float z = czm_unpackDepth(texture2D(uDepthTex, uv));
	if(gl_FragCoord.z > z && z > 0.)
		discard;

	gl_FragColor = color; 
}
#endif
#endif

#ifdef _SHOW_
varying vec2 v_textureCoordinates;

void main() {
	vec2 uv  = v_textureCoordinates;
	gl_FragColor = texture2D(uShowTex, uv);
}
#endif
