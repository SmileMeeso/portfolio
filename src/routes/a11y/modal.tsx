import { createFileRoute } from "@tanstack/react-router";
import A11yModalPage from "../../components/a11y/A11yModalPage";

export const Route = createFileRoute("/a11y/modal")({
  component: A11yModalPage,
});
