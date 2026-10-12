#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "Characters/CharacterData.h"
#include "CharacterBase.generated.h"

class UCombatComponent;
class USkillComponent;
class URelicComponent;
class UAnimationHooks;
class UNiagaraHooks;

UCLASS()
class AETERNA_API ACharacterBase : public ACharacter
{
	GENERATED_BODY()

public:
	ACharacterBase();

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	TObjectPtr<UCombatComponent> Combat;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	TObjectPtr<USkillComponent> Skills;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	TObjectPtr<URelicComponent> Relic;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	TObjectPtr<UAnimationHooks> Anim;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	TObjectPtr<UNiagaraHooks> Vfx;

	UPROPERTY(EditAnywhere, BlueprintReadOnly)
	FAeternaCharacterData Data;

	UFUNCTION(BlueprintCallable)
	void LoadFromJsonId(const FString& CharacterId);

	UFUNCTION(BlueprintCallable)
	void ApplyDamage(float Amount);

	UFUNCTION(BlueprintCallable)
	void Heal(float Amount);

	UFUNCTION(BlueprintCallable)
	void Dodge();

	UFUNCTION(BlueprintCallable)
	bool IsAlive() const;

	UFUNCTION(BlueprintCallable)
	float GetHp() const { return CurrentHp; }

	UFUNCTION(BlueprintCallable)
	float GetMaxHp() const { return Data.Hp; }

protected:
	virtual void BeginPlay() override;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
	float CurrentHp = 0.f;
};
