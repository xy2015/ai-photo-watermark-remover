import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing-page";
import { EditorPage } from "./pages/editor-page";
import { PrivacyPolicyPage } from "./pages/privacy-policy-page";
import { FeedbackPage } from "./pages/feedback-page";
import { NotFoundPage } from "./pages/not-found-page";
import { RootLayout } from "./layouts/root-layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: "editor", Component: EditorPage },
      { path: "privacy", Component: PrivacyPolicyPage },
      { path: "feedback", Component: FeedbackPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);