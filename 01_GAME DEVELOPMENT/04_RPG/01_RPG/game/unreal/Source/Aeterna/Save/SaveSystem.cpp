#include "Save/SaveSystem.h"
#include "Kismet/GameplayStatics.h"

bool USaveSystem::SaveProgress(const UAeternaSaveGame* Data)
{
	return UGameplayStatics::SaveGameToSlot(const_cast<UAeternaSaveGame*>(Data), TEXT("aeterna"), 0);
}

UAeternaSaveGame* USaveSystem::LoadProgress()
{
	if (!UGameplayStatics::DoesSaveGameExist(TEXT("aeterna"), 0))
	{
		return NewObject<UAeternaSaveGame>();
	}
	return Cast<UAeternaSaveGame>(UGameplayStatics::LoadGameFromSlot(TEXT("aeterna"), 0));
}
