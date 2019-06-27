#extension GL_EXT_draw_buffers : require
#define LINEAR_INTERP(MIN, MAX, R) ((MIN) + ((MAX) - (MIN)) * (R))

#ifdef GL_ES
precision highp float;
#endif

#define GRID_LENGTH 360.0
#define GRID_WIDTH 360.0
#define GRID_HEIGHT 25.0
#define LENGTHPERUNIT 30.0
#define MAPINROW  5.0
#define LEVELINDEX 25.0

uniform float uParticleDim;
uniform float uDeltaT;
uniform sampler2D uPosTexture;

uniform sampler2D uWindTexture;

uniform sampler2D uInitialPositionTex;
uniform float uParticleSpeed;


//uniform float uTest;

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

vec3 uvCoordToGridCoord(vec2 uv)
{
	vec3 gc;
	gc.x = mod(uv.x, GRID_LENGTH);
	gc.y = mod(uv.y, GRID_WIDTH);
	gc.z = (floor(uv.y / GRID_WIDTH) * 5.0 + floor(uv.x /GRID_LENGTH));
	return gc;
}

vec3 getColor(float value)
{
	vec3 color;
	float ratio = value/100.0;
	if(ratio <= 0.5){
		color = vec3(2.0 * ratio, 0.5 - ratio, 1.0 - 2.0 * ratio);
	}else{
		color = vec3(1.0,2.0 * ratio - 1.0, ratio -0.5);
	}
	return color;
}


float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main(){
	vec2 uv = gl_FragCoord.xy/uParticleDim;
	
	vec4 vecInfo = texture2D(uPosTexture,uv);
	vec3 pos = vecInfo.rgb;
	
	float deltaT = 0.01;  
	vec3 windVec =getVelority(pos);	
	
	pos  = pos + deltaT * (windVec) * uParticleSpeed; 
	float age = vecInfo.a;
	
	vec4 initVecInfo = texture2D(uInitialPositionTex, uv);
	if(pos.x >= 360.0|| 
			pos.x <= 0.0 || 
			pos.y >= 360.0 || 
			pos.y <= 0.0 /*|| windSpeed < .1 */)
	{
		pos  = texture2D(uInitialPositionTex, uv).rgb;
	}

	if(age < 0.0){
		pos  = initVecInfo.rgb;
		age  = initVecInfo.a;
	}
	age -= deltaT * 4.0;

	gl_FragData[0] =vec4(pos,age);
//	gl_FragData[1] = vec4(vel, 1.0);
	//gl_FragData[2] =vec4(getColor(windSpeed),0.15);
//	gl_FragData[2] =vec4(computeColor(windSpeed/90.0),0.15);

}