#include "Misc/AutomationTest.h"
#include "Data/DataLoader.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAeternaCharacterDataTest, "Aeterna.Character.LoadAmaterasu",
	EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FAeternaCharacterDataTest::RunTest(const FString& Parameters)
{
	FAeternaCharacterData data;
	data.Id = TEXT("amaterasu_001");
	data.Hp = 1200.f;
	TestEqual(TEXT("id"), data.Id, FString(TEXT("amaterasu_001")));
	TestTrue(TEXT("hp"), data.Hp > 0.f);
	return true;
}
