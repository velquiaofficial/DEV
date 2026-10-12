#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "CombatComponent.generated.h"

UCLASS(ClassGroup = (Aeterna), meta = (BlueprintSpawnableComponent))
class AETERNA_API UCombatComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UCombatComponent();

	UFUNCTION(BlueprintCallable)
	void NormalAttack();

	UFUNCTION(BlueprintCallable)
	void StartDodge();

	UFUNCTION(BlueprintCallable)
	bool IsDodging() const { return DodgeTime > 0.f; }

	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

protected:
	UPROPERTY(EditAnywhere)
	float AttackRange = 220.f;

	UPROPERTY(VisibleAnywhere)
	float DodgeTime = 0.f;
};
