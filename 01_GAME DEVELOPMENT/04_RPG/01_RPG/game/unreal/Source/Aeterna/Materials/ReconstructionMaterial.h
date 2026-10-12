#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Materials/ReconstructionMaterial.generated.h"

UCLASS(ClassGroup = (Aeterna), meta = (BlueprintSpawnableComponent))
class AETERNA_API UReconstructionMaterial : public UActorComponent
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable)
	void SetReconstruction(float Alpha, FLinearColor Tint);

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float ReconstructionAlpha = 0.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FLinearColor LayerTint = FLinearColor::Gray;
};
