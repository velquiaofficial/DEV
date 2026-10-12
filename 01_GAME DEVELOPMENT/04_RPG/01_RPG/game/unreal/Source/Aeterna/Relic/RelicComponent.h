#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "RelicComponent.generated.h"

UCLASS(ClassGroup = (Aeterna), meta = (BlueprintSpawnableComponent))
class AETERNA_API URelicComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable)
	void ActivateOwnedRelic();

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FString RelicId;
};
