#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "AeternaPlayerController.generated.h"

UCLASS()
class AETERNA_API AAeternaPlayerController : public APlayerController
{
	GENERATED_BODY()

protected:
	virtual void SetupInputComponent() override;

	void OnAttack();
	void OnDodge();
	void OnSkill1();
	void OnSkill2();
	void OnUltimate();
	void OnActivateRelic();
};
