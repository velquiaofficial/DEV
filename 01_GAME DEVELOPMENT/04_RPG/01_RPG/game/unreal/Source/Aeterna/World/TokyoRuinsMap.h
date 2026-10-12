#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "TokyoRuinsMap.generated.h"

class AWorldLayer;
class ARelicActor;
class ATokyoRuinsGenerator;

UCLASS()
class AETERNA_API ATokyoRuinsMap : public AActor
{
	GENERATED_BODY()

public:
	ATokyoRuinsMap();

	virtual void BeginPlay() override;

	UFUNCTION(BlueprintCallable)
	void RebuildFromActiveLayers();

	UPROPERTY()
	TObjectPtr<AWorldLayer> BaseTokyo;

	UPROPERTY()
	TObjectPtr<AWorldLayer> JapanLayer;

	UPROPERTY()
	TObjectPtr<AWorldLayer> GreeceLayer;

	UPROPERTY()
	TObjectPtr<AWorldLayer> EgyptLayer;

	UPROPERTY()
	TObjectPtr<ARelicActor> FirstRelic;

	UPROPERTY()
	TObjectPtr<ATokyoRuinsGenerator> RuinsPCG;
};
