using UnityEngine;

namespace Aeterna.Gacha
{
    public class GachaSystem : MonoBehaviour
    {
        public int Fragments = 400;

        public string Pull()
        {
            if (Fragments < 80)
            {
                return "";
            }
            Fragments -= 80;
            return "amaterasu";
        }
    }
}
