#include "Combat/SkillComponent.h"
#include "Characters/CharacterBase.h"
#include "Civilization/CivilizationSubsystem.h"
#include "Animation/AnimationHooks.h"
#include "Vfx/NiagaraHooks.h"

USkillComponent::USkillComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
}

bool USkillComponent::TrySkill(int32 Index)
{
	ACharacterBase* owner = Cast<ACharacterBase>(GetOwner());
	if (!owner || !owner->IsAlive())
	{
		return false;
	}
	if (Index == 0 && SkillCd1 <= 0.f)
	{
		SkillCd1 = 6.f;
		UltCharge = FMath::Min(100.f, UltCharge + 12.f);
		return true;
	}
	if (Index == 1 && SkillCd2 <= 0.f)
	{
		SkillCd2 = 8.f;
		owner->Heal(owner->Data.Hp * 0.08f);
		return true;
	}
	return false;
}

bool USkillComponent::TryUltimate()
{
	ACharacterBase* owner = Cast<ACharacterBase>(GetOwner());
	if (!owner || UltCharge < 100.f)
	{
		return false;
	}
	UltCharge = 0.f;
	if (UAnimationHooks* anim = owner->FindComponentByClass<UAnimationHooks>())
	{
		anim->PlayUltimate();
	}
	if (UNiagaraHooks* vfx = owner->FindComponentByClass<UNiagaraHooks>())
	{
		vfx->PlayRelicActivate();
		vfx->PlayGroundLight();
		if (owner->Data.Civilization == TEXT("japan"))
		{
			vfx->PlaySakura();
		}
	}
	if (UCivilizationSubsystem* civ = UCivilizationSubsystem::Get(this))
	{
		civ->ActivateCivilization(owner->Data.Civilization);
	}
	return true;
}

void USkillComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
	SkillCd1 = FMath::Max(0.f, SkillCd1 - DeltaTime);
	SkillCd2 = FMath::Max(0.f, SkillCd2 - DeltaTime);
}
