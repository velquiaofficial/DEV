#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "DialogueSystem.generated.h"

USTRUCT(BlueprintType)
struct FAeternaLine
{
	GENERATED_BODY()

	UPROPERTY()
	FString Character;

	UPROPERTY()
	int32 Relationship = 0;

	UPROPERTY()
	FString Location;

	UPROPERTY()
	int32 StoryState = 0;

	UPROPERTY()
	FString Line;
};

UCLASS()
class AETERNA_API UDialogueSystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;

	UFUNCTION(BlueprintCallable)
	FString PickLine(const FString& Character, int32 Relationship, const FString& Location, int32 StoryState) const;

private:
	TArray<FAeternaLine> Lines;
};
