#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "NiagaraHooks.generated.h"

UCLASS(ClassGroup = (Aeterna), meta = (BlueprintSpawnableComponent))
class AETERNA_API UNiagaraHooks : public UActorComponent
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable)
	void PlayGroundLight();

	UFUNCTION(BlueprintCallable)
	void PlaySakura();

	UFUNCTION(BlueprintCallable)
	void PlayAncientScript();

	UFUNCTION(BlueprintCallable)
	void PlayArchitectureForm();

	UFUNCTION(BlueprintCallable)
	void PlayRelicActivate();

	UFUNCTION(BlueprintCallable)
	void PlayCivilizationCollision();

	UPROPERTY(EditAnywhere)
	FName LastCue;
};
