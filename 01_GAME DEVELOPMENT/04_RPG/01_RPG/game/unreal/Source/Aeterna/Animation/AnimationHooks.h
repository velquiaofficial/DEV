#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "AnimationHooks.generated.h"

UCLASS(ClassGroup = (Aeterna), meta = (BlueprintSpawnableComponent))
class AETERNA_API UAnimationHooks : public UActorComponent
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable)
	void PlayIdle();

	UFUNCTION(BlueprintCallable)
	void PlayAttack();

	UFUNCTION(BlueprintCallable)
	void PlayDodge();

	UFUNCTION(BlueprintCallable)
	void PlaySkill(int32 Index);

	UFUNCTION(BlueprintCallable)
	void PlayUltimate();

	UFUNCTION(BlueprintCallable)
	void PlayAwaken();

	UPROPERTY(BlueprintAssignable)
	FSimpleMulticastDelegate OnAnimNotify;
};
