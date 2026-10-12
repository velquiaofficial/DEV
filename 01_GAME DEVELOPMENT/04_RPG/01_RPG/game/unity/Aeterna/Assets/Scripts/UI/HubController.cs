using Aeterna.Character;
using UnityEngine;

namespace Aeterna.UI
{
    public class HubController : MonoBehaviour
    {
        public CharacterView Stage;
        public string Selected = "amaterasu";

        public void Select(string id)
        {
            Selected = id;
            if (Stage != null)
            {
                Stage.Show(id);
            }
        }
    }
}
