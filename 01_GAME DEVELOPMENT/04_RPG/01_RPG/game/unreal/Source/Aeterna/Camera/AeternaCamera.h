#pragma once

#include "CoreMinimal.h"
#include "Camera/CameraActor.h"
#include "AeternaCamera.generated.h"

UCLASS()
class AETERNA_API AAeternaCamera : public ACameraActor
{
	GENERATED_BODY()

public:
	AAeternaCamera();

	UFUNCTION(BlueprintCallable)
	void Follow(AActor* Target, float Alpha);

	UFUNCTION(BlueprintCallable)
	void LookAt(const FVector& Point);

	UPROPERTY(EditAnywhere)
	FName ShotId = TEXT("Camera_A");
};
