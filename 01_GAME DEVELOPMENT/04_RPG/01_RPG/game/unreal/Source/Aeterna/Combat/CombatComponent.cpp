#include "Combat/CombatComponent.h"
#include "Characters/CharacterBase.h"
#include "Kismet/GameplayStatics.h"

UCombatComponent::UCombatComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UCombatComponent::NormalAttack()
{
	ACharacterBase* owner = Cast<ACharacterBase>(GetOwner());
	if (!owner || !owner->IsAlive())
	{
		return;
	}

	TArray<AActor*> foes;
	UGameplayStatics::GetAllActorsOfClass(GetWorld(), ACharacterBase::StaticClass(), foes);
	for (AActor* actor : foes)
	{
		ACharacterBase* other = Cast<ACharacterBase>(actor);
		if (!other || other == owner || !other->IsAlive())
		{
			continue;
		}
		if (FVector::Dist(owner->GetActorLocation(), other->GetActorLocation()) <= AttackRange)
		{
			other->ApplyDamage(owner->Data.Attack);
			break;
		}
	}
}

void UCombatComponent::StartDodge()
{
	DodgeTime = 0.35f;
}

void UCombatComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
	DodgeTime = FMath::Max(0.f, DodgeTime - DeltaTime);
}
