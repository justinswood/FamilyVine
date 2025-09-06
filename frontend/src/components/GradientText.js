import "./GradientText.css";

export default function GradientText({
  children,
  className = "",
  colors = ["#9333ea", "#7c3aed", "#581c87", "#a855f7", "#6b21a8"],
  animationSpeed = 8,
  showBorder = false
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };
  
  return (
    <div className={`animated-gradient-text ${className}`}>
      {showBorder && <div className="gradient-overlay" style={gradientStyle}></div>}
      <div className="text-content" style={gradientStyle}>{children}</div>
    </div>
  );
}
