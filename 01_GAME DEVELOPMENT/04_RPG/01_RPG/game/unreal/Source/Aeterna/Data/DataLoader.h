#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Characters/CharacterData.h"
#include "DataLoader.generated.h"

UCLASS()
class AETERNA_API UDataLoader : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	static UDataLoader* Get(const UObject* WorldContext);

	virtual void Initialize(FSubsystemCollectionBase& Collection) override;

	UFUNCTION(BlueprintCallable)
	FAeternaCharacterData LoadCharacter(const FString& CharacterId) const;

	UFUNCTION(BlueprintCallable)
	FString GetDataRoot() const;

private:
	TMap<FString, FAeternaCharacterData> Characters;
	void LoadCharactersFile();
};
