#define RAND(a, b) fract(sin(dot((a).xy, (b).xy * (b).z)) * 45632.849)

#define FADE_FACT 5e-9
#define SPEED 2e-6 
#define LIFE 200.
#define VAL_MASK .4

uniform float uRandSeed;
uniform vec2 uPickPos;

uniform sampler2D uInputTex;
uniform sampler2D uDrawTex;
uniform sampler2D uShowTex;
uniform sampler2D uPosTex0;
uniform sampler2D uPosTex1;
uniform sampler2D uDepthTex;

vec4 initParticle(vec2 uv, bool init) {
	vec3 pos = vec3(
		RAND(uv, vec3(32.25363, 67.75623, uRandSeed)),
		RAND(uv, vec3(78.63637, 55.22273, uRandSeed)),
		RAND(uv, vec3(16.22632, 98.72634, uRandSeed))
	);
	float age = init ? 
		floor(RAND(uv, vec3(73.36374, 20.65134, uRandSeed)) * LIFE) + .5
	: .5;

	return vec4(pos, age);
}

float decodeValueSL(vec3 cv) {
    return (cv.r + cv.g + cv.b) / 1.5 - 1.;
}

vec2 pickLayerValue(vec2 xy, float z) {
	vec2 st = (xy + vec2(mod(z, NGRID), floor(z / NGRID))) / NGRID;
	vec2 st_x = vec2(st.x * .5, st.y);
	vec2 st_y = vec2(st.x * .5 + .5, st.y);
	
	return vec2(
		decodeValueSL(texture2D(uDataTex, st_x).rgb),
		decodeValueSL(texture2D(uDataTex, st_y).rgb)
	);
}

vec2 computeVector(vec3 pos) {
	int ind = 0;
	float s = uHeightRange.x;
	float r = uHeightRange.y - uHeightRange.x;
	float vmin = 0.;
	float vmax = 0.;

	for (int i = 1; i < NLAYER; i++) {
		ind = i;
		float relH = (uHeights[i] - s) / r; 
		if (pos.z < relH) {
			vmax = relH;
			break;
		}
		vmin = relH;
	}
	
	vec2 v1 = pickLayerValue(pos.xy, float(ind - 1));
	vec2 v2 = pickLayerValue(pos.xy, float(ind));
	float ratio = (pos.z - vmin) / (vmax - vmin);
	
	return LINEAR_INTERP(v1, v2, ratio);
}

#ifdef _INIT_
varying vec2 v_textureCoordinates;

void main() {
	vec2 uv = v_textureCoordinates;
	vec4 _out = initParticle(uv, true);
	
	gl_FragData[0] = _out;
}
#endif

#ifdef _EVOL_
varying vec2 v_textureCoordinates;

void main() {
	vec2 uv  = v_textureCoordinates;
	vec4 _in = texture2D(uInputTex, uv);
 
	vec4 _out;
	vec2 _vel;
	if (_in.w > LIFE) {
		_out = initParticle(uv, false);
		_vel = computeVector(_out.xyz);
	} else {
		float spd_ratio = clamp(sqrt(uEyeHeight) * SPEED, 1e-3, .1);
		float time_ratio= clamp(floor(3. * log(uEyeHeight) / LOG10 - 17.), 1., 4.);

		_vel = computeVector(_in.xyz);
		_out = vec4(_in.xy + _vel * spd_ratio, _in.z, _in.w + time_ratio);
		if (!IN_0_1(_out.x) || !IN_0_1(_out.y)) {
			_out = vec4(clamp(_out.xy, 0., 1.), _in.z, LIFE + .5);
		}
	}

	//vec2 _vel = computeVector(_out.xyz); //correct, but 1.5 times slower
	//float spd = length(_vel) / SQRT2; // Actual Value

	//float length (genType x)  返回向量x的长度
	//现在只能求length(_vel)和1.0的最小值，如果只是用length(_vel)不出效果，不清楚为什么
	float spd = min(length(_vel), 1.); // Legend Value
	_out.w = floor(_out.w) + .5 + VAL_MASK * spd * 2. - VAL_MASK; 
	
	gl_FragData[0] = _out;
}
#endif

#ifdef _FADE_
varying vec2 v_textureCoordinates;

void main() {
	vec2 uv  = v_textureCoordinates;
	vec4 oriColor = texture2D(uDrawTex, uv);
	if (oriColor.a < .02)
		discard;

	float fv = clamp(1. - FADE_FACT * uEyeHeight, 0., .987);
	gl_FragColor = oriColor * fv;
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
		//_in.w<3.1时，还是正常，大于3.1就不正常了
		if (_in.w < 1.)
			alpha = 0.;
	}

	vec3 clr = vec3(0., 0., 0.);
	vec3 pos = vec3(0., 0., 0.);

	if (alpha > .1) {
		float height = uHeightRange.x + (uHeightRange.y - uHeightRange.x) * _in.z;
		vec2 lnglat = grid2lnglat(_in.xy * GRID_SIZE);
		pos = wgs84ToCartesian(vec3(lnglat, height * uHeightMag));
	
		float spd = (fract(_in.w) - .5) / VAL_MASK / 2. + .5 ;
		clr = computeColor(spd);
		alpha += .5 * spd; 
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

#ifdef _PICK_
varying vec2 v_textureCoordinates;

void main() {
	float i = gl_FragCoord.x - .5;
	vec2 _vel = pickLayerValue(uPickPos / GRID_SIZE, i);
    
    //float spd = length(_vel) / SQRT2; // Actual Value
	float spd = min(length(_vel), 1.); // Legend Value
    gl_FragColor = pack_0_1(spd);
}
#endif