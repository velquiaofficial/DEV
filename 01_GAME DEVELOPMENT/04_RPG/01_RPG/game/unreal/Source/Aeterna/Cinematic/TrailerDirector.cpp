#include "Cinematic/TrailerDirector.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Civilization/CivilizationSubsystem.h"
#include "Vfx/NiagaraHooks.h"
#include "Kismet/GameplayStatics.h"

void UTrailerDirector::LoadFromJson()
{
	Shots.Reset();
	FString raw;
	const FString path = FPaths::ProjectDir() / TEXT("../../trailer/trailer.json");
	if (!FFileHelper::LoadFileToString(raw, *path))
	{
		return;
	}
	TSharedPtr<FJsonObject> root;
	const TSharedRef<TJsonReader<>> reader = TJsonReaderFactory<>::Create(raw);
	if (!FJsonSerializer::Deserialize(reader, root) || !root.IsValid())
	{
		return;
	}
	const TArray<TSharedPtr<FJsonValue>> shots = root->GetArrayField(TEXT("shots"));
	for (const TSharedPtr<FJsonValue>& value : shots)
	{
		const TSharedPtr<FJsonObject> obj = value->AsObject();
		FAeternaShot shot;
		shot.Scene = static_cast<int32>(obj->GetNumberField(TEXT("scene")));
		shot.Start = obj->GetNumberField(TEXT("start"));
		shot.End = obj->GetNumberField(TEXT("end"));
		shot.Map = obj->GetStringField(TEXT("map"));
		shot.Camera = obj->GetStringField(TEXT("camera"));
		shot.Weather = obj->GetStringField(TEXT("weather"));
		shot.Cue = obj->HasField(TEXT("id")) ? obj->GetStringField(TEXT("id")) : TEXT("");
		Shots.Add(shot);
	}
}

void UTrailerDirector::Play()
{
	if (Shots.IsEmpty())
	{
		LoadFromJson();
	}
	Elapsed = 0.f;
	FiredScenes.Reset();
	bPlaying = true;
}

void UTrailerDirector::Tick(float DeltaTime)
{
	if (!bPlaying)
	{
		return;
	}
	Elapsed += DeltaTime;
	for (const FAeternaShot& shot : Shots)
	{
		if (FiredScenes.Contains(shot.Scene) || Elapsed + 0.05f < shot.Start)
		{
			continue;
		}
		FiredScenes.Add(shot.Scene);
		FireCue(shot.Cue);
	}
	if (Elapsed >= 30.f)
	{
		bPlaying = false;
	}
}

void UTrailerDirector::FireCue(const FString& Cue)
{
	UCivilizationSubsystem* civ = UCivilizationSubsystem::Get(this);
	if (Cue == TEXT("AmaterasuAwakening"))
	{
		if (civ)
		{
			civ->RegisterCivilization(TEXT("japan"));
		}
	}
	else if (Cue == TEXT("RelicActivation") || Cue == TEXT("MemoryWave") || Cue == TEXT("YamatoShift"))
	{
		if (civ)
		{
			civ->ActivateCivilization(TEXT("japan"));
		}
	}
	else if (Cue == TEXT("AthenaArrival") || Cue == TEXT("CivilizationCollision"))
	{
		if (civ)
		{
			civ->ActivateCivilization(TEXT("greece"));
			if (Cue == TEXT("CivilizationCollision"))
			{
				civ->ActivateCivilization(TEXT("japan"));
			}
		}
	}
	TArray<AActor*> owners;
	UGameplayStatics::GetAllActorsOfClass(GetWorld(), AActor::StaticClass(), owners);
	for (AActor* actor : owners)
	{
		if (UNiagaraHooks* vfx = actor->FindComponentByClass<UNiagaraHooks>())
		{
			if (Cue == TEXT("RelicActivation"))
			{
				vfx->PlayRelicActivate();
			}
			else if (Cue == TEXT("MemoryWave") || Cue == TEXT("YamatoShift"))
			{
				vfx->PlayGroundLight();
				vfx->PlaySakura();
			}
			else if (Cue == TEXT("CivilizationCollision"))
			{
				vfx->PlayCivilizationCollision();
			}
		}
	}
}

TStatId UTrailerDirector::GetStatId() const
{
	RETURN_QUICK_DECLARE_CYCLE_STAT(UTrailerDirector, STATGROUP_Tickables);
}
