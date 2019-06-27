#extension GL_EXT_draw_buffers : enable
#extension GL_OES_standard_derivatives : enable

uniform float uHLineHeight;
uniform float uNHSamples;

varying vec3 vColor;
varying float vHeight;
varying float vOffset;

#ifdef _VS_
attribute vec4 position;
attribute vec2 texcoords;

void main(void) {
    vec3 pos = vec3(position.xy, position.z * uHeightMag);
    vec3 color = texture2D(uDataTex, texcoords).rgb;
	vHeight = position.z;
    vOffset = position.w;

#ifdef _DRAW_
	float v = decodeValue(color);
	vColor = computeColor(v);
#endif
#if defined(_PICK_VAL_) || defined(_PICK_LINE_)
	vColor = color;
#endif

#ifdef _PICK_LINE_
    gl_Position = vec4(position.w * 2. - 1., (position.z - uHLineHeight) / 40., 0. ,1.);
#endif
#if defined(_PICK_VAL_) || defined(_DRAW_)
    gl_Position = czm_viewProjection * vec4(wgs84ToCartesian(pos), 1.);
#endif
}
#endif

#ifdef _PICK_VAL_
#ifdef _FS_
void main(void) {
    vec3 int24Height = float2int24(vHeight);
	vec3 int24Offset = float2int24(vOffset * 65536.);
	gl_FragData[0] = vec4(vColor, 1.);
	gl_FragData[1] = vec4(int24Height, 1.);
	gl_FragData[2] = vec4(int24Offset, 1.);
}
#endif
#endif

#ifdef _PICK_LINE_
#ifdef _FS_
void main(void) {
	gl_FragColor = vec4(vColor, 1.);
}
#endif
#endif

#ifdef _DRAW_
#ifdef _FS_
void main(void) {
    bool isDrawHLine = uHLineHeight > 0.;
	if (isDrawHLine) 
	{
		float df = fwidth(vHeight);
		isDrawHLine = isDrawHLine && vHeight < uHLineHeight && uHLineHeight < vHeight + df;

        float dFdOff = fwidth(vOffset);
        float f  = fract (vOffset * uNHSamples);
        float g = smoothstep(dFdOff * uNHSamples, dFdOff * uNHSamples * 2., f);
        isDrawHLine = isDrawHLine || !_IN(g);
	}

	gl_FragColor = isDrawHLine ? vec4(rgb2luminosity(reverseColor(vColor)), 1.) : vec4(vColor, 1.);
}
#endif
#endif