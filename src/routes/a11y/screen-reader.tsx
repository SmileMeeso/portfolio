import { createFileRoute } from "@tanstack/react-router";
import A11yScreenReaderPage from "../../components/a11y/A11yScreenReaderPage";

export const Route = createFileRoute("/a11y/screen-reader")({
  component: A11yScreenReaderPage,
});
