import { FiArrowRight } from "react-icons/fi";
const COLORS = {
    violet: {
      fill: "bg-violet-700",
      text: "text-white",
      border: "border-violet-500",
      outlineText: "text-violet-800",
      hoverFill: "hover:bg-violet-600",
    }
    // Add more colors if needed
  };

  type ButtonProps = {
    className?: string;
    href?: string;
    onClick?: (...args: any[]) => void;
    children?: React.ReactNode;
    variant?: string;
    color?: keyof typeof COLORS;
    px?: string;
    rightIcon?: boolean;
    [x: string]: any;
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
    let baseClasses = `inline-flex items-center justify-center h-9 transition-colors duration-200 rounded p-4.5 font-semibold text-sm border-2 cursor-pointer ${px} ${className}`;
  
    if (variant === "filled") {
      baseClasses += ` ${colorSet.fill} ${colorSet.text} border-transparent ${colorSet.hoverFill}`;
    } else if (variant === "outline") {
      baseClasses += ` bg-transparent ${colorSet.outlineText} ${colorSet.border} button-circle-fill hover:border-white`;
    } else if (variant === "plain") {
      baseClasses += ` bg-transparent border-none shadow-none text-white/50 hover:text-white`;
    }
  
    const content = (
      <span className="button-content flex items-center">
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
  