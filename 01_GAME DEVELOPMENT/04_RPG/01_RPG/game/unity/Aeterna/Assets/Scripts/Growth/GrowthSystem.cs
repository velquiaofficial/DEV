using UnityEngine;

namespace Aeterna.Growth
{
    public class GrowthSystem : MonoBehaviour
    {
        public int CharacterLevel = 1;
        public int RelicLevel = 1;
        public int Bond = 0;
        public int CivilizationLevel = 1;

        public void Train(string axis)
        {
            if (axis == "character") CharacterLevel += 1;
            if (axis == "relic") RelicLevel += 1;
            if (axis == "bond") Bond += 1;
            if (axis == "civilization") CivilizationLevel += 1;
        }
    }
}
