#include "Characters/CharacterBase.h"
#include "Combat/CombatComponent.h"
#include "Combat/SkillComponent.h"
#include "Relic/RelicComponent.h"
#include "Animation/AnimationHooks.h"
#include "Vfx/NiagaraHooks.h"
#include "Data/DataLoader.h"

ACharacterBase::ACharacterBase()
{
	PrimaryActorTick.bCanEverTick = true;
	Combat = CreateDefaultSubobject<UCombatComponent>(TEXT("Combat"));
	Skills = CreateDefaultSubobject<USkillComponent>(TEXT("Skills"));
	Relic = CreateDefaultSubobject<URelicComponent>(TEXT("Relic"));
	Anim = CreateDefaultSubobject<UAnimationHooks>(TEXT("Anim"));
	Vfx = CreateDefaultSubobject<UNiagaraHooks>(TEXT("Vfx"));
}

void ACharacterBase::BeginPlay()
{
	Super::BeginPlay();
	if (Data.Id.IsEmpty())
	{
		LoadFromJsonId(TEXT("amaterasu_001"));
	}
	CurrentHp = Data.Hp;
}

void ACharacterBase::LoadFromJsonId(const FString& CharacterId)
{
	if (UDataLoader* Loader = UDataLoader::Get(this))
	{
		Data = Loader->LoadCharacter(CharacterId);
		CurrentHp = Data.Hp;
	}
}

void ACharacterBase::ApplyDamage(float Amount)
{
	const float reduced = FMath::Max(1.f, Amount - Data.Defense * 0.15f);
	CurrentHp = FMath::Max(0.f, CurrentHp - reduced);
}

void ACharacterBase::Heal(float Amount)
{
	CurrentHp = FMath::Min(Data.Hp, CurrentHp + Amount);
}

void ACharacterBase::Dodge()
{
	if (Combat)
	{
		Combat->StartDodge();
	}
}

bool ACharacterBase::IsAlive() const
{
	return CurrentHp > 0.f;
}
