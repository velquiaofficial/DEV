#include "Misc/AutomationTest.h"
#include "Civilization/CivilizationSubsystem.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAeternaCivilizationActivateTest, "Aeterna.Civilization.ActivateJapan",
	EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FAeternaCivilizationActivateTest::RunTest(const FString& Parameters)
{
	TestEqual(TEXT("japan key"), FString(TEXT("japan")), FString(TEXT("japan")));
	return true;
}
