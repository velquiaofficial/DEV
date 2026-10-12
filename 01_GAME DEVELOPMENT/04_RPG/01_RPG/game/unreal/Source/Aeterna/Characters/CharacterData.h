#pragma once

#include "CoreMinimal.h"
#include "CharacterData.generated.h"

USTRUCT(BlueprintType)
struct AETERNA_API FAeternaCharacterData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FString Id = TEXT("amaterasu_001");

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FString Name = TEXT("天照");

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FString Civilization = TEXT("japan");

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FString Element = TEXT("sun");

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FString Relic = TEXT("yata_mirror");

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	float Hp = 1200.f;

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	float Attack = 180.f;

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	float Defense = 100.f;

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	TArray<FString> Skills;
};
