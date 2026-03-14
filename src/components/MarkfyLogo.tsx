interface MarkfyLogoProps {
  size?: number;
  className?: string;
}

const MarkfyLogo = ({ size = 32, className = '' }: MarkfyLogoProps) => (
  <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="40" height="40" rx="9" fill="#29B2FE"/>
    <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="22" fill="white">M</text>
  </svg>
);

export default MarkfyLogo;