using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Aeterna.Character
{
    public class CharacterView : MonoBehaviour
    {
        public string CharacterId = "amaterasu";
        readonly Dictionary<string, Transform> _parts = new Dictionary<string, Transform>();
        float _time;

        public void Show(string id)
        {
            CharacterId = id;
            foreach (Transform child in transform)
            {
                Destroy(child.gameObject);
            }
            _parts.Clear();
            var folder = Path.Combine(Application.streamingAssetsPath, "characters", id);
            var order = new[] { "body", "arm_l", "arm_r", "hair", "face", "eyes", "mouth", "full" };
            foreach (var part in order)
            {
                var file = Path.Combine(folder, part + ".png");
                if (!File.Exists(file))
                {
                    continue;
                }
                var bytes = File.ReadAllBytes(file);
                var tex = new Texture2D(2, 2, TextureFormat.RGBA32, false);
                tex.LoadImage(bytes);
                var go = new GameObject(part);
                go.transform.SetParent(transform, false);
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sprite = Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0f), 180f);
                sr.sortingOrder = part == "full" ? 0 : 2;
                _parts[part] = go.transform;
            }
        }

        void Update()
        {
            _time += Time.deltaTime;
            var breath = Mathf.Sin(_time * 2.2f) * 0.012f;
            transform.localScale = new Vector3(1f, 1f + breath, 1f);
            if (_parts.TryGetValue("eyes", out var eyes))
            {
                var blink = (_time % 4f) > 3.82f ? 0.08f : 1f;
                eyes.localScale = new Vector3(1f, blink, 1f);
            }
            if (_parts.TryGetValue("hair", out var hair))
            {
                hair.localRotation = Quaternion.Euler(0f, 0f, Mathf.Sin(_time * 1.4f) * 1.4f);
            }
        }
    }
}
