#pragma once

#include "CoreMinimal.h"
#include "TickableWorldSubsystem.h"
#include "TrailerDirector.generated.h"

USTRUCT()
struct FAeternaShot
{
	GENERATED_BODY()

	UPROPERTY()
	int32 Scene = 0;

	UPROPERTY()
	float Start = 0.f;

	UPROPERTY()
	float End = 0.f;

	UPROPERTY()
	FString Map;

	UPROPERTY()
	FString Camera;

	UPROPERTY()
	FString Weather;

	UPROPERTY()
	FString Cue;
};

UCLASS()
class AETERNA_API UTrailerDirector : public UTickableWorldSubsystem
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable)
	void LoadFromJson();

	UFUNCTION(BlueprintCallable)
	void Play();

	virtual void Tick(float DeltaTime) override;
	virtual TStatId GetStatId() const override;
	virtual bool IsTickable() const override { return bPlaying; }

	UPROPERTY()
	TArray<FAeternaShot> Shots;

protected:
	void FireCue(const FString& Cue);

	UPROPERTY()
	bool bPlaying = false;

	UPROPERTY()
	float Elapsed = 0.f;

	UPROPERTY()
	TSet<int32> FiredScenes;
};
