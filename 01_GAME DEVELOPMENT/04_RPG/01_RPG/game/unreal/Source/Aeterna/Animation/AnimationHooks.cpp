#include "Animation/AnimationHooks.h"

void UAnimationHooks::PlayIdle() {}
void UAnimationHooks::PlayAttack() { OnAnimNotify.Broadcast(); }
void UAnimationHooks::PlayDodge() { OnAnimNotify.Broadcast(); }
void UAnimationHooks::PlaySkill(int32 Index) { OnAnimNotify.Broadcast(); }
void UAnimationHooks::PlayUltimate() { OnAnimNotify.Broadcast(); }
void UAnimationHooks::PlayAwaken() { OnAnimNotify.Broadcast(); }
