#include "Data/DataLoader.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Engine/GameInstance.h"
#include "Kismet/GameplayStatics.h"

UDataLoader* UDataLoader::Get(const UObject* WorldContext)
{
	if (!WorldContext)
	{
		return nullptr;
	}
	const UWorld* world = WorldContext->GetWorld();
	if (!world)
	{
		return nullptr;
	}
	UGameInstance* gi = world->GetGameInstance();
	return gi ? gi->GetSubsystem<UDataLoader>() : nullptr;
}

void UDataLoader::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	LoadCharactersFile();
}

FString UDataLoader::GetDataRoot() const
{
	return FPaths::ProjectContentDir() / TEXT("Data");
}

void UDataLoader::LoadCharactersFile()
{
	FString path = GetDataRoot() / TEXT("characters.json");
	FString raw;
	if (!FFileHelper::LoadFileToString(raw, *path))
	{
		path = FPaths::ProjectDir() / TEXT("../../data/characters.json");
		FFileHelper::LoadFileToString(raw, *path);
	}
	TSharedPtr<FJsonValue> parsed;
	const TSharedRef<TJsonReader<>> reader = TJsonReaderFactory<>::Create(raw);
	if (!FJsonSerializer::Deserialize(reader, parsed) || !parsed.IsValid())
	{
		return;
	}
	const TArray<TSharedPtr<FJsonValue>>* rows = nullptr;
	if (!parsed->TryGetArray(rows))
	{
		return;
	}
	for (const TSharedPtr<FJsonValue>& row : *rows)
	{
		const TSharedPtr<FJsonObject> obj = row->AsObject();
		if (!obj.IsValid())
		{
			continue;
		}
		FAeternaCharacterData data;
		data.Id = obj->GetStringField(TEXT("id"));
		data.Name = obj->GetStringField(TEXT("name"));
		data.Civilization = obj->GetStringField(TEXT("civilization"));
		data.Element = obj->GetStringField(TEXT("element"));
		data.Relic = obj->GetStringField(TEXT("relic"));
		data.Hp = obj->GetNumberField(TEXT("hp"));
		data.Attack = obj->GetNumberField(TEXT("attack"));
		data.Defense = obj->GetNumberField(TEXT("defense"));
		const TArray<TSharedPtr<FJsonValue>> skills = obj->GetArrayField(TEXT("skills"));
		for (const TSharedPtr<FJsonValue>& skill : skills)
		{
			data.Skills.Add(skill->AsString());
		}
		Characters.Add(data.Id, data);
	}
}

FAeternaCharacterData UDataLoader::LoadCharacter(const FString& CharacterId) const
{
	if (const FAeternaCharacterData* found = Characters.Find(CharacterId))
	{
		return *found;
	}
	FAeternaCharacterData fallback;
	fallback.Id = TEXT("amaterasu_001");
	fallback.Name = TEXT("天照");
	fallback.Civilization = TEXT("japan");
	fallback.Element = TEXT("sun");
	fallback.Relic = TEXT("yata_mirror");
	fallback.Hp = 1200.f;
	fallback.Attack = 180.f;
	fallback.Defense = 100.f;
	fallback.Skills = { TEXT("solar_slash"), TEXT("sakura_domain"), TEXT("eternal_sun") };
	return fallback;
}
