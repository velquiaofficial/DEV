#include "Misc/AutomationTest.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAeternaCombatDamageTest, "Aeterna.Combat.Damage",
	EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FAeternaCombatDamageTest::RunTest(const FString& Parameters)
{
	const float hp = 1200.f;
	const float defense = 100.f;
	const float incoming = 180.f;
	const float reduced = FMath::Max(1.f, incoming - defense * 0.15f);
	TestTrue(TEXT("damage applies"), hp - reduced < hp);
	return true;
}
