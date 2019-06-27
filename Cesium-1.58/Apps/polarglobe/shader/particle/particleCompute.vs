#ifdef GL_ES
precision highp float;
#endif



varying vec4 vColor;

//uniform vec4 uColor;
uniform float uAlpha;
uniform sampler2D uParticleTexture;
varying mat4 vTextureMat;
varying mat4 vCameraRot;
uniform float uLevelFrom;
uniform float uLevelTo;
varying float curLevel;

//varying vec3 vLightWighting;


void main() {
	//vec2 uv = gl_PointCoord;
	vec2 st = vec2(gl_PointCoord.x, gl_PointCoord.y);
	vec2 uv  = (vTextureMat * vCameraRot * vec4(st - vec2(0.5),0.0,1.0)).xy + vec2(0.5);
	float alphaMask = texture2D(uParticleTexture, uv).r;

	float levelAlpha = 0.5 + (curLevel - uLevelFrom)/(uLevelTo - uLevelFrom) * 0.5;
	gl_FragColor = vec4(vColor.rgb, vColor.a * uAlpha * alphaMask);
}