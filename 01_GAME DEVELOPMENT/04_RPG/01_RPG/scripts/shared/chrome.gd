extends Object

const Palette := preload("res://scripts/shared/palette.gd")


static func flat(bg: Color, border: Color, radius: int, width: int) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = bg
	box.border_color = border
	box.set_border_width_all(width)
	box.set_corner_radius_all(radius)
	box.content_margin_left = 12
	box.content_margin_right = 12
	box.content_margin_top = 8
	box.content_margin_bottom = 8
	return box


static func theme() -> Theme:
	var t := Theme.new()
	var normal := flat(Color(0.08, 0.09, 0.12, 0.92), Color(0.45, 0.38, 0.22, 0.85), 8, 1)
	var hover := flat(Color(0.18, 0.15, 0.09, 0.96), Color(0.83, 0.66, 0.32, 1), 8, 1)
	var pressed := flat(Color(0.24, 0.17, 0.08, 1), Color(0.95, 0.82, 0.42, 1), 8, 1)
	t.set_stylebox("normal", "Button", normal)
	t.set_stylebox("hover", "Button", hover)
	t.set_stylebox("pressed", "Button", pressed)
	t.set_stylebox("disabled", "Button", flat(Color(0.05, 0.05, 0.06, 0.7), Color(0.2, 0.2, 0.22, 0.4), 8, 1))
	t.set_stylebox("focus", "Button", hover)
	t.set_color("font_color", "Button", Palette.INK)
	t.set_color("font_hover_color", "Button", Color(1, 0.95, 0.82))
	t.set_color("font_pressed_color", "Button", Color(1, 0.92, 0.7))
	t.set_color("font_disabled_color", "Button", Color(0.55, 0.55, 0.58))
	t.set_font_size("font_size", "Button", 16)
	t.set_color("font_color", "Label", Palette.INK)
	t.set_font_size("font_size", "Label", 16)
	var panel := flat(Color(0.05, 0.06, 0.09, 0.86), Color(0.55, 0.45, 0.24, 0.75), 12, 1)
	t.set_stylebox("panel", "Panel", panel)
	t.set_stylebox("panel", "PanelContainer", panel)
	t.set_stylebox("background", "ProgressBar", flat(Color(0.04, 0.04, 0.06, 0.95), Color(0, 0, 0, 0), 3, 0))
	t.set_stylebox("fill", "ProgressBar", flat(Color(0.78, 0.24, 0.3, 1), Color(0, 0, 0, 0), 3, 0))
	return t


static func gold_button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	var normal := flat(Color(0.62, 0.46, 0.16, 0.96), Color(0.95, 0.82, 0.45, 1), 8, 1)
	var hover := flat(Color(0.78, 0.6, 0.24, 1), Color(1, 0.9, 0.55, 1), 8, 1)
	b.add_theme_stylebox_override("normal", normal)
	b.add_theme_stylebox_override("hover", hover)
	b.add_theme_stylebox_override("pressed", hover)
	b.add_theme_stylebox_override("focus", hover)
	b.add_theme_color_override("font_color", Color(0.12, 0.08, 0.03))
	b.add_theme_color_override("font_hover_color", Color(0.1, 0.06, 0.02))
	b.add_theme_font_size_override("font_size", 18)
	return b


static func nav_button(text: String, on: bool) -> Button:
	var b := Button.new()
	b.text = text
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.custom_minimum_size = Vector2(0, 52)
	var bg := Color(0.18, 0.14, 0.08, 0.96) if on else Color(0, 0, 0, 0)
	var border := Color(0.83, 0.66, 0.32, 0.95) if on else Color(0, 0, 0, 0)
	var box := flat(bg, border, 8, 1 if on else 0)
	box.content_margin_left = 22
	b.add_theme_stylebox_override("normal", box)
	b.add_theme_stylebox_override("hover", flat(Color(0.16, 0.13, 0.08, 0.85), Color(0.83, 0.66, 0.32, 0.4), 8, 1))
	b.add_theme_stylebox_override("pressed", box)
	b.add_theme_stylebox_override("focus", box)
	b.add_theme_color_override("font_color", Color(0.96, 0.86, 0.52) if on else Color(0.86, 0.86, 0.88))
	b.add_theme_font_size_override("font_size", 18)
	return b


static func menu_button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.custom_minimum_size = Vector2(420, 48)
	var empty := flat(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 4, 0)
	var hover := flat(Color(0.83, 0.66, 0.32, 0.18), Color(0, 0, 0, 0), 4, 0)
	b.add_theme_stylebox_override("normal", empty)
	b.add_theme_stylebox_override("hover", hover)
	b.add_theme_stylebox_override("pressed", hover)
	b.add_theme_stylebox_override("focus", empty)
	b.add_theme_color_override("font_color", Color(0.92, 0.92, 0.94))
	b.add_theme_font_size_override("font_size", 22)
	return b


static func chip(text: String) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", flat(Color(0.05, 0.06, 0.08, 0.78), Color(0.62, 0.5, 0.24, 0.7), 14, 1))
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 15)
	label.add_theme_color_override("font_color", Palette.GOLD)
	panel.add_child(label)
	return panel
