import { Navigate, Route, Routes } from "react-router-dom";
import DiagnosticsPage from "./pages/DiagnosticsPage";
import SamplesPage from "./pages/SamplesPage";
import StepPage from "./pages/StepPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SamplesPage />} />
      <Route path="/diagnostics" element={<DiagnosticsPage />} />
      <Route path="/receive" element={<StepPage step="RECEIVE" title="受入" />} />
      <Route path="/prep" element={<StepPage step="PREP" title="前処理" />} />
      <Route path="/weigh" element={<StepPage step="WEIGH" title="秤量" />} />
      <Route path="/analyze" element={<StepPage step="ANALYZE" title="分析" />} />
      <Route path="/report" element={<StepPage step="REPORT" title="報告" />} />
      <Route path="/certify" element={<StepPage step="CERTIFY" title="証明" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
