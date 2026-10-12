using UnrealBuildTool;

public class Aeterna : ModuleRules
{
	public Aeterna(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		PublicDependencyModuleNames.AddRange(new[]
		{
			"Core", "CoreUObject", "Engine", "InputCore", "UMG", "Niagara", "LevelSequence", "MovieScene", "Json", "JsonUtilities"
		});
	}
}
