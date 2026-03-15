import { createFileRoute } from "@tanstack/react-router";
import SsrDemo from "../../components/rendering/SsrDemo";

export const Route = createFileRoute("/rendering/ssr")({
  component: SsrDemo,
});
