using Aeterna.Character;
using Aeterna.Data;
using Aeterna.UI;
using UnityEngine;

namespace Aeterna
{
    public class Boot : MonoBehaviour
    {
        void Start()
        {
            GameData.Load();
            var stage = new GameObject("Stage").AddComponent<CharacterView>();
            var hub = gameObject.AddComponent<HubController>();
            hub.Stage = stage;
            hub.Select("amaterasu");
        }
    }
}
