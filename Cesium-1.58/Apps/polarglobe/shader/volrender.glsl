#define VERT_SR 12.

float height2layer(float height) {
    float h = height / uHeightMag;
    float l1 = 0., l2 = 0., r = 0.;

	for (int i = 1; i < NLAYER; i++) {
        float hl = uHeights[i - 1];
        float hh = uHeights[i];
        if (hh > h) {
            l1 = float(i) - 1.;
            l2 = float(i);
            r = (h - hl) / (hh - hl);
            break;
        }
	}
	
	return LINEAR_INTERP(l1, l2, r);
}

float getValue(vec3 pos) {
    vec2 uv = pos.xy;
    if (uIsMask && texture2D(uMaskTex, uv).a < .5)
        return -1.;
        
    float z1 = height2layer(pos.z);
    float z2 = z1 + 1.;
    vec3 c1 = texture2D(uDataTex, (uv + floor(vec2(mod(z1, NGRID), z1 / NGRID))) / NGRID).xyz;
    vec3 c2 = texture2D(uDataTex, (uv + floor(vec2(mod(z2, NGRID), z2 / NGRID))) / NGRID).xyz;

    float r = mod(z1, 1.);
    return LINEAR_INTERP(decodeValue(c1), decodeValue(c2), r);    
}

vec4 computeColorVR(float val) {
    if (uIsFilter && (val < uFilterRange.x || val > uFilterRange.y) || val < -.9)
        return vec4(0., 0., 0., 0.);

	int i = 0;
    int n = int(uNColorScheme);

    for (int k = 0; k < 16; k++) {
        if (k == n - 2 || uGradPos[k + 1] > val) {
            float vmin = uGradPos[k];
            float span = uGradPos[k + 1] - vmin;

            vec3 clr = LINEAR_INTERP(uColorScheme[k], uColorScheme[k + 1], (val - vmin) / span);
            return vec4(clr, 1.);
        }
    }

	return vec4(0., 0., 0., 0.);
}


varying vec3 vPos;

#ifdef _VS_
attribute vec3 aPosition;

void main() {
    vec2 lnglat = aPosition.xy;
    float height = aPosition.z < 0. ? uHeightRange.x : uHeightRange.y;
    height *= uHeightMag;

    vPos = wgs84ToCartesian(vec3(lnglat, height));
    
    gl_Position = czm_viewProjection * vec4(vPos, 1.);
}
#endif
#ifdef _FS_

void main() {
    vec3 dv = vPos - uEyePos;
    float sampleParam = uIsMask ? VERT_SR * 3. : VERT_SR;
    dv = normalize(dv) * (uHeightRange.y - uHeightRange.x) * uHeightMag / sampleParam;

    vec3 pos = vPos;
    vec3 cart = cartesianToWgs84(pos);
    vec3 uvl = vec3(lnglat2grid(cart.xy), cart.z); 
    float val = getValue(uvl);
    vec4 nclr, clr = computeColorVR(val);

    for (float i = 0.; i < 1e4; i++) {
        if (i > sampleParam * 5.)
            break;

        float r = i * 1.2 + 2.;

        pos += dv;
        cart = cartesianToWgs84(pos);
        uvl = vec3(lnglat2grid(cart.xy), cart.z);

        if (
            any(greaterThan(uvl.xy, vec2(1., 1.))) || 
            any(lessThan(uvl.xy, vec2(0., 0.))) ||
            cart.z < uHeightRange.x * uHeightMag || 
            cart.z > uHeightRange.y * uHeightMag        
        )
            break;

        val = getValue(uvl);
        nclr = computeColorVR(val);
        clr = clr.a < .1 ? nclr : nclr.a < .1 ? clr : clr * (1. - 1. / r) + nclr * (1. / r); 
    }

	gl_FragColor = vec4(clr.rgb, clr.a * .7); 
}
#endif