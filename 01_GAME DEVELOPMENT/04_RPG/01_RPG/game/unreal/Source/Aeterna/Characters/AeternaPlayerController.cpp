#include "Characters/AeternaPlayerController.h"
#include "Characters/CharacterBase.h"

void AAeternaPlayerController::SetupInputComponent()
{
	Super::SetupInputComponent();
	InputComponent->BindAction("Attack", IE_Pressed, this, &AAeternaPlayerController::OnAttack);
	InputComponent->BindAction("Dodge", IE_Pressed, this, &AAeternaPlayerController::OnDodge);
	InputComponent->BindAction("Skill1", IE_Pressed, this, &AAeternaPlayerController::OnSkill1);
	InputComponent->BindAction("Skill2", IE_Pressed, this, &AAeternaPlayerController::OnSkill2);
	InputComponent->BindAction("Ultimate", IE_Pressed, this, &AAeternaPlayerController::OnUltimate);
	InputComponent->BindAction("Relic", IE_Pressed, this, &AAeternaPlayerController::OnActivateRelic);
}

void AAeternaPlayerController::OnAttack()
{
	if (ACharacterBase* pawn = Cast<ACharacterBase>(GetPawn()))
	{
		pawn->Combat->NormalAttack();
	}
}

void AAeternaPlayerController::OnDodge()
{
	if (ACharacterBase* pawn = Cast<ACharacterBase>(GetPawn()))
	{
		pawn->Dodge();
	}
}

void AAeternaPlayerController::OnSkill1()
{
	if (ACharacterBase* pawn = Cast<ACharacterBase>(GetPawn()))
	{
		pawn->Skills->TrySkill(0);
	}
}

void AAeternaPlayerController::OnSkill2()
{
	if (ACharacterBase* pawn = Cast<ACharacterBase>(GetPawn()))
	{
		pawn->Skills->TrySkill(1);
	}
}

void AAeternaPlayerController::OnUltimate()
{
	if (ACharacterBase* pawn = Cast<ACharacterBase>(GetPawn()))
	{
		pawn->Skills->TryUltimate();
	}
}

void AAeternaPlayerController::OnActivateRelic()
{
	if (ACharacterBase* pawn = Cast<ACharacterBase>(GetPawn()))
	{
		pawn->Relic->ActivateOwnedRelic();
	}
}
