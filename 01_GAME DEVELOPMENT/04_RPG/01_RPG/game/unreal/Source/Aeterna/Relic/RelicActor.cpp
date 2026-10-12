#include "Relic/RelicActor.h"
#include "Civilization/CivilizationSubsystem.h"

ARelicActor::ARelicActor()
{
	PrimaryActorTick.bCanEverTick = false;
}

void ARelicActor::Pickup(AActor* ByCharacter)
{
	bHeld = ByCharacter != nullptr;
}

void ARelicActor::Activate()
{
	if (UCivilizationSubsystem* civ = UCivilizationSubsystem::Get(this))
	{
		civ->ActivateCivilization(Civilization);
	}
}
