#define LINEAR_INTERP(MIN, MAX, R) ((MIN) + ((MAX) - (MIN)) * (R))
#define SIGN(x) ((x) < 0. ? -1. : 1.)

#define _IN(x) ((x) > 1e-7)
#define IN_0_1(x) ((x) > 0. && (x) < 1.)

#define SQRT2 1.41421356237
#define LOG10 2.30258509299
#define GRID_SIZE 359.
#define NLAYER 29
#define NGRID 5.

const vec3 radii = vec3(6378137.0, 6378137.0, 6356752.3142451793);
const vec3 radii_2 = vec3(40680631590769., 40680631590769., 40408299984661.445);

const vec3 cAmbientColor = vec3(.1, .1, .1);
const vec3 cLightColor = vec3(.9, .9, .9);
const vec3 cSpecularColor = vec3(1., 1., 1.);

const vec3 colorspace1 = vec3(.2126, .7152, .0722);
const vec3 colorspace2 = vec3(.299, .587, .114);


uniform vec3 uEyePos;
uniform float uEyeHeight;
uniform bool uSunlight;

uniform vec3 uColorScheme[16];
uniform float uGradPos[16];
uniform float uNColorScheme;

uniform float uHeights[NLAYER];
uniform float uHeightMag;
uniform vec2 uHeightRange;

uniform sampler2D uDataTex;

uniform bool uIsMask;
uniform sampler2D uMaskTex;

uniform bool uIsFilter;
uniform vec2 uFilterRange;
uniform vec4 u_min_range_ultmin_ultrange;

vec3 wgs84ToCartesian(vec3 p, float heightMagnification) {
	vec3 vn = vec3(
		cos(p.y) * cos(p.x),
		cos(p.y) * sin(p.x),
		sin(p.y)
	);
	vn = normalize(vn);

	vec3 vk = radii_2 * vn;
	float gamma = sqrt(dot(vn, vk));
	vk = vk / gamma;
	vn = vn * p.z * heightMagnification;

	return vk + vn;
}

vec3 wgs84ToCartesian(vec3 p) {
    return wgs84ToCartesian(p, 1.);
}

vec3 cartesianToWgs84(vec3 p) {
    vec3 p2 = p * p / radii_2;
    float ratio = sqrt(1. / (p2.x + p2.y + p2.z));

    vec3 intersection = p * ratio;
    vec3 gradient = intersection / radii_2 * 2.;
    float lambda = (1. - ratio) * length(p) / (.5 * length(gradient));

    vec3 multiplier = 1. / (1. + lambda / radii_2);
    vec3 s = p * multiplier;

    vec3 n = normalize(s / radii_2);
    vec3 h = p - s;

    float lng = atan(n.y, n.x);
    float lat = asin(n.z);
    float height = SIGN(dot(h, p)) * length(h);

    return vec3(lng, lat, height);
}

//in: absolute grid coord
//out: lng, lat
vec2 grid2lnglat(vec2 p) {
    float r = 179.5;
    float d = 396.219371902;
    float bias = length(p - vec2(r, r));
    float lat, lng;
    lat = 2. * atan(bias / d);
    lat = czm_piOverTwo - lat;
    lng = atan((p.x - r) / abs(p.y - r));
    lng = czm_piOverTwo - lng;
    lng = lng * SIGN(r - p.y);
    lng = mod(lng + czm_twoPi + czm_pi / 36., czm_twoPi);
    lng = lng > czm_pi ? lng - czm_twoPi : lng;

    return vec2(lng, lat);
}

//in: lng, lat
//out: relative grid coord (from 0. to 1.)
vec2 lnglat2grid(vec2 lnglat) {
    float r = 179.5;
    float c = 396.219371902;
    float d = lnglat.x - 5. / 180. * czm_pi;
    float l = tan((czm_piOverTwo - lnglat.y) / 2.) * c;
    
    vec2 xy = vec2(r + cos(d) * l, r - sin(d) * l);
    xy /= r * 2.;
    return clamp(xy, 0., 1.);
}

float decodeValue(vec3 cv) {
    float a = (cv.r + cv.g + cv.b) / 3.;
#ifdef _FN
    vec4 v = u_min_range_ultmin_ultrange;
    float b = a * v.w + v.z;
	float c = _FN(b);
	float d = (c - v.x) / v.y;
	return d;
#else
    return a;
#endif
}

float decodeValueByUV(vec2 texCoord) {
	vec3 clr = texture2D(uDataTex, texCoord).rgb;
    return decodeValue(clr);
}

vec3 computeColor(float val) {
	vec3 ret;
    int n = int(uNColorScheme);

    for (int k = 0; k < 16; k++) {
        float vmin = uGradPos[k];
        float span = uGradPos[k + 1] - vmin;
        ret = LINEAR_INTERP(uColorScheme[k], uColorScheme[k + 1], (val - vmin) / span);

        if (k == n - 2 || uGradPos[k + 1] > val)
            break;
    }

	return ret;
}

vec3 rgb2luminosity(vec3 rgb) 
{
	float l = dot(rgb, colorspace2);
	return vec3(l, l, l);
}

vec3 reverseColor(vec3 clr)
{
	return vec3(1., 1., 1.) - clr;
}

vec4 pack_0_1(float v) {
    vec4 bitSh = vec4(1., 255., 65025., 16581375.) * v;
    vec4 bitMsk= vec4(1./255., 1./255., 1./255., 0.);
    vec4 bits = fract(bitSh);
    bits -= bits.yzww * bitMsk;
    return bits;
}

vec3 float2int24(float v) {	
	const vec3 bitSh = vec3(
		256.,
		256. * 256.,
		256. * 256. * 256.
	);
	const vec3 bitMsk = vec3(
		0.,
		1. / 256.,
		1. / 256.
	);
	vec3 int24 = fract(v / bitSh);
	int24 -= int24.xxy * bitMsk;

	return int24;
}