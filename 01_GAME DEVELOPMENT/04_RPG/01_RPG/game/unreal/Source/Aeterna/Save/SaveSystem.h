#pragma once

#include "CoreMinimal.h"
#include "GameFramework/SaveGame.h"
#include "SaveSystem.generated.h"

UCLASS()
class AETERNA_API UAeternaSaveGame : public USaveGame
{
	GENERATED_BODY()

public:
	UPROPERTY()
	TArray<FString> Unlocked;

	UPROPERTY()
	TArray<FString> RestoredCivs;

	UPROPERTY()
	int32 Fragments = 0;
};

UCLASS()
class AETERNA_API USaveSystem : public UObject
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable)
	static bool SaveProgress(const UAeternaSaveGame* Data);

	UFUNCTION(BlueprintCallable)
	static UAeternaSaveGame* LoadProgress();
};
