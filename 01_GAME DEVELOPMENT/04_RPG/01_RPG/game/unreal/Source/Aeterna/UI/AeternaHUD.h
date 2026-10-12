#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "AeternaHUD.generated.h"

UCLASS()
class AETERNA_API AAeternaHUD : public AHUD
{
	GENERATED_BODY()

public:
	virtual void DrawHUD() override;

	UPROPERTY()
	float PlayerHp = 1.f;

	UPROPERTY()
	float Skill1 = 0.f;

	UPROPERTY()
	float Skill2 = 0.f;

	UPROPERTY()
	float Ultimate = 0.f;

	UPROPERTY()
	float RelicGauge = 0.f;

	UPROPERTY()
	float CivilizationGauge = 0.f;
};
