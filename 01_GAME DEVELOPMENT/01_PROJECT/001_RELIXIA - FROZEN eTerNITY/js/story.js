/**
 * 物語。screens.story。
 */
function storyScript() {
  const lines = [];
  const chapters = catalog.chapters?.chapters || [];
  (catalog.story?.chapters || []).forEach((chapter) => {
    const meta = chapters.find((item) => item.id === chapter.id);
    const push = (raw) => {
      storyLines(raw).forEach((line) => {
        lines.push({
          ...line,
          chapterId: chapter.id,
          chapter: meta?.label || "",
          title: meta?.title || "",
        });
      });
    };
    push(chapter.lines);
    Object.values(chapter.stages || {}).forEach(push);
  });
  return lines;
}

function renderStory() {
  const spec = hubSpec("story");
  const view = hubView("story");
  const state = hubState();
  const script = storyScript();
  if (state.line >= script.length) state.line = 0;
  const line = script[state.line] || { who: "", text: "story.json に文を足すと、ここに出ます。", chapter: "", title: "" };
  const marks = [];
  script.forEach((item, index) => {
    if (!marks.some((mark) => mark.id === item.chapterId)) {
      marks.push({ id: item.chapterId, label: item.chapter, title: item.title, index });
    }
  });
  const rail = el("div", "story-chapters");
  marks.forEach((mark) => {
    const button = withPlate(el("button", `story-chapter${mark.id === line.chapterId ? " is-on" : ""}`), `assets/select/chapters/${mark.id}.png`);
    button.type = "button";
    button.append(el("span", "story-chapter-label", mark.label || ""), el("span", "story-chapter-title", mark.title || ""));
    button.addEventListener("click", () => {
      state.line = mark.index;
      state.log = false;
      openScreen("story");
    });
    rail.append(button);
  });

  const actor = slot([
    line.image,
    line.chapterId ? `assets/hub/story/${line.chapterId}.png` : "",
    spec.actor || "assets/hub/story/actor.png",
  ], line.who || "立ち絵");
  actor.classList.add("story-actor");
  const box = withPlate(el("div", "story-box"), "assets/hub/ui/dialogue.png");
  const tools = el("div", "story-tools");
  const logBtn = el("button", "hub-btn", state.log ? "ログを閉じる" : "ログ");
  logBtn.type = "button";
  logBtn.addEventListener("click", () => {
    state.log = !state.log;
    openScreen("story");
  });
  const next = el("button", "hub-btn is-primary", state.line + 1 >= script.length ? "ホームへ" : "次へ");
  next.type = "button";
  next.addEventListener("click", () => {
    if (state.line + 1 >= script.length) openScreen("home");
    else {
      state.line += 1;
      openScreen("story");
    }
  });
  tools.append(hubBack("home"), logBtn, next);
  const same = script.filter((item) => item.chapterId === line.chapterId);
  const here = same.indexOf(line);
  box.append(
    el("p", "story-kicker", `${line.chapter || ""}  ${line.title || ""}`.trim()),
    el("p", "story-count", script.length ? `${state.line + 1} / ${script.length}` : ""),
    el("p", "story-who", line.who || "語り"),
    el("p", "story-text", line.text || ""),
    tools
  );
  view.append(rail, actor, box);
  if (state.log) {
    const list = withPlate(el("div", "story-log"), "assets/hub/ui/panel.png");
    same.slice(0, Math.max(0, here) + 1).forEach((item) => {
      const row = el("p", "story-log-line", item.text || "");
      if (item.who) row.prepend(el("span", "story-who", item.who));
      list.append(row);
    });
    view.append(list);
  }
  return view;
}

screens.story = function () {
  showHub(renderStory());
};
