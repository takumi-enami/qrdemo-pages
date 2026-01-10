import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "./Layout";

type NavItem = {
  label: string;
  to: string;
};

const navItems: NavItem[] = [
  { label: "検体一覧", to: "/" },
  { label: "受入", to: "/receive" },
  { label: "前処理", to: "/prep" },
  { label: "秤量", to: "/weigh" },
  { label: "分析", to: "/analyze" },
  { label: "報告", to: "/report" },
  { label: "証明", to: "/certify" },
];

type PageShellProps = {
  title: string;
  children: ReactNode;
};

export default function PageShell(props: PageShellProps) {
  const { title, children } = props;
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <Layout pageTitle={title} onHome={() => navigate("/")}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(17,24,39,0.12)",
              fontSize: 13,
              fontWeight: 700,
              color: isActive(item.to) ? "#111827" : "#374151",
              background: isActive(item.to) ? "rgba(37, 99, 235, 0.12)" : "white",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </Layout>
  );
}
