const COLORS = {
    violet: {
      fill: "bg-violet-800",
      text: "text-white",
      border: "border-violet-500",
      outlineText: "text-violet-800",
      hoverFill: "hover:bg-violet-700",
    }
    // Add more colors if needed
  };
  
  const ArrowRight = () => (
    <svg
      className="ml-2 w-5 h-5 inline-block"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  );
  
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
    let baseClasses = `inline-flex items-center justify-center h-9 transition-colors duration-200 rounded px-4 font-semibold text-sm border-2 cursor-pointer ${px} ${className}`;
  
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
        {rightIcon && <ArrowRight />}
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
  