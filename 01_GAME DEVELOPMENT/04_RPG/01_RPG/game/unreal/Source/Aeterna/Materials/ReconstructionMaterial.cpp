#include "Materials/ReconstructionMaterial.h"
#include "Components/PrimitiveComponent.h"

void UReconstructionMaterial::SetReconstruction(float Alpha, FLinearColor Tint)
{
	ReconstructionAlpha = FMath::Clamp(Alpha, 0.f, 1.f);
	LayerTint = Tint;
	AActor* owner = GetOwner();
	if (!owner)
	{
		return;
	}
	TArray<UPrimitiveComponent*> primitives;
	owner->GetComponents<UPrimitiveComponent>(primitives);
	for (UPrimitiveComponent* prim : primitives)
	{
		prim->SetCustomPrimitiveDataFloat(0, ReconstructionAlpha);
		prim->SetCustomPrimitiveDataVector4(1, FVector4(Tint.R, Tint.G, Tint.B, Tint.A));
	}
}
