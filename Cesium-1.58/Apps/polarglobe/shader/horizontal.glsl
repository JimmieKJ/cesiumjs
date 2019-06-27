#extension GL_OES_standard_derivatives : enable

uniform float uVerInv;
uniform float uTexInv;
uniform bool uRevHeight;

uniform float uContourDensity;
uniform vec3 uLightDir;
uniform float uAlpha;

float getHeight(float val) {
    return uHeightMag * (uRevHeight ? 1. - val : val) * 2.; 
}

float getHeight(vec2 texCoord) {
    return getHeight(decodeValueByUV(texCoord));
}

vec3 getNormal(vec2 pos, vec2 tc) 
{
    vec2 p = pos;
    vec2 t = tc;
    vec3 v0 = wgs84ToCartesian(vec3(grid2lnglat(p), getHeight(t)));

    p = vec2(pos.x + uVerInv, pos.y);
    t = vec2(tc.s + uTexInv, tc.t);
    vec3 v1 = wgs84ToCartesian(vec3(grid2lnglat(p), getHeight(t))) - v0;

    p = vec2(pos.x, pos.y - uVerInv);
    t = vec2(tc.s, tc.t - uTexInv);
    vec3 v2 = wgs84ToCartesian(vec3(grid2lnglat(p), getHeight(t))) - v0;

    p = vec2(pos.x - uVerInv, pos.y);
    t = vec2(tc.s - uTexInv, tc.t);
    vec3 v3 = wgs84ToCartesian(vec3(grid2lnglat(p), getHeight(t))) - v0;

    p = vec2(pos.x, pos.y + uVerInv);
    t = vec2(tc.s, tc.t + uTexInv);
    vec3 v4 = wgs84ToCartesian(vec3(grid2lnglat(p), getHeight(t))) - v0;

    vec3 c = normalize(cross(v1, v2));
    c += normalize(cross(v2, v3));
    c += normalize(cross(v3, v4));
    c += normalize(cross(v4, v1));

    return normalize(c);
}

varying vec2 vTex;
varying vec3 vColor;
varying float vValue;

varying vec3 vNorm;
varying vec3 vCameraVector;

#ifdef _VS_
attribute vec2 aPosition;
attribute vec2 aTexture;

void main() {
    vTex = aTexture;
    vValue = decodeValueByUV(aTexture);
#ifdef _DRAW_ 
	vNorm = getNormal(aPosition, aTexture);
	vColor = computeColor(vValue);
#endif
#ifdef _PICK_
	vColor = texture2D(uDataTex, aTexture).rgb;
#endif

    vec2 lnglat = grid2lnglat(aPosition);
    vec3 pos = wgs84ToCartesian(vec3(lnglat, getHeight(vValue)));

#ifdef _DRAW_
	vCameraVector = uEyePos - pos;
#endif
	gl_Position = czm_viewProjection * vec4(pos, 1.);
}
#endif
#ifdef _FS_

void main() {
    vec2 tc = mod(vTex, .2) * 5.;
	bool mask = !uIsMask || texture2D(uMaskTex, tc).a > .9;
    bool filter = !uIsFilter || vValue < uFilterRange[1] && vValue > uFilterRange[0];

	if (!mask || !filter)
		discard;

#ifdef _DRAW_
    float df = fwidth(vValue);
    float f  = fract (vValue * uContourDensity);
    float g = smoothstep(df * uContourDensity, df * uContourDensity * 2., f);
    
    f  = fract (vValue * uContourDensity / 5.);
    float g2 = smoothstep(df * uContourDensity * .3, df * uContourDensity * .6, f);
   
    vec3 norm = normalize(vNorm);
	vec3 lightDir = normalize(uSunlight ? czm_sunDirectionWC : uLightDir);
	vec3 cameraVector = normalize(vCameraVector);

	float directionalLightWeighting = max(dot(norm, lightDir), 0.0);
	float specularLightWeighting = 0.0;
	if (directionalLightWeighting > 0.0) {
		vec3 halfVector = normalize(lightDir + cameraVector);
		specularLightWeighting = pow(dot(halfVector, norm), 128.0);
	}

	vec3 lightWeighting = cAmbientColor + cLightColor * directionalLightWeighting;
    vec3 oriColor = 
        _IN(g2) && _IN(g) ? vColor :
        _IN(g) ? vec3(0., 0., 0.) : 
        vec3(.3, .3, .3);
	vec3 midColor = oriColor * lightWeighting;
	gl_FragColor = vec4(cSpecularColor - (cSpecularColor - midColor) * (1. - specularLightWeighting), uAlpha);
#endif
#ifdef _PICK_
	gl_FragColor = vec4(vColor, 1.); 
#endif
}
#endif