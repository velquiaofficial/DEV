#include "Enemy/EnemyBase.h"
#include "Kismet/GameplayStatics.h"

AEnemyBase::AEnemyBase()
{
	Data.Id = TEXT("lost_memory");
	Data.Name = TEXT("Lost Memory");
	Data.Civilization = TEXT("void");
	Data.Hp = 400.f;
	Data.Attack = 40.f;
	Data.Defense = 20.f;
}

void AEnemyBase::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	APawn* player = UGameplayStatics::GetPlayerPawn(this, 0);
	if (!player || !IsAlive())
	{
		return;
	}
	const FVector to = player->GetActorLocation() - GetActorLocation();
	if (to.Size() > 180.f)
	{
		AddMovementInput(to.GetSafeNormal(), 1.f);
	}
	else if (Combat)
	{
		Combat->NormalAttack();
	}
}
