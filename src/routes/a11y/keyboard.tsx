import { createFileRoute } from "@tanstack/react-router";
import A11yKeyboardPage from "../../components/a11y/A11yKeyboardPage";

export const Route = createFileRoute("/a11y/keyboard")({
  component: A11yKeyboardPage,
});
