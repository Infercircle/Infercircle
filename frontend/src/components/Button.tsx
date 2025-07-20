import { FiArrowRight } from "react-icons/fi";

const COLORS = {
  violet: {
    fill: "bg-violet-700",
    text: "text-white",
    border: "border-violet-500",
    outlineText: "text-violet-800",
    hoverFill: "hover:bg-violet-500",
  },
  // Add more colors if needed
};

type ButtonProps = {
  className?: string;
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  variant?: string;
  color?: keyof typeof COLORS;
  px?: string;
  rightIcon?: boolean;
  [x: string]: unknown;
};

const Button: React.FC<ButtonProps> = ({
  className = "",
  href,
  onClick,
  children,
  variant = "outline",
  color = "violet",
  px = "px-4",
  rightIcon = false,
  ...props
}) => {
  const colorSet = COLORS[color as keyof typeof COLORS] || COLORS.violet;
  let baseClasses = `inline-flex items-center justify-center h-10 transition-all duration-200 rounded font-semibold text-sm cursor-pointer relative ${px} ${className}`;

  if (variant === "filled") {
    baseClasses += ` ${colorSet.fill} ${colorSet.text} ${colorSet.hoverFill} border-t border-l border-white/20 border-r border-b border-black/20 active:border-t active:border-l active:border-black/20 active:border-r active:border-b active:border-white/20 active:translate-y-0.5`;
  } else if (variant === "outline") {
    baseClasses += ` ${colorSet.outlineText} border-t border-l border-white/10 border-r border-b border-black/30 active:border-t active:border-l active:border-black/30 active:border-r active:border-b active:border-white/10 active:translate-y-0.5 button-circle-fill`;
  } else if (variant === "plain") {
    baseClasses += ` bg-transparent border-none text-white/50 hover:text-white`;
  }

  const content = (
    <span className="button-content flex items-center gap-1">
      {children}
      {rightIcon && <FiArrowRight size={16} />}
    </span>
  );

  if (href) {
    return (
      <a href={href} className={baseClasses} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button className={baseClasses} onClick={onClick} {...props}>
      {content}
    </button>
  );
};

export default Button;
