#extension GL_EXT_draw_buffers : require

#ifdef GL_ES
precision highp float;
#endif

#define GRID_LENGTH 360.0
#define GRID_WIDTH 360.0
#define GRID_HEIGHT 25.0
#define MAGNIFY  4.0
#define MAPINROW  5.0

uniform float uParticleDim;
uniform float uLevelIndex;
uniform float uLevelFrom;
uniform float uLevelTo;
//uniform sampler2D uXWindTexture;
//uniform sampler2D uYWindTexture;
//uniform sampler2D uZWindTexture;
uniform sampler2D uWindTexture;


// source: http://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float rand(vec2 seed) {
  return fract(sin(dot(seed.xy,vec2(12.9898,78.233))) * 43758.5453);
}

//vec2 gridCoord3DToPlain(vec3 gridCoord)
//{
//	vec2 uv;
//	gridCoord.z -= 1.0;
//	uv.x = (mod(gridCoord.z,MAPINROW)*GRID_LENGTH + gridCoord.x ) / 2048.0;
//	uv.y = (floor(gridCoord.z/MAPINROW) * GRID_WIDTH + gridCoord.y) / 2048.0;
//	return uv;
//}

float decode(vec3 color,float minValue, float maxValue){
	//return (color.g + color.r/256.0 + color.b/65536.0) * (maxValue- minValue) + minValue;
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
//	 vec3 xWind = texture2D(uXWindTexture,st).rgb;
//	 vec3 yWind = texture2D(uYWindTexture,st).rgb;
//	 vec3 zWind = texture2D(uZWindTexture,st).rgb;
//	 float fxWind = decode(xWind,-100.0,100.0);
//	 float fyWind = decode(yWind,-100.0,100.0);
//	 float fzWind = decode(zWind, -2.0, 2.0);
//	 vec3 windVec = vec3(fxWind,fyWind,fzWind);
//	 return length(windVec);
}

vec3 getPos(float levelFrom,float levelTo, vec2 uv)
{
	float rd = rand(uv);
	vec3 pos = vec3(0.0,0.0,0.0);
	pos.z  = floor(levelTo + rd * (levelFrom - levelTo + 1.0));

	pos.xy = vec2(GRID_LENGTH * rand(vec2(uv.y,rd)),GRID_WIDTH *rand(vec2(uv.x,rd)));
	return pos;	
}


void main(){
	 vec2 uv = gl_FragCoord.xy /uParticleDim;
	 float rd = rand(uv);
	 vec3 pos = getPos(uLevelFrom,uLevelTo,uv);

	// vec2 st = gridCoord3DToPlain(pos);

	 float velority = length(getVelority(pos));
	 if(rd < 0.7)
	 {
		 for(float i = 0.0 ;i < 2.0 ;i+=1.0){
			 uv = vec2(rand(uv.xy),rand(uv.yx));
			 vec3 temPos = getPos(uLevelFrom,uLevelTo,uv);
			 float temV = length(getVelority(temPos));
			 if(temV > velority){
				pos = temPos;
				velority = temV;
			 }
		 }
	 }
	 gl_FragData[0] = vec4(pos,1.0 + rd * 40.0);

}