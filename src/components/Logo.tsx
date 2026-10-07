type LogoProps = {
  compact?: boolean;
  inverse?: boolean;
};

export default function Logo({ compact = false, inverse = false }: LogoProps) {
  return (
    <span
      className={`logo${compact ? " logo--compact" : ""}${inverse ? " logo--inverse" : ""}`}
    >
      <img
        src="/assets/logo-conecta.png"
        alt="Conecta Telecomunicaciones"
      />
    </span>
  );
}
