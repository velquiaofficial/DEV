#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "RelicActor.generated.h"

UCLASS()
class AETERNA_API ARelicActor : public AActor
{
	GENERATED_BODY()

public:
	ARelicActor();

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FString RelicId = TEXT("yata_mirror");

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FString Civilization = TEXT("japan");

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	bool bHeld = false;

	UFUNCTION(BlueprintCallable)
	void Pickup(AActor* ByCharacter);

	UFUNCTION(BlueprintCallable)
	void Activate();
};
