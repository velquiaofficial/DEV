// World reconstruction: forgotten Tokyo → civilization layer.
// Bind ReconstructionAlpha (CustomData0) and LayerTint (CustomData1).
float ReconstructionAlpha;
float4 LayerTint;

float4 ReconstructAlbedo(float3 BaseColor, float3 WorldNormal, float3 CameraVector)
{
	float fresnel = pow(saturate(1.0 - saturate(dot(WorldNormal, CameraVector))), 3.0);
	float3 forgotten = BaseColor * 0.22;
	float3 restored = lerp(BaseColor, LayerTint.rgb, 0.55) + fresnel * LayerTint.rgb * 0.35;
	float3 color = lerp(forgotten, restored, saturate(ReconstructionAlpha));
	return float4(color, 1.0);
}
