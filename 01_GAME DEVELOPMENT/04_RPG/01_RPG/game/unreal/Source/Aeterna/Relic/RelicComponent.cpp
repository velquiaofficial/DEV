#include "Relic/RelicComponent.h"
#include "Characters/CharacterBase.h"
#include "Civilization/CivilizationSubsystem.h"

void URelicComponent::ActivateOwnedRelic()
{
	ACharacterBase* owner = Cast<ACharacterBase>(GetOwner());
	if (!owner)
	{
		return;
	}
	if (RelicId.IsEmpty())
	{
		RelicId = owner->Data.Relic;
	}
	if (UCivilizationSubsystem* civ = UCivilizationSubsystem::Get(this))
	{
		civ->ActivateCivilization(owner->Data.Civilization);
	}
}
