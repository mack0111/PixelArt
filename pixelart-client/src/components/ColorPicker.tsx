const PALETTE = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FF8800", "#8800FF",
  "#0088FF", "#FF0088", "#88FF00", "#00FF88", "#884400",
  "#448800",
];

interface Props {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selectedColor, onSelect }: Props) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 160 }}>
      {PALETTE.map((color) => (
        <div
          key={color}
          onClick={() => onSelect(color)}
          style={{
            width: 32,
            height: 32,
            backgroundColor: color,
            border: selectedColor === color ? "3px solid #000" : "1px solid #ccc",
            cursor: "pointer",
            borderRadius: 4,
          }}
        />
      ))}
   
      <input
        type="color"
        value={selectedColor}
        onChange={(e) => onSelect(e.target.value)}
        style={{ width: 32, height: 32, padding: 0, border: "none", cursor: "pointer" }}
        title="Custom color"
      />
    </div>
  );
}
