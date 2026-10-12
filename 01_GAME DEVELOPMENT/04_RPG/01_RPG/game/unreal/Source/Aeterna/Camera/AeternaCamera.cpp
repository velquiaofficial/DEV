#include "Camera/AeternaCamera.h"

AAeternaCamera::AAeternaCamera()
{
	PrimaryActorTick.bCanEverTick = false;
}

void AAeternaCamera::Follow(AActor* Target, float Alpha)
{
	if (!Target)
	{
		return;
	}
	const FVector next = FMath::Lerp(GetActorLocation(), Target->GetActorLocation() + FVector(-280.f, 0.f, 160.f), Alpha);
	SetActorLocation(next);
}

void AAeternaCamera::LookAt(const FVector& Point)
{
	SetActorRotation((Point - GetActorLocation()).Rotation());
}
