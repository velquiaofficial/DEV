using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Aeterna.Data
{
    [Serializable]
    public class CharacterRow
    {
        public string id;
        public string name;
        public string name_ja;
        public string civilization;
        public string relic;
        public int hp;
        public int attack;
        public int defense;
    }

    public static class GameData
    {
        public static List<CharacterRow> Characters = new List<CharacterRow>();

        public static void Load()
        {
            var path = Path.Combine(Application.streamingAssetsPath, "characters.json");
            if (!File.Exists(path))
            {
                return;
            }
            var json = File.ReadAllText(path);
            Characters = new List<CharacterRow>(JsonHelper.FromArray<CharacterRow>(json));
        }
    }

    static class JsonHelper
    {
        public static T[] FromArray<T>(string json)
        {
            return JsonUtility.FromJson<Wrapper<T>>("{\"items\":" + json + "}").items;
        }

        [Serializable]
        class Wrapper<T>
        {
            public T[] items;
        }
    }
}
