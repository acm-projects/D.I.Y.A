import { useTranslation } from "react-i18next";
import { supportedLanguages } from "./config";

export default function LocaleSwitcher() {
    const { i18n } = useTranslation();

    return (
        <select
            value={i18n.resolvedLanguage}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            style={{
                width: "100%",
                padding: "8px 32px 8px 32px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                backgroundImage: `
                    url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"),
                    url("data:image/svg+xml,%3Csvg width='13' height='13' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='10' stroke='rgba(255,255,255,0.4)' stroke-width='2'/%3E%3Cpath d='M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")
                `,
                backgroundRepeat: "no-repeat, no-repeat",
                backgroundPosition: "right 12px center, left 12px center",
            }}
        >
            {Object.entries(supportedLanguages).map(([code, name]) => (
                <option
                    key={code}
                    value={code}
                    style={{ backgroundColor: "#270115", color: "#fff" }}
                >
                    {name}
                </option>
            ))}
        </select>
    );
}