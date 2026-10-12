#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "PCG/TokyoRuinsGenerator.generated.h"

UCLASS()
class AETERNA_API ATokyoRuinsGenerator : public AActor
{
	GENERATED_BODY()

public:
	ATokyoRuinsGenerator();

	UFUNCTION(BlueprintCallable)
	void GenerateRuins();

	UPROPERTY(EditAnywhere)
	int32 BuildingCount = 48;

	UPROPERTY(EditAnywhere)
	int32 Seed = 2026;
};
