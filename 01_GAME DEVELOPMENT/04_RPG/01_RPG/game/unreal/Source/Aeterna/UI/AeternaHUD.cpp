#include "UI/AeternaHUD.h"

void AAeternaHUD::DrawHUD()
{
	Super::DrawHUD();
	if (!Canvas)
	{
		return;
	}
	const float y = Canvas->SizeY - 90.f;
	DrawRect(FLinearColor(0.12f, 0.08f, 0.08f), 40.f, y, 280.f * PlayerHp, 14.f);
	DrawRect(FLinearColor(0.85f, 0.72f, 0.28f), 40.f, y + 20.f, 280.f * (Ultimate / 100.f), 10.f);
	DrawRect(FLinearColor(0.55f, 0.75f, 0.95f), 40.f, y + 36.f, 280.f * RelicGauge, 8.f);
	DrawRect(FLinearColor(0.72f, 0.42f, 0.18f), 40.f, y + 50.f, 280.f * CivilizationGauge, 8.f);
}
