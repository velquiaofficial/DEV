#include "World/WorldLayer.h"
#include "Components/StaticMeshComponent.h"

AWorldLayer::AWorldLayer()
{
	Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
	SetRootComponent(Root);
	Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
	Mesh->SetupAttachment(Root);
}

void AWorldLayer::SetInfluence(float Value)
{
	Influence = FMath::Clamp(Value, 0.f, 1.f);
	SetActorHiddenInGame(Influence <= 0.02f);
	if (Mesh)
	{
		Mesh->SetVisibility(Influence > 0.02f);
	}
}
