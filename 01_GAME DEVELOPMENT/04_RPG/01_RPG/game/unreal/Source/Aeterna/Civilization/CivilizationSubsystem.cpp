#include "Civilization/CivilizationSubsystem.h"
#include "World/TokyoRuinsMap.h"
#include "Kismet/GameplayStatics.h"

UCivilizationSubsystem* UCivilizationSubsystem::Get(const UObject* WorldContext)
{
	if (!WorldContext)
	{
		return nullptr;
	}
	const UWorld* world = WorldContext->GetWorld();
	return world ? world->GetSubsystem<UCivilizationSubsystem>() : nullptr;
}

void UCivilizationSubsystem::RegisterCivilization(const FString& CivId)
{
	Registered.AddUnique(CivId);
	if (!Influence.Contains(CivId))
	{
		Influence.Add(CivId, 0.f);
	}
}

void UCivilizationSubsystem::ActivateCivilization(const FString& CivId)
{
	RegisterCivilization(CivId);
	ActiveLayers.AddUnique(CivId);
	Influence.FindOrAdd(CivId) = 1.f;
	BlendCivilizationInfluence();
	TArray<AActor*> maps;
	UGameplayStatics::GetAllActorsOfClass(GetWorld(), ATokyoRuinsMap::StaticClass(), maps);
	for (AActor* actor : maps)
	{
		if (ATokyoRuinsMap* map = Cast<ATokyoRuinsMap>(actor))
		{
			map->RebuildFromActiveLayers();
		}
	}
}

void UCivilizationSubsystem::DeactivateCivilization(const FString& CivId)
{
	ActiveLayers.Remove(CivId);
	Influence.FindOrAdd(CivId) = 0.f;
	BlendCivilizationInfluence();
}

void UCivilizationSubsystem::BlendCivilizationInfluence()
{
	float total = 0.f;
	for (const TPair<FString, float>& pair : Influence)
	{
		total += pair.Value;
	}
	if (total <= 0.f)
	{
		return;
	}
	for (TPair<FString, float>& pair : Influence)
	{
		pair.Value /= total;
	}
}

FString UCivilizationSubsystem::GetFusionId() const
{
	const bool japan = ActiveLayers.Contains(TEXT("japan"));
	const bool greece = ActiveLayers.Contains(TEXT("greece"));
	const bool egypt = ActiveLayers.Contains(TEXT("egypt"));
	if (japan && greece)
	{
		return TEXT("japan_greece");
	}
	if (japan && egypt)
	{
		return TEXT("japan_egypt");
	}
	return TEXT("");
}
