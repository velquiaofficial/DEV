#include "World/TokyoRuinsMap.h"
#include "World/WorldLayer.h"
#include "Relic/RelicActor.h"
#include "Civilization/CivilizationSubsystem.h"
#include "PCG/TokyoRuinsGenerator.h"
#include "Materials/ReconstructionMaterial.h"

ATokyoRuinsMap::ATokyoRuinsMap()
{
	PrimaryActorTick.bCanEverTick = false;
}

void ATokyoRuinsMap::BeginPlay()
{
	Super::BeginPlay();
	UWorld* world = GetWorld();
	if (!world)
	{
		return;
	}
	BaseTokyo = world->SpawnActor<AWorldLayer>(GetActorLocation(), FRotator::ZeroRotator);
	if (BaseTokyo)
	{
		BaseTokyo->Civilization = TEXT("forgotten");
		BaseTokyo->SetInfluence(1.f);
	}
	JapanLayer = world->SpawnActor<AWorldLayer>(GetActorLocation(), FRotator::ZeroRotator);
	if (JapanLayer)
	{
		JapanLayer->Civilization = TEXT("japan");
		JapanLayer->SetInfluence(0.f);
	}
	GreeceLayer = world->SpawnActor<AWorldLayer>(GetActorLocation(), FRotator::ZeroRotator);
	if (GreeceLayer)
	{
		GreeceLayer->Civilization = TEXT("greece");
		GreeceLayer->SetInfluence(0.f);
	}
	EgyptLayer = world->SpawnActor<AWorldLayer>(GetActorLocation(), FRotator::ZeroRotator);
	if (EgyptLayer)
	{
		EgyptLayer->Civilization = TEXT("egypt");
		EgyptLayer->SetInfluence(0.f);
	}
	FirstRelic = world->SpawnActor<ARelicActor>(GetActorLocation() + FVector(400.f, 0.f, 80.f), FRotator::ZeroRotator);
	if (FirstRelic)
	{
		FirstRelic->RelicId = TEXT("yata_mirror");
		FirstRelic->Civilization = TEXT("japan");
	}
	RuinsPCG = world->SpawnActor<ATokyoRuinsGenerator>(GetActorLocation(), FRotator::ZeroRotator);
	if (RuinsPCG)
	{
		RuinsPCG->GenerateRuins();
	}
}

void ATokyoRuinsMap::RebuildFromActiveLayers()
{
	UCivilizationSubsystem* civ = UCivilizationSubsystem::Get(this);
	const TArray<FString> layers = civ ? civ->GetActiveLayers() : TArray<FString>();
	if (JapanLayer)
	{
		JapanLayer->SetInfluence(layers.Contains(TEXT("japan")) ? 1.f : 0.f);
	}
	if (GreeceLayer)
	{
		GreeceLayer->SetInfluence(layers.Contains(TEXT("greece")) ? 1.f : 0.f);
	}
	if (EgyptLayer)
	{
		EgyptLayer->SetInfluence(layers.Contains(TEXT("egypt")) ? 1.f : 0.f);
	}
	auto apply = [](AWorldLayer* layer, float alpha, FLinearColor tint)
	{
		if (!layer)
		{
			return;
		}
		UReconstructionMaterial* mat = layer->FindComponentByClass<UReconstructionMaterial>();
		if (!mat)
		{
			mat = NewObject<UReconstructionMaterial>(layer);
			mat->RegisterComponent();
		}
		mat->SetReconstruction(alpha, tint);
	};
	apply(JapanLayer, JapanLayer && layers.Contains(TEXT("japan")) ? 1.f : 0.f, FLinearColor(1.f, 0.55f, 0.28f));
	apply(GreeceLayer, GreeceLayer && layers.Contains(TEXT("greece")) ? 1.f : 0.f, FLinearColor(0.55f, 0.72f, 1.f));
	apply(EgyptLayer, EgyptLayer && layers.Contains(TEXT("egypt")) ? 1.f : 0.f, FLinearColor(0.95f, 0.78f, 0.22f));
}
