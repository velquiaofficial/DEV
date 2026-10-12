#pragma once

#include "CoreMinimal.h"
#include "Characters/CharacterBase.h"
#include "EnemyBase.generated.h"

UCLASS()
class AETERNA_API AEnemyBase : public ACharacterBase
{
	GENERATED_BODY()

public:
	AEnemyBase();

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FString EnemyId = TEXT("lost_memory");

protected:
	virtual void Tick(float DeltaSeconds) override;
};
