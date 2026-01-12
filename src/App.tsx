import { Navigate, Route, Routes } from "react-router-dom";
import ReceivePage from "./pages/ReceivePage";
import SampleDetailPage from "./pages/SampleDetailPage";
import SamplesPage from "./pages/SamplesPage";
import SettingsDevicesPage from "./pages/SettingsDevicesPage";
import SettingsDiagnosticsPage from "./pages/SettingsDiagnosticsPage";
import StepPage from "./pages/StepPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SamplesPage />} />
      <Route path="/samples/:id" element={<SampleDetailPage />} />
      <Route path="/receive" element={<ReceivePage />} />
      <Route path="/prep" element={<StepPage step="PREP" title="前処理" />} />
      <Route path="/weigh" element={<StepPage step="WEIGH" title="秤量" />} />
      <Route path="/analyze" element={<StepPage step="ANALYZE" title="分析" />} />
      <Route path="/certify" element={<StepPage step="CERTIFY" title="証明" />} />
      <Route path="/report" element={<StepPage step="REPORT" title="報告" />} />
      <Route path="/settings/devices" element={<SettingsDevicesPage />} />
      <Route path="/settings/diagnostics" element={<SettingsDiagnosticsPage />} />
      <Route path="/diagnostics" element={<Navigate to="/settings/diagnostics" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
