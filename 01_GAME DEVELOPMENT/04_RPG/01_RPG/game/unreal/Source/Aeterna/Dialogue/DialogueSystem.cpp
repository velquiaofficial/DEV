#include "Dialogue/DialogueSystem.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

void UDialogueSystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	FString raw;
	FString path = FPaths::ProjectContentDir() / TEXT("Data/dialogue.json");
	if (!FFileHelper::LoadFileToString(raw, *path))
	{
		path = FPaths::ProjectDir() / TEXT("../../data/dialogue.json");
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
		FAeternaLine line;
		line.Character = obj->GetStringField(TEXT("character"));
		line.Relationship = static_cast<int32>(obj->GetNumberField(TEXT("relationship")));
		line.Location = obj->GetStringField(TEXT("location"));
		line.StoryState = static_cast<int32>(obj->GetNumberField(TEXT("story_state")));
		line.Line = obj->GetStringField(TEXT("line"));
		Lines.Add(line);
	}
}

FString UDialogueSystem::PickLine(const FString& Character, int32 Relationship, const FString& Location, int32 StoryState) const
{
	const FAeternaLine* best = nullptr;
	int32 bestScore = -1;
	for (const FAeternaLine& line : Lines)
	{
		if (line.Character != Character)
		{
			continue;
		}
		if (line.Relationship > Relationship)
		{
			continue;
		}
		int32 score = line.Relationship;
		if (line.Location == Location)
		{
			score += 20;
		}
		if (line.StoryState == StoryState)
		{
			score += 10;
		}
		if (score > bestScore)
		{
			bestScore = score;
			best = &line;
		}
	}
	return best ? best->Line : FString(TEXT("……先生。"));
}
