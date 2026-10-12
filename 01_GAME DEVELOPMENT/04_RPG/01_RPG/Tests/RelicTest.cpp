#include "Misc/AutomationTest.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAeternaRelicIdTest, "Aeterna.Relic.YataMirror",
	EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FAeternaRelicIdTest::RunTest(const FString& Parameters)
{
	const FString relic = TEXT("yata_mirror");
	TestEqual(TEXT("relic"), relic, FString(TEXT("yata_mirror")));
	return true;
}
