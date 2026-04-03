type InteractiveFibaCourtProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  [key: string]: unknown;
};

export function InteractiveFibaCourt({
  title = "Terrain FIBA",
  subtitle = "Composant legacy temporairement neutralisé",
  className,
}: InteractiveFibaCourtProps) {
  return (
    <div className={className}>
      <div
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #faf8f5 100%)",
          border: "1px solid rgba(17,17,17,0.08)",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 10px 24px rgba(17,17,17,0.05)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#111111",
            marginBottom: 4,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            marginBottom: 14,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            minHeight: 240,
            borderRadius: 14,
            border: "1px dashed #d1d5db",
            background:
              "linear-gradient(180deg, rgba(215,163,93,0.18) 0%, rgba(207,154,84,0.22) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            fontWeight: 700,
            textAlign: "center",
            padding: 20,
          }}
        >
          InteractiveFibaCourt est désactivé le temps de finaliser
          l'unification avec le générateur actuel.
        </div>
      </div>
    </div>
  );
}

export default InteractiveFibaCourt;
