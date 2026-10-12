using UnityEngine;

namespace Aeterna.Combat
{
    public class BattleController : MonoBehaviour
    {
        public string HeroId = "amaterasu";
        public string FoeId = "oblivion";
        public int HeroHp = 1200;
        public int FoeHp = 1400;

        public void Skill(int slot)
        {
            FoeHp = Mathf.Max(0, FoeHp - (slot + 1) * 80);
        }

        public void RelicActivate()
        {
            HeroHp = Mathf.Min(1600, HeroHp + 120);
        }
    }
}
