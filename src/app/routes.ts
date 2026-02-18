import { createBrowserRouter, redirect } from "react-router";
import { Layout } from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import AnalysisPage from "./pages/AnalysisPage";
import SettingsPage from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        loader: () => redirect("/upload"),
      },
      {
        path: "upload",
        Component: UploadPage,
      },
      {
        path: "documents",
        Component: DocumentsPage,
      },
      {
        path: "documents/:docId",
        Component: DocumentDetailPage,
      },
      {
        path: "analysis",
        Component: AnalysisPage,
      },
      {
        path: "settings",
        Component: SettingsPage,
      },
    ],
  },
]);
