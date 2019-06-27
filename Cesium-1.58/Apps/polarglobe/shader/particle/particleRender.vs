#ifdef GL_ES
precision highp float;
#endif

#define GRID_LENGTH 360.0
#define GRID_WIDTH 360.0
#define GRID_HEIGHT 25.0
#define MAPINROW  5.0

#define LINEAR_INTERP(MIN, MAX, R) ((MIN) + ((MAX) - (MIN)) * (R))
#define PI 3.1415926

const vec3 radii_2 = vec3(40680631590769., 40680631590769., 40408299984661.445);


attribute vec2 aUV;

varying vec3 vGridCoord;
varying vec4 vColor;

uniform bool uIsMask;
uniform bool uIsFilter;
uniform vec2 uRange;

uniform mat4 uViewProjMat;
uniform float uSize;
uniform sampler2D uPosTexture;

//uniform sampler2D uXWindTexture;
//uniform sampler2D uYWindTexture;
//uniform sampler2D uZWindTexture;
uniform sampler2D uWindTexture;

uniform vec3 uColorScheme[16];
uniform float uNColorScheme;

varying mat4 vTextureMat;
varying mat4 vCameraRot;
varying float curLevel;

float decode(vec3 color,float minValue, float maxValue){
	return (color.r + color.g + color.b)/3.0 *(maxValue -minValue) +minValue;
}

vec3 getVelority(vec3 coord3D){
	vec2 xST;
	xST.x = (mod(coord3D.z-1.0,MAPINROW) * GRID_LENGTH + coord3D.x) / 3600.0;
	xST.y = (floor((coord3D.z-1.0)/MAPINROW) * GRID_WIDTH + coord3D.y) / 1800.0;

	vec2 yST = vec2(xST.x + 0.5,xST.y);
	vec3 xWind = texture2D(uWindTexture,xST).rgb;
	vec3 yWind = texture2D(uWindTexture,yST).rgb;
	float fxWind = decode(xWind,-100.0,100.0);
	float fyWind = decode(yWind,-100.0,100.0);
	vec3 windVec = vec3(fxWind,fyWind,0.0);
	return windVec;
}
vec3 computeColor(float val)
{
	int n = int(uNColorScheme);
	int i = int(val * (uNColorScheme - 1.));
	i = i > n - 2 ? n - 2 : i;
	float vmin = float(i) / (uNColorScheme - 1.);
	float span = 1. / (uNColorScheme - 1.);

	//vec3 color = uColorScheme[0];
	vec3 sColor;
	vec3 eColor;
	if(i == 0){
		sColor = uColorScheme[0];
		eColor = uColorScheme[1];
	}else if(i == 1){
		sColor = uColorScheme[1];
		eColor = uColorScheme[2];
	}else if(i ==2){
		sColor = uColorScheme[2];
		eColor = uColorScheme[3];
	}else if(i==3){
		sColor = uColorScheme[3];
		eColor = uColorScheme[4];
	}else{
		sColor = uColorScheme[4];
		eColor = uColorScheme[5];
	}	
	return LINEAR_INTERP(sColor, eColor, (val - vmin) / span);
}




vec2 grid2lalng(vec2 xy){
	float r = 179.5;
	float d = 396.219371902;
	float bias = length(xy - vec2(r,r));
	float lat = 2.0 * atan(bias/d);
	lat = 90.0 - degrees(lat);
	float lng = atan((xy.x - r)/abs(xy.y -r));
	lng = 90.0 - degrees(lng);
	lng = lng * sign(r - xy.y);
	lng = mod(lng + 365.0,360.0);
	lng = lng >180.0 ? lng -360.0 : lng;
	
	lng = radians(lng);
	lat = radians(lat);
	return vec2(lng,lat);
}

vec3 wgs84ToCartesian(vec3 p, float heightMagnification) 
{
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
// source: http://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float rand(vec2 seed) {
  return fract(sin(dot(seed.xy,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  //gl_PointSize = uSize;

  vec4 pos =  texture2D(uPosTexture, aUV);
  //vGridCoord = pos.rbg;

  vec3 velVec = getVelority(pos.rgb);

  float vel = length(velVec);

  gl_PointSize = uSize * (vel/90.0  * 0.8+ 0.05) * 5.0;

bool filter = !uIsFilter || vel / 100. < uRange[1] && vel / 100. > uRange[0];

vColor = filter ? vec4(computeColor(vel / 90.), 1.) : vec4(0., 0., 0., 0.);

  //vColor= computeColor(vel/90.0);

  curLevel = pos.z;

  pos.z = pos.z * 500.0 + 200.0;
  vec3 sphereCoord = vec3(grid2lalng(pos.xy),pos.z);
  pos  = vec4(wgs84ToCartesian(sphereCoord,100.0),1.0);

  vec2 norVec = normalize(velVec.xy);
  //norVec = (czm_view * vec4(norVec,0.0,1.0)).xy;
  
  
  float cosTheta = dot(norVec,vec2(1.0,0.0));
  float sinTheta =  -sqrt(1.0- cosTheta * cosTheta);
  if(velVec.y < 0.0){
	sinTheta = -sinTheta;
  }

  vec3 r = vec3(czm_view[0][0],czm_view[1][0],czm_view[2][0]);
  float cosT = dot(r.xy,vec2(1.0,0.0));
  float sinT =  -sqrt(1.0- cosT * cosT);
   if(r.y < 0.0){
	sinT = -sinT;
  }


  vTextureMat = mat4(cosTheta,sinTheta,0.0,0.0,-sinTheta,cosTheta,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,1.0);
  vCameraRot =  mat4(cosT,sinT,0.0,0.0,-sinT,cosT,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,1.0);


  gl_Position = czm_viewProjection * pos;
  
}