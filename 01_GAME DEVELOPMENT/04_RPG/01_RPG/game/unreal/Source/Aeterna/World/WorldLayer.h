#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "WorldLayer.generated.h"

UCLASS()
class AETERNA_API AWorldLayer : public AActor
{
	GENERATED_BODY()

public:
	AWorldLayer();

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FString Civilization;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float Influence = 0.f;

	UFUNCTION(BlueprintCallable)
	void SetInfluence(float Value);

	UPROPERTY(VisibleAnywhere)
	TObjectPtr<USceneComponent> Root;

	UPROPERTY(VisibleAnywhere)
	TObjectPtr<UStaticMeshComponent> Mesh;
};
