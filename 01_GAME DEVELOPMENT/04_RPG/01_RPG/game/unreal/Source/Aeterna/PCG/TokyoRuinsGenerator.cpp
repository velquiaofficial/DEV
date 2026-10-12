#include "PCG/TokyoRuinsGenerator.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMesh.h"

ATokyoRuinsGenerator::ATokyoRuinsGenerator()
{
	PrimaryActorTick.bCanEverTick = false;
	RootComponent = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
}

void ATokyoRuinsGenerator::GenerateRuins()
{
	UStaticMesh* cube = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
	FRandomStream rng(Seed);
	for (int32 i = 0; i < BuildingCount; ++i)
	{
		UStaticMeshComponent* mesh = NewObject<UStaticMeshComponent>(this, *FString::Printf(TEXT("Ruin_%02d"), i));
		mesh->SetupAttachment(RootComponent);
		mesh->RegisterComponent();
		const float x = rng.FRandRange(-4200.f, 4200.f);
		const float y = rng.FRandRange(-2800.f, 2800.f);
		const float h = rng.FRandRange(400.f, 2200.f);
		mesh->SetRelativeLocation(FVector(x, y, h * 0.5f));
		mesh->SetRelativeScale3D(FVector(rng.FRandRange(0.7f, 1.6f), rng.FRandRange(0.7f, 1.4f), h / 400.f));
		if (cube)
		{
			mesh->SetStaticMesh(cube);
		}
	}
}
