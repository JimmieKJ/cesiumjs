uniform float uPointSize;
uniform sampler2D uPointTex;

varying vec4 vColor;

#ifdef _VS_
attribute vec3 aPosition;
attribute vec2 aTexture;

void main() {
	vec3 pos = wgs84ToCartesian(aPosition, uHeightMag);
	float dist = length(pos - uEyePos);

    vec2 tc = mod(aTexture, .2) * 5.;
	bool mask = !uIsMask || texture2D(uMaskTex, tc).a > .9;

	vec3 color = texture2D(uDataTex, aTexture).rgb;
    float v = decodeValue(color);
    bool filter = !uIsFilter || v < uFilterRange[1] && v > uFilterRange[0];

    vColor = mask && filter ? vec4(computeColor(v), 1.) : vec4(0., 0., 0., 0.);

    gl_Position = czm_viewProjection * vec4(pos, 1.0);
	gl_PointSize = mask && filter ? 9e7 / dist * uPointSize : 0.;
}
#endif
#ifdef _FS_

void main(void) {
    if (vColor.a < .5)
        discard;

	float k = texture2D(uPointTex, gl_PointCoord).r; 
	if (k < 0.1)
		discard;
        
	gl_FragColor = vec4(vColor.rgb, .15 * k);
}
#endif