#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "SkillComponent.generated.h"

UCLASS(ClassGroup = (Aeterna), meta = (BlueprintSpawnableComponent))
class AETERNA_API USkillComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable)
	bool TrySkill(int32 Index);

	UFUNCTION(BlueprintCallable)
	bool TryUltimate();

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	float SkillCd1 = 0.f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	float SkillCd2 = 0.f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	float UltCharge = 0.f;

	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

	USkillComponent();
};
