#pragma once

#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "CivilizationSubsystem.generated.h"

UENUM(BlueprintType)
enum class EAeternaCivilization : uint8
{
	None UMETA(DisplayName = "Forgotten"),
	Japan UMETA(DisplayName = "Japan"),
	Greece UMETA(DisplayName = "Greece"),
	Egypt UMETA(DisplayName = "Egypt"),
	Norse UMETA(DisplayName = "Norse"),
	Mesopotamia UMETA(DisplayName = "Mesopotamia")
};

UCLASS()
class AETERNA_API UCivilizationSubsystem : public UWorldSubsystem
{
	GENERATED_BODY()

public:
	static UCivilizationSubsystem* Get(const UObject* WorldContext);

	UFUNCTION(BlueprintCallable)
	void RegisterCivilization(const FString& CivId);

	UFUNCTION(BlueprintCallable)
	void ActivateCivilization(const FString& CivId);

	UFUNCTION(BlueprintCallable)
	void DeactivateCivilization(const FString& CivId);

	UFUNCTION(BlueprintCallable)
	void BlendCivilizationInfluence();

	UFUNCTION(BlueprintCallable)
	TArray<FString> GetActiveLayers() const { return ActiveLayers; }

	UFUNCTION(BlueprintCallable)
	FString GetFusionId() const;

protected:
	UPROPERTY()
	TArray<FString> Registered;

	UPROPERTY()
	TArray<FString> ActiveLayers;

	UPROPERTY()
	TMap<FString, float> Influence;
};
