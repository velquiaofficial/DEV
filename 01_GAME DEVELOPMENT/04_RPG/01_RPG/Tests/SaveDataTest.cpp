#include "Misc/AutomationTest.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAeternaSaveDataTest, "Aeterna.Save.SlotName",
	EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FAeternaSaveDataTest::RunTest(const FString& Parameters)
{
	TestEqual(TEXT("slot"), FString(TEXT("aeterna")), FString(TEXT("aeterna")));
	return true;
}
