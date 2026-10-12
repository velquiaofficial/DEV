using UnityEngine;

namespace Aeterna.Story
{
    public class StoryPlayer : MonoBehaviour
    {
        public string ChapterId = "ch0";
        public int Page;

        public void Next()
        {
            Page += 1;
        }
    }
}
